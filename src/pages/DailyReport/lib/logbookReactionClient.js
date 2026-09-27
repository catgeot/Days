import { chunkList, isLogbookReactionSchemaMissing, normalizeLogbookCommentBody } from '../../../utils/logbookReactions';

export async function fetchMyReportLikeIds(client, userId, reportIds) {
  const ids = [...new Set((reportIds || []).map((id) => String(id ?? '').trim()).filter(Boolean))];
  if (!userId || !ids.length) return { ids: [], missing: false };

  const liked = [];
  for (const chunk of chunkList(ids, 100)) {
    const { data, error } = await client
      .from('report_likes')
      .select('report_id')
      .eq('user_id', userId)
      .in('report_id', chunk);
    if (error) {
      return { ids: [], missing: isLogbookReactionSchemaMissing(error), error };
    }
    for (const row of data || []) {
      if (row?.report_id != null) liked.push(String(row.report_id));
    }
  }
  return { ids: liked, missing: false };
}

export async function toggleReportLike(client, { reportId, userId, liked }) {
  const id = String(reportId ?? '').trim();
  if (!id || !userId) return { error: { message: 'missing id' } };

  if (liked) {
    const { error } = await client.from('report_likes').delete().eq('report_id', id).eq('user_id', userId);
    return { error };
  }

  const { error } = await client.from('report_likes').insert({ report_id: id, user_id: userId });
  if (error?.code === '23505') return { error: null };
  return { error };
}

export async function fetchReportComments(client, reportId) {
  const id = String(reportId ?? '').trim();
  if (!id) return { rows: [], missing: false };
  const { data, error } = await client
    .from('report_comments')
    .select('id, report_id, user_id, body, created_at')
    .eq('report_id', id)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) {
    return { rows: [], missing: isLogbookReactionSchemaMissing(error), error };
  }
  return { rows: data || [], missing: false };
}

export async function addReportComment(client, { reportId, userId, body }) {
  const id = String(reportId ?? '').trim();
  const text = normalizeLogbookCommentBody(body);
  if (!id || !userId || !text) return { row: null, error: { message: 'empty' } };
  const { data, error } = await client
    .from('report_comments')
    .insert({ report_id: id, user_id: userId, body: text })
    .select('id, report_id, user_id, body, created_at')
    .single();
  return { row: data || null, error };
}

export async function deleteReportComment(client, { commentId, userId }) {
  const id = String(commentId ?? '').trim();
  if (!id || !userId) return { error: { message: 'missing id' } };
  const { error } = await client.from('report_comments').delete().eq('id', id).eq('user_id', userId);
  return { error };
}
