import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigationType } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import { LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE } from '../../../logbookOfficialReviews/constants.js';
import { useLogbookOfficialReviewHub } from '../../../logbookOfficialReviews/useLogbookOfficialReviewHub.js';
import { formatLogbookDisplayDate } from '../../../utils/logbookDisplayDate';
import {
  formatGateoReviewerBadge,
  placeReviewVisitStoryDisplayTitle,
} from '../../../utils/placeReviewEditorial';
import {
  getCollapsedPreviewText,
  getGalleryImageEntries,
  resolveReviewThumbnailSrc,
} from '../../../utils/placeReviewContentBlocks.js';
import { stripReviewInlineMarkdown } from '../../../utils/reviewInlineMarkdown.js';
import { buildLogbookOfficialReviewHref } from '../../../utils/logbookOfficialReviewHubRoutes.js';
import {
  clearLogbookOfficialReviewHubBackState,
  readLogbookOfficialReviewHubBackState,
  snapshotLogbookOfficialReviewHubForBack,
} from '../../../utils/logbookOfficialReviewHubState.js';
import { restoreLogbookMainScrollWhenReady } from '../../../utils/logbookOfficialReviewHubScrollRestore.js';

export const LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE = 10;
const LIST_PREVIEW_MAX = 120;

/** Keeps hub inside the logbook main column when sidebar + max-w-7xl would exceed the viewport. */
const HUB_CARD_LAYOUT_CLASS =
  'mb-6 w-full min-w-0 max-w-full box-border md:max-w-[min(80rem,calc(100vw-16rem-3rem))] overflow-x-hidden rounded-2xl border border-gray-200 bg-white shadow-sm';

function editorialReviewListPreview(review) {
  const titled = placeReviewVisitStoryDisplayTitle(review, LIST_PREVIEW_MAX);
  if (titled) return titled;
  const raw = getCollapsedPreviewText(review);
  const plain = stripReviewInlineMarkdown(raw).replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= LIST_PREVIEW_MAX) return plain;
  return `${plain.slice(0, LIST_PREVIEW_MAX).trim()}…`;
}

function editorialReviewThumbSrc(review) {
  const images = review?.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const candidates = [...images];
  for (const { img } of getGalleryImageEntries(images, review?.content_blocks)) {
    if (!candidates.includes(img)) candidates.push(img);
  }
  for (const img of candidates) {
    const src = resolveReviewThumbnailSrc(img, { width: 160, height: 160 });
    if (src) return src;
  }
  return null;
}

function HubReviewListThumbnail({ src }) {
  const [loadState, setLoadState] = useState('pending');

  if (!src || loadState === 'fail') return null;

  if (loadState !== 'ok') {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        className="hidden size-0 overflow-hidden opacity-0 pointer-events-none"
        decoding="async"
        onLoad={() => setLoadState('ok')}
        onError={() => setLoadState('fail')}
      />
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="h-14 w-14 shrink-0 rounded-lg object-cover"
      decoding="async"
    />
  );
}

