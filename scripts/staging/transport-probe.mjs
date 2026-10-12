/**
 * Staging probe for transport-proxy. No live call in CI.
 *
 *   TRANSPORT_PROBE_URL=https://<ref>.supabase.co \
 *   TRANSPORT_PROBE_ANON_KEY=... \
 *   node scripts/staging/transport-probe.mjs
 *
 * STAGING_FUNCTIONS_URL and STAGING_ANON_KEY are accepted aliases.
 * Prints a short card summary. Does not print the anon key or service key.
 */
const baseInput = String(process.env.TRANSPORT_PROBE_URL || process.env.STAGING_FUNCTIONS_URL || '').replace(/\/$/, '');
const anon = String(process.env.TRANSPORT_PROBE_ANON_KEY || process.env.STAGING_ANON_KEY || '');

if (!baseInput || !anon) {
  console.error('TRANSPORT_PROBE_URL and TRANSPORT_PROBE_ANON_KEY are required');
  process.exit(1);
}

function endpoint() {
  if (baseInput.endsWith('/transport-proxy')) return baseInput;
  return `${baseInput}/functions/v1/transport-proxy`;
}

function kstToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

const RUNS = [
  { contentId: '638576', trainDate: '2026-10-24', label: '국향대전' },
  { contentId: '637693', trainDate: '2026-10-24', label: '마산가고파' },
  { contentId: '2930716', trainDate: '2026-10-16', label: '강릉' },
];

function line(option) {
  const fare = option.fareAdultMin == null
    ? '요금 없음'
    : option.fareAdultMin === option.fareAdultMax
      ? `${option.fareAdultMin}`
      : `${option.fareAdultMin}~${option.fareAdultMax}`;
  return [
    option.mode,
    option.depStation,
    '→',
    option.arrStation,
    option.grade,
    option.trainNo || (option.trainNos || []).slice(0, 4).join(','),
    `${option.durationMin}~${option.durationMax}분`,
    fare,
    `${option.dailyCount}회`,
    option.firstDeparture,
    option.lastDeparture,
    option.bookingOperator || '',
    option.truncated ? 'truncated' : '',
  ].filter(Boolean).join(' ');
}

function walk(card) {
  const problems = [];
  const blob = JSON.stringify(card);
  if (blob.includes(anon)) problems.push('response contains the anon key');
  if (/"fareAdultMin":0|"fareAdultMax":0/.test(blob)) problems.push('fare 0 present');
  if (/"firstDeparture":"23:59"|"lastDeparture":"23:59"/.test(blob)) problems.push('23:59 sentinel present');
  for (const origin of card.origins || []) {
    console.log(`- ${origin.label} direct=${origin.direct} options=${origin.options?.length || 0}`);
    for (const option of origin.options || []) console.log(`  ${line(option)}`);
    if (origin.suggestedTransfer) {
      console.log(`  transfer: ${origin.suggestedTransfer.summary}`);
      for (const leg of origin.suggestedTransfer.legs || []) {
        const count = leg.dailyCount == null ? '' : ` ${leg.dailyCount}회`;
        console.log(`  leg ${leg.mode} ${leg.from || leg.depStationId || ''}→${leg.to || ''} verified=${leg.verified}${count}`);
      }
    }
    for (const option of origin.options || []) {
      if (option.depStationId === 'NATH30000' && option.bookingOperator !== 'SR') {
        problems.push('수서 출발인데 SR 예매 규칙이 아님');
      }
      if (option.depStationId === 'NATH30000' && option.grade.startsWith('SRT')) {
        problems.push('등급명을 SRT로 바꿔 씀');
      }
    }
  }
  return problems;
}

async function runOne(spec) {
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({ contentId: spec.contentId, trainDate: spec.trainDate }),
    signal: AbortSignal.timeout(90000),
  });
  const text = await res.text();
  if (text.includes(anon)) {
    console.error(`${spec.contentId} response leaked the anon key`);
    return 1;
  }
  let card;
  try {
    card = JSON.parse(text);
  } catch {
    console.error(`${spec.contentId} non-json HTTP ${res.status}`);
    return 1;
  }
  const timing = res.headers.get('server-timing') || '';
  console.log(`\n== ${spec.label} ${spec.contentId} HTTP ${res.status} upstream=${card.upstreamCalls} cache=${card.cacheHits}`);
  console.log(`timing ${timing || '(none)'}`);
  if (!card.ok) {
    console.error(card.error || 'not ok');
    return 1;
  }
  const today = kstToday();
  const problems = [];
  if (!/\brl;dur=/.test(timing) || !/\bcache;dur=/.test(timing) || !/\bupstream;dur=/.test(timing) || !/\bbuild;dur=/.test(timing)) {
    problems.push(`Server-Timing ${timing || 'missing'}`);
  }
  if (card.flags?.busSameDayOnly !== true) problems.push('busSameDayOnly');
  if (card.flags?.fareScope !== 'adult only') problems.push('fareScope');
  if (card.source !== '국토교통부 TAGO') problems.push('source');
  if (card.trainDate !== spec.trainDate) problems.push(`trainDate ${card.trainDate}`);
  if (card.busDate !== today) problems.push(`busDate ${card.busDate} expected ${today}`);
  problems.push(...walk(card));

  if (spec.contentId === '2930716') {
    for (const id of ['seoul-station', 'cheongnyangni', 'dongseoul', 'seoul-gyeongbu', 'yeosu', 'incheon-airport']) {
      if (!card.origins.some((origin) => origin.originId === id)) problems.push(`missing ${id}`);
    }
    const yeosu = card.origins.find((origin) => origin.originId === 'yeosu');
    if (yeosu?.direct !== false) problems.push(`yeosu direct=${yeosu?.direct}`);
    const airport = card.origins.find((origin) => origin.originId === 'incheon-airport');
    if (airport && airport.direct !== true) {
      const arex = airport.suggestedTransfer?.legs?.find((leg) => leg.mode === 'arex');
      if (!arex || arex.verified !== false) problems.push('AREX leg missing or marked verified');
    }
  }
  if (spec.contentId === '638576') {
    const withHop = card.origins.find((origin) =>
      origin.suggestedTransfer?.legs?.some((leg) => leg.depStationId === 'NAT031857' && leg.arrStationId === 'NAT032212'),
    );
    if (!withHop) problems.push('광주송정→함평역 transfer leg missing');
  }
  if (problems.length) {
    for (const problem of problems) console.error(`FAIL ${problem}`);
    return 1;
  }
  console.log('shape ok');
  return 0;
}

let code = 0;
for (const spec of RUNS) {
  try {
    code = Math.max(code, await runOne(spec));
  } catch (error) {
    console.error(spec.contentId, error?.message || error);
    code = 1;
  }
}
process.exit(code);
