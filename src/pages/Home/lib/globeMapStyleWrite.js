/**
 * Map.setLayoutProperty / setLayerZoomRange / setPaintProperty / setFilter /
 * setConfigProperty always call Map._update(true), even when the style value
 * did not change. That marks the style dirty and re-fires styledata.
 * Skip the Map call unless the value actually changes.
 */
const styleWriteCache = new WeakMap();

function styleWriteBag(map) {
  let bag = styleWriteCache.get(map);
  if (!bag) {
    bag = new Map();
    styleWriteCache.set(map, bag);
  }
  return bag;
}

export function clearGlobeStyleWriteCache(map) {
  if (map) styleWriteCache.delete(map);
}

function styleValueSig(value) {
  if (value == null || typeof value !== 'object') return `p:${String(value)}`;
  try {
    return `j:${JSON.stringify(value)}`;
  } catch {
    return null;
  }
}

function styleValuesEqual(a, b) {
  if (Object.is(a, b)) return true;
  const sa = styleValueSig(a);
  const sb = styleValueSig(b);
  return sa != null && sa === sb;
}

function styleWriteUnchanged(map, key, value) {
  const sig = styleValueSig(value);
  if (sig == null) return false;
  return styleWriteBag(map).get(key) === sig;
}

function rememberStyleWrite(map, key, value) {
  const sig = styleValueSig(value);
  if (sig == null) return;
  styleWriteBag(map).set(key, sig);
}

function safeGetLayer(map, layerId) {
  try {
    return map?.getLayer?.(layerId) || null;
  } catch {
    return null;
  }
}

export function setLayoutPropertyIfChanged(map, layerId, name, value) {
  if (!safeGetLayer(map, layerId)) return false;
  let current;
  try {
    current = map.getLayoutProperty(layerId, name);
  } catch {
    return false;
  }
  if (styleValuesEqual(current, value)) return false;
  const key = `${layerId}\0l\0${name}`;
  if (styleWriteUnchanged(map, key, value)) return false;
  try {
    map.setLayoutProperty(layerId, name, value);
    rememberStyleWrite(map, key, value);
    return true;
  } catch {
    return false;
  }
}

export function setLayerZoomRangeIfChanged(map, layerId, minzoom, maxzoom) {
  const layer = safeGetLayer(map, layerId);
  if (!layer) return false;
  if (layer.minzoom === minzoom && layer.maxzoom === maxzoom) return false;
  const key = `${layerId}\0z`;
  const value = `${minzoom}:${maxzoom}`;
  if (styleWriteUnchanged(map, key, value)) return false;
  try {
    map.setLayerZoomRange(layerId, minzoom, maxzoom);
    rememberStyleWrite(map, key, value);
    return true;
  } catch {
    return false;
  }
}

export function setPaintPropertyIfChanged(map, layerId, name, value) {
  if (!safeGetLayer(map, layerId)) return false;
  let current;
  try {
    current = map.getPaintProperty(layerId, name);
  } catch {
    return false;
  }
  if (styleValuesEqual(current, value)) return false;
  const key = `${layerId}\0p\0${name}`;
  if (styleWriteUnchanged(map, key, value)) return false;
  try {
    map.setPaintProperty(layerId, name, value);
    rememberStyleWrite(map, key, value);
    return true;
  } catch {
    return false;
  }
}

export function setFilterIfChanged(map, layerId, filter) {
  if (!safeGetLayer(map, layerId)) return false;
  let current;
  try {
    current = map.getFilter(layerId);
  } catch {
    return false;
  }
  if (styleValuesEqual(current, filter)) return false;
  const key = `${layerId}\0f`;
  if (styleWriteUnchanged(map, key, filter)) return false;
  try {
    map.setFilter(layerId, filter);
    rememberStyleWrite(map, key, filter);
    return true;
  } catch {
    return false;
  }
}

export function setConfigPropertyIfChanged(map, namespace, name, value) {
  if (!map || typeof map.setConfigProperty !== 'function') return false;
  try {
    if (
      typeof map.getConfigProperty === 'function'
      && styleValuesEqual(map.getConfigProperty(namespace, name), value)
    ) {
      return false;
    }
  } catch {
    // Style config may not be readable yet.
  }
  const key = `${namespace}\0c\0${name}`;
  if (styleWriteUnchanged(map, key, value)) return false;
  try {
    map.setConfigProperty(namespace, name, value);
    rememberStyleWrite(map, key, value);
    return true;
  } catch {
    return false;
  }
}
