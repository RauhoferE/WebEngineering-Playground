import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
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
  },
  (t) => [
    index('comments_bear_created_idx').on(t.bearId, t.createdAt, t.id),
    check(
      'comments_author_len',
      sql`char_length(${t.author}) BETWEEN 1 AND 80`
    ),
    check('comments_text_len', sql`char_length(${t.text}) BETWEEN 1 AND 2000`),
  ]
);
