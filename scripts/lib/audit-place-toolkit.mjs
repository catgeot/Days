import { TRAVEL_SPOTS } from '../../src/pages/Home/data/travelSpots.js';
import {
  essentialGuideHasContent,
  isToolkitLocationMismatch,
  parseEssentialGuide
} from '../../src/utils/toolkitPlaceIdResolve.js';
import { extractArrivalIataCodesFromEssentialGuide } from '../../src/utils/rentalAirportMatch.js';
import {
  REMOVED_PLACE_ID_ALIASES,
  WRONG_ALIAS_POLICIES
} from '../data/place-toolkit-reconcile-rules.mjs';
import { TRAVEL_SPOT_AIRPORT_OVERRIDES } from '../data/travel-spot-airport-overrides.mjs';
import {
  buildSpotLookup,
  normalizePlaceKey,
  resolveTravelSpotFromPlaceId
} from './travel-spot-place-resolve.mjs';

/** 허브·게이트웨이만 있는 여행지 — 좌표 대비 IATA 거리 감사 제외 */
const GEO_MISMATCH_EXEMPT_SLUGS = new Set(
  Object.entries(TRAVEL_SPOT_AIRPORT_OVERRIDES)
    .filter(([, o]) => o.confidence === 'high' && o.bannerNote)
    .map(([slug]) => slug)
);

function matchesPattern(placeId, patterns) {
  const n = normalizePlaceKey(placeId);
  return patterns.some((p) => normalizePlaceKey(p) === n);
}

function rowSummary(row, resolved) {
  const guide = parseEssentialGuide(row.essential_guide);
  const iatas = guide ? extractArrivalIataCodesFromEssentialGuide(guide) : [];
  return {
    place_id: row.place_id,
    toolkit_updated_at: row.toolkit_updated_at ?? null,
    slug: resolved?.spot?.slug ?? null,
    matchKind: resolved?.matchKind ?? null,
    spotName: resolved?.spot?.name ?? null,
    hasGuideContent: guide ? essentialGuideHasContent(guide) : false,
    guideIatas: iatas
  };
}

/**
 * @param {Array<{ place_id: string, essential_guide?: unknown, toolkit_updated_at?: string }>} toolkitRows
 */
export function auditPlaceToolkitRows(toolkitRows) {
  const lookup = buildSpotLookup(TRAVEL_SPOTS);
  const bySlug = new Map();

  const audit = {
    generatedAt: new Date().toISOString(),
    toolkitRowCount: toolkitRows.length,
    mapped: [],
    unmapped: [],
    wrongAlias: [],
    duplicateSlug: [],
    geoMismatch: [],
    removedAliasWouldMap: []
  };

  for (const row of toolkitRows) {
    const placeId = row.place_id;
    const resolved = resolveTravelSpotFromPlaceId(lookup, TRAVEL_SPOTS, placeId);
    const summary = rowSummary(row, resolved);

    if (!resolved?.spot) {
      audit.unmapped.push(summary);
    } else {
      audit.mapped.push(summary);

      const slug = resolved.spot.slug;
      if (!bySlug.has(slug)) bySlug.set(slug, []);
      bySlug.get(slug).push(summary);
    }

    for (const policy of WRONG_ALIAS_POLICIES) {
      if (!matchesPattern(placeId, policy.patterns)) continue;
      if (resolved?.spot?.slug === policy.forbiddenSlug) {
        audit.wrongAlias.push({
          ...summary,
          policyId: policy.id,
          reason: policy.reason,
          forbiddenSlug: policy.forbiddenSlug
        });
      }
    }

    for (const [aliasPlaceId, forbiddenSlug] of Object.entries(REMOVED_PLACE_ID_ALIASES)) {
      if (normalizePlaceKey(aliasPlaceId) !== normalizePlaceKey(placeId)) continue;
      if (resolved?.spot?.slug === forbiddenSlug) {
        audit.removedAliasWouldMap.push({
          ...summary,
          removedAlias: aliasPlaceId,
          forbiddenSlug,
          reason: '세션1에서 제거된 별칭이 여전히 동일 slug로 해석됨'
        });
      }
    }

    if (resolved?.spot && row.essential_guide && !GEO_MISMATCH_EXEMPT_SLUGS.has(resolved.spot.slug)) {
      const location = {
        lat: resolved.spot.lat,
        lng: resolved.spot.lng,
        slug: resolved.spot.slug,
        name: resolved.spot.name,
        name_en: resolved.spot.name_en
      };
      if (isToolkitLocationMismatch(row, location)) {
        audit.geoMismatch.push({
          ...summary,
          spotLat: resolved.spot.lat,
          spotLng: resolved.spot.lng,
          reason: 'essential_guide IATA가 여행지 좌표와 불일치'
        });
      }
    }
  }

  for (const [slug, rows] of bySlug) {
    const distinctPlaceIds = [...new Set(rows.map((r) => r.place_id))];
    if (distinctPlaceIds.length > 1) {
      audit.duplicateSlug.push({
        slug,
        spotName: rows[0]?.spotName ?? null,
        placeIds: distinctPlaceIds,
        rows
      });
    }
  }

  audit.summary = {
    mapped: audit.mapped.length,
    unmapped: audit.unmapped.length,
    wrongAlias: audit.wrongAlias.length,
    duplicateSlug: audit.duplicateSlug.length,
    geoMismatch: audit.geoMismatch.length,
    removedAliasWouldMap: audit.removedAliasWouldMap.length
  };

  return audit;
}

/** P0 슬러그·브루나이 분리 대상만 추출 */
export function filterP0Audit(audit) {
  const p0Slugs = new Set(['borneo', 'angkor-wat']);
  const p0PlacePatterns = [
    'borneo',
    '보르네오',
    'brunei',
    '브루나이',
    'angkor',
    '앙코르',
    'siem',
    '시엠립',
    'siemreap'
  ];

  const isP0Row = (row) => {
    if (row.slug && p0Slugs.has(row.slug)) return true;
    const n = normalizePlaceKey(row.place_id);
    return p0PlacePatterns.some((p) => n.includes(normalizePlaceKey(p)));
  };

  const isP0Duplicate = (d) => p0Slugs.has(d.slug);

  return {
    wrongAlias: audit.wrongAlias.filter(isP0Row),
    unmapped: audit.unmapped.filter(isP0Row),
    duplicateSlug: audit.duplicateSlug.filter(isP0Duplicate),
    geoMismatch: audit.geoMismatch.filter(isP0Row),
    removedAliasWouldMap: audit.removedAliasWouldMap
  };
}
