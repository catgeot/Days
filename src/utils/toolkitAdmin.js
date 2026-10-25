/** Mirrors Edge TOOLKIT_ADMIN_USER_IDS — client-only UI gating (not a security boundary). */
export function parseToolkitAdminUserIds() {
  const raw =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TOOLKIT_ADMIN_USER_IDS) ||
    globalThis.__VITE_ENV__?.VITE_TOOLKIT_ADMIN_USER_IDS ||
    '';
  return String(raw)
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isToolkitAdminUserId(userId) {
  const id = String(userId ?? '').trim().toLowerCase();
  if (!id) return false;
  return parseToolkitAdminUserIds().includes(id);
}
