import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import type { LightMyRequestResponse } from 'fastify';
import { MemoryUserRepository } from '../repositories/memory/user-repository.js';
import { type AppDeps, buildApp } from '../app.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { Env } from '../schemas/env.js';
import { Problem } from '../schemas/problem.js';

const env = Env.parse({ DATABASE_URL: 'postgres://unused@localhost/unused' });

function steppingClock(): () => Date {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
}

function testDeps(users: MemoryUserRepository): AppDeps {
  const repos = {
    bears: new MemoryBearRepository([]),
    comments: new MemoryCommentRepository(steppingClock()),
    users,
  };
  return {
    repos,
    uow: { run: async (work) => await work(repos) },
    ping: async () => {},
    close: async () => {},
  };
}

// Fresh app per test; returns the user repository the app writes to,
// so a test can inspect what was actually stored
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
