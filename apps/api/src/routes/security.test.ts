import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { LightMyRequestResponse } from 'fastify';
import { type AppDeps, buildApp } from '../app.js';
import { LIMITS } from '../plugins/security.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';
import { MemoryRevokeTokenRepository } from '../repositories/memory/revoke-token-repository.js';
import { MemoryUserRepository } from '../repositories/memory/user-repository.js';
import { Env } from '../schemas/env.js';
import { Problem } from '../schemas/problem.js';
import { MemoryCommentEventRepository } from '../repositories/memory/comment-event-repository.js';

type App = ReturnType<typeof buildApp>;

const baseEnv = {
  DATABASE_URL: 'postgres://unused@localhost/unused',
  JWT_SECRET:
    'eVuixo7n6sQjoUEf3E6fLnEWTbbFXYYv_ZdRN_PaZP8sEH7GL03gQ46xNDEmLfUy',
  CORS_ORIGINS: 'http://localhost:4173',
};

// Documentation ranges (RFC 5737): never real hosts
const attacker = '203.0.113.7';
const someoneElse = '198.51.100.1';
// nginx as seen by the API inside the Docker network
const nginx = '172.18.0.4';

function testDeps(): AppDeps {
  const repos = {
    bears: new MemoryBearRepository([]),
    comments: new MemoryCommentRepository(),
    users: new MemoryUserRepository(),
    revokedTokens: new MemoryRevokeTokenRepository(),
    commentEvents: new MemoryCommentEventRepository(),
  };
  return {
    repos,
    uow: { run: async (work) => await work(repos) },
    ping: async () => {},
    close: async () => {},
  };
}

// Fresh app per test: the rate-limit counters live in memory, so no test inherits another's
function setup(t: TestContext, env: Record<string, string> = {}): App {
  const app = buildApp(Env.parse({ ...baseEnv, ...env }), testDeps);
  t.after(async () => {
    await app.close();
  });
  return app;
}

function assertProblem(res: LightMyRequestResponse, status: number): Problem {
  assert.equal(res.statusCode, status);
  assert.match(
    String(res.headers['content-type']),
    /^application\/problem\+json/
  );
  return Problem.parse(res.json());
}

// 429 is a Problem too, and Retry-After tells honest clients when to come back
function assertRateLimited(res: LightMyRequestResponse): void {
  assert.match(assertProblem(res, 429).type, /\/rate-limited$/);
  const retryAfter = Number(res.headers['retry-after']);
  assert.ok(
    retryAfter > 0,
    `retry-after: ${String(res.headers['retry-after'])}`
  );
}

async function login(
  app: App,
  email: string,
  { password = 'wrong password!!', ip = attacker, forwardedFor = '' } = {}
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
    remoteAddress: ip,
    headers: forwardedFor === '' ? {} : { 'x-forwarded-for': forwardedFor },
  });
}

async function register(
  app: App,
  email: string,
  ip = attacker
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: 'correct horse battery' },
    remoteAddress: ip,
  });
}

await test('login brute force: 429 with Retry-After after the configured attempts', async (t) => {
  const app = setup(t);
  const victim = { email: 'victim@x.org', password: 'correct horse battery' };
  assert.equal(
    (await register(app, victim.email, someoneElse)).statusCode,
    201
  );

  for (let i = 0; i < LIMITS.loginAccount.max; i++) {
    assertProblem(await login(app, victim.email), 401);
  }
  assertRateLimited(await login(app, victim.email));

  // Even the right password is refused now: the attacker cannot tell when they hit it
  assertRateLimited(
    await login(app, victim.email, { password: victim.password })
  );
  // Same canonical bucket: case and whitespace do not open a new one
  assertRateLimited(await login(app, ' VICTIM@x.org '));

  // Only this IP + e-mail pair is blocked: the owner still logs in from elsewhere,
  // so an attacker cannot lock other people out of their accounts
  const owner = await login(app, victim.email, {
    password: victim.password,
    ip: someoneElse,
  });
  assert.equal(owner.statusCode, 200);
});

await test('login: one IP cannot cycle through many accounts', async (t) => {
  const app = setup(t);

  // Every e-mail is new, so the per-account bucket never fills; the per-IP one does
  for (let i = 0; i < LIMITS.loginIp.max; i++) {
    assertProblem(await login(app, `user${i}@x.org`), 401);
  }
  assertRateLimited(await login(app, 'one-more@x.org'));

  // Other IPs are not affected
  assertProblem(await login(app, 'one-more@x.org', { ip: someoneElse }), 401);
});

