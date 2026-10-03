const DEFAULT_ADMIN_UIDS = new Set(['f31e47ac-144d-41e3-9ef9-441a2d008424']);

function parseAdminUidOverride() {
  const raw = import.meta.env.VITE_ADMIN_UIDS;
  if (!raw || typeof raw !== 'string') return null;
  const ids = raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return ids.length ? new Set(ids) : null;
}

let adminUidSet = DEFAULT_ADMIN_UIDS;
const override = parseAdminUidOverride();
if (override) adminUidSet = override;

export function isGalleryAdminUser(userId) {
  if (!userId || typeof userId !== 'string') return false;
  return adminUidSet.has(userId);
}
