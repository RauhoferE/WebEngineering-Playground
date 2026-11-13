import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test, type TestContext } from 'node:test';
import type { LightMyRequestResponse } from 'fastify';
import { buildApp, type AppDeps } from '../app.js';
import { Env } from '../schemas/env.js';
import { Comment, CommentList } from '../schemas/comment.js';
import { Problem } from '../schemas/problem.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';

const env = Env.parse({ DATABASE_URL: 'postgres://unused@localhost/unused' });

function testDeps(): AppDeps {
  return {
    repos: {
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
      comments: new MemoryCommentRepository(),
    },
    ping: async () => {},
    close: async () => {},
  };
}

// Fresh app and empty repositories per test, so tests cannot affect each other
function setup(t: TestContext): ReturnType<typeof buildApp> {
  const app = buildApp(env, testDeps);
  t.after(async () => {
    await app.close();
  });
  return app;
}

async function postComment(
  app: ReturnType<typeof buildApp>,
  bearId: string,
  payload: unknown
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'POST',
    url: `/api/bears/${bearId}/comments`,
    payload: payload as Record<string, unknown>,
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

await test('POST creates a comment and points to it', async (t) => {
  const app = setup(t);

  const res = await postComment(app, 'u-arctos', {
    author: 'Lena',
    text: 'Saw one in Slovenia',
  });

  assert.equal(res.statusCode, 201);
  const comment = Comment.parse(res.json());
  assert.equal(comment.bearId, 'u-arctos');
  assert.equal(comment.author, 'Lena');
  assert.equal(comment.text, 'Saw one in Slovenia');
  assert.equal(res.headers.location, `/api/comments/${comment.id}`);
});

await test('POST trims author and text', async (t) => {
  const app = setup(t);

  const res = await postComment(app, 'u-arctos', {
    author: '  Lena  ',
    text: '\n Saw one \t',
  });

  const comment = Comment.parse(res.json());
  assert.equal(comment.author, 'Lena');
  assert.equal(comment.text, 'Saw one');
});

await test('GET lists only the comments of the requested bear', async (t) => {
  const app = setup(t);
  await postComment(app, 'u-arctos', { author: 'Lena', text: 'first' });
  await postComment(app, 'u-arctos', { author: 'Max', text: 'second' });
  await postComment(app, 'u-maritimus', { author: 'Ida', text: 'other bear' });

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/u-arctos/comments',
  });

  assert.equal(res.statusCode, 200);
  const { items } = CommentList.parse(res.json());
  assert.deepEqual(
    items.map((c) => c.text),
    ['first', 'second']
  );
});

await test('GET returns an empty list for a bear without comments', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/u-maritimus/comments',
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(CommentList.parse(res.json()).items, []);
});

await test('POST rejects text that is empty after trimming', async (t) => {
  const app = setup(t);

  const res = await postComment(app, 'u-arctos', {
    author: 'Lena',
    text: '   ',
  });

  const problem = assertProblem(res, 400);
  assert.deepEqual(problem.errors, [
    { path: 'text', message: 'text must not be empty' },
  ]);
});

await test('POST rejects an author longer than 80 characters', async (t) => {
  const app = setup(t);

  const res = await postComment(app, 'u-arctos', {
    author: 'a'.repeat(81),
    text: 'too long a name',
  });

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'author');
});

await test('POST rejects a body with missing fields', async (t) => {
  const app = setup(t);

  const res = await postComment(app, 'u-arctos', { author: 'Lena' });

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'text');
});

await test('unknown bears are 404 for GET and POST', async (t) => {
  const app = setup(t);

  const get = await app.inject({
    method: 'GET',
    url: '/api/bears/u-nope/comments',
  });
  const post = await postComment(app, 'u-nope', { author: 'Lena', text: 'hi' });

  assertProblem(get, 404);
  assertProblem(post, 404);
});

await test('a malformed bear id is rejected with 400', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/U-Arctos/comments',
  });

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'id');
});

await test('DELETE removes a comment, a second DELETE is 404', async (t) => {
  const app = setup(t);
  const created = Comment.parse(
    (await postComment(app, 'u-arctos', { author: 'Lena', text: 'bye' })).json()
  );

  const first = await app.inject({
    method: 'DELETE',
    url: `/api/comments/${created.id}`,
  });
  assert.equal(first.statusCode, 204);
  assert.equal(first.body, '');

  const list = await app.inject({
    method: 'GET',
    url: '/api/bears/u-arctos/comments',
  });
  assert.deepEqual(CommentList.parse(list.json()).items, []);

  const second = await app.inject({
    method: 'DELETE',
    url: `/api/comments/${created.id}`,
  });
  assertProblem(second, 404);
});

await test('DELETE of an unknown comment id is 404', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'DELETE',
    url: `/api/comments/${randomUUID()}`,
  });

  assertProblem(res, 404);
});

await test('DELETE with an id that is not a UUID is 400', async (t) => {
  const app = setup(t);

  const res = await app.inject({
    method: 'DELETE',
    url: '/api/comments/not-a-uuid',
  });

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'commentId');
});
