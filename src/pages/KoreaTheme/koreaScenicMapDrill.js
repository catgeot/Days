/**
 * 명소·명승 지도 드릴다운 — 목록 URL 기본칩과 분리된 지도 전용 scope.
 * 명소: 대(권역) → 중(시도·세권) → 소(여행지 hub) → 핀
 * 명승: 대(권역) → 중(시도) → 소(경관) → 핀
 */
import {
  countKoreaScenicSpotsByTourArea,
  listKoreaScenicClusterChips,
  listKoreaScenicHubChips,
  listKoreaScenicRegions,
  listKoreaScenicSpots,
} from '../Home/lib/koreaScenicSpots.js';
import {
  areaHasScenicClusters,
  hubMatchesScenicCluster,
  resolveScenicClusterAreaCode,
} from '../Home/lib/koreaScenicClusters.js';
import {
  heritageTourAreaCodeForSpot,
  HERITAGE_CATEGORY_ORDER,
  listKoreaHeritageScenic,
  normalizeHeritageCategory,
} from '../Home/lib/koreaHeritageScenic.js';
import {
  labelScenicAreaCode,
  listScenicRegionAreas,
  scenicAreaCodeForHubId,
  SCENIC_REGION_ORDER,
} from '../Home/lib/koreaTourAttractionMap.js';
import { scenicSpotLngLat } from './nearbyScenicRank.js';
import {
  focusViewFromScenicItems,
  KOREA_SCENIC_MAP_OVERVIEW,
} from './koreaScenicMapData.js';

/** @typedef {{ region: string | null, area: string | null, cluster: string | null, hub: string | null }} ScenicMapDrillState */
/**
 * @typedef {{
 *   id: string,
 *   kind: 'region' | 'area' | 'cluster' | 'hub',
 *   label: string,
 *   count: number,
 *   lng: number,
 *   lat: number,
 *   region?: string,
 *   area?: string,
 *   cluster?: string,
 *   hub?: string,
 * }} ScenicMapDrillChip
 */

export const EMPTY_SCENIC_MAP_DRILL = Object.freeze({
  region: null,
  area: null,
  cluster: null,
  hub: null,
});

/** @typedef {{ region: string | null, area: string | null, category: string | null }} HeritageMapDrillState */

export const EMPTY_HERITAGE_MAP_DRILL = Object.freeze({
  region: null,
  area: null,
  category: null,
});

/**
 * @param {object[]} spots
 * @returns {{ lng: number, lat: number } | null}
 */
export function centroidOfScenicSpots(spots) {
  /** @type {{ lng: number, lat: number }[]} */
  const pts = [];
  for (const spot of spots || []) {
    const pt = scenicSpotLngLat(spot);
    if (pt) pts.push(pt);
  }
  if (!pts.length) return null;
  let lng = 0;
  let lat = 0;
  for (const p of pts) {
    lng += p.lng;
    lat += p.lat;
  }
  return { lng: lng / pts.length, lat: lat / pts.length };
}

/**
 * 근접한 지도 드릴 칩을 살짝 펼쳐 숫자·라벨이 한 점으로 뭉치지 않게 함.
 * 원 좌표(centroid)는 유지하되, 화면상 겹치는 그룹만 원형 fan-out.
 * @template {{ id: string, lng: number, lat: number }} T
 * @param {T[]} chips
 * @param {number} [minSepDeg] 이내를 겹침으로 본다 (≈시·군 인접)
 * @returns {T[]}
 */
