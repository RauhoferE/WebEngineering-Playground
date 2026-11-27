import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Comment } from '../schemas/comment.js';

export const bears = pgTable('bears', {
  id: text('id').primaryKey(), // slug, e.g. "u-arctos"
  name: text('name').notNull(),
  binomial: text('binomial').notNull().unique(),
  imageUrl: text('image_url'),
  range: text('range').notNull(),
  // For same order as Wikipedia
  position: integer('position').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  eventSeq: integer('event_seq').notNull().default(0),
});

export const comments = pgTable(
  'comments',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    bearId: text('bear_id')
      .notNull()
      .references(() => bears.id, { onDelete: 'cascade' }),
    author: text('author').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }) // Used because js can at most use milliseconds
      .notNull()
      .defaultNow(),
    reportCount: integer('report_count').notNull().default(0),
    hiddenAt: timestamp('hidden_at', { withTimezone: true, precision: 3 }),
    authorId: uuid('author_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [
    index('comments_author_idx').on(t.authorId),
    index('comments_bear_created_idx').on(t.bearId, t.createdAt, t.id),
    check(
      'comments_author_len',
      sql`char_length(${t.author}) BETWEEN 1 AND 80`
    ),
    check('comments_text_len', sql`char_length(${t.text}) BETWEEN 1 AND 2000`),
    check('comments_report_count_nonneg', sql`${t.reportCount} >= 0`),
  ]
);

export const commentEvents = pgTable(
  'comment_events',
  {
    bearId: text('bear_id')
      .notNull()
      .references(() => bears.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    type: text('type', {
      enum: ['comment.created', 'comment.deleted'],
    }).notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bearId, t.seq] })]
);

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: ['user', 'moderator'] })
      .notNull()
      .default('user'),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check('users_role_valid', sql`${t.role} IN ('user', 'moderator')`),
    check('users_email_len', sql`char_length(${t.email}) BETWEEN 3 AND 254`),
  ]
);

export const revokedTokens = pgTable(
  'revoked_tokens',
  {
    jti: uuid('jti').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('revoked_tokens_expires_idx').on(t.expiresAt)]
);

export const jobs = pgTable(
  'jobs',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    status: text('status', { enum: ['queued', 'running', 'done', 'dead'] })
      .notNull()
      .default('queued'),
    attempts: integer('attempts').notNull().default(0),
    runAt: timestamp('run_at', { withTimezone: true }).notNull().defaultNow(),
    lockedAt: timestamp('locked_at', { withTimezone: true }),
    lastError: text('last_error'),
  },
  // Partial index: only queued rows, so the claim stays fast however many done jobs pile up
  (t) => [
    index('jobs_ready')
      .on(t.runAt)
      .where(sql`status = 'queued'`),
  ]
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    fingerprint: text('fingerprint').notNull(),
    response: jsonb('response').$type<Comment>(), // null only inside the transaction that claimed the key
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.key] })] // per user: two users may pick the same key
);
