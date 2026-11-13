# Writeup 6

## Task 1

Who uses each check:

Liveness: the orchestrator (Docker, Kubernetes) uses it to decide whether to restart the process. If liveness checked the database, a database outage would restart every API instance, which fixes nothing.

Readiness: the load balancer uses it to decide whether to send traffic to an instance.

Too many dependencies in readiness: if the check includes Wikipedia or other optional services, one slow upstream marks every instance “not ready” at once, and the app goes down completely even though most features would still work. Each check also costs a request on every probe.

Why a pool: opening a Postgres connection costs a TCP handshake, TLS and authentication, and a new backend process on the server. A pool keeps connections open and reuses them, and it queues requests when they’re all busy.

What limits its size: Postgres’s max_connections (100 by default), shared between all API instances, workers, migrations and psql sessions. Each connection costs server memory, and only a few per database CPU core can do useful work at the same time. The slides’ example: 3 instances × 10 connections = 30.
