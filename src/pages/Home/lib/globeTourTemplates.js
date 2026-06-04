/**
 * Keyframe templates for on-demand 3D terrain tours.
 * Orbit frames keep center on landmark and rotate bearing (drone-style).
 * Each frame: { center, zoom, pitch, bearing, duration, ease?, orbit? }
 */

const clampLat = (lat) => Math.max(-85, Math.min(85, lat));

function offsetCenter([lng, lat], dLng, dLat) {
  return [lng + dLng, clampLat(lat + dLat)];
}

function lerpCenter([lngA, latA], [lngB, latB], t) {
  return [lngA + (lngB - lngA) * t, clampLat(latA + (latB - latA) * t)];
}

/** Touchdown when no airport coords — offset from centroid along inbound leg. */
function defaultApproachPoint(center, inboundBearingDeg, distanceKm = 4) {
  const rad = ((inboundBearingDeg + 180) * Math.PI) / 180;
  const kmPerDegLat = 111;
  const dLat = (distanceKm / kmPerDegLat) * Math.cos(rad);
  const cosLat = Math.cos((center[1] * Math.PI) / 180) || 0.2;
  const dLng = (distanceKm / (kmPerDegLat * cosLat)) * Math.sin(rad);
  return offsetCenter(center, dLng, dLat);
}

/** Drone orbit around a landmark — center fixed, bearing sweeps. */
export function landmarkOrbit(center, opts = {}) {
  const zoom = opts.zoom ?? 15.8;
  const pitch = opts.pitch ?? 65;
  const startBearing = opts.startBearing ?? -38;
  const orbitSpan = opts.orbitSpan ?? 130;
  const segments = opts.segments ?? 5;
  const segMs = opts.segmentDuration ?? 4200;
  const smoothOrbit = Boolean(opts.smoothOrbit);

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
      pitch: smoothOrbit ? pitch - 8 : 50,
      bearing: startBearing,
      duration: smoothOrbit ? 3200 : 2400,
      ease: true
    }
  ];

  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    frames.push({
      center,
      zoom: zoom + (!smoothOrbit && i === Math.ceil(segments / 2) ? 0.3 : 0),
      pitch: pitch + (smoothOrbit ? 0 : Math.sin(t * Math.PI) * 6),
      bearing: startBearing + orbitSpan * t,
      duration: segMs,
      ease: true,
      orbit: true
    });
  }

  return frames;
}

/** Urban city sweep — wide orbit at city center (not landmark POI; avoids 3D building limits). */
export function cityOrbit(center, opts = {}) {
  return landmarkOrbit(center, {
    zoom: 14.1,
    pitch: 52,
    startBearing: -40,
    orbitSpan: 165,
    segments: 5,
    segmentDuration: 5000,
    smoothOrbit: true,
    ...opts
  });
}

