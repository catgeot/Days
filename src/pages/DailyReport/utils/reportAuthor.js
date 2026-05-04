import { supabase } from '../../../shared/api/supabase';

/** 공개 글: 프로필 닉네임이 없으면 사용자 UUID 앞 8자 */
export function reportAuthorLabel(userId, displayName) {
  const name = typeof displayName === 'string' ? displayName.trim() : '';
  if (name) return name;
  if (userId && typeof userId === 'string') return userId.slice(0, 8);
  return '여행자';
}

export async function attachAuthorLabels(rows) {
  if (!rows?.length) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
  if (!ids.length) return rows;

  const { data: profs } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);

  const byId = new Map((profs || []).map((p) => [p.id, p.display_name]));

  return rows.map((r) => ({
    ...r,
    author_label: reportAuthorLabel(r.user_id, byId.get(r.user_id)),
  }));
}
