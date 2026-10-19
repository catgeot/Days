import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import GalleryAttributionLink from './GalleryAttributionLink';
import { buildGalleryPhotoCredit } from './buildGalleryPhotoCredit';

const creditShellClass =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-1.5 pt-6';

const creditRowClass =
  'pointer-events-none flex min-w-0 items-center gap-x-0.5 text-[10px] leading-snug text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]';

const linkClass =
  'pointer-events-auto inline-flex min-h-6 max-w-full items-center justify-center px-0.5 py-1 font-semibold underline decoration-white/50 underline-offset-2 hover:text-white';

const photographerLinkClass = `${linkClass} min-w-0 flex-1 truncate`;

const providerLinkClass = `${linkClass} shrink-0`;

export default function GalleryGridPhotoCredit({ image, location, locale }) {
  const { t, i18n } = useTranslation();
  const credit = useMemo(() => buildGalleryPhotoCredit(image, locale), [image, locale]);
  const isKo = i18n.language?.startsWith('ko');

  if (!credit) return null;

  if (credit.kind === 'kto') {
    return (
      <p data-gallery-photo-credit="" className={creditShellClass}>
        <span className={creditRowClass}>
          <span className="shrink-0">{t('place.gallery.photoCreditKtoPrefix')}</span>
          <GalleryAttributionLink
            href={credit.providerHref}
            location={location}
            image={image}
            context="gallery-grid"
            className={providerLinkClass}
          >
            {credit.providerLabel}
          </GalleryAttributionLink>
        </span>
      </p>
    );
  }

  const providerName = credit.provider === 'pexels' ? 'Pexels' : 'Unsplash';

  return (
    <p data-gallery-photo-credit="" className={creditShellClass}>
      <span className={creditRowClass}>
        <span className="shrink-0">{t('place.gallery.photoCreditBy')}</span>
        <GalleryAttributionLink
          href={credit.photographerHref}
          location={location}
          image={image}
          context="gallery-grid"
          className={photographerLinkClass}
        >
          {credit.authorName}
        </GalleryAttributionLink>
        <span className="shrink-0">{isKo ? '·' : t('place.gallery.photoCreditOn')}</span>
        <GalleryAttributionLink
          href={credit.providerHref}
          location={location}
          image={image}
          context="gallery-grid"
          className={providerLinkClass}
        >
          {providerName}
        </GalleryAttributionLink>
      </span>
    </p>
  );
}
