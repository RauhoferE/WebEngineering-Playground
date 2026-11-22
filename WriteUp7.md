# Writeup 7

## Task 1

Hash or encrypt? Encryption can be reversed: whoever gets the key gets every password, and the key sits on the same server. A hash is one-way. The server never needs the password back; it hashes the login attempt and compares.

Salt: a random value per password, stored inside the PHC string. The same password gives different hashes, so rainbow tables are useless and each hash has to be cracked separately.

Work factor: the time and memory each guess costs. argon2id is memory-hard, so GPUs and ASICs gain little. A slow hash is a feature because of the asymmetry: you pay about 50–100 ms once per login, while the attacker pays it for every one of billions of guesses against a leaked dump.

Length over composition (NIST SP 800-63B-4): strength comes from length. Composition rules produce predictable patterns like Password1!, push users to reuse or write passwords down, and add little entropy. Instead: a minimum length (15, or 8 with MFA; the task uses 12), a maximum of at least 64, a check against breached passwords, and allowing paste and password managers.

409 vs enumeration: a clear 409 tells anyone whether an e-mail has an account, which helps targeted phishing and credential stuffing. The alternative is to always answer “check your inbox” and send a verification mail, which needs e-mail infrastructure.

## Task 2

Revocation:
Session: DELETE the row and it’s gone immediately.
JWT: the signature stays valid until exp, so logout needs a denylist (or short lifetimes plus refresh tokens).

Statelessness:
A JWT can be verified without a lookup, but revocation, a fresh role, rate limits and audit all bring state back (slide 16).
A session needs one store lookup per request.

Size: a session id is about 40 bytes; a JWT is about 300 bytes up to several KB on every request. The cookie limit is 4 KB.

Storage, and what an XSS gets:
localStorage: the attacker reads the token itself, can use it from anywhere until exp, and you can’t tell it apart from the real user.
Memory: the token is lost on reload, and an XSS can still hook fetch.
HttpOnly cookie (session or JWT): the token can’t be read. The XSS can only send requests from the victim’s open tab (“session riding”), and that ends when the tab closes.

SameSite and CSRF:
Cookies are attached automatically, so a foreign site can make the browser send authenticated requests.
SameSite=Lax stops the cookie on cross-site POST and fetch requests; it is still sent on top-level GET navigations. That’s why there must be no state changes on GET.
Add JSON-only bodies (which force a CORS preflight) and an Origin check for defence in depth.
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
