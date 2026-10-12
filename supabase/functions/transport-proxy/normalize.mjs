import {
  AREX_LEG,
  BOOKING_URLS,
  SOURCE,
  SUSEO_STATION_ID,
  UNQUERIED_TERMINALS,
  DESTINATIONS,
  ORIGINS,
  stationName,
} from "./catalog.mjs";

export const MAX_UPSTREAM_PER_REQUEST = 40;
export const TRAIN_TTL_MS = 24 * 60 * 60 * 1000;

const UNQUERIED_IDS = new Set(UNQUERIED_TERMINALS.map((row) => row.id));

export function kstYmd(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysIso(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function parseDateInput(value) {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  let iso = null;
  if (/^\d{8}$/.test(s)) iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = s;
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return iso;
}

export function trainDateAllowed(iso, today) {
  return iso >= today && iso <= addDaysIso(today, 60);
}

export function compactDate(iso) {
  return String(iso).replace(/-/g, "");
}

export function routeKey(mode, depId, arrId, isoDate) {
  return `${mode}:${depId}:${arrId}:${compactDate(isoDate)}`;
}

export function cacheFresh(mode, fetchedAt, serviceDate, now = new Date()) {
  const fetched = Date.parse(fetchedAt);
  if (!Number.isFinite(fetched)) return false;
  const age = now.getTime() - fetched;
  if (age < 0) return false;
  if (mode === "train") return age <= TRAIN_TTL_MS;
  const today = kstYmd(now);
  if (serviceDate !== today) return false;
  return kstYmd(new Date(fetched)) === today;
}

export function cardCacheKey(contentId, busDate, trainDate) {
  return `card:${contentId}:${compactDate(busDate)}:${compactDate(trainDate)}`;
}

/** Assembled card is valid until the next KST midnight (bus day). */
export function cardCacheFresh(fetchedAt, busDate, now = new Date()) {
  const fetched = Date.parse(fetchedAt);
  if (!Number.isFinite(fetched)) return false;
  if (now.getTime() < fetched) return false;
  const today = kstYmd(now);
  if (busDate !== today) return false;
  return kstYmd(new Date(fetched)) === today;
}

export function serverTimingHeader(parts, { cacheDesc = "" } = {}) {
  return ["rl", "cache", "upstream", "build"].map((name) => {
    const ms = Number(parts?.[name]);
    const dur = Number.isFinite(ms) && ms > 0 ? ms : 0;
    const desc = name === "cache" && cacheDesc ? `;desc="${cacheDesc}"` : "";
    return `${name};dur=${dur.toFixed(1)}${desc}`;
  }).join(", ");
}

export function redactSecrets(text, secret) {
  let out = text == null ? "" : String(text);
  if (!secret) return out;
  out = out.split(secret).join("[REDACTED]");
  try {
    out = out.split(encodeURIComponent(secret)).join("[REDACTED]");
  } catch {
    /* key was not encodable */
  }
  return out;
}

export function pick(item, ...keys) {
  if (!item || typeof item !== "object") return "";
  for (const key of keys) {
    const value = item[key];
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  const lower = new Map(Object.entries(item).map(([key, value]) => [key.toLowerCase(), value]));
  for (const key of keys) {
    const value = lower.get(key.toLowerCase());
    if (value != null && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

/** TAGO clock. 24:00 is a real last-bus code. 23:59 is the 함평→광주 sentinel. */
export function parsePlanTime(value) {
  const s = String(value ?? "").trim();
  const match = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (!match) return null;
  const hh = Number(match[4]);
  const mm = Number(match[5]);
  if (hh === 24 && mm === 0) return { hhmm: "24:00", minutes: 24 * 60, sentinel: false };
  if (hh > 23 || mm > 59) return null;
  const hhmm = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return { hhmm, minutes: hh * 60 + mm, sentinel: hhmm === "23:59" };
}

export function durationMinutes(dep, arr) {
  if (!dep || !arr) return null;
  const end = arr.minutes < dep.minutes ? arr.minutes + 24 * 60 : arr.minutes;
  const span = end - dep.minutes;
  if (span < 0 || span > 24 * 60) return null;
  return span;
}

export function itemsFromTagoBody(json) {
  if (!json || typeof json !== "object") {
    return { ok: false, resultCode: "", resultMsg: "upstream non-json", items: [], totalCount: 0 };
  }
  const header = json.response?.header ?? {};
  const code = header.resultCode == null ? "" : String(header.resultCode).trim();
  const body = json.response?.body ?? {};
  const total = Number(body.totalCount);
  const raw = body.items && typeof body.items === "object" ? body.items.item : undefined;
  let items = [];
  if (Array.isArray(raw)) items = raw.filter((row) => row && typeof row === "object");
  else if (raw && typeof raw === "object") items = [raw];
  const ok = code === "00" || code === "0";
  return {
    ok,
    resultCode: code,
    resultMsg: header.resultMsg == null ? "" : String(header.resultMsg),
    items: ok ? items : [],
    totalCount: Number.isFinite(total) ? total : items.length,
  };
}

export function positiveFare(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function fareField(mode) {
  return mode === "train" ? "adultcharge" : "charge";
}

export function splitSentinel(items) {
  const kept = [];
  let droppedSentinel = 0;
  for (const item of items) {
    const dep = parsePlanTime(pick(item, "depplandtime", "depPlandTime"));
    if (dep?.sentinel) {
      droppedSentinel += 1;
      continue;
    }
    kept.push(item);
  }
  return { kept, droppedSentinel };
}

function bookingFor(mode, depId) {
  if (mode === "train" && depId === SUSEO_STATION_ID) {
    return {
      bookingOperator: "SR",
      bookingUrl: BOOKING_URLS.SR,
      bookingUnconfirmed: true,
      bookingRule: "suseo-departure",
    };
  }
  if (mode === "train") {
    return {
      bookingOperator: "Korail",
      bookingUrl: BOOKING_URLS.Korail,
      bookingUnconfirmed: false,
      bookingRule: "korail",
    };
  }
  if (mode === "expBus") {
    return {
      bookingOperator: null,
      bookingUrl: BOOKING_URLS.expBus,
      bookingUnconfirmed: false,
      bookingRule: null,
    };
  }
  if (mode === "suburbsBus") {
    return {
      bookingOperator: null,
      bookingUrl: BOOKING_URLS.suburbsBus,
      bookingUnconfirmed: false,
      bookingRule: null,
    };
  }
  return {
    bookingOperator: null,
    bookingUrl: null,
    bookingUnconfirmed: false,
    bookingRule: null,
  };
}

export function summarizeRoute(pair, items, { serviceDate, checkedAt = null, totalCount = null, pageItemCount = null } = {}) {
  const { kept, droppedSentinel } = splitSentinel(Array.isArray(items) ? items : []);
  const groups = new Map();
  for (const item of kept) {
    const dep = parsePlanTime(pick(item, "depplandtime", "depPlandTime"));
    const arr = parsePlanTime(pick(item, "arrplandtime", "arrPlandTime"));
    const span = durationMinutes(dep, arr);
    if (!dep || span == null) continue;
    const grade = pick(item, "traingradename", "gradeNm") || "미표기";
    const key = `${pair.mode}|${pair.depId}|${pair.arrId}|${grade}`;
    if (!groups.has(key)) groups.set(key, { grade, rows: [] });
    groups.get(key).rows.push({
      dep,
      span,
      fare: positiveFare(pick(item, fareField(pair.mode), "adultcharge", "charge")),
      trainNo: pick(item, "trainno", "trainNo"),
      depStation: pick(item, "depplacename", "depPlaceNm") || stationName(pair.depId),
      arrStation: pick(item, "arrplacename", "arrPlaceNm") || stationName(pair.arrId),
    });
  }

  const truncated = Number.isFinite(Number(totalCount)) && Number.isFinite(Number(pageItemCount))
    ? Number(totalCount) > Number(pageItemCount)
    : false;
  const options = [];
  for (const group of groups.values()) {
    const rows = group.rows;
    const durations = rows.map((row) => row.span);
    const fares = rows.map((row) => row.fare).filter((fare) => fare != null);
    const trainNos = [...new Set(rows.map((row) => row.trainNo).filter(Boolean))];
    const first = rows.reduce((min, row) => (row.dep.minutes < min.dep.minutes ? row : min), rows[0]);
    const last = rows.reduce((max, row) => (row.dep.minutes > max.dep.minutes ? row : max), rows[0]);
    options.push({
      mode: pair.mode,
      role: pair.role,
      venue: pair.role === "venue",
      operator: null,
      grade: group.grade,
      trainNo: trainNos.length === 1 ? trainNos[0] : null,
      trainNos: pair.mode === "train" ? trainNos : [],
      depStation: first.depStation,
      depStationId: pair.depId,
      arrStation: first.arrStation,
      arrStationId: pair.arrId,
      durationMin: Math.min(...durations),
      durationMax: Math.max(...durations),
      fareAdultMin: fares.length ? Math.min(...fares) : null,
      fareAdultMax: fares.length ? Math.max(...fares) : null,
      dailyCount: rows.length,
      truncated,
      reportedTotal: truncated ? Number(totalCount) : null,
      firstDeparture: first.dep.hhmm,
      lastDeparture: last.dep.hhmm,
      checkedAt,
      serviceDate,
      source: SOURCE,
      verified: true,
      ...bookingFor(pair.mode, pair.depId),
    });
  }
  options.sort((a, b) => a.firstDeparture.localeCompare(b.firstDeparture) || a.grade.localeCompare(b.grade));
  return { options, droppedSentinel };
}

export function planQueries(destination, { trainDate, busDate }) {
  const queries = [];
  const seen = new Set();
  for (const pair of destination.pairs) {
    if (UNQUERIED_IDS.has(pair.depId) || UNQUERIED_IDS.has(pair.arrId)) continue;
    if (pair.mode !== "train" && pair.mode !== "expBus" && pair.mode !== "suburbsBus") continue;
    const date = pair.mode === "train" ? trainDate : busDate;
    const key = routeKey(pair.mode, pair.depId, pair.arrId, date);
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push({ ...pair, date, key });
  }
  return {
    queries: queries.slice(0, MAX_UPSTREAM_PER_REQUEST),
    truncatedPlan: queries.length > MAX_UPSTREAM_PER_REQUEST,
  };
}

function materializeLeg(leg, results, trainDate, busDate, checkedAt) {
  if (leg.mode === "arex" || leg.verified === false && !leg.depId) {
    return { ...leg, verified: false };
  }
  const date = leg.mode === "train" ? trainDate : busDate;
  const key = routeKey(leg.mode, leg.depId, leg.arrId, date);
  const row = results[key];
  const base = {
    from: leg.from || stationName(leg.depId),
    to: leg.to || stationName(leg.arrId),
    mode: leg.mode,
    depStationId: leg.depId,
    arrStationId: leg.arrId,
  };
  if (!row?.queried || !row.ok) {
    return { ...base, verified: false, reason: row?.queried ? "upstream_error" : "not queried" };
  }
  const summary = summarizeRoute(
    { mode: leg.mode, depId: leg.depId, arrId: leg.arrId, role: "transfer" },
    row.items,
    { serviceDate: date, checkedAt, totalCount: row.totalCount, pageItemCount: row.rawCount },
  );
  const dailyCount = summary.options.reduce((sum, option) => sum + option.dailyCount, 0);
  return {
    ...base,
    verified: true,
    dailyCount,
    droppedSentinel: summary.droppedSentinel,
    options: summary.options,
  };
}

function buildTransfer(destination, originId, results, trainDate, busDate, checkedAt) {
  if (originId === "incheon-airport" && destination.incheonTransfer) {
    const spec = destination.incheonTransfer;
    const legs = [
      { ...AREX_LEG },
      ...(spec.legs || []).map((leg) => materializeLeg(leg, results, trainDate, busDate, checkedAt)),
    ];
    return { summary: spec.summary, legs };
  }
  const transfer = destination.transfer;
  if (!transfer) return null;
  if (Array.isArray(transfer.forOrigins) && !transfer.forOrigins.includes(originId)) return null;
  const legs = (transfer.legs || []).map((leg) => materializeLeg(leg, results, trainDate, busDate, checkedAt));
  if (originId === "incheon-airport") legs.unshift({ ...AREX_LEG });
  return { summary: transfer.summary, legs };
}

function positiveLeg(leg) {
  return leg.verified === true && Number(leg.dailyCount) > 0;
}

function pruneTransfer(transfer, originId, pairs, options) {
  if (!transfer) return null;
  const legs = (transfer.legs || []).filter((leg) => leg.mode === "arex" || positiveLeg(leg));
  if (!legs.length) return null;
  const depIds = new Set(pairs.map((pair) => pair.depId));
  const departsHere = legs.some((leg) => leg.depStationId && depIds.has(leg.depStationId));
  const arexPath = originId === "incheon-airport" && legs.some((leg) => leg.mode === "arex");
  const continues = options.length > 0 && legs.some(positiveLeg);
  if (!departsHere && !arexPath && !continues) return null;
  return { summary: transfer.summary, legs };
}

export function buildFestivalTransportCard({
  destination,
  trainDate,
  busDate,
  checkedAt,
  results,
}) {
  const origins = destination.originIds.map((originId) => {
    const pairs = destination.pairs.filter((pair) => pair.originId === originId);
    const options = [];
    let upstreamError = false;
    let venueQueried = false;
    let venueEmpty = false;
    for (const pair of pairs) {
      const date = pair.mode === "train" ? trainDate : busDate;
      const key = routeKey(pair.mode, pair.depId, pair.arrId, date);
      const row = results[key];
      if (pair.role === "venue") {
        if (row?.queried && row.ok) venueQueried = true;
        if (row?.queried && !row.ok) upstreamError = true;
      }
      if (!row?.queried || !row.ok) {
        if (row?.queried && !row.ok) upstreamError = true;
        continue;
      }
      const summary = summarizeRoute(pair, row.items, {
        serviceDate: date,
        checkedAt,
        totalCount: row.totalCount,
        pageItemCount: row.rawCount,
      });
      if (pair.role === "venue" && summary.options.length === 0) venueEmpty = true;
      options.push(...summary.options);
    }
    const venueHit = options.some((option) => option.venue);
    let direct = false;
    if (venueHit) direct = true;
    else if (!venueQueried && upstreamError) direct = null;
    else if (!venueQueried && pairs.every((pair) => pair.role !== "venue")) direct = false;
    else if (venueEmpty || venueQueried) direct = false;
    else direct = null;

    const suggestedTransfer = direct === true
      ? null
      : pruneTransfer(
        buildTransfer(destination, originId, results, trainDate, busDate, checkedAt),
        originId,
        pairs,
        options,
      );
    if (options.length === 0 && !suggestedTransfer) return null;

    return {
      originId,
      label: ORIGINS[originId]?.label || originId,
      direct,
      options,
      suggestedTransfer,
    };
  }).filter(Boolean);

  return {
    ok: true,
    contentId: destination.contentId,
    festivalName: destination.name,
    venue: destination.venue,
    cityLabel: destination.cityLabel,
    checkedAt,
    source: SOURCE,
    flags: { busSameDayOnly: true, fareScope: "adult only" },
    trainDate,
    busDate,
    origins,
  };
}

export function assertCatalogQueryable() {
  const bad = [];
  for (const destination of Object.values(DESTINATIONS)) {
    for (const pair of destination.pairs) {
      if (UNQUERIED_IDS.has(pair.depId) || UNQUERIED_IDS.has(pair.arrId)) {
        bad.push(`${destination.contentId}:${pair.depId}:${pair.arrId}`);
      }
    }
  }
  return bad;
}
