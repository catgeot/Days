/**
 * 관광지 지도 드릴다운 — 대(권역) → 중(시도) → 종목 대·중·소 → 핀.
 * 목록 URL 기본칩과 분리. 칩 좌표는 시도/권역 앵커(+종목 팬아웃).
 */
import {
  labelTourAttractionCat1,
  labelTourAttractionCat2,
  labelTourAttractionCat3,
  listTourAttractionCat2,
  listTourAttractionCat3,
  normalizeTourAttractionCat1,
  normalizeTourAttractionCat2,
  normalizeTourAttractionCat3,
  TOUR_ATTRACTION_CAT1,
} from '../Home/lib/koreaTourAttractionCategories.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
  SCENIC_REGION_ORDER,
} from '../Home/lib/koreaTourAttractionMap.js';
import { focusViewForMapDrill } from './koreaScenicMapDrill.js';

/** @typedef {{ region: string | null, area: string | null, cat1: string | null, cat2: string | null, cat3: string | null }} TourMapDrillState */
/**
 * @typedef {{
 *   id: string,
 *   kind: 'region' | 'area' | 'cat1' | 'cat2' | 'cat3',
 *   label: string,
 *   count: number,
 *   lng: number,
 *   lat: number,
 *   region?: string,
 *   area?: string,
 *   cat1?: string,
 *   cat2?: string,
 *   cat3?: string,
 * }} TourMapDrillChip
 */

export const EMPTY_TOUR_MAP_DRILL = Object.freeze({
  region: null,
  area: null,
  cat1: null,
  cat2: null,
  cat3: null,
});

/** 권역 지도 앵커 */
export const TOUR_MAP_REGION_CENTROID = Object.freeze({
  수도권: { lng: 127.05, lat: 37.52 },
  강원: { lng: 128.25, lat: 37.75 },
  충청: { lng: 127.25, lat: 36.55 },
  전라: { lng: 126.95, lat: 35.15 },
  경상: { lng: 128.55, lat: 35.55 },
  제주: { lng: 126.55, lat: 33.38 },
});

/** TourAPI areaCode 지도 앵커 */
export const TOUR_MAP_AREA_CENTROID = Object.freeze({
  1: { lng: 126.98, lat: 37.57 },
  2: { lng: 126.7, lat: 37.46 },
  3: { lng: 127.38, lat: 36.35 },
  4: { lng: 128.6, lat: 35.87 },
  5: { lng: 126.85, lat: 35.16 },
  6: { lng: 129.08, lat: 35.18 },
  7: { lng: 129.31, lat: 35.54 },
  8: { lng: 127.29, lat: 36.48 },
  31: { lng: 127.15, lat: 37.4 },
  32: { lng: 128.2, lat: 37.8 },
  33: { lng: 127.7, lat: 36.8 },
  34: { lng: 126.85, lat: 36.5 },
  35: { lng: 128.6, lat: 36.4 },
  36: { lng: 128.3, lat: 35.4 },
  37: { lng: 127.15, lat: 35.8 },
  38: { lng: 126.9, lat: 34.8 },
  39: { lng: 126.55, lat: 33.38 },
});

/**
 * @param {TourMapDrillState | null | undefined} drill
 * @returns {TourMapDrillState}
 */
export function normalizeTourMapDrill(drill) {
  const region = drill?.region ? String(drill.region) : null;
  const area = drill?.area ? String(drill.area) : null;
  const cat1 = normalizeTourAttractionCat1(drill?.cat1);
  const cat2 = normalizeTourAttractionCat2(cat1, drill?.cat2);
  const cat3 = normalizeTourAttractionCat3(cat1, cat2, drill?.cat3);
  return { region, area, cat1, cat2, cat3 };
}

/**
 * @param {{ lng: number, lat: number }} base
 * @param {number} index
 * @param {number} total
 * @param {number} [radiusDeg]
 */
export function fanOutMapAnchor(base, index, total, radiusDeg = 0.18) {
  const n = Math.max(total, 1);
  const angle = (2 * Math.PI * index) / n - Math.PI / 2;
  return {
    lng: base.lng + Math.cos(angle) * radiusDeg,
    lat: base.lat + Math.sin(angle) * radiusDeg * 0.75,
  };
}