export function spreadNearbyMapChips(chips, minSepDeg = 0.085) {
  if (!Array.isArray(chips) || chips.length < 2) return chips || [];
  const n = chips.length;
  /** @type {number[]} */
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    let y = i;
    while (parent[y] !== y) {
      const p = parent[y];
      parent[y] = x;
      y = p;
    }
    return x;
  };
  const unite = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };
  const minSep2 = minSepDeg * minSepDeg;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dLng = chips[i].lng - chips[j].lng;
      const dLat = chips[i].lat - chips[j].lat;
      if (dLng * dLng + dLat * dLat <= minSep2) unite(i, j);
    }
  }
  /** @type {Map<number, number[]>} */
  const groups = new Map();
  for (let i = 0; i < n; i += 1) {
    const r = find(i);
    const list = groups.get(r);
    if (list) list.push(i);
    else groups.set(r, [i]);
  }
  /** @type {T[]} */
  const out = chips.map((c) => ({ ...c }));
  for (const idxs of groups.values()) {
    if (idxs.length < 2) continue;
    let lng = 0;
    let lat = 0;
    for (const i of idxs) {
      lng += chips[i].lng;
      lat += chips[i].lat;
    }
    lng /= idxs.length;
    lat /= idxs.length;
    const radius = Math.max(minSepDeg * 0.55, 0.05);
    const m = idxs.length;
    for (let k = 0; k < m; k += 1) {
      const angle = (2 * Math.PI * k) / m - Math.PI / 2;
      const i = idxs[k];
      out[i] = {
        ...out[i],
        lng: lng + Math.cos(angle) * radius,
        lat: lat + Math.sin(angle) * radius * 0.75,
      };
    }
  }
  return out;
}

/**
 * @param {ScenicMapDrillState | null | undefined} drill
 * @returns {ScenicMapDrillState}
 */
export function normalizeScenicMapDrill(drill) {
  return {
    region: drill?.region ? String(drill.region) : null,
    area: drill?.area ? String(drill.area) : null,
    cluster: drill?.cluster ? String(drill.cluster) : null,
    hub: drill?.hub ? String(drill.hub).trim().toLowerCase() : null,
  };
}

/**
 * @param {object[]} memberSpots
 * @param {Omit<ScenicMapDrillChip, 'lng' | 'lat' | 'count'> & { count?: number }} base
 * @returns {ScenicMapDrillChip | null}
 */
function chipFromMembers(memberSpots, base) {
  const count = base.count != null ? base.count : memberSpots.length;
  if (count <= 0) return null;
  const center = centroidOfScenicSpots(memberSpots);
  if (!center) return null;
  return {
    ...base,
    count,
    lng: center.lng,
    lat: center.lat,
  };
}

/**
 * @param {object[]} [allSpots]
 * @param {ScenicMapDrillState | null | undefined} drill
 * @returns {{
 *   chips: ScenicMapDrillChip[],
 *   showSpotPins: boolean,
 *   crumbs: { id: string, label: string, drill: ScenicMapDrillState }[],
 *   scopeSpots: object[],
 *   levelLabel: string,
 * }}
 */
