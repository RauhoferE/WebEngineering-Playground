import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { LightMyRequestResponse } from 'fastify';
import { MemoryUserRepository } from '../repositories/memory/user-repository.js';
import { type AppDeps, buildApp } from '../app.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { Env } from '../schemas/env.js';
import { Problem } from '../schemas/problem.js';
import { MemoryRevokeTokenRepository } from '../repositories/memory/revoke-token-repository.js';
import { TokenService } from '../services/token-service.js';
import { MemoryCommentEventRepository } from '../repositories/memory/comment-event-repository.js';
import { MemoryIdempotencyKeyRepository } from '../repositories/memory/idempotency-key-repository.js';

const env = Env.parse({
  DATABASE_URL: 'postgres://unused@localhost/unused',
  JWT_SECRET:
    'eVuixo7n6sQjoUEf3E6fLnEWTbbFXYYv_ZdRN_PaZP8sEH7GL03gQ46xNDEmLfUy',
});

function steppingClock(): () => Date {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
}

function testDeps(users: MemoryUserRepository): AppDeps {
  const repos = {
    bears: new MemoryBearRepository([]),
    comments: new MemoryCommentRepository(steppingClock()),
    users,
    revokedTokens: new MemoryRevokeTokenRepository(),
    commentEvents: new MemoryCommentEventRepository(),
    idempotencyKeys: new MemoryIdempotencyKeyRepository(),
  };
  return {
    repos,
    uow: { run: async (work) => await work(repos) },
    ping: async () => {},
    close: async () => {},
  };
}

function setup(t: TestContext): {
  app: ReturnType<typeof buildApp>;
  users: MemoryUserRepository;
} {
  const users = new MemoryUserRepository(steppingClock());
  const app = buildApp(env, () => testDeps(users));
  t.after(async () => {
    await app.close();
  });
  return { app, users };
}

async function register(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload,
  });
}

function assertProblem(res: LightMyRequestResponse, status: number): Problem {
  assert.equal(res.statusCode, status);
  assert.match(
    String(res.headers['content-type']),
    /^application\/problem\+json/
  );
  return Problem.parse(res.json());
}

await test('register: 201, stores only an argon2id hash, duplicate → 409', async (t) => {
  const { app, users } = setup(t);

  const first = await register(app, {
    email: ' Thomas@Example.org ',
    password: 'correct horse battery',
  });
  assert.equal(first.statusCode, 201);
  assert.equal('passwordHash' in first.json(), false);
  assert.equal(first.json().role, 'user');
  assert.match(
    (await users.findByEmail('thomas@example.org'))?.passwordHash ?? '',
    /^\$argon2id\$/
  );

  const dup = await register(app, {
    email: 'thomas@example.org',
    password: 'another long password',
  });
  assertProblem(dup, 409);
});

await test('register: 11-character password → 400, 12 characters → 201', async (t) => {
  const { app, users } = setup(t);

  const short = await register(app, {
    email: 'lena@example.org',
    password: 'a'.repeat(11),
  });
  const problem = assertProblem(short, 400);
  assert.equal(problem.errors?.[0]?.path, 'password');
  assert.equal(await users.findByEmail('lena@example.org'), null);

  // The boundary itself is accepted, so the 400 above is about length only
  const exact = await register(app, {
    email: 'lena@example.org',
    password: 'a'.repeat(12),
  });
  assert.equal(exact.statusCode, 201);
});

await test('register: role "moderator" in the body → 400, no user is created', async (t) => {
  const { app, users } = setup(t);

  const res = await register(app, {
    email: 'mallory@example.org',
    password: 'correct horse battery',
    role: 'moderator',
  });
  const problem = assertProblem(res, 400);
  assert.match(problem.errors?.[0]?.message ?? '', /role/);
  // Mass assignment failed: the request did not even create a plain user
  assert.equal(await users.findByEmail('mallory@example.org'), null);
});

const creds = { email: 'a@x.org', password: 'correct horse battery' };

async function login(
  app: ReturnType<typeof buildApp>,
  payload: Record<string, unknown>
): Promise<LightMyRequestResponse> {
  return await app.inject({ method: 'POST', url: '/api/auth/login', payload });
}

async function me(
  app: ReturnType<typeof buildApp>,
  token?: string
): Promise<LightMyRequestResponse> {
  return await app.inject({
    url: '/api/auth/me',
    cookies: token === undefined ? {} : { token },
  });
}