function HubTitleRow({
  panelId,
  expanded,
  totalCount,
  onToggle,
  headerRound,
  asToggle = true,
  showChevron = true,
}) {
  const rowClass = `flex w-full min-w-0 items-center gap-2 px-4 py-3.5 text-left ${headerRound}`;
  const inner = (
    <>
      <Sparkles size={18} className="shrink-0 text-indigo-500" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">
        {LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}
      </span>
      {typeof totalCount === 'number' ? (
        <span
          className="shrink-0 whitespace-nowrap tabular-nums text-xs font-semibold text-gray-600"
          data-testid="logbook-official-review-hub-count"
        >
          {totalCount}편
        </span>
      ) : null}
      {showChevron ? (
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"
          data-testid="logbook-official-review-hub-chevron"
          aria-hidden
        >
          <ChevronDown
            size={22}
            strokeWidth={2.5}
            className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </span>
      ) : null}
    </>
  );

  if (!asToggle) {
    return (
      <div className={rowClass} data-testid="logbook-official-review-hub-title-row">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${rowClass} transition-colors hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500`}
      aria-expanded={expanded}
      aria-controls={panelId}
      data-testid="logbook-official-review-hub-toggle"
      onClick={onToggle}
    >
      {inner}
    </button>
  );
}

const LogbookOfficialReviewHubCard = () => {
  const panelId = useId();
  const navigationType = useNavigationType();
  const restoredBackRef = useRef(false);
  const scrollRestoreCancelRef = useRef(null);
  const [expanded, setExpanded] = useState(() => {
    const back = readLogbookOfficialReviewHubBackState(navigationType);
    return Boolean(back?.expanded);
  });
  const [visibleCount, setVisibleCount] = useState(() => {
    const back = readLogbookOfficialReviewHubBackState(navigationType);
    const fromBack = Number(back?.visibleCount);
    if (Number.isFinite(fromBack) && fromBack > 0) {
      return Math.max(fromBack, LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE);
    }
    return LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE;
  });
  const { enabled, rows, isLoading, loadFailed, totalCount, retry } = useLogbookOfficialReviewHub();

  const visibleRows = useMemo(() => rows.slice(0, visibleCount), [rows, visibleCount]);

  useLayoutEffect(() => {
    if (restoredBackRef.current) return;
    const back = readLogbookOfficialReviewHubBackState(navigationType);
    if (!back) return;
    setExpanded(true);
    setVisibleCount(
      Math.min(
        Math.max(back.visibleCount, LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE),
        totalCount || back.visibleCount,
      ),
    );
    if (isLoading) return undefined;

    scrollRestoreCancelRef.current?.();
    const main = document.querySelector('[data-logbook-main-scroll]');
    scrollRestoreCancelRef.current = restoreLogbookMainScrollWhenReady(main, back.scrollTop, {
      onFinalize: () => {
        restoredBackRef.current = true;
        clearLogbookOfficialReviewHubBackState();
      },
    });
    return () => {
      scrollRestoreCancelRef.current?.();
      scrollRestoreCancelRef.current = null;
    };
  }, [navigationType, totalCount, isLoading]);

  const rememberHubForBrowserBack = () => {
    const main = document.querySelector('[data-logbook-main-scroll]');
    snapshotLogbookOfficialReviewHubForBack({
      expanded,
      visibleCount,
      scrollTop: main ? main.scrollTop : 0,
    });
  };

  if (!enabled) {
    return null;
  }

  if (loadFailed) {
    return (
      <section
        className={HUB_CARD_LAYOUT_CLASS}
        aria-label={LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}
        data-testid="logbook-official-review-hub"
        data-hub-state="load-failed"
      >
        <HubTitleRow
          panelId={panelId}
          expanded={false}
          asToggle={false}
          showChevron={false}
          headerRound="rounded-t-2xl"
        />
        <div className="border-t border-gray-100 px-4 pb-3.5 pt-2">
          <p className="text-sm text-gray-600">리뷰를 불러오지 못했어요</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            data-testid="logbook-official-review-hub-retry"
            onClick={retry}
          >
            다시 시도
          </button>
        </div>
      </section>
    );
  }

  if (!isLoading && totalCount === 0) {
    return null;
  }

  if (isLoading && totalCount === 0 && !expanded) {
    return null;
  }

  const hasMore = visibleCount < totalCount;
  const headerRound = expanded ? 'rounded-t-2xl' : 'rounded-2xl';

  return (
    <section
      className={HUB_CARD_LAYOUT_CLASS}
      aria-label={LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE}
      data-testid="logbook-official-review-hub"
      data-hub-state="ready"
    >
      <HubTitleRow
        panelId={panelId}
        expanded={expanded}
        totalCount={totalCount}
        headerRound={headerRound}
        onToggle={() => setExpanded((open) => !open)}
      />

      {expanded ? (
        <div
          id={panelId}
          className="border-t border-gray-100 px-3 pb-4 pt-2 sm:px-4"
          data-testid="logbook-official-review-hub-panel"
        >
          <ul className="divide-y divide-gray-100">
            {isLoading && visibleRows.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-500" aria-busy="true">
                불러오는 중…
              </li>
            ) : null}
            {visibleRows.map((review) => {
              const slug = String(review.place_slug || '').trim();
              const href = buildLogbookOfficialReviewHref(review.id);
              const thumbSrc = editorialReviewThumbSrc(review);
              const preview = editorialReviewListPreview(review);
              const placeName = String(review.place_name || '').trim();
              const dateLabel = formatLogbookDisplayDate(review.created_at);
              const badgeLabel = formatGateoReviewerBadge(review.persona_label);

              return (
                <li key={review.id}>
                  <Link
                    to={href}
                    onClick={rememberHubForBrowserBack}
                    className={`flex py-3 px-1 rounded-lg hover:bg-gray-50 transition-colors${thumbSrc ? ' gap-3' : ''}`}
                    data-testid="logbook-official-review-hub-item"
                    data-hub-place-slug={slug || undefined}
                    data-review-id={review.id}
                    data-hub-has-thumb={thumbSrc ? 'true' : 'false'}
                    data-hub-persona-badge={badgeLabel}
                  >
                    {thumbSrc ? <HubReviewListThumbnail key={thumbSrc} src={thumbSrc} /> : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                        <span
                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700"
                          data-testid="logbook-official-review-hub-persona-badge"
                        >
                          {badgeLabel}
                        </span>
                        {placeName ? (
                          <span className="text-xs font-semibold text-gray-700">{placeName}</span>
                        ) : null}
                      </div>
                      {preview ? (
                        <p className="text-sm text-gray-600 line-clamp-2 break-keep">{preview}</p>
                      ) : null}
                      {dateLabel ? (
                        <p className="mt-1 text-[11px] text-gray-400">{dateLabel}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          {hasMore ? (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-4 py-2"
                data-testid="logbook-official-review-hub-more"
                onClick={() =>
                  setVisibleCount((n) =>
                    Math.min(n + LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE, totalCount),
                  )
                }
              >
                더 보기
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default LogbookOfficialReviewHubCard;
