import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  normalizeEditorialReviewCredit,
  normalizeGalleryPhotoCredit,
} from '../../../utils/stockPhotoCreditFormat';

const defaultMutedLink =
  'underline decoration-gray-300 underline-offset-2 hover:text-gray-600 font-semibold';
const defaultLightboxLink =
  'underline decoration-white/30 underline-offset-2 hover:text-white font-semibold';
const defaultGalleryLightLink =
  'pointer-events-auto inline-flex min-h-6 items-center justify-center px-0.5 py-1 font-semibold underline decoration-white/50 underline-offset-2 hover:text-white';

function PlainAnchor({ href, className, children, ...rest }) {
  if (!href) {
    return <span className={className}>{children}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  );
}

/**
 * @param {{
 *   credit: ReturnType<typeof import('./buildGalleryPhotoCredit.js').buildGalleryPhotoCredit>,
 *   tone?: 'muted' | 'lightbox' | 'gallery-overlay',
 *   rowClassName?: string,
 *   authorLinkClassName?: string,
 *   providerLinkClassName?: string,
 *   LinkComponent?: React.ComponentType<any>,
 *   linkExtraProps?: Record<string, unknown>,
 *   allowAuthorWrap?: boolean,
 * }} props
 */
export default function StockPhotoCreditLine({
  credit: rawCredit,
  tone = 'muted',
  rowClassName = '',
  authorLinkClassName = '',
  providerLinkClassName = '',
  LinkComponent,
  linkExtraProps = {},
  allowAuthorWrap = true,
}) {
  const { t, i18n } = useTranslation();
  const credit = normalizeGalleryPhotoCredit(rawCredit);
  const isKo = i18n.language?.startsWith('ko');
  const Link = LinkComponent || PlainAnchor;

  const toneLinkClass =
    tone === 'lightbox'
      ? defaultLightboxLink
      : tone === 'gallery-overlay'
        ? defaultGalleryLightLink
        : defaultMutedLink;

  const authorClass = [
    toneLinkClass,
    allowAuthorWrap ? 'min-w-0 max-w-full break-words' : 'min-w-0 truncate',
    authorLinkClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const providerClass = [toneLinkClass, 'shrink-0', providerLinkClassName].filter(Boolean).join(' ');

  const rowClass = [
    allowAuthorWrap ? 'flex flex-wrap items-center gap-x-0.5' : 'flex min-w-0 items-center gap-x-0.5',
    rowClassName,
  ]
    .filter(Boolean)
    .join(' ');

  if (!credit) return null;

  if (credit.kind === 'kto') {
    return (
      <span className={rowClass}>
        <span className="shrink-0">{t('place.gallery.photoCreditKtoPrefix')}</span>
        <Link href={credit.providerHref} className={providerClass} {...linkExtraProps}>
          {credit.providerLabel}
        </Link>
      </span>
    );
  }

  if (credit.kind === 'wikimedia') {
    return (
      <span className={rowClass} data-gallery-wikimedia-credit="">
        <span className="shrink-0">{t('place.gallery.photoCreditBy')}</span>
        <Link href={credit.photographerHref || undefined} className={authorClass} {...linkExtraProps}>
          {credit.authorName}
        </Link>
        {credit.licenseName ? (
          <>
            <span className="shrink-0" aria-hidden="true">
              ·
            </span>
            {credit.licenseHref ? (
              <Link href={credit.licenseHref} className={providerClass} {...linkExtraProps}>
                {credit.licenseName}
              </Link>
            ) : (
              <span className="shrink-0 font-semibold">{credit.licenseName}</span>
            )}
          </>
        ) : null}
        {credit.filePageHref ? (
          <>
            <span className="shrink-0" aria-hidden="true">
              ·
            </span>
            <Link
              href={credit.filePageHref}
              className={providerClass}
              title={t('place.gallery.photoCreditFilePageTitle')}
              {...linkExtraProps}
            >
              {t('place.gallery.photoCreditFilePage')}
            </Link>
          </>
        ) : null}
      </span>
    );
  }

  if (credit.kind === 'stock') {
    const providerName =
      credit.provider === 'pexels' ? 'Pexels' : credit.provider === 'wikimedia' ? 'Wikimedia Commons' : 'Unsplash';
    return (
      <span className={rowClass}>
        <span className="shrink-0">{t('place.gallery.photoCreditBy')}</span>
        <Link href={credit.photographerHref || undefined} className={authorClass} {...linkExtraProps}>
          {credit.authorName}
        </Link>
        <span className="shrink-0">{isKo ? '·' : t('place.gallery.photoCreditOn')}</span>
        <Link href={credit.providerHref || undefined} className={providerClass} {...linkExtraProps}>
          {providerName}
        </Link>
      </span>
    );
  }

  return null;
}

/**
 * Editorial / logbook credits normalized via stockPhotoCreditFormat.
 */
export function EditorialStockPhotoCreditLine({
  credit: editorialCredit,
  tone = 'muted',
  className = '',
  allowAuthorWrap = true,
}) {
  const normalized = normalizeEditorialReviewCredit(editorialCredit);

  if (!normalized) return null;
  if (normalized.kind === 'plain') {
    return <span className={className}>{normalized.text}</span>;
  }

  const galleryShaped =
    normalized.kind === 'stock'
      ? {
          kind: 'stock',
          provider: normalized.provider,
          authorName: normalized.authorName,
          photographerHref: normalized.photographerHref,
          providerHref: normalized.providerHref,
        }
      : normalized.kind === 'wikimedia'
        ? {
            kind: 'wikimedia',
            authorName: normalized.authorName,
            photographerHref: normalized.photographerHref,
            filePageHref: normalized.filePageHref,
            licenseName: normalized.licenseName,
            licenseHref: normalized.licenseHref,
          }
        : null;

  if (!galleryShaped) return null;

  return (
    <StockPhotoCreditLine
      credit={galleryShaped}
      tone={tone}
      rowClassName={className}
      allowAuthorWrap={allowAuthorWrap}
    />
  );
}