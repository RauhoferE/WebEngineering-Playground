import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test, type TestContext } from 'node:test';
import type { LightMyRequestResponse } from 'fastify';
import { buildApp, type AppDeps } from '../app.js';
import { TOKEN_COOKIE } from '../plugins/auth.js';
import { Env } from '../schemas/env.js';
import type { Role } from '../schemas/auth.js';
import { Comment, CommentPage } from '../schemas/comment.js';
import { Problem } from '../schemas/problem.js';
import { MemoryBearRepository } from '../repositories/memory/bear-repository.js';
import { MemoryCommentRepository } from '../repositories/memory/comment-repository.js';
import { MemoryUserRepository } from '../repositories/memory/user-repository.js';
import { MemoryRevokeTokenRepository } from '../repositories/memory/revoke-token-repository.js';
import { TokenService } from '../services/token-service.js';
import { MemoryCommentEventRepository } from '../repositories/memory/comment-event-repository.js';

const env = Env.parse({
  DATABASE_URL: 'postgres://unused@localhost/unused',
  JWT_SECRET:
    'eVuixo7n6sQjoUEf3E6fLnEWTbbFXYYv_ZdRN_PaZP8sEH7GL03gQ46xNDEmLfUy',
});

// Signs with the app's own secret, so requireAuth accepts these tokens
const tokens = new TokenService(env.JWT_SECRET, env.JWT_TTL_SECONDS);

type App = ReturnType<typeof buildApp>;
type Cookies = Record<string, string>;

interface LoggedIn {
  id: string;
  cookies: Cookies;
}

// Each comment is one second newer than the previous one, so the order is deterministic
function steppingClock(): () => Date {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 0, 1, 0, 0, tick++));
}

function testDeps(
  users: MemoryUserRepository,
  comments: MemoryCommentRepository
): AppDeps {
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
    comments,
    users,
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

// Creates the user directly in the repository and signs a token for it.
// Skips argon2 and HTTP, and is the only way to get a moderator: no API route grants the role
async function loginAs(
  users: MemoryUserRepository,
  email: string,
  role: Role = 'user'
): Promise<LoggedIn> {
  const user = await users.create({ email, passwordHash: 'unused', role });
  assert.ok(user !== null, `${email} already exists`);
  return {
    id: user.id,
    cookies: { [TOKEN_COOKIE]: await tokens.issue(user.id) },
  };
}

// Fresh app and empty repositories per test, so tests cannot affect each other.
// The repositories are returned too, so tests can seed rows the API cannot create
async function setup(t: TestContext): Promise<{
  app: App;
  users: MemoryUserRepository;
  comments: MemoryCommentRepository;
  lena: LoggedIn; // default user for tests that are not about authorisation
}> {
  const users = new MemoryUserRepository(steppingClock());
  const comments = new MemoryCommentRepository(steppingClock());
  const app = buildApp(env, () => testDeps(users, comments));
  t.after(async () => {
    await app.close();
  });
  return { app, users, comments, lena: await loginAs(users, 'lena@x.org') };
}

async function postComment(
  app: App,
  bearId: string,
  payload: unknown,
  cookies: Cookies = {}
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'POST',
    url: `/api/bears/${bearId}/comments`,
    payload: payload as Record<string, unknown>,
    cookies,
  });
}

async function createComment(
  app: App,
  as: LoggedIn,
  text = 'mine'
): Promise<string> {
  const res = await postComment(app, 'u-arctos', { text }, as.cookies);
  assert.equal(res.statusCode, 201);
  return Comment.parse(res.json()).id;
}

async function createComments(
  app: App,
  as: LoggedIn,
  texts: string[]
): Promise<void> {
  for (const text of texts) {
    await createComment(app, as, text);
  }
}

async function deleteComment(
  app: App,
  id: string,
  cookies: Cookies = {}
): Promise<LightMyRequestResponse> {
  return await app.inject({
    method: 'DELETE',
    url: `/api/comments/${id}`,
    cookies,
  });
}

async function getPage(
  app: App,
  bearId: string,
  query: Record<string, string>
): Promise<CommentPage> {
  const res = await app.inject({
    method: 'GET',
    url: `/api/bears/${bearId}/comments`,
    query,
  });
  assert.equal(res.statusCode, 200);
  return CommentPage.parse(res.json());
}

function assertProblem(res: LightMyRequestResponse, status: number): Problem {
  assert.equal(res.statusCode, status);
  assert.match(
    String(res.headers['content-type']),
    /^application\/problem\+json/
  );
  return Problem.parse(res.json());
}

await test('POST creates a comment as the logged-in user and points to it', async (t) => {
  const { app, lena } = await setup(t);

  const res = await postComment(
    app,
    'u-arctos',
    { text: 'Saw one in Slovenia' },
    lena.cookies
  );

  assert.equal(res.statusCode, 201);
  const comment = Comment.parse(res.json());
  assert.equal(comment.bearId, 'u-arctos');
  // Both come from the token, never from the body
  assert.equal(comment.authorId, lena.id);
  assert.equal(comment.author, 'lena');
  assert.equal(comment.text, 'Saw one in Slovenia');
  assert.equal(res.headers.location, `/api/comments/${comment.id}`);
});

