#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
API=${API:-http://localhost:3000}
PW='correct horse battery'
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

# Reads one key from .env without executing the file; values already set in the shell win
env_value() {
  { grep -E "^$1=" "$ROOT/.env" 2>/dev/null || true; } | tail -n1 | cut -d= -f2- |
    sed -E 's/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/'
}
MODERATOR_EMAIL=${MODERATOR_EMAIL:-$(env_value MODERATOR_EMAIL)}
MODERATOR_PASSWORD=${MODERATOR_PASSWORD:-$(env_value MODERATOR_PASSWORD)}
: "${MODERATOR_EMAIL:?missing: add it to .env (see .env.example), then npm run db:seed:moderator}"
: "${MODERATOR_PASSWORD:?missing: add it to .env (see .env.example), then npm run db:seed:moderator}"

fail() {
  echo "error: $*" >&2
  exit 1
}

# JSON.stringify escapes quotes and backslashes, printf would not
credentials() {
  node -e 'console.log(JSON.stringify({ email: process.argv[1], password: process.argv[2] }))' "$1" "$2"
}

post_json() { # url body [curl args...] → prints the status code
  local url=$1 body=$2
  shift 2
  curl -s -o /dev/null -w '%{http_code}' -X POST "$url" \
    -H 'content-type: application/json' -d "$body" "$@"
}

register() { # email password; 201 = new, 409 = exists from an earlier run, both fine
  local status
  status=$(post_json "$API/api/auth/register" "$(credentials "$1" "$2")")
  [[ $status == 201 || $status == 409 ]] || fail "register $1 → $status"
}

login() { # email password jar
  local status
  status=$(post_json "$API/api/auth/login" "$(credentials "$1" "$2")" -c "$3")
  [[ $status == 200 ]] || fail "login $1 → $status (wrong password, or seed not run?)"
}

new_comment() { # → prints the id of a fresh comment by the author
  local status
  status=$(curl -s -o "$DIR/comment.json" -w '%{http_code}' -b "$DIR/author" \
    -X POST "$API/api/bears/u-arctos/comments" \
    -H 'content-type: application/json' -d '{"text":"curl matrix"}')
  [[ $status == 201 ]] || fail "create comment → $status: $(cat "$DIR/comment.json")"
  node -p 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).id' "$DIR/comment.json"
}

FAILED=0
delete_as() { # label jar-or-empty id expected
  local args=(-s -o /dev/null -w '%{http_code}' -X DELETE "$API/api/comments/$3")
  if [[ -n $2 ]]; then args+=(-b "$2"); fi
  local status
  status=$(curl "${args[@]}")
  local verdict=ok
  if [[ $status != "$4" ]]; then
    verdict=FAIL
    FAILED=1
  fi
  printf '%-10s %s (expected %s) %s\n' "$1" "$status" "$4" "$verdict"
}

curl -sf -o /dev/null "$API/health" || fail "API not reachable at $API (npm run dev:api)"

register author@bears.example "$PW"
register other@bears.example "$PW"
# The moderator is never registered: it must come from the seed, or the role would be "user"
login author@bears.example "$PW" "$DIR/author"
login other@bears.example "$PW" "$DIR/other"
login "$MODERATOR_EMAIL" "$MODERATOR_PASSWORD" "$DIR/moderator"

# "other" runs before "author" on the same comment: the 204 proves the 403 deleted nothing
ID=$(new_comment)
delete_as anonymous "" "$ID" 401
delete_as other "$DIR/other" "$ID" 403
delete_as author "$DIR/author" "$ID" 204
delete_as moderator "$DIR/moderator" "$(new_comment)" 204

exit "$FAILED"