/**
 * @param {string | null | undefined} region
 * @returns {{ lng: number, lat: number } | null}
 */
export function tourMapRegionAnchor(region) {
  const key = String(region || '').trim();
  return TOUR_MAP_REGION_CENTROID[key] || null;
}

/**
 * @param {string | null | undefined} area
 * @param {string | null | undefined} region
 * @returns {{ lng: number, lat: number } | null}
 */
export function tourMapAreaAnchor(area, region) {
  const code = String(area || '').trim();
  if (code && TOUR_MAP_AREA_CENTROID[code]) return TOUR_MAP_AREA_CENTROID[code];
  return tourMapRegionAnchor(region);
}

/**
 * @param {TourMapDrillState | null | undefined} drill
 * @param {{
 *   regionCounts?: Record<string, number>,
 *   areaCounts?: Record<string, number>,
 *   cat1Counts?: Record<string, number>,
 *   cat2Counts?: Record<string, number>,
 *   cat3Counts?: Record<string, number>,
 * }} [counts]
 * @returns {{
 *   chips: TourMapDrillChip[],
 *   showSpotPins: boolean,
 *   crumbs: { id: string, label: string, drill: TourMapDrillState }[],
 *   levelLabel: string,
 *   fetchFilters: {
 *     region: string | null,
 *     areaCode: string | null,
 *     cat1: string | null,
 *     cat2: string | null,
 *     cat3: string | null,
 *   } | null,
 * }}
 */
