/**
 * First paint for /blog. Default, `tab=public`, and unknown tabs are the explore feed.
 * `tab=mine` is the private logbook only when an auth session is already stored.
 * The session read is sync localStorage so the review hub can mount on the first frame.
 * @param {string} search
 * @param {{ length: number, key: (index: number) => string | null, getItem: (key: string) => string | null } | null | undefined} storage
 */
export function initialLogbookPublicMode(search, storage) {
  const query = String(search || '').replace(/^\?/, '');
  const tab = new URLSearchParams(query).get('tab');
  if (tab === 'mine' && storageHasAuthSession(storage)) return false;
  return true;
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
