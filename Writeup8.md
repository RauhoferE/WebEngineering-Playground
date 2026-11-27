## Writeup 8

## Task 1 

### Check with Curl

```bash
# 1. First request: 200, Cache-Control and ETag
curl -si http://localhost:3000/api/bears | grep -iE '^(HTTP|cache-control|etag|vary)'

# 2. Revalidate with that ETag: 304 Not Modified, no body
ETAG=$(curl -s -o /dev/null -D - http://localhost:3000/api/bears | awk 'tolower($1)=="etag:"{print $2}' | tr -d '\r')
curl -si -H "If-None-Match: $ETAG" http://localhost:3000/api/bears

# 3. Change the data: the same If-None-Match now gets 200 and a new ETag
docker compose exec db psql -U bears bears -c "UPDATE bears SET name = name || '!' WHERE id = '<an id from step 1>';"
curl -si -H "If-None-Match: $ETAG" http://localhost:3000/api/bears | grep -iE '^(HTTP|etag)'
docker compose exec db psql -U bears bears -c "UPDATE bears SET name = rtrim(name, '!') WHERE id = '<same id>';"

# 4. A single bear and its comments
curl -si http://localhost:3000/api/bears/<id> | grep -iE '^(cache-control|etag)'
curl -si http://localhost:3000/api/bears/<id>/comments | grep -iE '^(cache-control|etag)'

# 5. Logged in: private, no-store
curl -si -c /tmp/jar -H 'content-type: application/json' \
  -d '{"email":"<you>","password":"<pw>"}' http://localhost:3000/api/auth/login | grep -i '^cache-control'
curl -si -b /tmp/jar http://localhost:3000/api/auth/me | grep -iE '^(cache-control|etag)'
```

## Questions

**Library choice**: `@fastify/etag` handles hashing and the 304; your own hook handles `Cache-Control`. The plugin doesn't set caching policy, and that policy is what keeps personal data out of shared caches.
- **Freshness vs validation:** while fresh (`max-age`), a cache answers without asking. Once stale, it asks with `If-None-Match` and gets a 304 with no body. Validation saves bytes, not work: the query and `JSON.stringify` still run before the hash. A version-based ETag (a counter bumped on seed or refresh) could answer 304 before loading anything, and Task 2's cache makes the work itself cheap.
- **private vs public:** `public` lets CDNs and proxies share one copy. `private` means only the user's own browser. Shared caches skip requests with `Authorization`, but there's no such rule for **cookies**, so anything cookie-based must be `private`. That's why the default is `private, no-store`.
- **no-store vs no-cache:** `no-store` means never write it down (secrets, `/api/auth/me`). `no-cache` means you may store it but must revalidate every time (comments: always current, cheap 304s).
- **Vary:** adds request headers to the cache key. `@fastify/cors` already sends `Vary: Origin`. Compression would need `Vary: Accept-Encoding`, and `Vary: Cookie` effectively means one entry per user.
- **PWA strategies → headers** (slide 16):

  | PWA strategy | Server header |
  |---|---|
  | cache-only | `max-age=31536000, immutable` on hashed Vite assets |
  | cache-first | long `max-age` plus a new URL when the content changes |
  | stale-while-revalidate | `max-age=60, stale-while-revalidate=300` (your bears) |
  | network-first | `no-cache` + ETag (your comments) |
  | network-only | `no-store` (auth) |


## Task 2

### Times Before cache

To Benchmark use 
> BENCH_DISABLE_RATE_LIMIT=true npm run dev:api > /tmp/api.log 2>&1

```
┌─────────┬──────┬──────┬───────┬───────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%   │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼───────┼─────────┼─────────┼───────┤
│ Latency │ 9 ms │ 9 ms │ 21 ms │ 22 ms │ 9.82 ms │ 2.74 ms │ 71 ms │
└─────────┴──────┴──────┴───────┴───────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 2,119   │ 2,119   │ 5,043   │ 5,191   │ 4,842.4 │ 721.08  │ 2,119   │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Bytes/Sec │ 8.09 MB │ 8.09 MB │ 19.2 MB │ 19.8 MB │ 18.5 MB │ 2.75 MB │ 8.08 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Times after cache 

```bash
┌─────────┬──────┬──────┬───────┬──────┬─────────┬─────────┬───────┐
│ Stat    │ 2.5% │ 50%  │ 97.5% │ 99%  │ Avg     │ Stdev   │ Max   │
├─────────┼──────┼──────┼───────┼──────┼─────────┼─────────┼───────┤
│ Latency │ 4 ms │ 4 ms │ 7 ms  │ 9 ms │ 4.48 ms │ 1.01 ms │ 22 ms │
└─────────┴──────┴──────┴───────┴──────┴─────────┴─────────┴───────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg     │ Stdev   │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Req/Sec   │ 8,991   │ 8,991   │ 9,839   │ 10,023  │ 9,738.8 │ 265.47  │ 8,987   │
├───────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ Bytes/Sec │ 34.3 MB │ 34.3 MB │ 37.5 MB │ 38.2 MB │ 37.1 MB │ 1.01 MB │ 34.3 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Check with Curl

