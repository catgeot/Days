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
 * Majors that share a coarse-merge box but separate at tier-2 zoom — Mapbox label collision only.
 */
export function annotateLabelOverlapEligibility(markers = []) {
  const coarseMerge = getMajorMergeThreshold(1.25);
  const fineMerge = getMajorMergeThreshold(GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM);

  return markers.map((marker) => {
    if (marker.type !== 'major') return marker;
    const anchor = { lat: marker.lat, lng: marker.lng };
    const labelOverlapEligible = markers.some((other) => {
      if (other === marker || other.type !== 'major') return false;
      const otherPt = { lat: other.lat, lng: other.lng };
      return (
        areMarkerCoordsNear(anchor, otherPt, coarseMerge)
        && !areMarkerCoordsNear(anchor, otherPt, fineMerge)
      );
    });
    return labelOverlapEligible ? { ...marker, labelOverlapEligible: true } : marker;
  });
}