// Registers, logs in and returns the user id and the JWT from the cookie
async function registerAndLogin(
  app: ReturnType<typeof buildApp>,
  user: { email: string; password: string }
): Promise<{ id: string; token: string }> {
  const reg = await register(app, user);
  assert.equal(reg.statusCode, 201);
  const token = (await login(app, user)).cookies.find(
    (c) => c.name === 'token'
  )?.value;
  assert.ok(token !== undefined, 'login set no token cookie');
  return { id: reg.json<{ id: string }>().id, token };
}

const b64url = (value: unknown): string =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

await test('logout invalidates the token itself, not only the cookie', async (t) => {
  const { app } = setup(t);
  await register(app, creds);

  const res = await login(app, creds);
  assert.equal(res.statusCode, 200);
  const cookie = res.cookies.find((c) => c.name === 'token');
  assert.ok(cookie);
  assert.equal(cookie.httpOnly, true);
  assert.equal(cookie.sameSite, 'Lax');
  assert.equal(cookie.path, '/');

  const before = await me(app, cookie.value);
  assert.equal(before.statusCode, 200);
  assert.equal(before.json<{ email: string }>().email, creds.email);

  const out = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    cookies: { token: cookie.value },
  });
  assert.equal(out.statusCode, 204);
  // The browser is told to drop the cookie...
  assert.equal(out.cookies.find((c) => c.name === 'token')?.maxAge, 0);

  // ...and the server refuses the old token, like an attacker who copied it
  assertProblem(await me(app, cookie.value), 401);
});

await test('me: without a cookie or with garbage → 401 Problem', async (t) => {
  const { app } = setup(t);

  assertProblem(await me(app), 401);
  assertProblem(await me(app, 'not-a-jwt'), 401);
});

await test('login: wrong password and unknown e-mail get the same 401', async (t) => {
  const { app } = setup(t);
  await register(app, creds);

  const wrongPasswordRes = await login(app, {
    ...creds,
    password: 'wrong password!!',
  });
  const unknownEmailRes = await login(app, {
    ...creds,
    email: 'nobody@x.org',
  });
  const wrongPassword = assertProblem(wrongPasswordRes, 401);
  const unknownEmail = assertProblem(unknownEmailRes, 401);

  // Nothing in the answer tells which of the two was wrong (no enumeration)
  assert.equal(wrongPassword.type, unknownEmail.type);
  assert.equal(wrongPassword.title, unknownEmail.title);
  assert.equal(wrongPassword.detail, unknownEmail.detail);
  // And a failed login hands out no cookie
  assert.equal(wrongPasswordRes.headers['set-cookie'], undefined);
  assert.equal(unknownEmailRes.headers['set-cookie'], undefined);
});

await test('me: forged tokens → 401 (edited claims, alg "none")', async (t) => {
  const { app } = setup(t);
  const victim = await registerAndLogin(app, {
    email: 'victim@x.org',
    password: 'correct horse battery',
  });
  const attacker = await registerAndLogin(app, {
    email: 'attacker@x.org',
    password: 'another long password',
  });

  const [header = '', payload = '', signature = ''] = attacker.token.split('.');
  const claims = JSON.parse(
    Buffer.from(payload, 'base64url').toString()
  ) as Record<string, unknown>;

  // Edited payload, original signature: claims to be the victim
  const edited = [header, b64url({ ...claims, sub: victim.id }), signature];
  assertProblem(await me(app, edited.join('.')), 401);

  // Unsigned token: the classic alg "none" attack, blocked by pinning HS256
  const unsigned = [
    b64url({ alg: 'none', typ: 'JWT' }),
    b64url({ ...claims, sub: victim.id }),
    '',
  ];
  assertProblem(await me(app, unsigned.join('.')), 401);

  // Control: the untouched token still works, so the 401s come from the forgery
  assert.equal((await me(app, attacker.token)).statusCode, 200);
});

await test('me: token signed with a different secret → 401', async (t) => {
  const { app } = setup(t);
  const { id } = await registerAndLogin(app, creds);

  // Correct alg, iss, aud and sub; only the key is wrong
  const foreign = await new TokenService('x'.repeat(48), 3600).issue(id);
  assertProblem(await me(app, foreign), 401);
});
