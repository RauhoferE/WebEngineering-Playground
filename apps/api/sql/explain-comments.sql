-- Query plans for GET /api/bears/:id/comments (DrizzleCommentRepository.listByBear)
-- Run after `npm run db:seed:comments`:
--   docker compose exec -T db psql -U bears -d bears < apps/api/sql/explain-comments.sql
-- The SELECTs are the repository's SQL (logged with drizzle's logger: true), params inlined.

\pset pager off

-- Cursor key of the 10,000th newest comment (about page 500 with limit 20)
SELECT created_at AS cursor_created_at, id AS cursor_id
FROM comments
WHERE bear_id = 'u-arctos'
ORDER BY created_at DESC, id DESC
OFFSET 9999 LIMIT 1 \gset

\echo '=== 1. first page, WITH index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE comments.bear_id = 'u-arctos'
ORDER BY comments.created_at DESC, comments.id DESC
LIMIT 21;

\echo '=== 2. page ~500 via cursor, WITH index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE comments.bear_id = 'u-arctos'
  AND (comments.created_at, comments.id) < (:'cursor_created_at'::timestamptz, :'cursor_id'::uuid)
ORDER BY comments.created_at DESC, comments.id DESC
LIMIT 21;

\echo '=== 3. page ~500 via OFFSET 10000, WITH index (for comparison)'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE comments.bear_id = 'u-arctos'
ORDER BY comments.created_at DESC, comments.id DESC
LIMIT 21 OFFSET 10000;

-- DDL is transactional: the index is dropped only inside this transaction.
-- DROP INDEX locks the table until ROLLBACK, so only run this on a local database.
BEGIN;
DROP INDEX comments_bear_created_idx;

\echo '=== 4. first page, WITHOUT index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE comments.bear_id = 'u-arctos'
ORDER BY comments.created_at DESC, comments.id DESC
LIMIT 21;

\echo '=== 5. page ~500 via cursor, WITHOUT index'
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, bear_id, author, text, created_at FROM comments
WHERE comments.bear_id = 'u-arctos'
  AND (comments.created_at, comments.id) < (:'cursor_created_at'::timestamptz, :'cursor_id'::uuid)
ORDER BY comments.created_at DESC, comments.id DESC
LIMIT 21;

ROLLBACK;
