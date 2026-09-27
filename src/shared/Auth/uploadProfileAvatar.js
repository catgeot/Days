import imageCompression from 'browser-image-compression';
import { supabase } from '../api/supabase';
import { notifyProfileUpdated } from './profileAvatar';

export async function uploadProfileAvatar(user, file) {
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
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;
  const { error: metaError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
  if (metaError) throw metaError;
  const { error: profileError } = await supabase.from('profiles').upsert(
    { id: user.id, avatar_url: avatarUrl, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  );
  if (profileError) {
    console.warn('[profile] avatar_url sync skipped:', profileError.message);
  }
  notifyProfileUpdated();
  return avatarUrl;
}
