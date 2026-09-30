/**
 * Idempotent layer z-order — moveLayer marks style dirty and emits styledata; skip when already correct.
 */

function layerExists(map, layerId) {
  try {
    return Boolean(map.getLayer(layerId));
  } catch {
    return false;
  }
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {string[]} layerIdsInRaiseOrder — bottom-to-top when each id is moved to top in sequence
 */
export function raiseLayersToTopIfNeeded(map, layerIdsInRaiseOrder) {
  if (!map || map._removed) return;
  const existing = layerIdsInRaiseOrder.filter((id) => layerExists(map, id));
  if (existing.length === 0) return;

  let layers;
  try {
    layers = map.getStyle()?.layers;
  } catch {
    return;
  }
  if (!layers?.length) return;

  const n = existing.length;
  const expectedTopToBottom = [...existing].reverse();
  const actualTopToBottom = layers.slice(-n).map((l) => l.id).reverse();

  if (
    actualTopToBottom.length === n
    && actualTopToBottom.every((id, i) => id === expectedTopToBottom[i])
  ) {
    return;
  }

  for (const layerId of existing) {
    try {
      map.moveLayer(layerId);
    } catch {
      // Layer may be mid-transition.
    }
  }
}
