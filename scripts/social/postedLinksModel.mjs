/** posted-links.md → social card rows. Does not read posted-log.md. */

export const POSTED_LINKS_COLUMNS = [
  '게시일',
  '채널',
  '게시 URL',
  '홍보번호',
  '대상',
  '표시 이름',
  '지역',
  '상태',
];

export const SOCIAL_LINKS_CARD_CAP = 30;

const CAMPAIGN_ID_RE = /^(?:reel-\d+|fest-\d+)$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PLACE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;
const LIVE_CHANNELS = new Set(['IG', 'FB']);

function splitTableRow(line) {
  const trimmed = String(line ?? '').trim();
  if (!trimmed.startsWith('|')) return null;
  const parts = trimmed.split('|');
  const end = trimmed.endsWith('|') ? -1 : undefined;
  return parts.slice(1, end).map((cell) => cell.trim());
}

function isSeparator(cells) {
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isRealDate(value) {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * @param {string} raw
 * @returns {{ ok: true, targets: { type: 'place', slug: string }[] | { type: 'festival', id: string }[] } | { ok: false }}
 */
export function parseSocialTargets(raw) {
  const parts = String(raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 1 || parts.length > 3) return { ok: false };
  const targets = [];
  for (const part of parts) {
    const match = /^(place|festival):(.+)$/.exec(part);
    if (!match) return { ok: false };
    if (match[1] === 'place') {
      const slug = match[2].trim();
      if (!PLACE_SLUG_RE.test(slug)) return { ok: false };
      targets.push({ type: 'place', slug });
    } else {
      const id = match[2].trim();
      if (!/^\d+$/.test(id)) return { ok: false };
      targets.push({ type: 'festival', id });
    }
  }
  return { ok: true, targets };
}

export function socialTargetKey(targets) {
  return targets
    .map((target) =>
      target.type === 'festival' ? `festival:${target.id}` : `place:${target.slug}`,
    )
    .join(',');
}

/**
 * @param {string} markdown
 */
export function parsePostedLinksMarkdown(markdown) {
  const lines = String(markdown ?? '').replace(/^\uFEFF/, '').split(/\r?\n/);
  let headerIndex = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const cells = splitTableRow(lines[index]);
    if (!cells || cells[0] !== '게시일') continue;
    if (
      cells.length !== POSTED_LINKS_COLUMNS.length ||
      POSTED_LINKS_COLUMNS.some((name, column) => cells[column] !== name)
    ) {
      return { ok: false, error: `머리 열이 달라요 (줄 ${index + 1})`, rows: [] };
    }
    headerIndex = index;
    break;
  }
  if (headerIndex === -1) return { ok: true, rows: [] };

  const rows = [];
  // 표 아래 삭제·댓글 불릿은 행이 아니에요. 표가 아닌 첫 줄에서 읽기를 멈춰요.
  for (let index = headerIndex + 1; index < lines.length; index += 1) {
    if (!String(lines[index] ?? '').trim()) continue;
    const cells = splitTableRow(lines[index]);
    if (!cells) break;
    if (isSeparator(cells)) continue;
    rows.push({ line: index + 1, cells });
  }
  return { ok: true, rows };
}

function classifyRow(row) {
  const line = row.line;
  const cells = row.cells;
  if (!cells || cells.length !== POSTED_LINKS_COLUMNS.length) {
    return { kind: 'skipped', line, reason: 'malformed' };
  }
  const [postedOn, channelRaw, url, campaignId, targetRaw, title, region, statusRaw] = cells;
  const channel = String(channelRaw || '').trim().toUpperCase();
  const status = String(statusRaw || '').trim().toLowerCase();
  if (channel === 'X') return { kind: 'excluded', line, reason: 'x' };
  if (status === 'deleted') return { kind: 'excluded', line, reason: 'deleted' };
  if (status === 'unconfirmed') return { kind: 'excluded', line, reason: 'unconfirmed' };
  if (!LIVE_CHANNELS.has(channel)) return { kind: 'skipped', line, reason: 'bad-channel' };
  if (status !== 'live') return { kind: 'skipped', line, reason: 'bad-status' };
  if (!CAMPAIGN_ID_RE.test(String(campaignId || '').trim())) {
    return { kind: 'skipped', line, reason: 'bad-campaign' };
  }
  if (!isRealDate(postedOn)) return { kind: 'skipped', line, reason: 'bad-date' };
  if (!/^https?:\/\/\S+$/.test(url) || /[()\s]/.test(url)) {
    return { kind: 'skipped', line, reason: 'bad-url' };
  }
  const parsedTargets = parseSocialTargets(targetRaw);
  if (!parsedTargets.ok) return { kind: 'skipped', line, reason: 'bad-targets' };
  if (!String(title || '').trim()) return { kind: 'skipped', line, reason: 'missing-title' };
  return {
    kind: 'live',
    line,
    postedOn,
    channel,
    campaignId: String(campaignId).trim(),
    title: String(title).trim(),
    region: String(region || '').trim(),
    targets: parsedTargets.targets,
    targetKey: socialTargetKey(parsedTargets.targets),
  };
}

/**
 * Merge live IG/FB rows into one card per 홍보번호. Newest first, cap 30.
 * @param {{ line: number, cells: string[] }[]} rows
 */
export function buildSocialLinkCards(rows) {
  const skipped = [];
  const excluded = [];
  /** @type {Map<string, ReturnType<typeof classifyRow>[]>} */
  const groups = new Map();

  for (const row of rows) {
    const classified = classifyRow(row);
    if (classified.kind === 'skipped') {
      skipped.push({ line: classified.line, reason: classified.reason });
      continue;
    }
    if (classified.kind === 'excluded') {
      excluded.push({ line: classified.line, reason: classified.reason });
      continue;
    }
    const list = groups.get(classified.campaignId) || [];
    list.push(classified);
    groups.set(classified.campaignId, list);
  }

  /** @type {object[]} */
  const cards = [];
  for (const [campaignId, list] of groups) {
    const keys = new Set(list.map((row) => row.targetKey));
    if (keys.size > 1) {
      return {
        ok: false,
        error: `홍보번호 ${campaignId}의 대상이 서로 달라요`,
        cards: [],
        skipped,
        excluded,
      };
    }
    const byDate = [...list].sort((a, b) => a.postedOn.localeCompare(b.postedOn) || a.line - b.line);
    const latest = [...list].sort((a, b) => b.postedOn.localeCompare(a.postedOn) || b.line - a.line)[0];
    const region =
      [...list]
        .sort((a, b) => b.postedOn.localeCompare(a.postedOn) || b.line - a.line)
        .map((row) => row.region)
        .find(Boolean) || '';
    cards.push({
      campaignId,
      firstPostedAt: byDate[0].postedOn,
      title: latest.title,
      region,
      targets: latest.targets.map((target) => ({ ...target })),
    });
  }

  cards.sort(
    (a, b) =>
      b.firstPostedAt.localeCompare(a.firstPostedAt) || b.campaignId.localeCompare(a.campaignId),
  );

  return {
    ok: true,
    cards: cards.slice(0, SOCIAL_LINKS_CARD_CAP),
    capped: cards.length > SOCIAL_LINKS_CARD_CAP,
    skipped,
    excluded,
  };
}

const TOUR_SLUG_RE = /^tour-(\d{1,32})$/;

/**
 * A place target resolves when the slug is in the local catalog, or it is a
 * `tour-{contentId}` the place route hydrates. A named slug that is in neither
 * is missing. Festival ids are numeric links to `/korea`.
 */
export function socialTargetResolves(target, catalog = {}) {
  if (!target) return false;
  if (target.type === 'festival') return /^\d+$/.test(String(target.id || '').trim());
  const slug = String(target.slug || '').trim().toLowerCase();
  if (!slug) return false;
  if (catalog?.places?.has(slug)) return true;
  return TOUR_SLUG_RE.test(slug);
}

/**
 * Drop secondaries the site cannot open. A missing main removes the card.
 * @param {object[]} cards
 */
export function resolveSocialLinkCards(cards, catalog = {}) {
  const missingMains = [];
  const kept = [];
  for (const card of cards) {
    const targets = Array.isArray(card.targets) ? card.targets : [];
    const main = targets[0];
    if (!socialTargetResolves(main, catalog)) {
      missingMains.push({
        campaignId: card.campaignId,
        target: main ? socialTargetKey([main]) : '',
      });
      continue;
    }
    const nextTargets = [main];
    for (const target of targets.slice(1)) {
      if (socialTargetResolves(target, catalog)) nextTargets.push(target);
    }
    kept.push({ ...card, targets: nextTargets });
  }
  return { cards: kept, missingMains };
}

function placeRecord(catalog, slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key || !catalog?.places) return null;
  return catalog.places.get(key) || null;
}

