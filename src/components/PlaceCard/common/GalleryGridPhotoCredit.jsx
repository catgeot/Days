import React, { useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import GalleryAttributionLink from './GalleryAttributionLink';
import { buildGalleryPhotoCredit } from './buildGalleryPhotoCredit';

const creditShellClass =
  'pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/45 to-transparent px-2 pb-1.5 pt-6';

const creditTextClass =
  'pointer-events-none block truncate text-[10px] leading-snug text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]';

const linkClass =
  'pointer-events-auto font-semibold underline decoration-white/50 underline-offset-2 hover:text-white';

export default function GalleryGridPhotoCredit({ image, location, locale }) {
  const { t } = useTranslation();
  const credit = useMemo(() => buildGalleryPhotoCredit(image, locale), [image, locale]);

  if (!credit) return null;

  if (credit.kind === 'kto') {
    return (
      <p data-gallery-photo-credit="" className={creditShellClass}>
        <span className={creditTextClass}>
          {t('place.gallery.photoCreditKtoPrefix')}{' '}
          <GalleryAttributionLink
            href={credit.providerHref}
            location={location}
            image={image}
            context="gallery-grid"
            className={linkClass}
          >
            {credit.providerLabel}
          </GalleryAttributionLink>
        </span>
      </p>
    );
  }

  const i18nKey =
    credit.provider === 'pexels'
      ? 'place.gallery.photoCreditPexels'
      : 'place.gallery.photoCreditUnsplash';

  return (
    <p data-gallery-photo-credit="" className={creditShellClass}>
      <span className={creditTextClass}>
        <Trans
          i18nKey={i18nKey}
          values={{ name: credit.authorName }}
          components={{
            photographer: (
              <GalleryAttributionLink
                href={credit.photographerHref}
                location={location}
                image={image}
                context="gallery-grid"
                className={linkClass}
              />
            ),
            provider: (
              <GalleryAttributionLink
                href={credit.providerHref}
                location={location}
                image={image}
                context="gallery-grid"
                className={linkClass}
              />
            ),
          }}
        />
      </span>
    </p>
  );
}
