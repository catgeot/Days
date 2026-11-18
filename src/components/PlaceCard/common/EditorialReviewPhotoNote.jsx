import React from 'react';
import { useTranslation } from 'react-i18next';
import { resolveEditorialReviewPhotoNoteText } from '../../../utils/editorialReviewPhotoNote';

export function EditorialReviewPhotoNote({ image, variant = 'inline', className = '' }) {
  const { t } = useTranslation();
  const note = resolveEditorialReviewPhotoNoteText(image);
  if (!note) return null;

  const variantClass =
    variant === 'thumbnail'
      ? 'text-[9px] text-gray-500 leading-snug text-right'
      : variant === 'hero'
        ? 'text-[10px] text-gray-600 leading-snug'
        : variant === 'lightbox'
          ? 'max-w-[min(100%,40rem)] px-3 text-center text-sm leading-snug text-gray-100/95 whitespace-pre-line'
          : 'text-[10px] text-gray-600 leading-snug';

  const testId =
    variant === 'hero'
      ? 'logbook-editorial-review-detail-hero-note'
      : variant === 'lightbox'
        ? 'gateo-review-lightbox-note'
        : 'editorial-review-image-note';

  if (variant === 'lightbox') {
    return (
      <div
        className={`pointer-events-auto rounded-2xl border border-white/10 bg-black/55 px-3 py-2.5 backdrop-blur-md ${className}`}
        data-gateo-review-lightbox-note=""
      >
        <p className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300/90">
          {t('place.gallery.photoNote')}
        </p>
        <p className={variantClass} data-testid={testId}>
          {note}
        </p>
      </div>
    );
  }

  return (
    <p className={`${variantClass} ${className}`.trim()} data-testid={testId}>
      {note}
    </p>
  );
}