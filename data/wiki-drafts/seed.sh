#!/usr/bin/env bash
# Seed all wiki drafts via the admin API.
# Usage: ./seed.sh [http://localhost:3800]
set -euo pipefail

BASE="${1:-http://localhost:3800}"
cd "$(dirname "$0")"

echo "Seeding wiki drafts → $BASE"
echo "------------------------------------"

for f in *.json; do
  printf "→ %-32s " "$f"
  resp=$(curl -s -X POST "$BASE/api/admin/wiki" \
    -H "Content-Type: application/json" \
    --data @"$f")
  if echo "$resp" | grep -q '"page"'; then
    slug=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['page']['slug'])")
    echo "ok  ($slug)"
  else
    echo "ERR"
    echo "    $resp"
  fi
done

echo "------------------------------------"
echo "Done. Verify at $BASE/admin/wiki"