await test('register: 429 after the configured number of sign-ups per IP', async (t) => {
  const app = setup(t);

  for (let i = 0; i < LIMITS.register.max; i++) {
    assert.equal((await register(app, `spam${i}@x.org`)).statusCode, 201);
  }
  assertRateLimited(await register(app, 'one-more@x.org'));

  assert.equal(
    (await register(app, 'one-more@x.org', someoneElse)).statusCode,
    201
  );
});

await test('every /api route has a per-IP safety net', async (t) => {
  const app = setup(t);
  const list = async (): Promise<LightMyRequestResponse> =>
    await app.inject({ url: '/api/bears', remoteAddress: attacker });

  for (let i = 0; i < LIMITS.api.max; i++) {
    assert.equal((await list()).statusCode, 200, `request ${i + 1}`);
  }
  assertRateLimited(await list());
});

await test('security headers are set and nothing reveals the server', async (t) => {
  const app = setup(t);

  const res = await app.inject({ url: '/api/bears' });

  assert.equal(res.statusCode, 200);
  const csp = String(res.headers['content-security-policy']);
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['referrer-policy'], 'no-referrer');
  assert.match(String(res.headers['strict-transport-security']), /max-age=/);
  assert.equal(res.headers['x-powered-by'], undefined);
  assert.equal(res.headers.server, undefined);
});

await test('production: no Swagger UI, and the CSP upgrades insecure requests', async (t) => {
  const dev = setup(t);
  const prod = setup(t, { NODE_ENV: 'production' });

  // Control: in development the docs exist, so the 404 below comes from the environment
  assert.notEqual((await dev.inject({ url: '/api/docs' })).statusCode, 404);
  assertProblem(await prod.inject({ url: '/api/docs' }), 404);

  const devCsp = String(
    (await dev.inject({ url: '/api/bears' })).headers['content-security-policy']
  );
  const prodCsp = String(
    (await prod.inject({ url: '/api/bears' })).headers[
      'content-security-policy'
    ]
  );
  assert.doesNotMatch(devCsp, /upgrade-insecure-requests/);
  assert.match(prodCsp, /upgrade-insecure-requests/);
});

await test('a body over the limit is rejected with 413 before any schema runs', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    headers: { 'content-type': 'application/json' },
    payload: JSON.stringify({
      email: 'big@x.org',
      password: 'x'.repeat(20 * 1024),
    }),
  });

  assertProblem(res, 413);
});

await test('CORS: credentials only for the allow-listed origin', async (t) => {
  const app = setup(t);
  const preflight = async (origin: string): Promise<LightMyRequestResponse> =>
    await app.inject({
      method: 'OPTIONS',
      url: '/api/auth/login',
      headers: {
        origin,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
    });

  const allowed = await preflight('http://localhost:4173');
  assert.equal(
    allowed.headers['access-control-allow-origin'],
    'http://localhost:4173'
  );
  assert.equal(allowed.headers['access-control-allow-credentials'], 'true');

  // No allow-origin header: the browser refuses to hand the response to evil.example
  const evil = await preflight('https://evil.example');
  assert.equal(evil.headers['access-control-allow-origin'], undefined);
});

await test('without TRUST_PROXY, X-Forwarded-For is ignored and cannot dodge the limit', async (t) => {
  const app = setup(t);

  // A new fake client IP per attempt: if the API believed the header, no bucket would fill
  for (let i = 0; i < LIMITS.loginAccount.max; i++) {
    const res = await login(app, 'victim@x.org', {
      forwardedFor: `10.0.0.${i}`,
    });
    assertProblem(res, 401);
  }
  assertRateLimited(
    await login(app, 'victim@x.org', { forwardedFor: '10.0.0.99' })
  );
});

await test('behind nginx (TRUST_PROXY from compose): each client gets its own bucket', async (t) => {
  // The exact value compose.yaml sets; it must parse, or the API never starts in Docker
  const app = setup(t, { TRUST_PROXY: 'uniquelocal' });
  const viaNginx = async (client: string): Promise<LightMyRequestResponse> =>
    await login(app, 'victim@x.org', { ip: nginx, forwardedFor: client });

  for (let i = 0; i < LIMITS.loginAccount.max; i++) {
    assertProblem(await viaNginx(attacker), 401);
  }
  assertRateLimited(await viaNginx(attacker));

  // Same socket address (nginx), different client: not blocked. Without trustProxy
  // every user would share nginx's IP, and one attacker would lock out everyone
  assertProblem(await viaNginx(someoneElse), 401);
});
