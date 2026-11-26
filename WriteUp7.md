# Writeup 7

## Task 1

Hash or encrypt? Encryption can be reversed: whoever gets the key gets every password, and the key sits on the same server. A hash is one-way. The server never needs the password back; it hashes the login attempt and compares.

Salt: a random value per password, stored inside the PHC string. The same password gives different hashes, so rainbow tables are useless and each hash has to be cracked separately.

Work factor: the time and memory each guess costs. argon2id is memory-hard, so GPUs and ASICs gain little. A slow hash takes more time to compute and makes large scale guessing, brute force etc harder.

Length over composition (NIST SP 800-63B-4): strength comes from length. 
- Composition rules produce predictable patterns like Password1!, push users to reuse or write passwords down, and add little entropy. 

- Length does more for strength (Every character multiplies the number of possible passwords, harder to guess)

409 error vs enumeration: a clear 409 tells anyone whether an e-mail has an account (clear ux, simpler debugging), which helps targeted phishing and credential stuffing. 
The alternative is to always answer “check your inbox” even if the user is not registered.
Also keep reponse time and size the same, so attackers don't know the difference.

## Task 2

Revocation:
Session: DELETE the row and it’s gone immediately.
JWT: the signature stays valid until exp, so logout needs a denylist (or short lifetimes plus refresh tokens).

Statelessness:
A JWT can be verified without a lookup, but revocation, a fresh role, rate limits and audit all bring state back.
A session needs one store lookup per request.

Size: a session id is about 40 bytes; a JWT is about 300 bytes up to several KB on every request. The cookie limit is 4 KB.

Storage, and what an XSS gets:
Depends where credential is stored.
localStorage: the attacker reads the token itself, can use it from anywhere until exp, and you can’t tell it apart from the real user.
Memory: the token is lost on reload, and an XSS can still hook fetch.
HttpOnly cookie (session or JWT): the token can’t be read. The XSS can only send requests from the victim’s open tab (“session riding”), and that ends when the tab closes.

SameSite and CSRF:
Cookies are attached automatically, so a foreign site can make the browser send authenticated requests to your website.
SameSite=Strict Cookie is never sent on cross site requests.
Strong but users arriving from another site look logged out.
SameSite=Lax stops the cookie on cross-site POST and fetch requests; it is still sent on top-level GET navigations. Blocks classic POST-CSRF form.
A Bearer header set by JavaScript is immune to CSRF but exposed to XSS. That’s the trade-off between the two.

## Task 3

**Authentication vs authorisation:**
  - Authentication answers "who are you?" and produces `req.user`.
  - Authorisation answers "what may you do?": the policy turns actor, action and subject into a verdict.
  - Keep them apart: `requireAuth` never checks roles, and the policy never checks passwords.

- **401 vs 403:**
  - 401 means not authenticated (no credential, an invalid one, or an expired one). The client should log in and retry.
  - 403 means authenticated but not allowed. Retrying with the same identity won't help, so the UI should hide the control.
  - The status name "Unauthorized" is a historical misnomer for this.
  
- **RBAC vs ownership:**
  - RBAC grants rights by role: a moderator may delete any comment. It's coarse and easy to explain.
  - An ownership check is attribute-based: `author_id = actor.id`.
  - The policy combines both and denies by default. The `WHERE` repeats ownership at the data layer, so a forgotten check in a future route still can't delete someone else's row.
  
- **IDOR (OWASP A01:2025 Broken Access Control, the #1 risk):**
  - The id in `DELETE /api/comments/:id` is a direct reference to an object.
  - If the server only checks "logged in?" and never "yours?", user A can delete B's comment just by changing the id.
  - Unguessable UUIDs don't help here: every comment id is public in the `GET` list anyway.
  
- **Why hiding the button isn't a security control:**
  - The client is under the attacker's control: curl, DevTools, editing `user.role` in React state, or replaying a request from the network tab.
  - The hidden button is UX: it avoids offering an action that would fail.
  - The 401/204/403/204 matrix only holds because the server checks every request.

## Task 4

**Mapping to the OWASP Top 10 (2025):**

| Measure | Addresses |
|---|---|
| Login/register rate limits | **A07** Authentication Failures (brute force, credential stuffing), **A06** Insecure Design ("no rate limit by design") |
| helmet, CSP, no Swagger in prod | **A02** Security Misconfiguration; CSP is also the second layer against stored XSS (**A05** Injection) |
| Strict CORS, `.strict()` bodies | **A01** Broken Access Control (CORS `*`, role in the body / mass assignment) |
| Body limit, zod everywhere | **A06** (a 10 MB body is a DoS), **A05** (shrinks the input, but doesn't replace parameterised queries), **A08** (untrusted JSON stays out of trusted paths) |
| Env validation, fail fast | **A02**, **A10** Mishandling of Exceptional Conditions (fails closed instead of running with an empty secret) |
| Secrets in env, gitleaks, rotation | **A04** Cryptographic Failures (secrets in git) |
| Lockfile + `npm ci` (already in CI) | **A03** Supply Chain |
| `warn` log on 429 | **A09** Logging and Alerting |

**Fixed window vs token bucket:**
- **Fixed window** (what `@fastify/rate-limit` does):
  - one counter per key, reset at the end of each window;
  - simple, O(1) memory;
  - but at the window boundary you get up to **2 × max** in a short time: 5 guesses at 0:59 and 5 more at 1:00.
- **Token bucket:**
  - a capacity of *b* tokens, refilled at *r* per second;
  - each request takes one token, and an empty bucket gives 429;
  - bursts of up to *b* are allowed, the average stays at *r*, and there's no boundary effect;
  - it stores a token count and the last refill time.
- **Why fixed window is acceptable for login:** the limit is small, and the second, per-IP bucket caps the total anyway.

**Defence in depth:** several independent layers, so that no single mistake is enough. For this API:
- **Brute force:** argon2id makes each guess slow → rate limits → passwords of at least 12 characters → no account enumeration.
- **Stored XSS:** React escapes text → CSP → the HttpOnly cookie isn't worth stealing.
- **IDOR:** the policy → the ownership check in the `WHERE` clause.
- **CSRF:** SameSite=Lax → the CORS allow-list.
