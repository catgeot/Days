import union from '@turf/union';
import { featureCollection } from '@turf/helpers';

/**
 * 맞춘 나라 폴리곤을 하나로 합쳐 외곽만 남긴다.
 * 나라마다 line을 그리면 접경이 이중으로 겹침 → 조립 윤곽 1회만.
 * @param {GeoJSON.Feature[]} features
 * @returns {GeoJSON.Feature | null}
 */
export function dissolvePlacedOutline(features) {
  const polys = (features || []).filter((f) => {
    const t = f?.geometry?.type;
    return t === 'Polygon' || t === 'MultiPolygon';
  });
  if (!polys.length) return null;
  const fc = featureCollection(
    polys.map((f) => ({
      type: 'Feature',
      properties: {},
      geometry: f.geometry,
    })),
  );
  if (fc.features.length === 1) {
    return {
      type: 'Feature',
      properties: { role: 'placed-outline' },
      geometry: fc.features[0].geometry,
    };
  }
  try {
    const merged = union(fc);
    if (!merged?.geometry) return null;
    return {
      type: 'Feature',
      properties: { role: 'placed-outline' },
      geometry: merged.geometry,
    };
  } catch {
    return {
      type: 'Feature',
      properties: { role: 'placed-outline' },
      geometry: fc.features[0].geometry,
    };
  }
}
