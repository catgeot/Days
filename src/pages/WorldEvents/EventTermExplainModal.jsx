import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  getGlossaryTermSearchUrl,
  getWorldEventGlossaryTermById,
} from '../../utils/worldEventGlossary';
import { fetchEventTermExplanation } from '../../utils/fetchEventTermExplanation';

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   termId: string | null,
 *   locale?: string,
 *   onClose: () => void,
 * }} props
 */
export default function EventTermExplainModal({ event, termId, locale = 'ko', onClose }) {
  const { t } = useTranslation();
  const term = getWorldEventGlossaryTermById(event, termId);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const displayTerm =
    term && (locale === 'en' && term.termEn ? term.termEn : term.termKo);
  const prompt = term && (locale === 'en' && term.promptEn ? term.promptEn : term.promptKo);
  const searchUrl = getGlossaryTermSearchUrl(term, locale);

  useEffect(() => {
    if (!term || !prompt || !event?.id) return undefined;

    let cancelled = false;
    setAnswer('');
    setError(false);
    setLoading(true);

    fetchEventTermExplanation({
      eventId: event.id,
      termId: term.id,
      prompt,
      locale,
    })
      .then((result) => {
        if (cancelled) return;
        if (result.ok && result.answer) {
          setAnswer(result.answer);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [event?.id, term?.id, prompt, locale]);

  useEffect(() => {
    if (!term) return undefined;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (eventKey) => {
      if (eventKey.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [term, onClose]);

  if (!term || !displayTerm) return null;

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t('worldEventDetail.glossary.close')}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-term-modal-title"
        className="relative z-10 flex max-h-[min(85dvh,32rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-stone-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
              <Sparkles size={12} aria-hidden />
              MOONi
            </p>
            <h2 id="event-term-modal-title" className="mt-0.5 text-lg font-extrabold text-stone-900">
              {displayTerm}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex shrink-0 rounded-full border border-stone-200 bg-stone-50 p-2 text-stone-600 hover:bg-stone-100"
            aria-label={t('worldEventDetail.glossary.close')}
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-sm text-stone-500">{t('worldEventDetail.glossary.loading')}</p>
          ) : error ? (
            <p className="text-sm text-stone-600">{t('worldEventDetail.glossary.error')}</p>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{answer}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-stone-100 px-4 py-3">
          {searchUrl ? (
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-amber-300 hover:bg-amber-50"
            >
              {t('worldEventDetail.glossary.googleSearch')}
              <ExternalLink size={10} className="opacity-60" aria-hidden />
            </a>
          ) : null}
          {term.referenceUrl ? (
            <a
              href={term.referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-amber-300 hover:bg-amber-50"
            >
              {t('worldEventDetail.glossary.referenceLink')}
              <ExternalLink size={10} className="opacity-60" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
