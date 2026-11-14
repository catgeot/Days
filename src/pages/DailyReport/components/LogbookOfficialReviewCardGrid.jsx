import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImageIcon } from 'lucide-react';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import {
  formatGateoReviewerBadge,
  placeReviewVisitStoryDisplayTitle,
} from '../../../utils/placeReviewEditorial';
import {
  getCollapsedPreviewText,
  getGalleryImageEntries,
  resolveReviewImageSrc,
} from '../../../utils/placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from '../../../utils/reviewInlineMarkdown.js';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';
import { resolveLogbookReviewPlaceDisplayName } from '../../../logbookOfficialReviews/logbookReviewPlaceLabel.js';
import { logbookReviewPersonaFallbackGradient } from '../../../logbookOfficialReviews/logbookReviewPersonaFallback.js';
import { optimizeLogbookReviewCardThumbUrl } from '../../../logbookOfficialReviews/logbookReviewCardThumbUrl.js';

const CARD_TITLE_MAX = 72;
const CARD_SUMMARY_MAX = 110;

function editorialReviewCardTitle(review) {
  const titled = placeReviewVisitStoryDisplayTitle(review, CARD_TITLE_MAX);
  if (titled) return titled;
  const raw = getCollapsedPreviewText(review);
  const plain = stripReviewInlineMarkdown(raw).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= CARD_TITLE_MAX) return plain;
  return `${plain.slice(0, CARD_TITLE_MAX).trim()}…`;
}

function editorialReviewCardSummary(review, title) {
  const raw = stripReviewInlineMarkdown(getCollapsedPreviewText(review))
    .replace(/\s+/g, ' ')
    .trim();
  if (!raw) return '';
  const titleNorm = String(title || '').replace(/…$/, '').trim();
  if (!titleNorm) {
    return raw.length <= CARD_SUMMARY_MAX ? raw : `${raw.slice(0, CARD_SUMMARY_MAX).trim()}…`;
  }
  if (raw === titleNorm || raw === title) return '';
  if (raw.startsWith(titleNorm)) {
    const rest = raw.slice(titleNorm.length).replace(/^[.。!\s]+/, '').trim();
    if (rest.length < 6) return '';
    return rest.length <= CARD_SUMMARY_MAX ? rest : `${rest.slice(0, CARD_SUMMARY_MAX).trim()}…`;
  }
  return raw.length <= CARD_SUMMARY_MAX ? raw : `${raw.slice(0, CARD_SUMMARY_MAX).trim()}…`;
}

function editorialReviewCardThumb(review) {
  const images = review?.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const candidates = [...images];
  for (const { img } of getGalleryImageEntries(images, review?.content_blocks)) {
    if (!candidates.includes(img)) candidates.push(img);
  }
  for (const img of candidates) {
    const raw = resolveReviewImageSrc(img);
    if (!raw) continue;
    const optimized = optimizeLogbookReviewCardThumbUrl(raw);
    if (optimized.src) return optimized;
  }
  return null;
}

