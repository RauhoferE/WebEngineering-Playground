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
