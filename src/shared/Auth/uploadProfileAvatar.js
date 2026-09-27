import imageCompression from 'browser-image-compression';
import { fetchUserProfile, supabase } from '../api/supabase';
import {
  PROFILE_PHOTO_LIMIT,
  normalizeProfilePhotoUrls,
  notifyProfileUpdated,
  ownerProfilePhotos,
  ownerProfilePublic,
} from './profileAvatar';

function galleryColumnMissing(error) {
  if (!error) return false;
  return /avatar_urls|profile_public/i.test(error.message || '')
    || error.code === 'PGRST204'
    || error.code === '42703';
}

export async function uploadProfilePhotoFile(user, file) {
  if (!user?.id || !file) throw new Error('profile photo requires a signed-in user');
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 3,
    maxWidthOrHeight: 2560,
    useWebWorker: true,
    fileType: 'image/jpeg',
  });
  const fileName = `${user.id}_${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
  return `${publicUrl}?t=${Date.now()}`;
}

export async function persistProfileGallery(user, { photos, profilePublic }) {
  if (!user?.id) throw new Error('profile photo requires a signed-in user');
  const list = normalizeProfilePhotoUrls(photos).slice(0, PROFILE_PHOTO_LIMIT);
  const cover = list[0] || '';
  const isPublic = profilePublic !== false;
  const { error: metaError } = await supabase.auth.updateUser({
    data: {
      avatar_url: cover,
      avatar_urls: list,
      profile_public: isPublic,
    },
  });
  if (metaError) throw metaError;

  const updatedAt = new Date().toISOString();
  const full = await supabase.from('profiles').upsert(
    {
      id: user.id,
      avatar_url: cover || null,
      avatar_urls: list,
      profile_public: isPublic,
      updated_at: updatedAt,
    },
    { onConflict: 'id' },
  );
  if (full.error && galleryColumnMissing(full.error)) {
    const coverOnly = await supabase.from('profiles').upsert(
      { id: user.id, avatar_url: cover || null, updated_at: updatedAt },
      { onConflict: 'id' },
    );
    if (coverOnly.error) {
      console.warn('[profile] avatar_url sync skipped:', coverOnly.error.message);
    }
  } else if (full.error) {
    console.warn('[profile] gallery sync skipped:', full.error.message);
  }
  notifyProfileUpdated();
  return { photos: list, profilePublic: isPublic, avatarUrl: cover };
}

export async function uploadProfileAvatar(user, file) {
  const url = await uploadProfilePhotoFile(user, file);
  const profile = await fetchUserProfile(user.id);
  const { data } = await supabase.auth.getUser();
  const sessionUser = data.user || user;
  const next = normalizeProfilePhotoUrls([
    url,
    ...ownerProfilePhotos(profile, sessionUser),
  ]);
  await persistProfileGallery(sessionUser, {
    photos: next,
    profilePublic: ownerProfilePublic(profile, sessionUser),
  });
  return url;
}