```bash
npx autocannon -c 50 -a 50 http://localhost:3000/api/bears
curl -s http://localhost:3000/metrics | grep '^cache_'
# Cache before postgres 
#cache_lookups_total{cache="bears_list",result="miss"} 1 <- request 1 found nothing and started fetch 
#cache_lookups_total{cache="bears_list",result="inflight"} 49 <- others wait on fetch 
# HELP cache_loads_total Loads that actually reached the database or Wikipedia
# TYPE cache_loads_total counter
#cache_loads_total{cache="bears_list"} 1 <- was only fetched once
# 
npm run bench
curl -s http://localhost:3000/metrics | grep '^cache_'
#cache_lookups_total{cache="bears_list",result="miss"} 1
#cache_lookups_total{cache="bears_list",result="inflight"} 98
#cache_lookups_total{cache="bears_list",result="stale"} 1
#cache_lookups_total{cache="bears_list",result="hit"} 250
# HELP cache_loads_total Loads that actually reached the database or Wikipedia
# TYPE cache_loads_total counter
#cache_loads_total{cache="bears_list"} 2
```

Check cache loads of wikipedia 

```bash
curl -s -c /tmp/mod -H 'content-type: application/json' \
  -d '{"email":"moderator@bears.example","password":"Password123!"}' http://localhost:3000/api/auth/login
TOKEN=$(awk '$6=="token"{print $7}' /tmp/mod)
npx autocannon -c 50 -a 50 -m POST -H "Cookie: token=$TOKEN" http://localhost:3000/api/bears/refresh
curl -s http://localhost:3000/metrics | grep 'cache="wikipedia"' 
# Cache for wikipedia call 
#cache_lookups_total{cache="wikipedia",result="miss"} 1
#cache_lookups_total{cache="wikipedia",result="inflight"} 49
#cache_loads_total{cache="wikipedia"} 1
```
### Questions
**Libraries:** `lru-cache` handles storage, TTL, `max` and coalescing; `prom-client` provides the counters and `/metrics`; PostgreSQL `LISTEN`/`NOTIFY` delivers invalidation across processes; `autocannon` does the measurement.
- **Cache-aside vs read-through:** in cache-aside, the service checks the cache, loads on a miss and stores the result. In read-through, the cache owns a loader. `lru-cache`'s `fetchMethod` is technically read-through, but the service passes its own loader on each call and owns the key and the invalidation. So it behaves like cache-aside, with coalescing included.
- **TTL vs event-based invalidation:** you use both. A refresh or seed bumps the generation, via `NOTIFY`, for near-zero staleness. The 60 s TTL catches what events miss: a direct SQL edit, or a dropped listener connection.
- **Stampede:** an entry expires, 50 requests miss at once and 50 identical loads hit the database or Wikipedia. Coalescing (single flight) makes the first miss load and everyone else await the same promise. A failed load stores nothing, and every waiter gets the error.
- **When to move to Redis:** when instances must agree on one copy, when the data outgrows process memory, or when a warm cache must survive a deploy. The cost is a network hop, serialisation and one more service to run.
- **Several API instances:** each has its own LRU, so N cold starts and N loads. `NOTIFY` does reach every instance that `LISTEN`s, but each keeps its own copy and generation. The rate-limit counters are per instance too.

## Task 3

To test this you need atleast 2 accounts

### Questions
- **Polling, long polling, SSE, WebSockets:** Polling = a GET every N s: simple, but wasted requests and up to N s delay.
  Long polling = a GET held open until data arrives: one request per event, a gap while reconnecting.
  SSE = one never-ending HTTP response, server → client, `EventSource` built in with auto-reconnect and `Last-Event-ID`.
  WebSockets = upgrade to a full-duplex channel with its own protocol, no built-in reconnect or resync.
  Comments flow one way; writing stays a POST with validation, auth and idempotency. SSE is plain HTTP, so
  cookies, CORS, helmet, nginx and the Vite proxy work unchanged, and resync comes for free. WebSockets pay off
  only when the client talks back often (chat, cursors, games).
