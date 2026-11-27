import { sql } from 'drizzle-orm';
import {
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
