import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../shared/api/supabase';
import { MOBILE_INPUT_TEXT_CLASS } from '../../../shared/hooks/useMobileInputViewport';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import { LOGBOOK_COMMENTS_HASH, readLogbookCommentCount } from '../../../utils/logbookReactions';
import { reportAuthorLabel } from '../utils/reportAuthor';
import {
  addReportComment,
  deleteReportComment,
  fetchReportComments,
} from '../lib/logbookReactionClient';

async function withAuthorLabels(rows) {
  const ids = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
  if (!ids.length) return rows;
  const { data: profs } = await supabase.from('profiles').select('id, display_name').in('id', ids);
  const byId = new Map((profs || []).map((row) => [row.id, row.display_name]));
  return rows.map((row) => ({
    ...row,
    author_label: reportAuthorLabel(row.user_id, byId.get(row.user_id)),
  }));
}

export default function LogbookComments({ report, onCountChange }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const reportId = report?.id;
  const available = readLogbookCommentCount(report) != null;
  const [rows, setRows] = useState([]);
  const [hidden, setHidden] = useState(false);
  const [userId, setUserId] = useState(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const askLogin = useCallback(() => {
    if (!window.confirm(t('logbook.reactions.loginConfirm'))) return;
    const from = `${window.location.pathname}${window.location.search}#${LOGBOOK_COMMENTS_HASH}`;
    navigate('/auth/login', { state: { from } });
  }, [navigate, t]);

  useEffect(() => {
    if (!available || !reportId) return undefined;
    let cancelled = false;
    void (async () => {
      const [{ data: { user } }, fetched] = await Promise.all([
        supabase.auth.getUser(),
        fetchReportComments(supabase, reportId),
      ]);
      if (cancelled) return;
      setUserId(user?.id ?? null);
      if (fetched.missing) {
        setHidden(true);
        return;
      }
      const labeled = await withAuthorLabels(fetched.rows);
      if (!cancelled) setRows(labeled);
    })();
    return () => {
      cancelled = true;
    };
  }, [available, reportId]);

  useEffect(() => {
    if (!available || hidden) return undefined;
    if (hash !== `#${LOGBOOK_COMMENTS_HASH}`) return undefined;
    document.getElementById(LOGBOOK_COMMENTS_HASH)?.scrollIntoView({ block: 'start' });
    return undefined;
  }, [available, hash, hidden, rows.length]);

  if (!available || hidden) return null;

  const submit = async (event) => {
    event.preventDefault();
    setErrorText('');
    if (!userId) {
      askLogin();
      return;
    }
    const text = draft.trim();
    if (!text || posting) return;
    setPosting(true);
    const { row, error } = await addReportComment(supabase, { reportId, userId, body: text });
    setPosting(false);
    if (error || !row) {
      setErrorText(t('logbook.reactions.saveFail'));
      return;
    }
    const [labeled] = await withAuthorLabels([row]);
    setRows((prev) => [...prev, labeled]);
    setDraft('');
    onCountChange?.((current) => Math.max(0, (current ?? 0) + 1));
  };

  const remove = async (commentId) => {
    if (!userId || !window.confirm(t('logbook.reactions.deleteConfirm'))) return;
    const { error } = await deleteReportComment(supabase, { commentId, userId });
    if (error) {
      setErrorText(t('logbook.reactions.saveFail'));
      return;
    }
    setRows((prev) => prev.filter((row) => row.id !== commentId));
    onCountChange?.((current) => Math.max(0, (current ?? 0) - 1));
  };

  const locale = i18n.language?.startsWith('en') ? 'en' : 'ko';

  return (
    <section id={LOGBOOK_COMMENTS_HASH} className="mt-12 pt-8 border-t border-gray-200 scroll-mt-24">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('logbook.reactions.commentsTitle')}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400">{t('logbook.reactions.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li key={row.id} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-semibold text-gray-700 truncate">{row.author_label}</span>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {formatLogbookDisplayDate(row.created_at, { locale })}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{row.body}</p>
              {userId && row.user_id === userId ? (
                <button
                  type="button"
                  className="mt-1 text-[11px] text-gray-400 hover:text-red-600"
                  onClick={() => void remove(row.id)}
                >
                  {t('logbook.reactions.delete')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {userId ? (
        <form onSubmit={(event) => void submit(event)} className="mt-5 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t('logbook.reactions.placeholder')}
            className={`w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl ${MOBILE_INPUT_TEXT_CLASS} text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400`}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={posting || !draft.trim()}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-4 py-2 rounded-full"
            >
              {t('logbook.reactions.submit')}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={askLogin}
          className="mt-5 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {t('logbook.reactions.loginToComment')}
        </button>
      )}
      {errorText ? <p className="mt-2 text-xs text-red-600">{errorText}</p> : null}
    </section>
  );
}
