#!/usr/bin/env bash
# STAGING ONLY. Delete staging-ip-echo after this passes. Do not point this at production.
# Usage:
#   IP_ECHO_URL=https://<staging-ref>.supabase.co/functions/v1/staging-ip-echo \
#   VIDEOS_URL=https://<staging-ref>.supabase.co/functions/v1/fetch-place-videos \
#   ANON_KEY=... \
#   bash supabase/functions/staging-ip-echo/verify.sh
set -euo pipefail

if [[ -z "${IP_ECHO_URL:-}" || -z "${ANON_KEY:-}" ]]; then
  echo "Set IP_ECHO_URL and ANON_KEY. Optional VIDEOS_URL for the 7/min check." >&2
  exit 1
fi

auth=(-H "Authorization: Bearer ${ANON_KEY}" -H "apikey: ${ANON_KEY}")
root=$(cd "$(dirname "$0")/../../.." && pwd)

echo_ip() {
  curl -sS "${auth[@]}" "$@" "$IP_ECHO_URL"
}

client_of() {
  node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s); if(!j.clientIp || j.clientIp==="unknown") process.exit(2); process.stdout.write(j.clientIp);})'
}

bucket_ip() {
  node -e '
    const ip = process.argv[1].trim().toLowerCase();
    if (!ip || ip === "unknown") process.exit(2);
    if (!ip.includes(":")) { process.stdout.write(ip); process.exit(0); }
    const halves = ip.split("::");
    if (halves.length > 2) process.exit(2);
    const parse = (part) => part ? part.split(":") : [];
    const left = parse(halves[0]);
    const right = halves.length === 2 ? parse(halves[1]) : [];
    const hextet = /^[0-9a-f]{1,4}$/;
    if ([...left, ...right].some((part) => !hextet.test(part))) process.exit(2);
    let parts;
    if (halves.length === 1) {
      if (left.length !== 8) process.exit(2);
      parts = left;
    } else {
      const missing = 8 - left.length - right.length;
      if (missing < 1) process.exit(2);
      parts = [...left, ...Array(missing).fill("0"), ...right];
    }
    process.stdout.write(parts.slice(0, 4).map((part) => part.padStart(4, "0")).join(":") + "::/64");
  ' "$1"
}

echo "egress lookup"
egress_raw=$(curl -fsS --max-time 15 https://api.ipify.org || curl -fsS --max-time 15 https://ifconfig.me/ip || true)
egress_raw=$(printf '%s' "$egress_raw" | tr -d '[:space:]')
if [[ -z "$egress_raw" || "$egress_raw" == "unknown" ]]; then
  echo "FAIL could not read the external egress IP" >&2
  exit 1
fi
if ! egress=$(bucket_ip "$egress_raw"); then
  echo "FAIL egress IP is not a comparable address: $egress_raw" >&2
  exit 1
fi
echo "external egress=$egress_raw bucket=$egress"

echo "a) no extra header"
a_json=$(echo_ip)
echo "$a_json"
if ! e=$(printf '%s' "$a_json" | client_of); then
  echo "FAIL clientIp missing or unknown" >&2
  echo "$a_json" >&2
  exit 1
fi
echo "echo clientIp=$e"
if [[ "$e" == "unknown" || "$e" != "$egress" ]]; then
  echo "FAIL clientIp=$e does not match egress $egress" >&2
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
  if ! got=$(printf '%s' "$json" | client_of); then
    echo "FAIL $label clientIp missing or unknown" >&2
    echo "$json" >&2
    exit 1
  fi
  echo "$label -> $got"
  if [[ "$got" == "unknown" || "$got" != "$egress" ]]; then
    echo "FAIL $label clientIp=$got expected egress $egress" >&2
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
  echo "7 requests/min, seven distinct uncached catalog places, rotated first hop"
  mapfile -t places < <(node -e '
    const catalog = require(process.argv[1]);
    const ids = Object.keys(catalog.places || {});
    const pick = ids.slice(-7);
    if (pick.length < 7) process.exit(1);
    process.stdout.write(pick.join("\n"));
  ' "$root/supabase/functions/fetch-place-videos/placeVideoCatalog.json")
  if [[ "${#places[@]}" -ne 7 ]]; then
    echo "FAIL need 7 catalog place ids" >&2
    exit 1
  fi
  for i in 1 2 3 4 5 6 7; do
    place="${places[$((i - 1))]}"
    code=$(curl -sS -o /tmp/ip-echo-videos.json -w "%{http_code}" \
      "${auth[@]}" -H "Content-Type: application/json" -H "Origin: https://www.gateo.kr" \
      -H "X-Forwarded-For: 198.51.100.${i}" \
      -d "{\"placeId\":\"${place}\"}" \
      "$VIDEOS_URL")
    echo "request $i place=$place -> $code"
    if [[ "$i" -lt 7 && "$code" == "429" ]]; then
      echo "FAIL rate limited before the 7th request" >&2
      exit 1
    fi
    if [[ "$i" -eq 7 && "$code" != "429" ]]; then
      echo "FAIL 7th request was $code, expected 429. These seven places must be uncached." >&2
      cat /tmp/ip-echo-videos.json >&2 || true
      exit 1
    fi
  done
fi

echo "PASS echo clientIp matched egress $egress"
