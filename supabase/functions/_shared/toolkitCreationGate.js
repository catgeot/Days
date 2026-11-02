function hasNewlineOrUrl(value) {
  if (/[\r\n]/.test(value)) return true;
  return /http/i.test(value) || /www\./i.test(value) || value.includes('://');
}

export function resolveToolkitCreationGate({ slug, canonicalPlaceId, isKnownSlug }) {
  const slugNorm = String(slug ?? '').trim().toLowerCase();
  const placeId = String(canonicalPlaceId ?? '').trim();

  if (slugNorm && placeId.toLowerCase() === slugNorm && isKnownSlug) {
    return { ok: true, mode: 'registered', placeId: slugNorm };
  }

  if (!placeId) {
    return { ok: false, status: 400, error: 'placeId required' };
  }
  if (placeId.length > 120) {
    return { ok: false, status: 400, error: 'placeId too long' };
  }
  if (hasNewlineOrUrl(placeId)) {
    return { ok: false, status: 400, error: 'placeId contains newline or url' };
  }
  return { ok: true, mode: 'unregistered', placeId };
}
