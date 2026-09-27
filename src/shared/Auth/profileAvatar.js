export const PROFILE_UPDATED_EVENT = 'gateo-profile-updated';

export function notifyProfileUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function profileAvatarUrl(userOrUrl) {
  const raw = typeof userOrUrl === 'string'
    ? userOrUrl
    : userOrUrl?.user_metadata?.avatar_url || userOrUrl?.avatar_url || '';
  const value = String(raw || '').trim();
  if (!value) return '';
  return value.replace(/^http:\/\//i, 'https://');
}

export function profileLabel(displayName, user) {
  const name = String(displayName || '').trim();
  if (name) return name;
  return String(user?.email || '').split('@')[0].trim();
}
