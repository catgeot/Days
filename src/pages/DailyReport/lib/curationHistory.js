export const CURATION_DATA_KEY = 'gateo_curation_data';
export const CURATION_HISTORY_KEY = 'gateo_curation_history';
export const CURATION_HISTORY_MAX = 24;
export const CURATION_REJECTED_KEY = 'gateo_curation_rejected';
export const CURATION_REJECTED_MAX = 48;
export const CURATION_TASTE_SURVEY_KEY = 'gateo_curation_taste_survey';

/** 설문 칩 — 프롬프트·UI 공통 */
export const CURATION_TASTE_TAG_OPTIONS = [
  { id: 'sea', label: '바다·섬' },
  { id: 'nature', label: '산·자연' },
  { id: 'city', label: '도시·건축' },
  { id: 'culture', label: '문화·유적' },
  { id: 'adventure', label: '오지·모험' },
  { id: 'quiet', label: '조용한 휴식' },
];

function safeParseJson(raw) {
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function trimStr(v) {
  return String(v ?? '').trim();
}

function normalizeTips(tips) {
  if (!Array.isArray(tips)) return undefined;
  const list = tips
    .map((t) => trimStr(t))
    .filter(Boolean)
    .slice(0, 6);
  return list.length ? list : undefined;
}

/** string 또는 객체 → 저장용 엔트리. 지명 없으면 null. */
export function normalizeCurationHistoryEntry(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const location = trimStr(raw);
    return location ? { location } : null;
  }
  if (typeof raw !== 'object') return null;

  const location = trimStr(raw.location);
  if (!location) return null;

  const entry = { location };
  const locationEn = trimStr(raw.locationEn);
  const title = trimStr(raw.title);
  const description = trimStr(raw.description);
  const imageUrl = trimStr(raw.imageUrl);
  const imageSource = trimStr(raw.imageSource);
  const slug = trimStr(raw.slug);
  const country = trimStr(raw.country);
  const country_en = trimStr(raw.country_en);
  const searchKeyword = trimStr(raw.searchKeyword);
  const whyHidden = trimStr(raw.whyHidden);
  const bestSeason = trimStr(raw.bestSeason);
  const tips = normalizeTips(raw.tips);

  if (locationEn) entry.locationEn = locationEn;
  if (title) entry.title = title;
  if (description) entry.description = description;
  if (imageUrl) entry.imageUrl = imageUrl;
  if (imageSource) entry.imageSource = imageSource;
  if (slug) entry.slug = slug;
  if (country) entry.country = country;
  if (country_en) entry.country_en = country_en;
  if (searchKeyword) entry.searchKeyword = searchKeyword;
  if (whyHidden) entry.whyHidden = whyHidden;
  if (bestSeason) entry.bestSeason = bestSeason;
  if (tips) entry.tips = tips;

  const lat = Number(raw.lat);
  const lng = Number(raw.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    entry.lat = lat;
    entry.lng = lng;
  }

  const savedAt = Number(raw.savedAt);
  entry.savedAt = Number.isFinite(savedAt) ? savedAt : Date.now();

  return entry;
}

export function parseCurationHistory(raw) {
  const parsed = typeof raw === 'string' ? safeParseJson(raw) : raw;
  if (!Array.isArray(parsed)) return [];
  const out = [];
  const seen = new Set();
  for (const item of parsed) {
    const entry = normalizeCurationHistoryEntry(item);
    if (!entry) continue;
    if (seen.has(entry.location)) continue;
    seen.add(entry.location);
    out.push(entry);
  }
  return out;
}

export function historyExcludeLocations(list) {
  return parseCurationHistory(list)
    .map((e) => e.location)
    .filter(Boolean);
}

export function removeCurationHistoryEntry(list, location) {
  const loc = trimStr(location);
  if (!loc) return parseCurationHistory(list);
  return parseCurationHistory(list).filter((e) => e.location !== loc);
}

export function normalizeCurationRejectedEntry(raw) {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    const location = trimStr(raw);
    return location ? { location, rejectedAt: Date.now() } : null;
  }
  if (typeof raw !== 'object') return null;
  const location = trimStr(raw.location);
  if (!location) return null;
  const entry = { location };
  const locationEn = trimStr(raw.locationEn);
  if (locationEn) entry.locationEn = locationEn;
  const rejectedAt = Number(raw.rejectedAt);
  entry.rejectedAt = Number.isFinite(rejectedAt) ? rejectedAt : Date.now();
  return entry;
}

export function parseCurationRejected(raw) {
  const parsed = typeof raw === 'string' ? safeParseJson(raw) : raw;
  if (!Array.isArray(parsed)) return [];
  const out = [];
  const seen = new Set();
  for (const item of parsed) {
    const entry = normalizeCurationRejectedEntry(item);
    if (!entry || seen.has(entry.location)) continue;
    seen.add(entry.location);
    out.push(entry);
  }
  return out;
}

export function upsertCurationRejectedEntry(list, rawEntry, { max = CURATION_REJECTED_MAX } = {}) {
  const entry = normalizeCurationRejectedEntry(rawEntry);
  if (!entry) return parseCurationRejected(list);
  const prev = parseCurationRejected(list).filter((e) => e.location !== entry.location);
  return [entry, ...prev].slice(0, Math.max(1, max));
}

