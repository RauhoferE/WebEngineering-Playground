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

**Library choice** (slide 54 asks you to explain libraries you use): `@fastify/etag` handles hashing and the 304; your own hook handles `Cache-Control`. The plugin doesn't set caching policy, and that policy is what keeps personal data out of shared caches.
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

- **Trade-off:** a changed bear can be up to 60 s old (plus 300 s with SWR). That's acceptable for a species list, not for comments.
- **Slide 17 question:** a shared cache must never store `/api/auth/me` or the POST, and `/api/auth/me` shouldn't even be cached by the browser (`no-store`). Same for `/health/ready`, and the SSE stream gets `no-cache`.

## Task 2

### Times 

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