- **Ordering per entity:** all events of one bear arrive in commit order; across bears there is no order, and nobody
  can tell. `seq` is incremented under the bear's row lock in the comment transaction. It matters: `created 43`
  after `deleted 44` would bring a deleted comment back. A `bigserial` is assigned at insert, not commit: 42 can
  become visible before 41, and a client that saw 42 never gets 41. Total order would queue every write in
  the system on one row.
- **Slow consumer:** each connection has its own socket buffer; `write()` returns false when it is full, and
  `@fastify/sse` waits for drain but doesn't limit how much piles up. Above 1 MiB queued, the server destroys that one connection
  instead of buffering without limit or stalling the others. Nothing is lost: the client reconnects with `Last-Event-ID`
  and catches up from `comment_events`.
- **Two API instances:** the `EventEmitter` lives in one process. A POST handled by instance A reaches only A's
  SSE clients; clients connected to B hear nothing until they reconnect. SSE connections stay on one instance, so the events
  have to reach every instance: publish after commit to a shared channel and let each instance forward to its own clients:
  PostgreSQL `LISTEN/NOTIFY` (as already used for `bears_changed`; payload < 8000 bytes, so send `bearId` + `seq`
  and load the event from the table) or Redis pub/sub.

## Task 4

### Check background workers

```bash
# watch the table in a second terminal
watch -n1 "docker compose exec -T db psql -U bears bears -c \"SELECT id, type, status, attempts, run_at, locked_at, last_error FROM jobs ORDER BY id DESC LIMIT 5;\""

npm run worker  

# Always fail jobs end in 3 attempts 
docker compose exec db psql -U bears bears -c "INSERT INTO jobs (type, payload) VALUES ('always-fails', '{}');"

# Kill worker mid hob and check if job still completes 
WORKER_DEMO_DELAY_MS=15000 JOB_VISIBILITY_TIMEOUT_SECONDS=30 npm run worker
# run the UPDATE from 1.; while the job is "running":
pkill -9 -f src/worker.ts
JOB_VISIBILITY_TIMEOUT_SECONDS=30 npm run worker
```

### Questions 

- **Why not in the request?** Latency: the user would wait for work that is not part of the answer. Reliability: a crash
  after the response loses the follow-up work; an upstream outage (Wikipedia) fails a request whose data was fine.
  Retries: a request has no place to retry in 10 minutes; a queue has. Load shaping: bursts become a queue, and the worker
  runs at its own pace and scales on its own.
- **At-least-once vs at-most-once:** at-most-once = mark done, then work: a crash in between loses the job. At-least-once
  = work, then mark done: a crash in between runs it again. There is no order without a gap. Ours is at-least-once; the
  upsert and "done" commit in one transaction (exactly-once inside the database), and the upsert is idempotent anyway.
- **Why SKIP LOCKED:** without `FOR UPDATE`, two workers both read job 1 and both run it. With `FOR UPDATE` alone it is
  correct, but worker 2 waits on job 1's lock, so the workers run one after another. `SKIP LOCKED` makes worker 2 take
  the next free row.
- **Visibility timeout:** a claimed job is a lease (`running` + `locked_at`). If the worker dies, nobody marks it done or
  failed; after the timeout it goes back to `queued`. It must be longer than the slowest normal run, or a healthy job runs
  twice. SQS uses the same name.
- **When a broker (BullMQ + Redis, RabbitMQ):** much higher throughput than one polled table, fan-out to many consumers,
  routing, consumers in other languages, or the team already runs one. The price: enqueueing is no longer in the same
  transaction as the business write, and there is one more service to run. For the bear API the table is enough.

## Task 5

### Questions

### Questions
- **Why is exactly-once delivery impossible end to end?** After a timeout the sender cannot tell "request lost" from
  "done, answer lost". Every acknowledgement can be lost as well, so no extra message settles it. The sender can only
  choose: don't retry (at-most-once, the action may be lost) or retry (at-least-once, it may happen twice).
- **How do idempotent operations give the same guarantee?** Deliver at least once, and make duplicates harmless:
  the effect happens exactly once even if the message arrives several times (effectively-once). Our POST stores the
  first response under the key in the same transaction as the comment; every retry replays it instead of inserting again.
- **Playground 4 (idempotent methods):** GET, PUT and DELETE are idempotent by definition, so browsers, proxies and
  clients may retry them safely. POST is not: two POSTs create two comments. The Idempotency-Key gives POST the same
  retry safety (the alternative would be a PUT to a client-chosen id).
- **Task 4 (retries):** the queue delivers at least once: a worker that dies after the upsert but before "done" gets
  its job re-run after the visibility timeout, and failures are retried with backoff. So the handler must be idempotent:
  `refresh-bears` upserts on the natural key, and its effect and "done" commit in one transaction.
