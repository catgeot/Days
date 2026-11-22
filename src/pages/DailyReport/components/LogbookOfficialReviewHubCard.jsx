import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Sparkles } from 'lucide-react';
import { LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE } from '../../../logbookOfficialReviews/constants.js';
import { rememberLogbookReviewHubRows } from '../../../logbookOfficialReviews/logbookReviewHubListCache.js';
import {
  buildLogbookHubReturnTo,
  readMatchingLogbookReviewHubSession,
  snapshotLogbookReviewHubSession,
} from '../../../logbookOfficialReviews/logbookReviewHubSession.js';
import { prepareLogbookReviewHubNavigation } from '../../../logbookOfficialReviews/logbookReviewHubNavigate.js';
import {
  captureLogbookHubScrollAnchor,
  holdLogbookHubScrollAnchor,
} from '../../../logbookOfficialReviews/logbookReviewHubScrollAnchor.js';
import {
  applyLogbookHubScrollRestore,
  clearLogbookHubScrollRestored,
  scheduleLogbookHubScrollRestore,
} from '../../../logbookOfficialReviews/logbookReviewHubScrollRestore.js';
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
import {
  filterLogbookOfficialReviewRows,
  groupLogbookOfficialReviews,
  LOGBOOK_REVIEW_FILTER_MAJOR,
} from '../../../logbookOfficialReviews/groupLogbookOfficialReviews.js';
import { pageLogbookOfficialReviewRows } from '../../../logbookOfficialReviews/logbookReviewHubOrder.js';
import {
  applyLogbookReviewFilterToSearchParams,
  logbookReviewFilterUrlNeedsNormalize,
  parseLogbookReviewFilterFromSearch,
} from '../../../logbookOfficialReviews/logbookReviewFilterUrl.js';
import { isGateoLogbookReviewFilterEnabled } from '../../../utils/logbookReviewFilterFlag.js';
import { logbookPlaceKey } from '../../../utils/logbookReadingMeta.js';
import { resolveLogbookBlogLocationReviewFilter } from '../../../logbookOfficialReviews/logbookBlogLocationReviewFilter.js';
import { trackEvent } from '../../../shared/analytics/trackEvent.js';
import LogbookOfficialReviewFilter from './LogbookOfficialReviewFilter.jsx';
import LogbookOfficialReviewCardGrid from './LogbookOfficialReviewCardGrid.jsx';

export const LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE = 10;
export const LOGBOOK_OFFICIAL_REVIEW_HUB_CARD_PAGE_SIZE = 12;
const LIST_PREVIEW_MAX = 120;

/** Keeps hub inside the logbook main column when sidebar + max-w-7xl would exceed the viewport. */
const HUB_CARD_LAYOUT_CLASS =
  'mb-6 w-full min-w-0 max-w-full box-border overflow-x-hidden rounded-2xl border border-gray-200 bg-white shadow-sm';

function hubPageSize(filterEnabled) {
  return filterEnabled ? LOGBOOK_OFFICIAL_REVIEW_HUB_CARD_PAGE_SIZE : LOGBOOK_OFFICIAL_REVIEW_HUB_PAGE_SIZE;
}

function initialVisibleCount(pathname, search, pageSize) {
  const saved = readMatchingLogbookReviewHubSession(pathname, search)?.visibleCount;
  if (typeof saved === 'number' && saved > 0) return Math.max(pageSize, saved);
  return pageSize;
}