export function buildTourMapDrill(drill, counts = {}, opts = {}) {
  const d = normalizeTourMapDrill(drill);
  const regionCounts = counts.regionCounts || {};
  const areaCounts = counts.areaCounts || {};
  const cat1Counts = counts.cat1Counts || {};
  const cat2Counts = counts.cat2Counts || {};
  const cat3Counts = counts.cat3Counts || {};
  const countsReady = opts.countsReady === true;

  /** @type {{ id: string, label: string, drill: TourMapDrillState }[]} */
  const crumbs = [
    { id: 'root', label: '전체', drill: { ...EMPTY_TOUR_MAP_DRILL } },
  ];

  const emptyFilters = {
    region: null,
    areaCode: null,
    cat1: null,
    cat2: null,
    cat3: null,
  };

  if (!countsReady) {
    return {
      chips: [],
      showSpotPins: false,
      crumbs,
      levelLabel: '불러오는 중…',
      fetchFilters: null,
    };
  }

  if (!d.region) {
    /** @type {TourMapDrillChip[]} */
    const chips = [];
    for (const region of SCENIC_REGION_ORDER) {
      const count = Number(regionCounts[region]) || 0;
      const center = tourMapRegionAnchor(region);
      if (!center || count <= 0) continue;
      chips.push({
        id: `region:${region}`,
        kind: 'region',
        label: region,
        count,
        lng: center.lng,
        lat: center.lat,
        region,
      });
    }
    return {
      chips,
      showSpotPins: false,
      crumbs,
      levelLabel: '대분류(권역)',
      fetchFilters: null,
    };
  }

  crumbs.push({
    id: `region:${d.region}`,
    label: d.region,
    drill: {
      region: d.region,
      area: null,
      cat1: null,
      cat2: null,
      cat3: null,
    },
  });

  const areaMeta = listScenicRegionAreas(d.region)
    .map((a) => ({ ...a, count: Number(areaCounts[a.code]) || 0 }))
    .filter((a) => a.count > 0);

  if (!d.area && !d.cat1) {
    if (areaMeta.length > 1) {
      /** @type {TourMapDrillChip[]} */
      const chips = [];
      for (const a of areaMeta) {
        const center = tourMapAreaAnchor(a.code, d.region);
        if (!center) continue;
        chips.push({
          id: `area:${a.code}`,
          kind: 'area',
          label: a.label,
          count: a.count,
          lng: center.lng,
          lat: center.lat,
          region: d.region,
          area: a.code,
        });
      }
      return {
        chips,
        showSpotPins: false,
        crumbs,
        levelLabel: '중분류(시도)',
        fetchFilters: null,
      };
    }
  }

  const resolvedArea =
    d.area || (areaMeta.length === 1 ? areaMeta[0].code : null);
  if (resolvedArea && resolvedArea !== d.area && !d.cat1) {
    /* single-area region: skip area crumb until user drills a cat */
  }

  if (resolvedArea) {
    const areaLabel = labelScenicAreaCode(resolvedArea) || resolvedArea;
    if (!crumbs.some((c) => c.id === `area:${resolvedArea}`)) {
      crumbs.push({
        id: `area:${resolvedArea}`,
        label: areaLabel,
        drill: {
          region: d.region,
          area: resolvedArea,
          cat1: null,
          cat2: null,
          cat3: null,
        },
      });
    }
  }

  const geoAnchor =
    tourMapAreaAnchor(resolvedArea, d.region) ||
    tourMapRegionAnchor(d.region) ||
    { lng: 127.8, lat: 36.2 };

  if (!d.cat1) {
    const catRows = TOUR_ATTRACTION_CAT1.map((c) => ({
      ...c,
      count: Number(cat1Counts[c.code]) || 0,
    })).filter((c) => c.count > 0);
    if (catRows.length > 1) {
      /** @type {TourMapDrillChip[]} */
      const chips = catRows.map((c, i) => {
        const center = fanOutMapAnchor(geoAnchor, i, catRows.length, 0.22);
        return {
          id: `cat1:${c.code}`,
          kind: 'cat1',
          label: c.label,
          count: c.count,
          lng: center.lng,
          lat: center.lat,
          region: d.region,
          area: resolvedArea || undefined,
          cat1: c.code,
        };
      });
      return {
        chips,
        showSpotPins: false,
        crumbs,
        levelLabel: '종목 대분류',
        fetchFilters: null,
      };
    }
    if (catRows.length === 1) {
      const only = catRows[0];
      return buildTourMapDrill(
        {
          region: d.region,
          area: resolvedArea,
          cat1: only.code,
          cat2: null,
          cat3: null,
        },
        counts,
        { countsReady: true },
      );
    }
    return {
      chips: [],
      showSpotPins: true,
      crumbs,
      levelLabel: '관광지',
      fetchFilters: {
        ...emptyFilters,
        region: d.region,
        areaCode: resolvedArea,
      },
    };
  }

  crumbs.push({
    id: `cat1:${d.cat1}`,
    label: labelTourAttractionCat1(d.cat1) || d.cat1,
    drill: {
      region: d.region,
      area: resolvedArea,
      cat1: d.cat1,
      cat2: null,
      cat3: null,
    },
  });

  if (!d.cat2) {
    const catRows = listTourAttractionCat2(d.cat1)
      .map((c) => ({ ...c, count: Number(cat2Counts[c.code]) || 0 }))
      .filter((c) => c.count > 0);
    if (catRows.length > 1) {
      /** @type {TourMapDrillChip[]} */
      const chips = catRows.map((c, i) => {
        const center = fanOutMapAnchor(geoAnchor, i, catRows.length, 0.16);
        return {
          id: `cat2:${c.code}`,
          kind: 'cat2',
          label: c.label,
          count: c.count,
          lng: center.lng,
          lat: center.lat,
          region: d.region,
          area: resolvedArea || undefined,
          cat1: d.cat1,
          cat2: c.code,
        };
      });
      return {
        chips,
        showSpotPins: false,
        crumbs,
        levelLabel: '종목 중분류',
        fetchFilters: null,
      };
    }
    if (catRows.length === 1) {
      return buildTourMapDrill(
        {
          region: d.region,
          area: resolvedArea,
          cat1: d.cat1,
          cat2: catRows[0].code,
          cat3: null,
        },
        counts,
        { countsReady: true },
      );
    }
    return {
      chips: [],
      showSpotPins: true,
      crumbs,
      levelLabel: '관광지',
      fetchFilters: {
        ...emptyFilters,
        region: d.region,
        areaCode: resolvedArea,
        cat1: d.cat1,
      },
    };
  }

  crumbs.push({
    id: `cat2:${d.cat2}`,
    label: labelTourAttractionCat2(d.cat1, d.cat2) || d.cat2,
    drill: {
      region: d.region,
      area: resolvedArea,
      cat1: d.cat1,
      cat2: d.cat2,
      cat3: null,
    },
  });

  if (!d.cat3) {
    const catRows = listTourAttractionCat3(d.cat1, d.cat2)
      .map((c) => ({ ...c, count: Number(cat3Counts[c.code]) || 0 }))
      .filter((c) => c.count > 0);
    if (catRows.length > 1) {
      /** @type {TourMapDrillChip[]} */
      const chips = catRows.map((c, i) => {
        const center = fanOutMapAnchor(geoAnchor, i, catRows.length, 0.12);
        return {
          id: `cat3:${c.code}`,
          kind: 'cat3',
          label: c.label,
          count: c.count,
          lng: center.lng,
          lat: center.lat,
          region: d.region,
          area: resolvedArea || undefined,
          cat1: d.cat1,
          cat2: d.cat2,
          cat3: c.code,
        };
      });
      return {
        chips,
        showSpotPins: false,
        crumbs,
        levelLabel: '종목 소분류',
        fetchFilters: null,
      };
    }
    return {
      chips: [],
      showSpotPins: true,
      crumbs,
      levelLabel: '관광지',
      fetchFilters: {
        ...emptyFilters,
        region: d.region,
        areaCode: resolvedArea,
        cat1: d.cat1,
        cat2: d.cat2,
        cat3: catRows[0]?.code || null,
      },
    };
  }

  crumbs.push({
    id: `cat3:${d.cat3}`,
    label: labelTourAttractionCat3(d.cat1, d.cat2, d.cat3) || d.cat3,
    drill: { ...d, area: resolvedArea },
  });

  return {
    chips: [],
    showSpotPins: true,
    crumbs,
    levelLabel: '관광지',
    fetchFilters: {
      ...emptyFilters,
      region: d.region,
      areaCode: resolvedArea,
      cat1: d.cat1,
      cat2: d.cat2,
      cat3: d.cat3,
    },
  };
}

