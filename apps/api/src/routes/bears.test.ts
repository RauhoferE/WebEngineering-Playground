import assert from 'node:assert/strict';
import { test, type TestContext } from 'node:test';
import { buildApp } from '../app.js';
import { Env } from '../schemas/env.js';
import { BearList, type Bear } from '../schemas/bear.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';

const env = Env.parse({ DATABASE_URL: 'postgres://unused@localhost/unused' });

const fixture: Bear[] = [
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
  {
    id: 'a-melanoleuca',
    name: 'Giant panda',
    binomial: 'A. melanoleuca',
    imageUrl: null,
    range: 'Central China',
  },
];

function setup(t: TestContext): ReturnType<typeof buildApp> {
  const app = buildApp(env, () => {
    const repos = {
      bears: new MemoryBearRepository(fixture),
      comments: new MemoryCommentRepository(),
    };
    return {
      repos,
      // No real transaction in memory: run the work against the same repositories
      uow: { run: async (work) => await work(repos) },
      ping: async () => {},
      close: async () => {},
    };
  });
  t.after(async () => {
    await app.close();
  });
  return app;
}

async function listNames(
  app: ReturnType<typeof buildApp>,
  query: Record<string, string>
): Promise<string[]> {
  const res = await app.inject({ method: 'GET', url: '/api/bears', query });
  assert.equal(res.statusCode, 200);
  return BearList.parse(res.json()).items.map((b) => b.name);
}

await test('without q all bears are listed in source order', async (t) => {
  const app = setup(t);

  assert.deepEqual(await listNames(app, {}), [
    'Brown bear',
    'Polar bear',
    'Giant panda',
  ]);
});

await test('q filters bears by name', async (t) => {
  const app = setup(t);

  assert.deepEqual(await listNames(app, { q: 'polar' }), ['Polar bear']);
});

await test('q is case-insensitive and matches inside the name', async (t) => {
  const app = setup(t);

  assert.deepEqual(await listNames(app, { q: 'BEAR' }), [
    'Brown bear',
    'Polar bear',
  ]);
});

await test('q is trimmed, and a blank q means no filter', async (t) => {
  const app = setup(t);

  assert.deepEqual(await listNames(app, { q: '  panda ' }), ['Giant panda']);
  assert.equal((await listNames(app, { q: '   ' })).length, 3);
});

await test('q without matches returns an empty list, not an error', async (t) => {
  const app = setup(t);

  assert.deepEqual(await listNames(app, { q: 'koala' }), []);
});

await test('q longer than 50 characters is rejected with 400', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears',
    query: { q: 'b'.repeat(51) },
  });

  assert.equal(res.statusCode, 400);
  assert.match(
    String(res.headers['content-type']),
    /^application\/problem\+json/
  );
});
