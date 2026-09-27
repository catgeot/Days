import { supabase } from '../../../shared/api/supabase';
import { i18n } from '../../../i18n/config';
import { publicProfilePhotos } from '../../../shared/Auth/profileAvatar';
import { isEditorialLogbook } from '../../../utils/logbookEditorial';

/** 공개 글: 프로필 닉네임이 없으면 사용자 UUID 앞 8자 */
export function reportAuthorLabel(userId, displayName) {
  const name = typeof displayName === 'string' ? displayName.trim() : '';
  if (name) return name;
  if (userId && typeof userId === 'string') return userId.slice(0, 8);
  return i18n.t('logbook.common.traveler');
}

function schemaColumnMissing(error) {
  if (!error) return false;
  return error.code === 'PGRST204' || error.code === '42703' || /column/i.test(error.message || '');
}

export async function fetchAuthorProfiles(ids) {
  if (!ids?.length) return new Map();
  const selects = [
    'id, display_name, avatar_url, avatar_urls, profile_public',
    'id, display_name, avatar_url',
    'id, display_name',
  ];
  let rows = [];
  for (const select of selects) {
    const result = await supabase.from('profiles').select(select).in('id', ids);
    if (!result.error) {
      rows = result.data || [];
      break;
    }
    if (!schemaColumnMissing(result.error)) break;
  }
  return new Map(rows.map((row) => [row.id, row]));
}

export async function attachAuthorLabels(rows) {
  if (!rows?.length) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const byId = await fetchAuthorProfiles(ids);

  return rows.map((r) => {
    const profile = byId.get(r.user_id);
    const photos = isEditorialLogbook(r) ? [] : publicProfilePhotos(profile);
    return {
      ...r,
      author_label: isEditorialLogbook(r)
        ? null
        : reportAuthorLabel(r.user_id, profile?.display_name),
      author_avatar: photos[0] || '',
      author_photos: photos,
      author_photo_count: photos.length,
    };
  });
}
