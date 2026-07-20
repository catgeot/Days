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

/** 5-stage aerial cinematic — overview → approach → orbit → landing. */
const REGION_CINEMATIC_PROFILES = {
  island: {
    small: { overviewZoom: 11.0, approachZoom: 12.0, orbit1: 12.5, orbit2: 12.8, landingZoom: 13.5, landingPitch: 55 },
    medium: { overviewZoom: 10.0, approachZoom: 11.0, orbit1: 11.5, orbit2: 11.8, landingZoom: 13.0, landingPitch: 55 },
    large: { overviewZoom: 9.0, approachZoom: 10.0, orbit1: 10.5, orbit2: 11.0, landingZoom: 12.5, landingPitch: 55 }
  },
  urban: {
    small: { overviewZoom: 12.2, approachZoom: 13.0, orbit1: 13.4, orbit2: 13.7, landingZoom: 14.2, landingPitch: 52 },
    medium: { overviewZoom: 11.4, approachZoom: 12.2, orbit1: 12.7, orbit2: 13.0, landingZoom: 13.8, landingPitch: 52 },
    large: { overviewZoom: 10.6, approachZoom: 11.4, orbit1: 12.0, orbit2: 12.4, landingZoom: 13.2, landingPitch: 50 }
  },
  nature: {
    small: { overviewZoom: 11.2, approachZoom: 12.0, orbit1: 12.4, orbit2: 12.7, landingZoom: 13.4, landingPitch: 56 },
    medium: { overviewZoom: 10.2, approachZoom: 11.0, orbit1: 11.5, orbit2: 11.9, landingZoom: 12.8, landingPitch: 56 },
    large: { overviewZoom: 9.2, approachZoom: 10.0, orbit1: 10.6, orbit2: 11.0, landingZoom: 12.2, landingPitch: 58 }
  }
};

const ISLAND_CINEMATIC_SCALE = REGION_CINEMATIC_PROFILES.island;

function resolveRegionScale(profileName, scale) {
  const family = REGION_CINEMATIC_PROFILES[profileName] || REGION_CINEMATIC_PROFILES.nature;
  return family[scale || 'medium'] || family.medium;
}

/**
 * Region 3D tour — wide overview orbit, then settle on landing POI.
 * @param {[number, number]} overviewCenter
 * @param {[number, number]} landingCenter
 * @param {{ profile?: 'island'|'urban'|'nature', scale?: string, startBearing?: number }} [opts]
 */
export function buildRegionCinematicKeyframes(overviewCenter, landingCenter, opts = {}) {
  const profileName = opts.profile || 'island';
  const zoomProfile = resolveRegionScale(profileName, opts.scale);
  const startBearing = opts.startBearing ?? -40;
  const overview = overviewCenter;
  const landing = landingCenter || overviewCenter;

  return [
    {
      center: [...overview],
      zoom: zoomProfile.overviewZoom,
      pitch: 10,
      bearing: startBearing,
      duration: 0
    },
    {
      center: [...overview],
      zoom: zoomProfile.approachZoom,
      pitch: 40,
      bearing: startBearing + 30,
      duration: 3500,
      ease: true
    },
    {
      center: [...overview],
      zoom: zoomProfile.orbit1,
      pitch: 48,
      bearing: startBearing + 70,
      duration: 4500,
      ease: true,
      orbit: true
    },
    {
      center: [...overview],
      zoom: zoomProfile.orbit2,
      pitch: 52,
      bearing: startBearing + 115,
      duration: 4500,
      ease: true,
      orbit: true
    },
    {
      center: [...landing],
      zoom: zoomProfile.landingZoom,
      pitch: zoomProfile.landingPitch,
      bearing: startBearing + 160,
      duration: 5000,
      ease: true,
      orbit: true
    }
  ];
}

/**
 * Standard island 3D tour — top-down overview, locked-center approach/orbit, beach/POI landing.
 * @param {[number, number]} overviewCenter — wide island overview (frames 1–4)
 * @param {[number, number]} landingCenter — final approach POI (frame 5)
 */
export function buildIslandCinematicKeyframes(overviewCenter, landingCenter, opts = {}) {
  return buildRegionCinematicKeyframes(overviewCenter, landingCenter, {
    ...opts,
    profile: 'island'
  });
}

/**
 * Island approach — delegates to 5-stage cinematic pattern.
 * @deprecated Prefer `buildIslandCinematicKeyframes` + `globeLandmarks` keyframes SSOT.
 */
export function islandReveal(center, opts = {}) {
  const scaleMap = { small: 'small', medium: 'medium', large: 'large', archipelago: 'small' };
  const scale = scaleMap[opts.islandScale] || 'medium';
  const landing = opts.approachPoint || center;
  return buildIslandCinematicKeyframes(center, landing, {
    scale,
    startBearing: opts.startBearing
  });
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
  islandCinematic: (center, opts = {}) =>
    buildIslandCinematicKeyframes(
      opts.overviewCenter || center,
      opts.approachPoint || center,
      opts
    ),
  regionCinematic: (center, opts = {}) =>
    buildRegionCinematicKeyframes(
      opts.overviewCenter || center,
      opts.approachPoint || center,
      opts
    ),
  aerialApproach,
  // legacy aliases
  coastalSweep: coastalOrbit,
  mountainReveal: mountainOrbit,
  islandApproach: islandReveal
};
