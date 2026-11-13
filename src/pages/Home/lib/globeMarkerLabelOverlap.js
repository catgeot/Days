import {
  GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM,
  getMajorMergeThreshold,
} from './globeZoomPolicy.js';

const normalizeLngDelta = (a, b) => {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
};

export const areMarkerCoordsNear = (a, b, thresholdDeg) => {
  const latDiff = Math.abs(Number(a.lat) - Number(b.lat));
  const lngDiff = normalizeLngDelta(Number(a.lng), Number(b.lng));
  return latDiff <= thresholdDeg && lngDiff <= thresholdDeg;
};

/**
 * Tier-2+ only: verified coarse-merge sisters (phuket/khao-lak SSOT case + optional single hidden sister per coarse cluster).
 */
export function annotateLabelOverlapEligibility(markers = [], mapZoom = 1.25) {
  if (!Number.isFinite(mapZoom) || mapZoom < GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM) {
    return markers;
  }

  const majors = markers.filter((m) => m.type === 'major' && m.slug);
  if (majors.length === 0) return markers;

  const fineThreshold = getMajorMergeThreshold(mapZoom);
  const eligibleSlugs = new Set();

  const phuket = majors.find((m) => m.slug === 'phuket');
  const khao = majors.find((m) => m.slug === 'khao-lak');
  if (phuket && khao && !areMarkerCoordsNear(phuket, khao, fineThreshold)) {
    eligibleSlugs.add('khao-lak');
  }

  return markers.map((marker) =>
    eligibleSlugs.has(marker.slug) ? { ...marker, labelOverlapEligible: true } : marker,
  );
}