/** No saved choice → open. A boolean in the matching session wins, including collapsed. */
export function initialLogbookHubExpanded(saved) {
  return typeof saved === 'boolean' ? saved : true;
}

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
  filteredCount,
  onToggle,
  headerRound,
  asToggle = true,
  showChevron = true,
  countSuffix,
  title,
}) {
  const rowClass = `flex w-full min-w-0 items-center gap-2 px-4 py-3.5 text-left ${headerRound}`;
  const inner = (
    <>
      <Sparkles size={18} className="shrink-0 text-indigo-500" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900">
        {title}
      </span>
      {typeof totalCount === 'number' ? (
        <span
          className="shrink-0 whitespace-nowrap tabular-nums text-xs font-semibold text-gray-600"
          data-testid="logbook-official-review-hub-count"
        >
          {typeof filteredCount === 'number' && filteredCount !== totalCount
            ? `${filteredCount} / ${totalCount}${countSuffix}`
            : `${totalCount}${countSuffix}`}
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

const LogbookOfficialReviewHubCard = ({ blogLocationFilter = '' }) => {
  const { t } = useTranslation();
  const hubTitle = t('logbook.officialReviewHub.title', {
    defaultValue: LOGBOOK_OFFICIAL_REVIEW_CARD_TITLE,
  });
  const [, setSearchParams] = useSearchParams();
  const location = useLocation();
  const panelId = useId();
  const filterEnabled = isGateoLogbookReviewFilterEnabled();
  const pageSize = hubPageSize(filterEnabled);
  const countSuffix = t('logbook.officialReviewHub.countSuffix');
  const [expanded, setExpanded] = useState(() =>
    initialLogbookHubExpanded(
      readMatchingLogbookReviewHubSession(location.pathname, location.search)?.expanded,
    ),
  );
  const [visibleCount, setVisibleCount] = useState(() =>
    initialVisibleCount(location.pathname, location.search, pageSize),
  );
  const [cityOverflowOpen, setCityOverflowOpen] = useState(() =>
    Boolean(readMatchingLogbookReviewHubSession(location.pathname, location.search)?.cityOverflowOpen),
  );
  const blogLocationKey = useMemo(() => {
    const fromProp = logbookPlaceKey(blogLocationFilter);
    if (fromProp) return fromProp;
    return logbookPlaceKey(new URLSearchParams(location.search).get('location'));
  }, [blogLocationFilter, location.search]);
  const blogLocationReviewFilter = useMemo(
    () => resolveLogbookBlogLocationReviewFilter(blogLocationKey),
    [blogLocationKey],
  );
  const parsedFilter = filterEnabled
    ? parseLogbookReviewFilterFromSearch(location.search)
    : { major: LOGBOOK_REVIEW_FILTER_MAJOR.ALL, citySlug: '' };
  const initialMajor = blogLocationKey
    ? blogLocationReviewFilter.major
    : parsedFilter.major;
  const initialCitySlug = blogLocationKey
    ? blogLocationReviewFilter.citySlug
    : parsedFilter.citySlug;
  const [filterMajor, setFilterMajor] = useState(initialMajor);
  const [filterCitySlug, setFilterCitySlug] = useState(initialCitySlug);
  const { enabled, rows, isLoading, loadFailed, totalCount, retry } = useLogbookOfficialReviewHub();
  const didRestoreScroll = useRef(false);
  const skipExpandedPersist = useRef(true);
  const expandedRef = useRef(expanded);
  const defaultHubToggleSent = useRef(false);
  const openedByDefault = useRef(null);
  if (openedByDefault.current == null) {
    const saved = readMatchingLogbookReviewHubSession(location.pathname, location.search)?.expanded;
    openedByDefault.current = typeof saved !== 'boolean';
  }
  expandedRef.current = expanded;
  const locationRef = useRef(location);
  locationRef.current = location;
  /** @type {React.MutableRefObject<import('../../../logbookOfficialReviews/logbookReviewHubScrollAnchor.js').LogbookHubScrollAnchor | null>} */
  const scrollAnchorRef = useRef(null);

  // #840 default open has no stored boolean. One event per mount; rerenders must not send it again.
  useEffect(() => {
    if (defaultHubToggleSent.current) return;
    if (!openedByDefault.current) {
      defaultHubToggleSent.current = true;
      return;
    }
    if (!enabled || loadFailed || totalCount === 0 || !expanded) return;
    defaultHubToggleSent.current = true;
    trackEvent('logbook_review_hub_toggle', { expanded: true, source: 'default' });
  }, [enabled, loadFailed, totalCount, expanded]);

  const onHubToggle = useCallback(() => {
    const next = !expandedRef.current;
    expandedRef.current = next;
    setExpanded(next);
    trackEvent('logbook_review_hub_toggle', { expanded: next, source: 'user' });
  }, []);

  useEffect(() => {
    const session = readMatchingLogbookReviewHubSession(location.pathname, location.search);
    if (!session) return;
    if (typeof session.expanded === 'boolean') setExpanded(session.expanded);
    if (typeof session.visibleCount === 'number' && session.visibleCount > 0) {
      setVisibleCount(Math.max(pageSize, session.visibleCount));
    }
    if (session.cityOverflowOpen) setCityOverflowOpen(true);
  }, [location.pathname, location.search, pageSize]);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const scrollRoot = document.querySelector('[data-logbook-main-scroll]');
    if (!(scrollRoot instanceof HTMLElement)) return undefined;
    const session = readMatchingLogbookReviewHubSession(location.pathname, location.search);
    const target = Number(session?.scrollY);
    const room = scrollRoot.scrollHeight - scrollRoot.clientHeight;
    const canRestore =
      expanded &&
      rows.length > 0 &&
      scrollRoot.clientHeight >= 20 &&
      Number.isFinite(target) &&
      target > 0 &&
      room + 8 >= target &&
      Boolean(scrollRoot.querySelector('[data-review-id]'));

    // Seek must not start until the saved list can actually hold the offset.
    // An early seek clamps to the top, and a wheel in that window abandons the return (#809).
    if (canRestore && !didRestoreScroll.current) {
      if (typeof history !== 'undefined') history.scrollRestoration = 'manual';
      applyLogbookHubScrollRestore(scrollRoot, target);
      if (session?.anchorReviewId) {
        const beforeAlign = scrollRoot.scrollTop;
        holdLogbookHubScrollAnchor(scrollRoot, {
          reviewId: String(session.anchorReviewId),
          offset: Number(session.anchorOffset) || 0,
          scrollTop: target,
        });
        if (Math.abs(scrollRoot.scrollTop - target) > 80) scrollRoot.scrollTop = beforeAlign;
      }
      didRestoreScroll.current = true;
      scrollAnchorRef.current = captureLogbookHubScrollAnchor(scrollRoot);
      if (Array.isArray(window.__gateoHubScrollFrames)) {
        // Hub-nav E2E reads the pre-paint value. The array exists only when that spec installed it.
        window.__gateoHubScrollFrames.push(scrollRoot.scrollTop);
      }
      return scheduleLogbookHubScrollRestore(scrollRoot, target);
    }

    if (didRestoreScroll.current && scrollAnchorRef.current) {
      holdLogbookHubScrollAnchor(scrollRoot, scrollAnchorRef.current);
      scrollAnchorRef.current = captureLogbookHubScrollAnchor(scrollRoot);
    }
    return undefined;
  });

  useEffect(() => {
    return () => {
      if (!didRestoreScroll.current || typeof history === 'undefined') return;
      history.scrollRestoration = 'auto';
    };
  }, []);

  useEffect(() => {
    if (skipExpandedPersist.current) {
      skipExpandedPersist.current = false;
      return;
    }
    const { pathname, search } = locationRef.current;
    snapshotLogbookReviewHubSession({
      returnTo: buildLogbookHubReturnTo(pathname, search),
      expanded,
    });
  }, [expanded]);

  const hubLinkState = useMemo(
    () => ({
      returnTo: buildLogbookHubReturnTo(location.pathname, location.search),
      fromLogbookReviewHub: true,
    }),
    [location.pathname, location.search],
  );

  const onHubReviewNavigate = useCallback(() => {
    const scrollRoot = document.querySelector('[data-logbook-main-scroll]');
    clearLogbookHubScrollRestored(scrollRoot);
    const scrollY = scrollRoot && 'scrollTop' in scrollRoot ? scrollRoot.scrollTop : 0;
    const anchor =
      scrollRoot instanceof HTMLElement ? captureLogbookHubScrollAnchor(scrollRoot) : null;
    rememberLogbookReviewHubRows(rows);
    prepareLogbookReviewHubNavigation({
      pathname: location.pathname,
      search: location.search,
      expanded,
      visibleCount,
      scrollY,
      anchorReviewId: anchor?.reviewId,
      anchorOffset: anchor?.offset,
      cityOverflowOpen,
    });
  }, [location.pathname, location.search, expanded, visibleCount, rows, cityOverflowOpen]);

  useEffect(() => {
    if (!filterEnabled) return;
    if (logbookReviewFilterUrlNeedsNormalize(location.search)) {
      const parsed = parseLogbookReviewFilterFromSearch(location.search);
      const next = applyLogbookReviewFilterToSearchParams(
        new URLSearchParams(location.search),
        parsed.major,
        parsed.citySlug,
      );
      setSearchParams(next, { replace: true });
      return;
    }
    if (blogLocationKey) {
      setFilterMajor(blogLocationReviewFilter.major);
      setFilterCitySlug(blogLocationReviewFilter.citySlug);
      setVisibleCount(pageSize);
      return;
    }
    const parsed = parseLogbookReviewFilterFromSearch(location.search);
    setFilterMajor(parsed.major);
    setFilterCitySlug(parsed.citySlug);
  }, [
    filterEnabled,
    location.search,
    setSearchParams,
    blogLocationKey,
    blogLocationReviewFilter.major,
    blogLocationReviewFilter.citySlug,
  ]);

  const syncFilterToUrl = useCallback(
    (major, citySlug) => {
      if (!filterEnabled) return;
      setSearchParams(
        (prev) => applyLogbookReviewFilterToSearchParams(prev, major, citySlug),
        { replace: false },
      );
    },
    [filterEnabled, setSearchParams],
  );

  const grouped = useMemo(() => groupLogbookOfficialReviews(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (!filterEnabled) return rows;
    return filterLogbookOfficialReviewRows(rows, filterMajor, filterCitySlug || null);
  }, [rows, filterEnabled, filterMajor, filterCitySlug]);

  const filteredTotal = filteredRows.length;

  const visibleRows = useMemo(
    () => pageLogbookOfficialReviewRows(filteredRows, 0, visibleCount),
    [filteredRows, visibleCount],
  );

  const resetPagination = useCallback(() => {
    setVisibleCount(pageSize);
  }, [pageSize]);

  const onMajorChange = useCallback(
    (major) => {
      setFilterMajor(major);
      setFilterCitySlug('');
      resetPagination();
      syncFilterToUrl(major, '');
    },
    [resetPagination, syncFilterToUrl],
  );

  const onCityChange = useCallback(
    (slug) => {
      setFilterCitySlug(slug);
      resetPagination();
      syncFilterToUrl(filterMajor, slug);
    },
    [filterMajor, resetPagination, syncFilterToUrl],
  );

  if (!enabled) {
    return null;
  }

  if (loadFailed) {
    return (
      <section
        className={HUB_CARD_LAYOUT_CLASS}
        aria-label={hubTitle}
        data-testid="logbook-official-review-hub"
        data-hub-state="load-failed"
      >
        <HubTitleRow
          panelId={panelId}
          expanded={false}
          asToggle={false}
          showChevron={false}
          headerRound="rounded-t-2xl"
          countSuffix={countSuffix}
          title={hubTitle}
        />
        <div className="border-t border-gray-100 px-4 pb-3.5 pt-2">
          <p className="text-sm text-gray-600">{t('logbook.officialReviewHub.loadFailed')}</p>
          <button
            type="button"
            className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            data-testid="logbook-official-review-hub-retry"
            onClick={retry}
          >
            {t('logbook.officialReviewHub.retry')}
          </button>
        </div>
      </section>
    );
  }

  if (!isLoading && totalCount === 0) {
    return null;
  }

  if (isLoading && totalCount === 0) {
    return null;
  }

  const hasMore = visibleCount < filteredTotal;
  const headerRound = expanded ? 'rounded-t-2xl' : 'rounded-2xl';
  const displayFilteredCount =
    filterEnabled && filteredTotal !== totalCount ? filteredTotal : undefined;

  return (
    <section
      className={HUB_CARD_LAYOUT_CLASS}
      aria-label={hubTitle}
      data-testid="logbook-official-review-hub"
      data-hub-state="ready"
    >
      <HubTitleRow
        panelId={panelId}
        expanded={expanded}
        totalCount={totalCount}
        filteredCount={displayFilteredCount}
        headerRound={headerRound}
        countSuffix={countSuffix}
        title={hubTitle}
        onToggle={onHubToggle}
      />

      {expanded ? (
        <div
          id={panelId}
          className="border-t border-gray-100 px-3 pb-4 pt-2 sm:px-4"
          data-testid="logbook-official-review-hub-panel"
        >
          {filterEnabled ? (
            <LogbookOfficialReviewFilter
              major={filterMajor}
              citySlug={filterCitySlug}
              total={grouped.total}
              domesticCount={grouped.domesticCount}
              overseasCount={grouped.overseasCount}
              cityChips={grouped.cities}
              cityOverflowOpen={cityOverflowOpen}
              onCityOverflowOpenChange={setCityOverflowOpen}
              onMajorChange={onMajorChange}
              onCityChange={onCityChange}
            />
          ) : null}
          {filterEnabled && blogLocationKey && filteredTotal === 0 && !isLoading ? (
            <p
              className="py-6 text-center text-sm text-gray-500"
              data-testid="logbook-official-review-hub-location-empty"
            >
              {t('logbook.officialReviewHub.locationEmpty', {
                location: blogLocationKey,
                defaultValue: `‘${blogLocationKey}’ 지역 GATEO 리뷰어 리뷰가 아직 없어요.`,
              })}
            </p>
          ) : null}
          {filterEnabled ? (
            <LogbookOfficialReviewCardGrid
              reviews={visibleRows}
              hubLinkState={hubLinkState}
              onHubReviewNavigate={onHubReviewNavigate}
            />
          ) : (
            <ul className="divide-y divide-gray-100">
              {visibleRows.map((review) => {
                const slug = String(review.place_slug || '').trim();
                const href = slug ? `/place/${slug}/reviews` : '#';
                const thumbSrc = editorialReviewThumbSrc(review);
                const preview = editorialReviewListPreview(review);
                const placeName = String(review.place_name || '').trim();
                const dateLabel = formatLogbookDisplayDate(review.created_at);
                const badgeLabel = formatGateoReviewerBadge(review.persona_label);

                return (
                  <li key={review.id}>
                    <Link
                      to={href}
                      state={hubLinkState}
                      onPointerDown={(event) => {
                        if (event.button !== 0) return;
                        onHubReviewNavigate();
                      }}
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
          )}
          {hasMore ? (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-4 py-2"
                data-testid="logbook-official-review-hub-more"
                onClick={() =>
                  setVisibleCount((n) => Math.min(n + pageSize, filteredTotal))
                }
              >
                {t('logbook.officialReviewHub.loadMore')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default LogbookOfficialReviewHubCard;