export function readCurationRejected({
  localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
  sessionStorage: sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
} = {}) {
  const fromLocal = parseCurationRejected(readStorageRaw(localStore, CURATION_REJECTED_KEY));
  if (fromLocal.length) return fromLocal;
  return parseCurationRejected(readStorageRaw(sessionStore, CURATION_REJECTED_KEY));
}

export function writeCurationRejected(
  list,
  {
    localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
    sessionStorage: sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  } = {},
) {
  const normalized = parseCurationRejected(list).slice(0, CURATION_REJECTED_MAX);
  const raw = JSON.stringify(normalized);
  writeStorageRaw(localStore, CURATION_REJECTED_KEY, raw);
  writeStorageRaw(sessionStore, CURATION_REJECTED_KEY, raw);
  return normalized;
}

export function normalizeCurationTasteSurvey(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const allowed = new Set(CURATION_TASTE_TAG_OPTIONS.map((o) => o.id));
  const tags = (Array.isArray(raw.tags) ? raw.tags : [])
    .map((t) => trimStr(t))
    .filter((t) => allowed.has(t));
  if (!tags.length) return null;
  const updatedAt = Number(raw.updatedAt);
  return {
    tags,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : Date.now(),
  };
}

export function readCurationTasteSurvey({
  localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
} = {}) {
  return normalizeCurationTasteSurvey(safeParseJson(readStorageRaw(localStore, CURATION_TASTE_SURVEY_KEY)));
}

export function writeCurationTasteSurvey(
  survey,
  {
    localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
  } = {},
) {
  const normalized = normalizeCurationTasteSurvey(survey);
  if (!normalized) {
    try {
      localStore?.removeItem?.(CURATION_TASTE_SURVEY_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
  writeStorageRaw(localStore, CURATION_TASTE_SURVEY_KEY, JSON.stringify(normalized));
  return normalized;
}

/** 동일 location이면 최신으로 교체 후 맨 앞. 상한 초과 시 꼬리 절단. */
export function upsertCurationHistoryEntry(list, rawEntry, { max = CURATION_HISTORY_MAX } = {}) {
  const entry = normalizeCurationHistoryEntry(rawEntry);
  if (!entry) return parseCurationHistory(list);
  const prev = parseCurationHistory(list).filter((e) => e.location !== entry.location);
  return [entry, ...prev].slice(0, Math.max(1, max));
}

function readStorageRaw(storage, key) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageRaw(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 나의 목록: localStorage 우선 · 없으면 session 마이그레이션.
 * Node/스모크에서는 storage 인자를 넘긴다.
 */
export function readCurationHistory({
  localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
  sessionStorage: sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
} = {}) {
  const fromLocal = parseCurationHistory(readStorageRaw(localStore, CURATION_HISTORY_KEY));
  if (fromLocal.length) return fromLocal;

  const fromSession = parseCurationHistory(readStorageRaw(sessionStore, CURATION_HISTORY_KEY));
  if (fromSession.length && localStore) {
    writeStorageRaw(localStore, CURATION_HISTORY_KEY, JSON.stringify(fromSession));
  }
  return fromSession;
}

export function writeCurationHistory(
  list,
  {
    localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
    sessionStorage: sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
  } = {},
) {
  const normalized = parseCurationHistory(list).slice(0, CURATION_HISTORY_MAX);
  const raw = JSON.stringify(normalized);
  writeStorageRaw(localStore, CURATION_HISTORY_KEY, raw);
  writeStorageRaw(sessionStore, CURATION_HISTORY_KEY, raw);
  return normalized;
}

export function readCurationData(
  sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
) {
  const parsed = safeParseJson(readStorageRaw(sessionStore, CURATION_DATA_KEY));
  if (!parsed || typeof parsed !== 'object') return null;
  return normalizeCurationHistoryEntry(parsed);
}

export function writeCurationData(
  data,
  sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
) {
  const entry = normalizeCurationHistoryEntry(data);
  if (!entry) return null;
  writeStorageRaw(sessionStore, CURATION_DATA_KEY, JSON.stringify(entry));
  return entry;
}

export function clearCurationData(
  sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
) {
  if (!sessionStore || typeof sessionStore.removeItem !== 'function') return;
  try {
    sessionStore.removeItem(CURATION_DATA_KEY);
  } catch {
    /* ignore */
  }
}

/** 패널 복원용 — savedAt 유지한 채 현재 결과로 쓸 payload */
export function curationEntryToPanelData(entry) {
  const normalized = normalizeCurationHistoryEntry(entry);
  if (!normalized) return null;
  return { ...normalized };
}

/**
 * 페이지 진입 시 메인 본문: session 결과 우선 · 없으면 나의 목록 최신.
 * 목록만 있고 session이 비면 history[0]을 session에 되살려 result로 연다.
 */
export function resolveActiveCurationPanel({
  localStorage: localStore = typeof localStorage !== 'undefined' ? localStorage : null,
  sessionStorage: sessionStore = typeof sessionStorage !== 'undefined' ? sessionStorage : null,
} = {}) {
  const history = readCurationHistory({
    localStorage: localStore,
    sessionStorage: sessionStore,
  });
  const session = readCurationData(sessionStore);
  if (session?.location) {
    return { panel: session, history, from: 'session' };
  }
  const fallback = curationEntryToPanelData(history[0]);
  if (fallback) {
    writeCurationData(fallback, sessionStore);
    return { panel: fallback, history, from: 'history' };
  }
  return { panel: null, history, from: null };
}