function HubReviewCardFallback({ cityLabel, personaLabel, preparingLabel }) {
  const gradient = logbookReviewPersonaFallbackGradient(personaLabel);
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} text-white`}
      data-testid="logbook-official-review-hub-card-fallback"
    >
      <ImageIcon size={28} strokeWidth={1.75} aria-hidden className="opacity-90" />
      {cityLabel ? (
        <p className="px-2 text-center text-sm font-semibold drop-shadow-sm">{cityLabel}</p>
      ) : null}
      <p className="text-[11px] font-medium text-white/90">{preparingLabel}</p>
    </div>
  );
}

const CARD_MEDIA_LOAD_TIMEOUT_MS = 8_000;

function HubReviewCardLoadingShell({ personaLabel }) {
  const gradient = logbookReviewPersonaFallbackGradient(personaLabel);
  return (
    <div
      className={`absolute inset-0 z-0 bg-gradient-to-br ${gradient}`}
      aria-hidden
      data-testid="logbook-official-review-hub-card-photo-loading"
    />
  );
}

function HubReviewCardMedia({
  thumb,
  alt,
  cityLabel,
  personaLabel,
  preparingLabel,
  preferEager,
}) {
  const thumbSrc = thumb?.src;
  const [loadState, setLoadState] = useState(() => (thumbSrc ? 'pending' : 'fail'));
  const [inView, setInView] = useState(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !thumbSrc) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [thumbSrc]);

  useEffect(() => {
    if (!inView || loadState !== 'pending' || !thumbSrc) return undefined;
    const timer = setTimeout(() => setLoadState('fail'), CARD_MEDIA_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [inView, loadState, thumbSrc]);

  if (!thumbSrc || loadState === 'fail') {
    return (
      <HubReviewCardFallback
        cityLabel={cityLabel}
        personaLabel={personaLabel}
        preparingLabel={preparingLabel}
      />
    );
  }

  const loadingShell = loadState === 'pending' ? (
    <HubReviewCardLoadingShell personaLabel={personaLabel} />
  ) : null;

  const imgCommon = {
    decoding: 'async',
    loading: preferEager ? 'eager' : 'lazy',
    ...(preferEager ? { fetchPriority: 'high' } : {}),
    onError: () => setLoadState('fail'),
  };

  return (
    <div ref={mediaRef} className="absolute inset-0">
      {loadingShell}
      <img
        src={thumbSrc}
        srcSet={thumb?.srcSet || undefined}
        sizes={thumb?.sizes || undefined}
        alt={loadState === 'ok' ? alt : ''}
        aria-hidden={loadState !== 'ok'}
        className={`absolute inset-0 z-[1] h-full w-full object-cover object-center ${
          loadState === 'pending' ? 'opacity-0' : ''
        }`}
        data-testid={
          loadState === 'ok' ? 'logbook-official-review-hub-card-photo' : undefined
        }
        onLoad={() => setLoadState('ok')}
        {...imgCommon}
      />
    </div>
  );
}

export default function LogbookOfficialReviewCardGrid({
  reviews,
  hubLinkState,
  onHubReviewNavigate,
}) {
  const { t, i18n } = useTranslation();
  const preparingLabel = t('logbook.officialReviewHub.imagePreparing');
  const lang = i18n.language?.startsWith('en') ? 'en' : 'ko';

  return (
    <ul
      className="grid grid-cols-2 gap-3 xl:grid-cols-3 xl:gap-4"
      data-testid="logbook-official-review-hub-card-grid"
    >
      {reviews.map((review, index) => {
        const slug = String(review.place_slug || '').trim();
        const placePath = slug ? `/place/${slug}` : '';
        const href = placePath ? buildPlaceReviewsHref(placePath, review.id) : '#';
        const thumb = editorialReviewCardThumb(review);
        const thumbSrc = thumb?.src ?? null;
        const title = editorialReviewCardTitle(review);
        const summary = editorialReviewCardSummary(review, title);
        const cityLabel = resolveLogbookReviewPlaceDisplayName(review, lang);
        const dateLabel = formatLogbookDisplayDate(review.created_at, {
          locale: lang === 'en' ? 'en' : 'ko',
        });
        const badgeLabel = formatGateoReviewerBadge(review.persona_label);
        const photoAlt = t('logbook.officialReviewHub.photoAlt', {
          city: cityLabel,
          reviewer: badgeLabel,
        });

        return (
          <li key={review.id} className="min-w-0">
            <Link
              to={href}
              state={hubLinkState}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                onHubReviewNavigate?.();
              }}
              onClick={() => onHubReviewNavigate?.()}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-colors hover:border-indigo-100 hover:bg-gray-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              data-testid="logbook-official-review-hub-item"
              data-hub-place-slug={slug || undefined}
              data-review-id={review.id}
              data-hub-has-thumb={thumbSrc ? 'true' : 'false'}
              data-hub-thumb-src={thumbSrc || undefined}
              data-hub-persona-badge={badgeLabel}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <HubReviewCardMedia
                  thumb={thumb}
                  alt={photoAlt}
                  cityLabel={cityLabel}
                  personaLabel={review.persona_label}
                  preparingLabel={preparingLabel}
                  preferEager={index < 3}
                />
                <span className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                  {badgeLabel}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1 px-2.5 py-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {cityLabel ? (
                    <span className="text-xs font-semibold text-gray-800">{cityLabel}</span>
                  ) : null}
                  {dateLabel ? (
                    <span className="text-[11px] text-gray-400">{dateLabel}</span>
                  ) : null}
                </div>
                {title ? (
                  <p
                    className="min-w-0 text-sm font-medium leading-snug text-gray-800 line-clamp-2 break-keep"
                    data-testid="logbook-official-review-hub-card-title"
                  >
                    {title}
                  </p>
                ) : null}
                {summary ? (
                  <p
                    className="min-w-0 max-xl:hidden text-xs leading-snug text-gray-500 line-clamp-1 break-keep"
                    data-testid="logbook-official-review-hub-card-summary"
                  >
                    {summary}
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}