/**
 * @param {TourMapDrillState} drill
 * @param {TourMapDrillChip} chip
 * @returns {TourMapDrillState}
 */
export function drillDownTourMap(drill, chip) {
  const d = normalizeTourMapDrill(drill);
  if (!chip) return d;
  if (chip.kind === 'region') {
    return {
      region: chip.region || chip.label,
      area: null,
      cat1: null,
      cat2: null,
      cat3: null,
    };
  }
  if (chip.kind === 'area') {
    return {
      region: chip.region || d.region,
      area: chip.area || null,
      cat1: null,
      cat2: null,
      cat3: null,
    };
  }
  if (chip.kind === 'cat1') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      cat1: chip.cat1 || null,
      cat2: null,
      cat3: null,
    };
  }
  if (chip.kind === 'cat2') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      cat1: chip.cat1 || d.cat1,
      cat2: chip.cat2 || null,
      cat3: null,
    };
  }
  if (chip.kind === 'cat3') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      cat1: chip.cat1 || d.cat1,
      cat2: chip.cat2 || d.cat2,
      cat3: chip.cat3 || null,
    };
  }
  return d;
}

/**
 * @param {TourMapDrillState} drill
 * @returns {TourMapDrillState}
 */
export function drillUpTourMap(drill) {
  const d = normalizeTourMapDrill(drill);
  if (d.cat3) {
    return {
      region: d.region,
      area: d.area,
      cat1: d.cat1,
      cat2: d.cat2,
      cat3: null,
    };
  }
  if (d.cat2) {
    return {
      region: d.region,
      area: d.area,
      cat1: d.cat1,
      cat2: null,
      cat3: null,
    };
  }
  if (d.cat1) {
    return {
      region: d.region,
      area: d.area,
      cat1: null,
      cat2: null,
      cat3: null,
    };
  }
  if (d.area) {
    return {
      region: d.region,
      area: null,
      cat1: null,
      cat2: null,
      cat3: null,
    };
  }
  if (d.region) {
    return { ...EMPTY_TOUR_MAP_DRILL };
  }
  return { ...EMPTY_TOUR_MAP_DRILL };
}

export { focusViewForMapDrill };
