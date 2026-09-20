/** getStyle/getLayer throw "Style is not done loading" until the style finishes loading. */
export function isGlobeMapStyleReady(map) {
  return Boolean(map && !map._removed && map.isStyleLoaded?.());
}
