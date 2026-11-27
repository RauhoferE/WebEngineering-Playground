#!/usr/bin/env bash
# Task 5: the same POST 20× in parallel with one Idempotency-Key → one comment, 20 identical responses
set -euo pipefail

API=${API:-http://localhost:3000}
BEAR=${BEAR:-u-arctos}
N=${N:-20}
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

curl -sf -o /dev/null "$API/health" || { echo "error: API not reachable at $API" >&2; exit 1; }

# Fresh user per run: no password in the repo
EMAIL="idem-$(node -e 'console.log(crypto.randomUUID())')@bears.example"
PASSWORD=$(node -e 'console.log(crypto.randomUUID())')
CREDS="{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}"
curl -sf -o /dev/null -X POST "$API/api/auth/register" -H 'content-type: application/json' -d "$CREDS"
curl -sf -o /dev/null -c "$DIR/jar" -X POST "$API/api/auth/login" -H 'content-type: application/json' -d "$CREDS"

KEY=$(node -e 'console.log(crypto.randomUUID())')
TEXT="idempotency test $KEY"
for i in $(seq 1 "$N"); do
  curl -s -b "$DIR/jar" -o "$DIR/body-$i" -w '%{http_code}\n' \
    -X POST "$API/api/bears/$BEAR/comments" \
    -H 'content-type: application/json' -H "Idempotency-Key: $KEY" \
    -d "{\"text\":\"$TEXT\"}" > "$DIR/status-$i" &
done
wait

echo "status codes:            $(cat "$DIR"/status-* | sort | uniq -c | xargs)"
echo "distinct bodies:         $(md5sum "$DIR"/body-* | cut -d' ' -f1 | sort -u | wc -l)"
echo "comments with this text: $(curl -s "$API/api/bears/$BEAR/comments?limit=100" | grep -o "$TEXT" | wc -l)"
echo "same key, other body:    $(curl -s -o /dev/null -w '%{http_code}' -b "$DIR/jar" \
  -X POST "$API/api/bears/$BEAR/comments" -H 'content-type: application/json' \
  -H "Idempotency-Key: $KEY" -d '{"text":"something else"}')"
