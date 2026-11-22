import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeExploreSearchThumbnailCredit } from '../../lib/exploreSearchThumbnailCredit.js';

const linkClass =
  'font-semibold text-sky-200 underline decoration-sky-200/50 underline-offset-2 hover:text-sky-100';

function stopCardNav(event) {
  event.stopPropagation();
}

/**
 * 탐색 검색 명소 카드 — Unsplash 썸네일 출처(카드 선택 onClick과 분리).
 * @param {{ credit?: object | null, className?: string }} props
 */
export default function ExploreSearchThumbnailCreditCue({ credit: raw, className = '' }) {
  const { t, i18n } = useTranslation();
  const credit = useMemo(() => normalizeExploreSearchThumbnailCredit(raw), [raw]);
  if (!credit) return null;

  const label = t('home.explore.searchThumbnailCreditPrefix');

  return (
    <p
      data-explore-search-thumbnail-credit=""
      className={`pointer-events-auto inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-full border border-white/25 bg-white/[0.06] px-2 py-0.5 text-[10px] leading-snug text-white/90 ${className}`}
      onClick={stopCardNav}
      onPointerDown={stopCardNav}
    >
      <span className="shrink-0 font-medium text-white/85">{label}</span>
      {credit.photographerHref ? (
        <a
          href={credit.photographerHref}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={stopCardNav}
          onPointerDown={stopCardNav}
        >
          {credit.authorName}
        </a>
      ) : (
        <span className="font-semibold text-sky-200/95">{credit.authorName}</span>
      )}
      <span className="shrink-0 text-white/80" aria-hidden="true">
        /
      </span>
      <a
        href={credit.unsplashHref}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        onClick={stopCardNav}
        onPointerDown={stopCardNav}
      >
        Unsplash
      </a>
    </p>
  );
}