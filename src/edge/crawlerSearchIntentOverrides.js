import {
  extractCityIntroFromGalleryDescription,
  trimMetaDescription,
} from './placeMetaDescription.js';

/**
 * Search-intent hints for crawler title/description.
 * Key: `place:{slug}:{tab}:{locale}` or `hub:{path}:{locale}`.
 * `tab` is `base` for /place/:slug, an alias tab (`video`) or an indexed tab (`gallery`).
 * Title is the head text before the `| GATEO` suffix. Canonical is not a hint.
 *
 * @type {Record<string, { title?: string, descriptionLead?: string, ensurePhrases?: string[], preferCityIntro?: boolean }>}
 */
export const CRAWLER_SEARCH_INTENT_OVERRIDES = {
  'place:jakarta:base:ko': {
    title: '자카르타(Jakarta) 여행 — 명소·플래너·AI 도슨트',
    descriptionLead: '자카르타(Jakarta).',
  },
  'place:tsushima:base:ko': {
    title: '대마도(Daemado island) 여행 — 명소·플래너·AI 도슨트',
    descriptionLead: '대마도(Daemado island).',
  },
  'place:tsushima:base:en': {
    title: 'Daemado island (대마도) travel',
    descriptionLead: 'Daemado island (Tsushima).',
  },
  'place:santorini:base:ko': {
    title: '산토리니 여행 사진 — 명소·플래너·AI 도슨트',
    descriptionLead: '산토리니 여행 사진.',
  },
  'place:santorini:base:en': {
    title: 'Santorini travel photos',
    descriptionLead: 'Santorini travel photos.',
  },
  'place:fez:gallery:ko': {
    title: 'Fez city gallery · 페즈 여행 사진',
    descriptionLead: 'Fez city gallery.',
    preferCityIntro: true,
  },
  'place:fez:gallery:en': {
    title: 'Fez city gallery',
    descriptionLead: 'Fez city gallery.',
    preferCityIntro: true,
  },
  'place:sri-jayawardenapura:base:en': {
    title: 'Sri Jayawardenepura Kotte photos',
    descriptionLead: 'Sri Jayawardenepura Kotte photos.',
  },
  'hub:/korea/theme/scenic:ko': {
    title: '한국의 명승 (scenic spots)',
    descriptionLead: 'scenic spots.',
  },
  'hub:/korea/theme/scenic:en': {
    descriptionLead: 'Korea scenic spots.',
  },
  'place:cape-verde:video:ko': {
    title: '카보베르데 여행 영상',
    descriptionLead: '카보베르데(카포베르데) 여행 영상.',
  },
  'place:cape-verde:video:en': {
    title: 'Cape Verde (카보베르데) travel video',
    descriptionLead: 'Cape Verde (카보베르데·카포베르데) travel video.',
  },
};

export function crawlerSearchIntentKey(ctx) {
  const locale = ctx?.locale === 'en' ? 'en' : 'ko';
  if (ctx?.kind === 'hub' || (ctx?.path && !ctx?.slug)) {
    return `hub:${ctx.path}:${locale}`;
  }
  const slug = String(ctx?.slug || '').trim();
  const tab = String(ctx?.tab || 'base').trim() || 'base';
  return `place:${slug}:${tab}:${locale}`;
}

function mergeHintDescription(description, hint, placeName, locale) {
  let body = String(description || '').trim();
  if (hint.preferCityIntro && placeName) {
    const intro = extractCityIntroFromGalleryDescription(body, placeName, locale);
    if (intro) body = intro;
  }
  const leads = [];
  const lead = String(hint.descriptionLead || '').trim();
  if (lead) leads.push(lead);
  for (const phrase of hint.ensurePhrases || []) {
    const text = String(phrase || '').trim();
    if (!text) continue;
    if (`${leads.join(' ')} ${body}`.includes(text)) continue;
    leads.push(text);
  }
  const prefix = leads.join(' ').trim();
  const combined = prefix && !body.startsWith(prefix) ? `${prefix} ${body}`.trim() : body;
  return trimMetaDescription(combined) || body;
}

export function applyCrawlerSearchIntent(row, ctx) {
  if (!row) return row;
  const hint = CRAWLER_SEARCH_INTENT_OVERRIDES[crawlerSearchIntentKey(ctx)];
  if (!hint) return row;
  const next = { ...row };
  const title = String(hint.title || '').trim();
  if (title) next.title = title;
  if (hint.descriptionLead || hint.ensurePhrases?.length || hint.preferCityIntro) {
    next.description = mergeHintDescription(
      row.description,
      hint,
      ctx?.placeName || row.placeName,
      ctx?.locale,
    );
  }
  return next;
}