await test('POST trims the text', async (t) => {
  const { app, lena } = await setup(t);

  const res = await postComment(
    app,
    'u-arctos',
    { text: '\n Saw one \t' },
    lena.cookies
  );

  assert.equal(Comment.parse(res.json()).text, 'Saw one');
});

await test('POST without a valid login → 401 and nothing is stored', async (t) => {
  const { app } = await setup(t);

  assertProblem(await postComment(app, 'u-arctos', { text: 'anonymous' }), 401);
  assertProblem(
    await postComment(
      app,
      'u-arctos',
      { text: 'forged' },
      { [TOKEN_COOKIE]: 'not-a-jwt' }
    ),
    401
  );

  assert.deepEqual((await getPage(app, 'u-arctos', {})).items, []);
});

await test('POST with author or authorId in the body → 400, nobody can post as someone else', async (t) => {
  const { app, lena } = await setup(t);

  const spoofed = [
    ['author', 'Thomas'],
    ['authorId', randomUUID()],
  ] as const;
  for (const [key, value] of spoofed) {
    const res = await postComment(
      app,
      'u-arctos',
      { text: 'hi', [key]: value },
      lena.cookies
    );

    const problem = assertProblem(res, 400);
    assert.match(problem.errors?.[0]?.message ?? '', new RegExp(`"${key}"`));
  }

  assert.deepEqual((await getPage(app, 'u-arctos', {})).items, []);
});

await test('GET lists only the comments of the requested bear', async (t) => {
  const { app, users, lena } = await setup(t);
  const max = await loginAs(users, 'max@x.org');
  await postComment(app, 'u-arctos', { text: 'first' }, lena.cookies);
  await postComment(app, 'u-arctos', { text: 'second' }, max.cookies);
  await postComment(app, 'u-maritimus', { text: 'other bear' }, lena.cookies);

  // Reading stays public: no cookie
  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/u-arctos/comments',
  });

  assert.equal(res.statusCode, 200);
  const { items, nextCursor } = CommentPage.parse(res.json());
  assert.deepEqual(
    items.map((c) => [c.author, c.text]),
    [
      ['max', 'second'],
      ['lena', 'first'],
    ]
  );
  assert.equal(nextCursor, null);
});

await test('GET returns an empty list for a bear without comments', async (t) => {
  const { app } = await setup(t);

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/u-maritimus/comments',
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(CommentPage.parse(res.json()).items, []);
});

await test('POST rejects text that is empty after trimming', async (t) => {
  const { app, lena } = await setup(t);

  const res = await postComment(app, 'u-arctos', { text: '   ' }, lena.cookies);

  const problem = assertProblem(res, 400);
  assert.deepEqual(problem.errors, [
    { path: 'text', message: 'text must not be empty' },
  ]);
});

await test('POST rejects a body with missing fields', async (t) => {
  const { app, lena } = await setup(t);

  const res = await postComment(app, 'u-arctos', {}, lena.cookies);

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'text');
});

await test('unknown bears are 404 for GET and POST', async (t) => {
  const { app, lena } = await setup(t);

  const get = await app.inject({
    method: 'GET',
    url: '/api/bears/u-nope/comments',
  });
  const post = await postComment(app, 'u-nope', { text: 'hi' }, lena.cookies);

  assertProblem(get, 404);
  assertProblem(post, 404);
});

await test('a malformed bear id is rejected with 400', async (t) => {
  const { app } = await setup(t);

  const res = await app.inject({
    method: 'GET',
    url: '/api/bears/U-Arctos/comments',
  });

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'id');
});

await test('DELETE matrix: anonymous 401, other user 403, author 204, moderator 204', async (t) => {
  const { app, users, lena: author } = await setup(t);
  const other = await loginAs(users, 'other@x.org');
  const moderator = await loginAs(users, 'mod@x.org', 'moderator');

  const id = await createComment(app, author);
  assertProblem(await deleteComment(app, id), 401);
  const forbidden = assertProblem(
    await deleteComment(app, id, other.cookies),
    403
  );
  assert.match(forbidden.type, /\/forbidden$/);

  // The author's 204 also proves that the 401 and the 403 left the comment alone
  const own = await deleteComment(app, id, author.cookies);
  assert.equal(own.statusCode, 204);
  assert.equal(own.body, '');

  // RBAC: a moderator may delete a comment that is not theirs
  const foreign = await createComment(app, author);
  const moderated = await deleteComment(app, foreign, moderator.cookies);
  assert.equal(moderated.statusCode, 204);

  assert.deepEqual((await getPage(app, 'u-arctos', {})).items, []);
});

await test('a comment without author (seeded) can only be deleted by a moderator', async (t) => {
  const { app, users, comments, lena } = await setup(t);
  const moderator = await loginAs(users, 'mod@x.org', 'moderator');
  // Like seed-comments.ts: a row with author_id NULL, which the API cannot create
  const seeded = await comments.create('u-arctos', {
    text: 'seeded',
    author: 'Seed bot',
    authorId: null,
  });

  // Deny by default: null never equals the id of a user
  assertProblem(await deleteComment(app, seeded.id, lena.cookies), 403);
  const res = await deleteComment(app, seeded.id, moderator.cookies);
  assert.equal(res.statusCode, 204);
});