export function buildCuratedMapDrill(allSpots, drill) {
  const d = normalizeScenicMapDrill(drill);
  const catalog =
    Array.isArray(allSpots) && allSpots.length
      ? allSpots
      : listKoreaScenicSpots();

  /** @type {{ id: string, label: string, drill: ScenicMapDrillState }[]} */
  const crumbs = [
    { id: 'root', label: '전체', drill: { ...EMPTY_SCENIC_MAP_DRILL } },
  ];

  if (!d.region) {
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const region of listKoreaScenicRegions()) {
      const members = catalog.filter((s) => s.region === region);
      const chip = chipFromMembers(members, {
        id: `region:${region}`,
        kind: 'region',
        label: region,
        region,
      });
      if (chip) chips.push(chip);
    }
    return {
      chips,
      showSpotPins: false,
      crumbs,
      scopeSpots: catalog,
      levelLabel: '대분류(권역)',
    };
  }

  crumbs.push({
    id: `region:${d.region}`,
    label: d.region,
    drill: { region: d.region, area: null, cluster: null, hub: null },
  });

  const inRegion = catalog.filter((s) => s.region === d.region);
  const areaCounts = countKoreaScenicSpotsByTourArea(d.region);
  const areaChipsMeta = listScenicRegionAreas(d.region)
    .map((a) => ({ ...a, count: Number(areaCounts[a.code]) || 0 }))
    .filter((a) => a.count > 0);

  if (!d.area && !d.cluster && !d.hub) {
    if (areaChipsMeta.length > 1) {
      /** @type {ScenicMapDrillChip[]} */
      const chips = [];
      for (const a of areaChipsMeta) {
        const members = inRegion.filter(
          (s) => scenicAreaCodeForHubId(s.hubId) === a.code,
        );
        const chip = chipFromMembers(members, {
          id: `area:${a.code}`,
          kind: 'area',
          label: a.label,
          count: a.count,
          region: d.region,
          area: a.code,
        });
        if (chip) chips.push(chip);
      }
      return {
        chips,
        showSpotPins: false,
        crumbs,
        scopeSpots: inRegion,
        levelLabel: '중분류(시도)',
      };
    }

    const clusterArea = resolveScenicClusterAreaCode(d.region, null);
    if (clusterArea && areaHasScenicClusters(clusterArea)) {
      const clusterMeta = listKoreaScenicClusterChips(d.region, clusterArea);
      /** @type {ScenicMapDrillChip[]} */
      const chips = [];
      for (const c of clusterMeta) {
        const members = inRegion.filter((s) =>
          hubMatchesScenicCluster(s.hubId, clusterArea, c.id),
        );
        const chip = chipFromMembers(members, {
          id: `cluster:${c.id}`,
          kind: 'cluster',
          label: c.label,
          count: c.count,
          region: d.region,
          area: clusterArea,
          cluster: c.id,
        });
        if (chip) chips.push(chip);
      }
      if (chips.length) {
        return {
          chips,
          showSpotPins: false,
          crumbs,
          scopeSpots: inRegion,
          levelLabel: '중분류(세권)',
        };
      }
    }

    const hubMeta = listKoreaScenicHubChips(d.region, null, null);
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const h of hubMeta) {
      const members = inRegion.filter(
        (s) => String(s.hubId || '').trim().toLowerCase() === h.hubId,
      );
      const chip = chipFromMembers(members, {
        id: `hub:${h.hubId}`,
        kind: 'hub',
        label: h.label,
        count: h.count,
        region: d.region,
        hub: h.hubId,
      });
      if (chip) chips.push(chip);
    }
    return {
      chips,
      showSpotPins: false,
      crumbs,
      scopeSpots: inRegion,
      levelLabel: '소분류(여행지)',
    };
  }

  /** 시도 칩을 거친 권역만 상태바에 시도 표시 (강원 등 단일 시도는 세권으로 직행) */
  const showAreaCrumb = Boolean(d.area) && areaChipsMeta.length > 1;
  if (showAreaCrumb) {
    const areaLabel = labelScenicAreaCode(d.area) || d.area;
    crumbs.push({
      id: `area:${d.area}`,
      label: areaLabel,
      drill: { region: d.region, area: d.area, cluster: null, hub: null },
    });
  }

  const inArea = d.area
    ? inRegion.filter((s) => scenicAreaCodeForHubId(s.hubId) === d.area)
    : inRegion;

  if (d.area && !d.cluster && !d.hub) {
    const clusterArea = resolveScenicClusterAreaCode(d.region, d.area);
    if (clusterArea && areaHasScenicClusters(clusterArea)) {
      const clusterMeta = listKoreaScenicClusterChips(d.region, clusterArea);
      /** @type {ScenicMapDrillChip[]} */
      const chips = [];
      for (const c of clusterMeta) {
        const members = inArea.filter((s) =>
          hubMatchesScenicCluster(s.hubId, clusterArea, c.id),
        );
        const chip = chipFromMembers(members, {
          id: `cluster:${c.id}`,
          kind: 'cluster',
          label: c.label,
          count: c.count,
          region: d.region,
          area: d.area,
          cluster: c.id,
        });
        if (chip) chips.push(chip);
      }
      if (chips.length) {
        return {
          chips,
          showSpotPins: false,
          crumbs,
          scopeSpots: inArea,
          levelLabel: '중분류(세권)',
        };
      }
    }

    const hubMeta = listKoreaScenicHubChips(d.region, d.area, null);
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const h of hubMeta) {
      const members = inArea.filter(
        (s) => String(s.hubId || '').trim().toLowerCase() === h.hubId,
      );
      const chip = chipFromMembers(members, {
        id: `hub:${h.hubId}`,
        kind: 'hub',
        label: h.label,
        count: h.count,
        region: d.region,
        area: d.area,
        hub: h.hubId,
      });
      if (chip) chips.push(chip);
    }
    return {
      chips,
      showSpotPins: false,
      crumbs,
      scopeSpots: inArea,
      levelLabel: '소분류(여행지)',
    };
  }

  if (d.cluster) {
    const clusterArea = resolveScenicClusterAreaCode(d.region, d.area);
    const clusterLabel =
      listKoreaScenicClusterChips(d.region, clusterArea).find(
        (c) => c.id === d.cluster,
      )?.label || d.cluster;
    crumbs.push({
      id: `cluster:${d.cluster}`,
      label: clusterLabel,
      drill: {
        region: d.region,
        area: showAreaCrumb ? d.area : d.area || clusterArea,
        cluster: d.cluster,
        hub: null,
      },
    });
    if (!d.hub) {
      const inCluster = inArea.filter((s) =>
        hubMatchesScenicCluster(s.hubId, clusterArea, d.cluster),
      );
      const hubMeta = listKoreaScenicHubChips(
        d.region,
        d.area || clusterArea,
        d.cluster,
      );
      /** @type {ScenicMapDrillChip[]} */
      const chips = [];
      for (const h of hubMeta) {
        const members = inCluster.filter(
          (s) => String(s.hubId || '').trim().toLowerCase() === h.hubId,
        );
        const chip = chipFromMembers(members, {
          id: `hub:${h.hubId}`,
          kind: 'hub',
          label: h.label,
          count: h.count,
          region: d.region,
          area: d.area || clusterArea || undefined,
          cluster: d.cluster,
          hub: h.hubId,
        });
        if (chip) chips.push(chip);
      }
      return {
        chips,
        showSpotPins: false,
        crumbs,
        scopeSpots: inCluster,
        levelLabel: '소분류(여행지)',
      };
    }
  }

  const hubLabel =
    listKoreaScenicHubChips(d.region, d.area, d.cluster).find(
      (h) => h.hubId === d.hub,
    )?.label || d.hub;
  crumbs.push({
    id: `hub:${d.hub}`,
    label: hubLabel,
    drill: { ...d },
  });
  const scopeSpots = catalog.filter(
    (s) => String(s?.hubId || '').trim().toLowerCase() === d.hub,
  );
  return {
    chips: [],
    showSpotPins: true,
    crumbs,
    scopeSpots,
    levelLabel: '명소',
  };
}

