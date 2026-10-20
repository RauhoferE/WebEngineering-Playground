# Writeup 5

## Task 1

Why does one slow synchronous operation delay every request?

Node runs all your JavaScript on a single thread, the event loop. A handler that does synchronous work, such as pbkdf2Sync or a big JSON.parse, keeps that thread busy until it finishes. During that time no other callback can run: no other request handler, no timer, not even /health. Async I/O avoids this because the work is handed to the OS or to libuv’s thread pool, and await gives the thread back to the loop. CPU-heavy work belongs in worker threads or a background job (slide 12).

What is a health endpoint for, and who calls it?

It’s a cheap, machine-readable answer to “is this process alive and able to serve?”. It’s called by machines, not people: Docker’s HEALTHCHECK (which your compose file uses to delay starting web until the API is healthy), load balancers deciding where to send traffic, orchestrators like Kubernetes using liveness and readiness probes to restart or remove instances, and uptime monitoring. version shows which build is deployed, and uptime reveals restart loops. Keep it fast, and keep it free of slow upstream calls, or a Wikipedia outage would make your healthy API look dead.

## Task 2

What is a BFF, and what moves from the browser to the server?

A Backend for Frontend is a thin server that belongs to one specific frontend and is maintained by the frontend team (slide 23). What moves to the server in your app:
Fetching and parsing the wikitext. The browser now receives a clean Bear, not wikitext.
Validating the upstream response, since external data is untrusted input.
Identifying the client with a descriptive User-Agent.
Timeouts and mapping failures to status codes.
Aggregation: one image request instead of eight per browser.
Later: caching and rate limiting in one place, and secrets that must never reach the browser.
The browser also no longer needs origin=* or cross-origin calls, because everything goes to its own origin through /api.

Why is an empty 200 on upstream failure worse than a 502?

An empty 200 claims “it worked, there are no bears”. The client can’t tell an outage apart from an empty result, so the UI shows “No bears found” instead of an error. Caches may store the empty answer. Monitoring counts a success while the app is broken, so the person on call never gets alerted. A 502 or 504 states the truth: the problem is upstream, retry later or show an error state. It also appears in error-rate dashboards (slide 27).

## Task 3

Why do comments survive a reload but not a restart?
The Map lives in the memory of the API process. A page reload only resets the React state; the frontend then fetches the comments from the API again, and the API still has them. A restart creates a new process with a new, empty Map. Making them last needs persistence, which is Playground 5 with PostgreSQL.
Safe, idempotent, cacheable (slide 8):
Safe: the method doesn’t change server state (GET, HEAD, OPTIONS).
Idempotent: sending the request N times leaves the server in the same state as sending it once (GET, PUT, DELETE).
Cacheable: a response may be stored and reused (GET and HEAD by default).


Why POST for creating? The server picks the id, so the client doesn’t know the new comment’s URI in advance. POST to the collection means “create something in here”, and the answer is 201 with Location pointing to the new URI. PUT would require the client to know the target URI already.
Why must DELETE be idempotent? If a response gets lost, clients, proxies and libraries may retry it automatically. A second DELETE must not do anything extra; the comment is gone either way. Idempotency is about server state, not the status code, so the second call answers 404 and that’s still correct (slide 8).
What happens when a client retries a POST? POST isn’t idempotent. If the first request was stored but the response got lost, the retry creates a second comment with a new id: a duplicate (slide 13). Two ways to prevent it:
The client generates the id and sends PUT /api/comments/{id}, so a retry just overwrites the same comment.
An Idempotency-Key header: the server remembers the key and returns the first result again on a retry (unit 4).

## Task 4 

Why exactly one error contract?
Every client can handle every failure the same way: check the status, branch on type, show detail. If each route invented its own error format, the frontend would need special code per endpoint, and any new endpoint could break it. A standard format (RFC 9457) also works with existing tools and libraries, can be documented once in OpenAPI (Task 5), and makes the logs consistent.
What must never leave the server?
Stack traces, error messages from libraries or upstreams, SQL, hostnames and internal URLs, file paths, configuration values and secrets. They help attackers map your system, for example to see which versions you run or which hosts exist, and they’re useless to legitimate users. So 5xx responses get a generic detail, and everything else goes to the log (slide 39).
How do request ids connect a complaint to a log line?
Each request gets one id: generated by the server, or taken over from x-request-id if a proxy or client already set one. The id is returned in the response header and in instance, and Fastify writes it into every log line of that request as reqId. When a user reports “I got an error”, they (or the frontend) can provide the id, and you search the logs for exactly that request among thousands, including the full error and stack trace that were deliberately kept out of the response.