await test('the repository refuses to delete foreign comments even without the policy', async (t) => {
  const { users, comments, lena } = await setup(t);
  const other = await loginAs(users, 'other@x.org');
  const comment = await comments.create('u-arctos', {
    text: 'mine',
    author: 'lena',
    authorId: lena.id,
  });

  // Defence in depth: the ownership check is part of the delete itself (slide 29),
  // so a future route that forgets the policy still cannot delete someone else's row
  assert.equal(
    await comments.delete(comment.id, { id: other.id, role: 'user' }),
    false
  );
  assert.notEqual(await comments.findById(comment.id), null);
  assert.equal(
    await comments.delete(comment.id, { id: lena.id, role: 'user' }),
    true
  );
});

await test('DELETE removes a comment, a second DELETE is 404', async (t) => {
  const { app, lena } = await setup(t);
  const id = await createComment(app, lena, 'bye');

  assert.equal((await deleteComment(app, id, lena.cookies)).statusCode, 204);
  assert.deepEqual((await getPage(app, 'u-arctos', {})).items, []);

  assertProblem(await deleteComment(app, id, lena.cookies), 404);
});

await test('DELETE of an unknown comment id: anonymous 401, logged in 404', async (t) => {
  const { app, lena } = await setup(t);
  const id = randomUUID();

  // Authentication comes first, so anonymous callers cannot probe which ids exist
  assertProblem(await deleteComment(app, id), 401);
  assertProblem(await deleteComment(app, id, lena.cookies), 404);
});

await test('DELETE with an id that is not a UUID is 400', async (t) => {
  const { app, lena } = await setup(t);

  const res = await deleteComment(app, 'not-a-uuid', lena.cookies);

  const problem = assertProblem(res, 400);
  assert.equal(problem.errors?.[0]?.path, 'commentId');
});

await test('following nextCursor walks all comments newest first', async (t) => {
  const { app, lena } = await setup(t);
  await createComments(app, lena, ['1', '2', '3', '4', '5']);

  const pages: string[][] = [];
  let cursor: string | null = null;
  do {
    const query: Record<string, string> = { limit: '2' };
    if (cursor !== null) query.cursor = cursor;
    const page = await getPage(app, 'u-arctos', query);
    pages.push(page.items.map((c) => c.text));
    cursor = page.nextCursor;
  } while (cursor !== null);

  assert.deepEqual(pages, [['5', '4'], ['3', '2'], ['1']]);
});

await test('a page that ends exactly at the last comment has no nextCursor', async (t) => {
  const { app, lena } = await setup(t);
  await createComments(app, lena, ['1', '2']);

  const page = await getPage(app, 'u-arctos', { limit: '2' });

  assert.equal(page.items.length, 2);
  assert.equal(page.nextCursor, null);
});

await test('without a limit a page has 20 comments', async (t) => {
  const { app, lena } = await setup(t);
  await createComments(
    app,
    lena,
    Array.from({ length: 21 }, (_, i) => `comment ${i + 1}`)
  );

  const page = await getPage(app, 'u-arctos', {});

  assert.equal(page.items.length, 20);
  assert.notEqual(page.nextCursor, null);
});

await test('a cursor is stable when new comments arrive between pages', async (t) => {
  const { app, lena } = await setup(t);
  await createComments(app, lena, ['1', '2', '3', '4']);

  const first = await getPage(app, 'u-arctos', { limit: '2' });
  assert.ok(first.nextCursor !== null);
  await createComments(app, lena, ['new']);
  const second = await getPage(app, 'u-arctos', {
    limit: '2',
    cursor: first.nextCursor,
  });

  // With OFFSET 2, "new" would shift everything and "3" would show up twice
  assert.deepEqual(
    first.items.map((c) => c.text),
    ['4', '3']
  );
  assert.deepEqual(
    second.items.map((c) => c.text),
    ['2', '1']
  );
});

await test('a malformed cursor is rejected with 400', async (t) => {
  const { app } = await setup(t);

  for (const cursor of [
    'garbage',
    Buffer.from('{"createdAt":"yesterday","id":"x"}').toString('base64url'),
  ]) {
    const res = await app.inject({
      method: 'GET',
      url: '/api/bears/u-arctos/comments',
      query: { cursor },
    });

    const problem = assertProblem(res, 400);
    assert.match(problem.type, /\/invalid-cursor$/);
  }
});

await test('a limit outside 1 to 100 is rejected with 400', async (t) => {
  const { app } = await setup(t);

  for (const limit of ['0', '101', 'abc']) {
    const res = await app.inject({
      method: 'GET',
      url: '/api/bears/u-arctos/comments',
      query: { limit },
    });

    const problem = assertProblem(res, 400);
    assert.equal(problem.errors?.[0]?.path, 'limit', `limit=${limit}`);
  }
});
