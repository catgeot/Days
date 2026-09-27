import { supabase } from '../../../shared/api/supabase';
import { i18n } from '../../../i18n/config';
import { profileAvatarUrl } from '../../../shared/Auth/profileAvatar';
import { isEditorialLogbook } from '../../../utils/logbookEditorial';

/** 공개 글: 프로필 닉네임이 없으면 사용자 UUID 앞 8자 */
export function reportAuthorLabel(userId, displayName) {
  const name = typeof displayName === 'string' ? displayName.trim() : '';
  if (name) return name;
  if (userId && typeof userId === 'string') return userId.slice(0, 8);
  return i18n.t('logbook.common.traveler');
}

function avatarColumnMissing(error) {
  if (!error) return false;
  return error.code === 'PGRST204' || /avatar_url/i.test(error.message || '');
}

export async function fetchAuthorProfiles(ids) {
  if (!ids?.length) return new Map();
  const withAvatar = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', ids);
  const rows = avatarColumnMissing(withAvatar.error)
    ? (await supabase.from('profiles').select('id, display_name').in('id', ids)).data
    : withAvatar.data;
  return new Map((rows || []).map((row) => [row.id, row]));
}

export async function attachAuthorLabels(rows) {
  if (!rows?.length) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const byId = await fetchAuthorProfiles(ids);

  return rows.map((r) => {
    const profile = byId.get(r.user_id);
    return {
      ...r,
      author_label: isEditorialLogbook(r)
        ? null
        : reportAuthorLabel(r.user_id, profile?.display_name),
      author_avatar: isEditorialLogbook(r) ? '' : profileAvatarUrl(profile?.avatar_url),
    };
  });
}
