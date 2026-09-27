import imageCompression from 'browser-image-compression';
import { supabase } from '../../../shared/api/supabase';

const COMPRESS_OPTIONS = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };

export async function uploadLogbookStorageImage(file) {
  const compressed = await imageCompression(file, COMPRESS_OPTIONS);
  const fileExt = (compressed.name.split('.').pop() || 'jpg').replace(/[^\w]/g, '') || 'jpg';
  const fileName = `logbook/${Date.now()}_${Math.random().toString(36).slice(2, 11)}.${fileExt}`;
  const { error } = await supabase.storage.from('images').upload(fileName, compressed);
  if (error) throw error;
  const { data } = supabase.storage.from('images').getPublicUrl(fileName);
  return data.publicUrl;
}