function festivalRecord(catalog, id) {
  if (!catalog?.festivals) return null;
  return catalog.festivals.get(String(id || '').trim()) || null;
}

function photoCreditFor(imageUrl, explicit) {
  const text = String(explicit || '').trim();
  if (text) return { kind: 'text', label: text };
  if (/visitkorea\.or\.kr/i.test(String(imageUrl || ''))) {
    return { kind: 'kto', label: '한국관광공사' };
  }
  return null;
}

/**
 * Attach catalog names, festival dates, and the primary hero photo.
 * @param {object[]} cards
 * @param {{ places?: Map<string, { name?: string, imageUrl?: string | null }>, festivals?: Map<string, object> }} [catalog]
 */
export function enrichSocialCards(cards, catalog = {}) {
  const { cards: resolved } = resolveSocialLinkCards(cards, catalog);
  return resolved.map((card) => {
    const targets = card.targets.map((target, index) => {
      if (target.type === 'festival') {
        const fest = festivalRecord(catalog, target.id);
        const next = { type: 'festival', id: String(target.id) };
        if (index > 0 && fest?.title) next.name = fest.title;
        if (fest?.eventStartDate) next.eventStartDate = fest.eventStartDate;
        if (fest?.eventEndDate) next.eventEndDate = fest.eventEndDate;
        if (fest?.imageUrl) next.imageUrl = fest.imageUrl;
        if (fest?.imageCredit) next.imageCredit = fest.imageCredit;
        return next;
      }
      const place = placeRecord(catalog, target.slug);
      const next = { type: 'place', slug: target.slug };
      if (index > 0 && place?.name) next.name = place.name;
      if (place?.imageUrl) next.imageUrl = place.imageUrl;
      return next;
    });
    const primary = targets[0] || null;
    const photoUrl = primary?.imageUrl || null;
    const photoCredit = photoCreditFor(photoUrl, primary?.imageCredit);
    let region = String(card.region || '').trim();
    if (!region && primary?.type === 'place') {
      region = String(placeRecord(catalog, primary.slug)?.region || '').trim();
    }
    return {
      campaignId: card.campaignId,
      firstPostedAt: card.firstPostedAt,
      title: card.title,
      region,
      photoUrl,
      photoCredit,
      targets: targets.map((target) => {
        const next = { type: target.type };
        if (target.type === 'festival') next.id = target.id;
        else next.slug = target.slug;
        if (target.name) next.name = target.name;
        if (target.eventStartDate) next.eventStartDate = target.eventStartDate;
        if (target.eventEndDate) next.eventEndDate = target.eventEndDate;
        return next;
      }),
    };
  });
}
