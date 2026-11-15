/**
 * Public logbook is `tab=public` or a signed-out visitor.
 * The session check is async, so the first paint has to decide without it.
 * Otherwise the review hub mounts late and the return scroll lands after
 * the first frame.
 * @param {string} search
 * @param {{ length: number, key: (index: number) => string | null, getItem: (key: string) => string | null } | null | undefined} storage
 */
export function initialLogbookPublicMode(search, storage) {
  const query = String(search || '').replace(/^\?/, '');
  if (new URLSearchParams(query).get('tab') === 'public') return true;
  return !storageHasAuthSession(storage);
}

/**
 * @param {{ length: number, key: (index: number) => string | null, getItem: (key: string) => string | null } | null | undefined} storage
 */
export function storageHasAuthSession(storage) {
  if (!storage || typeof storage.length !== 'number' || typeof storage.key !== 'function') {
    return false;
  }
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i) || '';
    if (!key.endsWith('-auth-token')) continue;
    let raw = '';
    try {
      raw = storage.getItem(key) || '';
    } catch {
      continue;
    }
    if (!raw || raw === 'null') continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && (parsed.access_token || parsed.user)) return true;
    } catch {
      /* not a session payload */
    }
  }
  return false;
}
