import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryUserRepository } from '../repositories/memory/user-repository.js';
import { type AppDeps, buildApp } from '../app.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { Env } from '../schemas/env.js';

const env = Env.parse({ DATABASE_URL: 'postgres://unused@localhost/unused' });

function steppingClock(): () => Date {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
}

function testDeps(): AppDeps {
  const repos = {
    bears: new MemoryBearRepository([
      {
        id: 'u-arctos',
        name: 'Brown bear',
        binomial: 'U. arctos',
        imageUrl: null,
        range: 'Eurasia',
      },
      {
        id: 'u-maritimus',
        name: 'Polar bear',
        binomial: 'U. maritimus',
        imageUrl: null,
        range: 'Arctic',
      },
    ]),
    comments: new MemoryCommentRepository(steppingClock()),
    users: new MemoryUserRepository(steppingClock()),
  };
  return {
    repos,
    uow: { run: async (work) => await work(repos) },
    ping: async () => {},
    close: async () => {},
  };
}

await test('register: 201, stores only an argon2id hash, duplicate → 409', async (t) => {
  const users = new MemoryUserRepository();
  const app = buildApp(env, testDeps);
  t.after(async () => {
    await app.close();
  });

  const first = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: {
      email: ' Thomas@Example.org ',
      password: 'correct horse battery',
    },
  });
  assert.equal(first.statusCode, 201);
  assert.equal('passwordHash' in first.json(), false);
  assert.match(
    (await users.findByEmail('thomas@example.org'))?.passwordHash ?? '',
    /^\$argon2id\$/
  );

  const dup = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email: 'thomas@example.org', password: 'another long password' },
  });
  assert.equal(dup.statusCode, 409);
});
