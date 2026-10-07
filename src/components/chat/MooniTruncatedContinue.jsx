import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { canShowMooniContinueButton } from '../../utils/mooniTruncatedContinue.js';

/**
 * @param {{
 *   truncated?: boolean,
 *   finishReason?: string,
 *   continueAttempts?: number,
 *   isContinuing?: boolean,
 *   onContinue: () => void,
 *   variant?: 'dark' | 'light',
 * }} props
 */
export default function MooniTruncatedContinue({
  truncated = false,
  finishReason = 'STOP',
  continueAttempts = 0,
  isContinuing = false,
  onContinue,
  variant = 'dark',
}) {
  const { t } = useTranslation();
  const showButton = canShowMooniContinueButton({
    truncated,
    finishReason,
    continueAttempts,
  });

  const isTruncated =
    truncated || String(finishReason ?? '').toUpperCase() === 'MAX_TOKENS';
  if (!isTruncated) return null;

  const isDark = variant === 'dark';
  const noticeClass = isDark ? 'text-amber-100/90' : 'text-amber-800';
  const btnClass = isDark
    ? 'border-amber-400/60 bg-amber-500/20 text-amber-50 hover:bg-amber-500/30'
    : 'border-amber-500/50 bg-amber-50 text-amber-950 hover:bg-amber-100';

  return (
    <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
      <p className={`text-xs leading-snug break-keep ${noticeClass}`}>
        {t('mooni.chat.truncatedNotice')}
      </p>
      {showButton ? (
        <button
          type="button"
          disabled={isContinuing}
          onClick={onContinue}
          className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors disabled:opacity-60 ${btnClass}`}
        >
          {isContinuing ? (
            <Loader2 size={14} className="animate-spin shrink-0" aria-hidden />
          ) : null}
          {t('mooni.chat.continueReading')}
        </button>
      ) : null}
    </div>
  );
}
