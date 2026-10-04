#!/usr/bin/env bash
# STAGING ONLY. Delete _staging-ip-echo after this passes. Do not point this at production.
# Usage:
#   IP_ECHO_URL=https://<staging>.functions.supabase.co/_staging-ip-echo \
#   VIDEOS_URL=https://<staging>.functions.supabase.co/fetch-place-videos \
#   ANON_KEY=... \
#   bash supabase/functions/_staging-ip-echo/verify.sh
set -euo pipefail

if [[ -z "${IP_ECHO_URL:-}" || -z "${ANON_KEY:-}" ]]; then
  echo "Set IP_ECHO_URL and ANON_KEY. Optional VIDEOS_URL for the 7/min check." >&2
  exit 1
fi

auth=(-H "Authorization: Bearer ${ANON_KEY}" -H "apikey: ${ANON_KEY}")

echo_ip() {
  curl -sS "${auth[@]}" "$@" "$IP_ECHO_URL"
}

client_of() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); if(!j.clientIp) process.exit(2); process.stdout.write(j.clientIp);})'
}

echo "a) no extra header"
a_json=$(echo_ip)
echo "$a_json"
e=$(printf '%s' "$a_json" | client_of)
echo "egress clientIp=$e"
if [[ "$e" == *:* && "$e" != *::/64 && "$e" != *:*:* ]]; then
  echo "FAIL port-like clientIp: $e" >&2
  exit 1
fi
if [[ "$e" =~ :[0-9]+$ ]]; then
  echo "FAIL clientIp includes a port: $e" >&2
  exit 1
fi

check() {
  local label="$1"
  shift
  local json
  json=$(echo_ip "$@")
  local got
  got=$(printf '%s' "$json" | client_of)
  echo "$label -> $got"
  if [[ "$got" != "$e" ]]; then
    echo "FAIL $label clientIp=$got expected $e" >&2
    echo "$json" >&2
    exit 1
  fi
}

check "b) one forged XFF hop" -H "X-Forwarded-For: 1.2.3.4"
check "c) two forged XFF hops" -H "X-Forwarded-For: 1.2.3.4, 5.6.7.8"
check "d) forged CF-Connecting-IP" -H "CF-Connecting-IP: 9.9.9.9"
check "e) forged X-Real-IP" -H "X-Real-IP: 9.9.9.9"
echo "f) repeat a-e from an IPv6 egress. clientIp must be that /64, still with no port."
echo "g) repeat from another network (mobile hotspot)."

if [[ -n "${VIDEOS_URL:-}" ]]; then
  echo "7 requests/min with a rotated first hop"
  place="${PLACE_ID:-paris}"
  for i in 1 2 3 4 5 6 7; do
    code=$(curl -sS -o /tmp/ip-echo-videos.json -w "%{http_code}" \
      "${auth[@]}" -H "Content-Type: application/json" -H "Origin: https://www.gateo.kr" \
      -H "X-Forwarded-For: 198.51.100.${i}" \
      -d "{\"placeId\":\"${place}\"}" \
      "$VIDEOS_URL")
    echo "request $i -> $code"
    if [[ "$i" -lt 7 && "$code" == "429" ]]; then
      echo "FAIL rate limited before the 7th request" >&2
      exit 1
    fi
    if [[ "$i" -eq 7 && "$code" != "429" ]]; then
      echo "FAIL 7th request was $code, expected 429" >&2
      cat /tmp/ip-echo-videos.json >&2 || true
      exit 1
    fi
  done
fi

echo "PASS echo clientIp stayed $e"
