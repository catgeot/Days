/**
 * 명소 지도 드릴다운 — 대(권역) → 중(시도·세권) → 소(여행지 hub) → 핀.
 * 목록 URL 기본칩(#110)과 분리된 지도 전용 scope.
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
  labelScenicAreaCode,
  listScenicRegionAreas,
  scenicAreaCodeForHubId,
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

  if (d.area) {
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

  if (d.cluster && !d.hub) {
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
        area: d.area || clusterArea,
        cluster: d.cluster,
        hub: null,
      },
    });
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