/** Alpine village + ridgeline — center between town and peak. */
export function alpineVillageOrbit(center, opts = {}) {
  const peakOffset = opts.peakOffset;
  const orbitCenter = peakOffset
    ? offsetCenter(center, peakOffset[0], peakOffset[1])
    : center;

  return landmarkOrbit(orbitCenter, {
    zoom: 13.6,
    pitch: 56,
    startBearing: -50,
    orbitSpan: 125,
    segments: 5,
    segmentDuration: 5600,
    smoothOrbit: true,
    ...opts
  });
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

/** Island scale — wide overview → glide-in with center locked on island. */
const ISLAND_SCALE_PROFILES = {
  small: {
    apexZoom: 11.4,
    glideZoom: 12.5,
    holdZoom: 13.7,
    driftSpan: 42,
    driftSegments: 3,
    approachBlend: 0.2,
    approachKm: 3
  },
  medium: {
    apexZoom: 10.6,
    glideZoom: 12.1,
    holdZoom: 13.3,
    driftSpan: 38,
    driftSegments: 3,
    approachBlend: 0.18,
    approachKm: 5
  },
  large: {
    apexZoom: 9.8,
    glideZoom: 11.4,
    holdZoom: 12.7,
    driftSpan: 34,
    driftSegments: 3,
    approachBlend: 0.16,
    approachKm: 8
  },
  archipelago: {
    apexZoom: 8.8,
    glideZoom: 10.6,
    holdZoom: 12.1,
    driftSpan: 32,
    driftSegments: 3,
    approachBlend: 0.14,
    approachKm: 6
  }
};

/**
 * Island approach — center stays on island while zoom/pitch close in (no off-island jump).
 * Final frame only nudges map center toward airport/beach (approachBlend).
 */
export function islandReveal(center, opts = {}) {
  const scale = opts.islandScale || 'medium';
  const profile = ISLAND_SCALE_PROFILES[scale] || ISLAND_SCALE_PROFILES.medium;
  const focus = center;
  const entryBearing = opts.startBearing ?? -40;
  const finalPitch = opts.pitch ?? 50;
  const segMs = opts.segmentDuration ?? 4200;

  const apexZoom = opts.apexZoom ?? profile.apexZoom;
  const glideZoom = opts.glideZoom ?? profile.glideZoom;
  const holdZoom = opts.holdZoom ?? profile.holdZoom;
  const driftSpan = opts.driftSpan ?? profile.driftSpan;
  const driftSegments = opts.driftSegments ?? profile.driftSegments;
  const approachBlend = opts.approachBlend ?? profile.approachBlend;

  const endBearing = entryBearing + 14 + driftSpan;
  const touchdown =
    opts.approachPoint ||
    defaultApproachPoint(focus, endBearing, opts.approachKm ?? profile.approachKm);
  const holdCenter = lerpCenter(focus, touchdown, approachBlend);

  const frames = [
    {
      center: focus,
      zoom: apexZoom,
      pitch: 8,
      bearing: entryBearing,
      duration: 0
    },
    {
      center: focus,
      zoom: apexZoom + 0.18,
      pitch: 16,
      bearing: entryBearing + 3,
      duration: 3200,
      ease: true
    },
    {
      center: focus,
      zoom: glideZoom - 0.35,
      pitch: 30,
      bearing: entryBearing + 8,
      duration: segMs,
      ease: true
    },
    {
      center: focus,
      zoom: glideZoom,
      pitch: 40,
      bearing: entryBearing + 12,
      duration: segMs,
      ease: true
    }
  ];

  for (let i = 1; i <= driftSegments; i += 1) {
    const t = i / driftSegments;
    frames.push({
      center: focus,
      zoom: glideZoom + (holdZoom - glideZoom - 0.25) * t,
      pitch: 40 + (finalPitch - 6) * t,
      bearing: entryBearing + 14 + driftSpan * t,
      duration: segMs,
      ease: true,
      orbit: true
    });
  }

  frames.push({
    center: holdCenter,
    zoom: holdZoom,
    pitch: finalPitch,
    bearing: endBearing + 6,
    duration: 3400,
    ease: true
  });

  return frames;
}

/** Coastal cliff / island orbit — slightly lower pitch. */
export function coastalOrbit(center, opts = {}) {
  const { shoreOffset, ...orbitOpts } = opts;
  const orbitCenter = shoreOffset
    ? offsetCenter(center, shoreOffset[0], shoreOffset[1])
    : center;

  return landmarkOrbit(orbitCenter, {
    zoom: 14.5,
    pitch: 58,
    startBearing: -25,
    orbitSpan: 120,
    segments: 5,
    segmentDuration: 4500,
    ...orbitOpts
  });
}

/** @deprecated Use landmarkOrbit — kept as alias for fallback spots. */
export function aerialApproach(center) {
  return landmarkOrbit(center, { zoom: 15.2, pitch: 62, orbitSpan: 100, segments: 4 });
}

export const TOUR_TEMPLATE_BY_NAME = {
  landmarkOrbit,
  cityOrbit,
  alpineVillageOrbit,
  mountainOrbit,
  coastalOrbit,
  islandReveal,
  aerialApproach,
  // legacy aliases
  coastalSweep: coastalOrbit,
  mountainReveal: mountainOrbit,
  islandApproach: islandReveal
};
