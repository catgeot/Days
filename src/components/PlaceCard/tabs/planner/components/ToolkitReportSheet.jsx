import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { supabase } from '../../../../../shared/api/supabase';
import { submitToolkitReport } from '../../../../../utils/submitToolkitReport.js';

export default function ToolkitReportSheet({
  open,
  onClose,
  placeId,
  section,
  sectionTitle,
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState('idle');
  const noteRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNote('');
      setUrl('');
      setHoneypot('');
      setStatus('idle');
      const id = requestAnimationFrame(() => noteRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [open, section]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    setStatus('submitting');
    const result = await submitToolkitReport(supabase, {
      placeId,
      section,
      note,
      url,
      honeypot,
    });
    if (result.ok) {
      setStatus('success');
      return;
    }
    setStatus('error');
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col justify-end bg-black/40"
      data-toolkit-report-sheet=""
      role="dialog"
      aria-modal="true"
      aria-labelledby="toolkit-report-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t('place.planner.toolkitFreshness.reportClose')}
        onClick={onClose}
      />
      <div className="relative bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 id="toolkit-report-title" className="text-base font-bold text-gray-900">
              {t('place.planner.toolkitFreshness.reportTitle')}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('place.planner.toolkitFreshness.reportSection', { title: sectionTitle })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-800"
            aria-label={t('place.planner.toolkitFreshness.reportClose')}
          >
            <X size={20} />
          </button>
        </div>

        {status === 'success' ? (
          <p
            data-toolkit-report-status="success"
            className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl px-3 py-3"
          >
            {t('place.planner.toolkitFreshness.reportSuccess')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-800">
                {t('place.planner.toolkitFreshness.reportNoteLabel')}
              </span>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                required
                maxLength={2000}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder={t('place.planner.toolkitFreshness.reportNotePlaceholder')}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-gray-800">
                {t('place.planner.toolkitFreshness.reportUrlLabel')}
              </span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                maxLength={500}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="https://"
              />
            </label>
            <input
              type="text"
              name="company"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            {status === 'error' ? (
              <p
                data-toolkit-report-status="error"
                className="text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
              >
                {t('place.planner.toolkitFreshness.reportError')}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={status === 'submitting' || !note.trim()}
              className="w-full rounded-xl bg-blue-600 text-white font-bold py-3 text-sm disabled:opacity-50"
            >
              {status === 'submitting'
                ? t('place.planner.toolkitFreshness.reportSubmitting')
                : t('place.planner.toolkitFreshness.reportSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
