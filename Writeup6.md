# Writeup 6

## Task 1

Who uses each check:

Liveness: the orchestrator (Docker, Kubernetes) uses it to decide whether to restart the process. If liveness checked the database, a database outage would restart every API instance, which fixes nothing.

Readiness: the load balancer uses it to decide whether to send traffic to an instance.

Too many dependencies in readiness: if the check includes Wikipedia or other optional services, one slow upstream marks every instance “not ready” at once, and the app goes down completely even though most features would still work. Each check also costs a request on every probe.

Why a pool: opening a Postgres connection costs a TCP handshake, TLS and authentication, and a new backend process on the server. A pool keeps connections open and reuses them, and it queues requests when they’re all busy.

What limits its size: Postgres’s max_connections (100 by default), shared between all API instances, workers, migrations and psql sessions. Each connection costs server memory, and only a few per database CPU core can do useful work at the same time. The slides’ example: 3 instances × 10 connections = 30.

## Task 2


Why migrations instead of creating tables from code at startup:
CREATE TABLE IF NOT EXISTS never alters an existing table, so new columns and indexes never reach existing databases.
Migrations are versioned and reviewed in the pull request, and every environment runs the same steps in the same order.
There’s a history of what ran where (__drizzle_migrations).

Forward-only: a migration that has run anywhere is frozen. You fix mistakes with a new migration, never by editing an old one, because the migrator never re-runs an applied file and the databases would drift apart.

Two branches both creating 0003:
_journal.json conflicts on merge, and both snapshots claim to follow 0002, so the next generate diffs against the wrong state.
In a database where one branch already ran, the other 0003 can be silently skipped.
The fix: rebase, delete your unapplied migration, and regenerate it on top of main.

Natural vs surrogate key:
Natural key: use one when the value is unique, stable, and known at insert time. The bear slug is the URL and the Wikipedia identity.
Surrogate key: use one when any of those three is in doubt. Comments have no natural identity, so they get a UUID v7.

## Task 3

What it hides: SQL and Drizzle, table and column names, Date vs ISO-string mapping, ordering, and batching. Services speak the domain (listByBear, delete returning false) instead of select().where(). It’s also the seam that lets tests swap in memory implementations, and would let you replace Drizzle with Prisma without touching routes.

What it costs:
Every query exists twice: once in the interface, once in each class.
A repository that just mirrors the ORM (findMany(where)) is “Drizzle with extra steps”, which the slides call leaky.
In-memory fakes can hide SQL bugs. Your MemoryCommentRepository doesn’t enforce the CHECK lengths or the foreign key, and it orders by insertion, not by created_at, id. Tests pass, but they don’t prove the SQL is right.

N+1: “comments for all bears” written naively is one query for the bears, plus one listByBear per bear inside a loop. With 8 bears that’s 9 round trips; with 100 bears it’s 101, and the latency grows with the data.

How your repository avoids it: listByBears(ids) makes one WHERE bear_id IN (...) query and groups the rows in memory, so it’s always 2 queries no matter how many bears there are. Because the batching lives in the repository, the service can never accidentally loop over queries.

Caveat: IN with thousands of IDs, or bears with unbounded comment counts, need pagination or a LATERAL join with a per-bear limit (slide 29).

## Task 4

Task 4 begins at commit ab3213f03f37e5421c213b4dedd1e9fdcfa68a0a. 
"Task3: Changed created add property to milliseconds"

- **Why `OFFSET` gets slower, and skips or repeats rows:**
  - `LIMIT 20 OFFSET 10000` makes Postgres read and sort 10,020 rows only to throw 10,000 away, so page 500 costs 500 times page 1.
  - A comment inserted between two page loads shifts every row by one: one row appears twice and another is skipped (a delete does the reverse).
- **How a cursor avoids that:** it says "continue after (created_at, id)", which is a position in the sort order, not a count. The index jumps straight to that position, so every page costs the same, and inserts elsewhere don't shift it.
- **What a B-tree is:** a balanced tree of sorted keys. The root and inner pages route a lookup to a leaf in 3–4 page reads, and the leaves are linked, so after the jump Postgres walks sideways in order. That's why the index also delivers the `ORDER BY` without a sort.
- **Why column order matters:**
  - The rule: equality columns first, then the range or sort columns. `(bear_id, created_at, id)` serves `WHERE bear_id = $1 ORDER BY created_at DESC, id DESC` plus the cursor condition.
  - `(created_at, bear_id)` couldn't: one bear's comments would be scattered across the whole index.
  - The same index also doesn't help `WHERE created_at > $1` on its own, because the leading column isn't constrained.
- **Why Postgres may ignore an index on a small table:** the planner estimates costs. For a table that fits in a few pages, reading everything in one sequential pass is cheaper than jumping through an index and then into the table.
