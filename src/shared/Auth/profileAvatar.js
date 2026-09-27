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

export const PROFILE_PHOTO_LIMIT = 8;

function asUrlList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeProfilePhotoUrls(value) {
  const out = [];
  for (const item of asUrlList(value)) {
    const url = profileAvatarUrl(item);
    if (!url || out.includes(url)) continue;
    out.push(url);
    if (out.length >= PROFILE_PHOTO_LIMIT) break;
  }
  return out;
}

export function ownerProfilePhotos(profile, user) {
  const stored = normalizeProfilePhotoUrls(profile?.avatar_urls);
  if (stored.length) return stored;
  const fromMeta = normalizeProfilePhotoUrls(user?.user_metadata?.avatar_urls);
  if (fromMeta.length) return fromMeta;
  const one = profileAvatarUrl(profile?.avatar_url) || profileAvatarUrl(user);
  return one ? [one] : [];
}

export function ownerProfilePublic(profile, user) {
  if (typeof profile?.profile_public === 'boolean') return profile.profile_public;
  if (typeof user?.user_metadata?.profile_public === 'boolean') return user.user_metadata.profile_public;
  return true;
}

/** 다른 사람에게 보이는 사진. 비공개면 빈 목록. */
export function publicProfilePhotos(profile) {
  if (!profile || profile.profile_public === false) return [];
  const stored = normalizeProfilePhotoUrls(profile.avatar_urls);
  if (stored.length) return stored;
  const one = profileAvatarUrl(profile.avatar_url);
  return one ? [one] : [];
}
