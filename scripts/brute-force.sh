#!/usr/bin/env bash
set -euo pipefail

API=${API:-http://localhost:3000}
EMAIL=${1:-victim@bears.example}
ATTEMPTS=${ATTEMPTS:-8}
HEADERS=$(mktemp)
trap 'rm -f "$HEADERS"' EXIT

curl -sf -o /dev/null "$API/health" || { echo "error: API not reachable at $API" >&2; exit 1; }

blocked=0
for i in $(seq 1 "$ATTEMPTS"); do
  body=$(node -e 'console.log(JSON.stringify({ email: process.argv[1], password: "guess-" + process.argv[2] }))' "$EMAIL" "$i")
  status=$(curl -s -o /dev/null -D "$HEADERS" -w '%{http_code}' -X POST "$API/api/auth/login" \
    -H 'content-type: application/json' -d "$body")
  retry=$({ grep -i '^retry-after:' "$HEADERS" || true; } | tr -d '\r' | cut -d' ' -f2)
  printf 'attempt %2d: %s%s\n' "$i" "$status" "${retry:+ (retry-after: ${retry}s)}"
  if [[ $status == 429 ]]; then blocked=1; fi
done

if [[ $blocked == 1 ]]; then echo "blocked by the rate limit"; else echo "never blocked: rate limit missing?"
