import assert from 'node:assert/strict';
import { type Action, type Actor, can, type Verdict } from './policy.js';
import test from 'node:test';

const author: Actor = { id: 'a', role: 'user' };
const other: Actor = { id: 'b', role: 'user' };
const moderator: Actor = { id: 'm', role: 'moderator' };
const comment = { authorId: 'a' };

const matrix: Array<[string, Actor | null, Action, Verdict]> = [
  ['anonymous', null, 'comment:create', 'unauthenticated'],
  ['author', author, 'comment:create', 'allow'],
  ['other', other, 'comment:create', 'allow'],
  ['moderator', moderator, 'comment:create', 'allow'],
  ['anonymous', null, 'comment:delete', 'unauthenticated'],
  ['author', author, 'comment:delete', 'allow'],
  ['other', other, 'comment:delete', 'forbidden'],
  ['moderator', moderator, 'comment:delete', 'allow'],
];

for (const [who, actor, action, expected] of matrix) {
  await test(`${who} × ${action} → ${expected}`, () => {
    assert.equal(can(actor, action, comment), expected);
  });
}