/**
 * @param {ScenicMapDrillState} drill
 * @param {ScenicMapDrillChip} chip
 * @returns {ScenicMapDrillState}
 */
export function drillDownScenicMap(drill, chip) {
  const d = normalizeScenicMapDrill(drill);
  if (!chip) return d;
  if (chip.kind === 'region') {
    return {
      region: chip.region || chip.label,
      area: null,
      cluster: null,
      hub: null,
    };
  }
  if (chip.kind === 'area') {
    return {
      region: chip.region || d.region,
      area: chip.area || null,
      cluster: null,
      hub: null,
    };
  }
  if (chip.kind === 'cluster') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      cluster: chip.cluster || null,
      hub: null,
    };
  }
  if (chip.kind === 'hub') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      cluster: chip.cluster || d.cluster,
      hub: chip.hub || null,
    };
  }
  return d;
}

/**
 * @param {ScenicMapDrillState} drill
 * @returns {ScenicMapDrillState}
 */
export function drillUpScenicMap(drill) {
  const d = normalizeScenicMapDrill(drill);
  if (d.hub) {
    return { region: d.region, area: d.area, cluster: d.cluster, hub: null };
  }
  if (d.cluster) {
    const areas = listScenicRegionAreas(d.region);
    /** 강원처럼 시도 칩이 1개면 세권 상위는 권역(세권 목록)으로 */
    if (areas.length <= 1) {
      return { region: d.region, area: null, cluster: null, hub: null };
    }
    return { region: d.region, area: d.area, cluster: null, hub: null };
  }
  if (d.area) {
    return { region: d.region, area: null, cluster: null, hub: null };
  }
  if (d.region) {
    return { ...EMPTY_SCENIC_MAP_DRILL };
  }
  return { ...EMPTY_SCENIC_MAP_DRILL };
}

