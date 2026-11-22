# Writeup 7

## Task 1

Hash or encrypt? Encryption can be reversed: whoever gets the key gets every password, and the key sits on the same server. A hash is one-way. The server never needs the password back; it hashes the login attempt and compares.

Salt: a random value per password, stored inside the PHC string. The same password gives different hashes, so rainbow tables are useless and each hash has to be cracked separately.

Work factor: the time and memory each guess costs. argon2id is memory-hard, so GPUs and ASICs gain little. A slow hash is a feature because of the asymmetry: you pay about 50–100 ms once per login, while the attacker pays it for every one of billions of guesses against a leaked dump.

Length over composition (NIST SP 800-63B-4): strength comes from length. Composition rules produce predictable patterns like Password1!, push users to reuse or write passwords down, and add little entropy. Instead: a minimum length (15, or 8 with MFA; the task uses 12), a maximum of at least 64, a check against breached passwords, and allowing paste and password managers.

409 vs enumeration: a clear 409 tells anyone whether an e-mail has an account, which helps targeted phishing and credential stuffing. The alternative is to always answer “check your inbox” and send a verification mail, which needs e-mail infrastructure.
