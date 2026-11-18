import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCommonsArtistPageHref } from '../../../utils/commonsArtistHref.js';
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
 *   interactiveLinks?: boolean,
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
  interactiveLinks = true,
}) {
  const { t, i18n } = useTranslation();
  const credit = normalizeGalleryPhotoCredit(rawCredit);
  const [fetchedAuthorHref, setFetchedAuthorHref] = useState(null);
  const isKo = i18n.language?.startsWith('ko');

  useEffect(() => {
    setFetchedAuthorHref(null);
    if (credit?.kind !== 'wikimedia' || credit.photographerHref || !credit.filePageHref) {
      return undefined;
    }
    let cancelled = false;
    const filePageHref = credit.filePageHref;
    fetchCommonsArtistPageHref(filePageHref).then(
      (href) => {
        if (!cancelled) setFetchedAuthorHref(href);
      },
      (error) => {
        queueMicrotask(() => {
          throw error;
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [credit?.kind, credit?.photographerHref, credit?.filePageHref]);
  const Link = LinkComponent || PlainAnchor;

  const toneLinkClass = interactiveLinks
    ? tone === 'lightbox'
      ? defaultLightboxLink
      : tone === 'gallery-overlay'
        ? defaultGalleryLightLink
        : defaultMutedLink
    : tone === 'gallery-overlay'
      ? 'font-semibold text-white/90'
      : tone === 'lightbox'
        ? 'font-semibold text-white/85'
        : 'font-semibold';

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
    !interactiveLinks ? 'pointer-events-none' : '',
    rowClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const Label = ({ href, className, title, children }) => {
    if (interactiveLinks && href) {
      return (
        <Link href={href} className={className} title={title} {...linkExtraProps}>
          {children}
        </Link>
      );
    }
    return (
      <span className={className} title={title}>
        {children}
      </span>
    );
  };

  if (!credit) return null;

  if (credit.kind === 'kto') {
    return (
      <span className={rowClass}>
        <span className="shrink-0">{t('place.gallery.photoCreditKtoPrefix')}</span>
        <Label href={credit.providerHref} className={providerClass}>
          {credit.providerLabel}
        </Label>
      </span>
    );
  }

  if (credit.kind === 'wikimedia') {
    return (
      <span className={rowClass} data-gallery-wikimedia-credit="">
        <span className="shrink-0">{t('place.gallery.photoCreditBy')}</span>
        <Label href={credit.photographerHref || fetchedAuthorHref || undefined} className={authorClass}>
          {credit.authorName}
        </Label>
        {credit.licenseName ? (
          <>
            <span className="shrink-0" aria-hidden="true">
              ·
            </span>
            <Label href={credit.licenseHref || undefined} className={providerClass}>
              {credit.licenseName}
            </Label>
          </>
        ) : null}
        {credit.filePageHref ? (
          <>
            <span className="shrink-0" aria-hidden="true">
              ·
            </span>
            <Label
              href={credit.filePageHref}
              className={providerClass}
              title={t('place.gallery.photoCreditFilePageTitle')}
            >
              {t('place.gallery.photoCreditFilePage')}
            </Label>
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
        <Label href={credit.photographerHref || undefined} className={authorClass}>
          {credit.authorName}
        </Label>
        <span className="shrink-0">{isKo ? '·' : t('place.gallery.photoCreditOn')}</span>
        <Label href={credit.providerHref || undefined} className={providerClass}>
          {providerName}
        </Label>
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