/**
 * @param {ScenicMapDrillChip[]} chips
 * @param {object[]} [scopeSpots]
 */
export function focusViewForMapDrill(chips, scopeSpots) {
  if (chips?.length) {
    const pseudo = chips.map((c) => ({
      id: c.id,
      name: c.label,
      lat: c.lat,
      lng: c.lng,
    }));
    return focusViewFromScenicItems(pseudo) || KOREA_SCENIC_MAP_OVERVIEW;
  }
  if (scopeSpots?.length) {
    return focusViewFromScenicItems(scopeSpots) || KOREA_SCENIC_MAP_OVERVIEW;
  }
  return KOREA_SCENIC_MAP_OVERVIEW;
}

/**
 * @param {HeritageMapDrillState | null | undefined} drill
 * @returns {HeritageMapDrillState}
 */
export function normalizeHeritageMapDrill(drill) {
  return {
    region: drill?.region ? String(drill.region) : null,
    area: drill?.area ? String(drill.area) : null,
    category: normalizeHeritageCategory(drill?.category),
  };
}

/**
 * @param {object[]} [allSpots]
 * @param {HeritageMapDrillState | null | undefined} drill
 * @returns {{
 *   chips: ScenicMapDrillChip[],
 *   showSpotPins: boolean,
 *   crumbs: { id: string, label: string, drill: HeritageMapDrillState }[],
 *   scopeSpots: object[],
 *   levelLabel: string,
 * }}
 */
