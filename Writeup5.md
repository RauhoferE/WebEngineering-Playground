# Writeup 5

## Task 1

Why does one slow synchronous operation delay every request?

Node runs all your JavaScript on a single thread, the event loop. A handler that does synchronous work, such as pbkdf2Sync or a big JSON.parse, keeps that thread busy until it finishes. During that time no other callback can run: no other request handler, no timer, not even /health. Async I/O avoids this because the work is handed to the OS or to libuv’s thread pool, and await gives the thread back to the loop. CPU-heavy work belongs in worker threads or a background job (slide 12).

What is a health endpoint for, and who calls it?

It’s a cheap, machine-readable answer to “is this process alive and able to serve?”. It’s called by machines, not people: Docker’s HEALTHCHECK (which your compose file uses to delay starting web until the API is healthy), load balancers deciding where to send traffic, orchestrators like Kubernetes using liveness and readiness probes to restart or remove instances, and uptime monitoring. version shows which build is deployed, and uptime reveals restart loops. Keep it fast, and keep it free of slow upstream calls, or a Wikipedia outage would make your healthy API look dead.

## Task 2
