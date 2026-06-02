/**
 * Keyframe templates for on-demand 3D terrain tours.
 * Orbit frames keep center on landmark and rotate bearing (drone-style).
 * Each frame: { center, zoom, pitch, bearing, duration, ease?, orbit? }
 */

const clampLat = (lat) => Math.max(-85, Math.min(85, lat));

function offsetCenter([lng, lat], dLng, dLat) {
  return [lng + dLng, clampLat(lat + dLat)];
}

/** Drone orbit around a landmark — center fixed, bearing sweeps. */
export function landmarkOrbit(center, opts = {}) {
  const zoom = opts.zoom ?? 15.8;
  const pitch = opts.pitch ?? 65;
  const startBearing = opts.startBearing ?? -38;
  const orbitSpan = opts.orbitSpan ?? 130;
  const segments = opts.segments ?? 5;
  const segMs = opts.segmentDuration ?? 4200;

  const frames = [
    {
      center,
      zoom: zoom - 1.8,
      pitch: 0,
      bearing: startBearing,
      duration: 0
    },
    {
      center,
      zoom: zoom - 0.6,
      pitch: 50,
      bearing: startBearing,
      duration: 2400,
      ease: true
    }
  ];

  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    frames.push({
      center,
      zoom: zoom + (i === Math.ceil(segments / 2) ? 0.3 : 0),
      pitch: pitch + Math.sin(t * Math.PI) * 6,
      bearing: startBearing + orbitSpan * t,
      duration: segMs,
      ease: true,
      orbit: true
    });
  }

  return frames;
}

/** Wider orbit for mountains / large natural landmarks. */
export function mountainOrbit(center, opts = {}) {
  return landmarkOrbit(center, {
    zoom: 12.5,
    pitch: 58,
    startBearing: -50,
    orbitSpan: 110,
    segments: 4,
    segmentDuration: 5200,
    ...opts
  });
}

/** Coastal cliff / island orbit — slightly lower pitch. */
export function coastalOrbit(center, opts = {}) {
  return landmarkOrbit(center, {
    zoom: 14.5,
    pitch: 58,
    startBearing: -25,
    orbitSpan: 120,
    segments: 5,
    segmentDuration: 4500,
    ...opts
  });
}

/** @deprecated Use landmarkOrbit — kept as alias for fallback spots. */
export function aerialApproach(center) {
  return landmarkOrbit(center, { zoom: 15.2, pitch: 62, orbitSpan: 100, segments: 4 });
}

export const TOUR_TEMPLATE_BY_NAME = {
  landmarkOrbit,
  mountainOrbit,
  coastalOrbit,
  aerialApproach,
  // legacy aliases
  coastalSweep: coastalOrbit,
  mountainReveal: mountainOrbit
};