export function buildHeritageMapDrill(allSpots, drill) {
  const d = normalizeHeritageMapDrill(drill);
  const catalog =
    Array.isArray(allSpots) && allSpots.length
      ? allSpots
      : listKoreaHeritageScenic();

  /** @type {{ id: string, label: string, drill: HeritageMapDrillState }[]} */
  const crumbs = [
    { id: 'root', label: '전체', drill: { ...EMPTY_HERITAGE_MAP_DRILL } },
  ];

  if (!d.region) {
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const region of SCENIC_REGION_ORDER) {
      const members = catalog.filter((s) => s.region === region);
      const chip = chipFromMembers(members, {
        id: `region:${region}`,
        kind: 'region',
        label: region,
        region,
      });
      if (chip) chips.push(chip);
    }
    return {
      chips,
      showSpotPins: false,
      crumbs,
      scopeSpots: catalog,
      levelLabel: '대분류(권역)',
    };
  }

  crumbs.push({
    id: `region:${d.region}`,
    label: d.region,
    drill: { region: d.region, area: null, category: null },
  });

  const inRegion = catalog.filter((s) => s.region === d.region);
  const areaChipsMeta = listScenicRegionAreas(d.region)
    .map((a) => ({
      ...a,
      members: inRegion.filter((s) => heritageTourAreaCodeForSpot(s) === a.code),
    }))
    .filter((a) => a.members.length > 0);

  if (!d.area && !d.category) {
    if (areaChipsMeta.length > 1) {
      /** @type {ScenicMapDrillChip[]} */
      const chips = [];
      for (const a of areaChipsMeta) {
        const chip = chipFromMembers(a.members, {
          id: `area:${a.code}`,
          kind: 'area',
          label: a.label,
          count: a.members.length,
          region: d.region,
          area: a.code,
        });
        if (chip) chips.push(chip);
      }
      return {
        chips,
        showSpotPins: false,
        crumbs,
        scopeSpots: inRegion,
        levelLabel: '중분류(시도)',
      };
    }

    const onlyArea = areaChipsMeta[0]?.code || null;
    const catScope = onlyArea
      ? inRegion.filter((s) => heritageTourAreaCodeForSpot(s) === onlyArea)
      : inRegion;
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const cat of HERITAGE_CATEGORY_ORDER) {
      const members = catScope.filter(
        (s) => normalizeHeritageCategory(s.category) === cat,
      );
      const chip = chipFromMembers(members, {
        id: `category:${cat}`,
        kind: 'category',
        label: cat,
        region: d.region,
        area: onlyArea || undefined,
        category: cat,
      });
      if (chip) chips.push(chip);
    }
    if (chips.length > 1) {
      return {
        chips,
        showSpotPins: false,
        crumbs,
        scopeSpots: catScope,
        levelLabel: '소분류(경관)',
      };
    }
    return {
      chips: [],
      showSpotPins: true,
      crumbs,
      scopeSpots: catScope,
      levelLabel: '명승',
    };
  }

  if (d.area) {
    const areaLabel = labelScenicAreaCode(d.area) || d.area;
    crumbs.push({
      id: `area:${d.area}`,
      label: areaLabel,
      drill: { region: d.region, area: d.area, category: null },
    });
  }

  const inArea = d.area
    ? inRegion.filter((s) => heritageTourAreaCodeForSpot(s) === d.area)
    : inRegion;

  if (d.area && !d.category) {
    /** @type {ScenicMapDrillChip[]} */
    const chips = [];
    for (const cat of HERITAGE_CATEGORY_ORDER) {
      const members = inArea.filter(
        (s) => normalizeHeritageCategory(s.category) === cat,
      );
      const chip = chipFromMembers(members, {
        id: `category:${cat}`,
        kind: 'category',
        label: cat,
        region: d.region,
        area: d.area,
        category: cat,
      });
      if (chip) chips.push(chip);
    }
    if (chips.length > 1) {
      return {
        chips,
        showSpotPins: false,
        crumbs,
        scopeSpots: inArea,
        levelLabel: '소분류(경관)',
      };
    }
    return {
      chips: [],
      showSpotPins: true,
      crumbs,
      scopeSpots: inArea,
      levelLabel: '명승',
    };
  }

  crumbs.push({
    id: `category:${d.category}`,
    label: d.category,
    drill: { ...d },
  });
  const scopeSpots = inArea.filter(
    (s) => normalizeHeritageCategory(s.category) === d.category,
  );
  return {
    chips: [],
    showSpotPins: true,
    crumbs,
    scopeSpots,
    levelLabel: '명승',
  };
}

/**
 * @param {HeritageMapDrillState} drill
 * @param {ScenicMapDrillChip} chip
 * @returns {HeritageMapDrillState}
 */
export function drillDownHeritageMap(drill, chip) {
  const d = normalizeHeritageMapDrill(drill);
  if (!chip) return d;
  if (chip.kind === 'region') {
    return {
      region: chip.region || chip.label,
      area: null,
      category: null,
    };
  }
  if (chip.kind === 'area') {
    return {
      region: chip.region || d.region,
      area: chip.area || null,
      category: null,
    };
  }
  if (chip.kind === 'category') {
    return {
      region: chip.region || d.region,
      area: chip.area || d.area,
      category: normalizeHeritageCategory(chip.category || chip.label),
    };
  }
  return d;
}

/**
 * @param {HeritageMapDrillState} drill
 * @returns {HeritageMapDrillState}
 */
export function drillUpHeritageMap(drill) {
  const d = normalizeHeritageMapDrill(drill);
  if (d.category) {
    return { region: d.region, area: d.area, category: null };
  }
  if (d.area) {
    return { region: d.region, area: null, category: null };
  }
  if (d.region) {
    return { ...EMPTY_HERITAGE_MAP_DRILL };
  }
  return { ...EMPTY_HERITAGE_MAP_DRILL };
}
