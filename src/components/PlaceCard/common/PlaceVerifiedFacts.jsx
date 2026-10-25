import React, { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Compass, PenLine } from 'lucide-react';
import { useLocale } from '../../../i18n/LocaleProvider';
import {
  checkedAtForLocale,
  factValueForLocale,
  linkLabelForLocale,
  resolveVerifiedFacts,
  sourceNameForLocale,
  splitFactTimeRanges,
  TIME_RANGE_CLASS,
} from '../../../data/placeVerifiedFacts/index.js';
import { splitItineraryPlaceMentions } from '../../../data/placeVerifiedFacts/itineraryLinks.js';
import {
  plannerSlotForToolkit,
  verifiedFactSlots,
} from '../../../data/placeVerifiedFacts/localInfoLayout.js';
import {
  AI_GENERATED_LABEL,
  presentFactText,
  publicSourceName,
  slotLooksEmpty,
} from '../../../data/placeVerifiedFacts/schema.js';
import { buildPlacePath } from '../../../utils/placePlannerPath';
import {
  PLACE_GALLERY_SECTION,
  consumePlaceGallerySectionAfterReview,
  parsePlaceGallerySectionFromLocation,
  peekPlaceGallerySectionAfterReview,
  scrollPlaceGallerySectionIntoView,
} from '../../../utils/placeGallerySectionFocus.js';
import { buildPlaceReviewsHref } from '../../../utils/placeReviewFocus.js';
import { getPlaceStableKey } from '../../../utils/travelSpotResolve.js';
import { useVisitStories } from '../hooks/useVisitStories';

function usePlaceGallerySectionOpen(sectionId, placeKey) {
  const routeLocation = useLocation();
  const [open, setOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  useEffect(() => {
    autoOpenedRef.current = false;
  }, [placeKey]);

  useEffect(() => {
    const key = String(placeKey || '').trim();
    if (!key) return;
    const locationLike = {
      hash: routeLocation.hash,
      search: routeLocation.search,
    };
    const fromUrl = parsePlaceGallerySectionFromLocation(locationLike);
    const fromReview = peekPlaceGallerySectionAfterReview(key);
    const target = fromUrl ?? fromReview;
    if (target !== sectionId) return;
    setOpen(true);
    if (!fromUrl && fromReview === sectionId) {
      consumePlaceGallerySectionAfterReview(key);
    }
    if (!autoOpenedRef.current) {
      autoOpenedRef.current = true;
      requestAnimationFrame(() => scrollPlaceGallerySectionIntoView(sectionId));
    }
  }, [
    placeKey,
    sectionId,
    routeLocation.pathname,
    routeLocation.hash,
    routeLocation.search,
  ]);

  return [open, setOpen];
}

function slotHeading(slot, t) {
  return t(`place.facts.slots.${slot.id}`, { defaultValue: slot.label });
}

function unverifiedLine(slots, t) {
  const labels = (Array.isArray(slots) ? slots : [])
    .filter(slotLooksEmpty)
    .map((slot) => slotHeading(slot, t))
    .filter(Boolean);
  if (!labels.length) return '';
  return t('place.facts.unverified', { items: labels.join(', ') });
}

function sourceLabelClass(text) {
  const value = String(text || '').trim();
  if (!/\s/.test(value) && (value.includes('.') || /^https?:/i.test(value))) {
    return 'break-keep [overflow-wrap:anywhere]';
  }
  return 'break-keep [overflow-wrap:normal]';
}

function sourceHref(source) {
  const url = String(source?.url || '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

function SourceLine({ sources, locale, light }) {
  return (
    <span data-fact-source="">
      {sources.map((source, index) => {
        const name = sourceNameForLocale(publicSourceName(source.name || source.url), locale);
        const href = sourceHref(source);
        const wrap = sourceLabelClass(name);
        const linkClass = light
          ? 'underline decoration-gray-400 underline-offset-2 hover:decoration-gray-700'
          : 'underline decoration-white/30 underline-offset-2 hover:decoration-white';
        const node = href ? (
          <a
            key={`${href}-${index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} ${wrap}`}
            onClick={(event) => event.stopPropagation()}
          >
            {name}
          </a>
        ) : (
          <span key={`${name}-${index}`} className={wrap}>{name}</span>
        );
        return (
          <React.Fragment key={`${name}-${index}`}>
            {index > 0 ? ' · ' : null}
            {node}
          </React.Fragment>
        );
      })}
    </span>
  );
}

function FactRuns({ text }) {
  return splitFactTimeRanges(text).map((part, index) => (
    part.type === 'time' ? (
      <span key={`time-${index}`} className={TIME_RANGE_CLASS}>{part.text}</span>
    ) : (
      <React.Fragment key={`text-${index}`}>{part.text}</React.Fragment>
    )
  ));
}

function FactValue({ slot, slug, locale, light }) {
  const text = presentFactText(factValueForLocale(slug, slot, locale));
  if ((slot.linkRole === 'booking' || slot.linkRole === 'map') && /^https?:\/\//.test(slot.value)) {
    const label = linkLabelForLocale(
      slot.linkLabel || (slot.linkRole === 'booking' ? '공식 예매' : 'Google 지도'),
      locale,
    );
    return (
      <p data-fact-value="" className="text-sm">
        <a
          href={slot.value}
          target="_blank"
          rel="noopener noreferrer"
          data-official-link={slot.linkRole}
          onClick={(event) => event.stopPropagation()}
          className={`${sourceLabelClass(label)} ${light
            ? 'font-semibold text-sky-800 underline underline-offset-2'
            : 'font-semibold text-sky-200 underline underline-offset-2'}`}
        >
          {label}
        </a>
      </p>
    );
  }
  const valueClass = light
    ? 'text-sm leading-relaxed text-[#111827] break-keep whitespace-pre-line'
    : 'text-sm leading-relaxed text-[#e5e7eb] break-keep whitespace-pre-line';
  if (slot.id === 'itinerary') {
    const linkClass = light
      ? 'font-semibold text-sky-800 underline underline-offset-2'
      : 'font-semibold text-sky-200 underline underline-offset-2';
    return (
      <p data-fact-value="" className={valueClass}>
        {splitItineraryPlaceMentions(text).map((part, index) => (
          part.type === 'link' ? (
            <Link
              key={`${part.href}-${index}`}
              to={part.href}
              data-itinerary-place={part.href}
              className={linkClass}
              onClick={(event) => event.stopPropagation()}
            >
              {part.text}
            </Link>
          ) : (
            <FactRuns key={`t-${index}`} text={part.text} />
          )
        ))}
      </p>
    );
  }
  return (
    <p data-fact-value="" className={valueClass}>
      <FactRuns text={text} />
    </p>
  );
}

function FactMeta({ slot, locale, light }) {
  const { t } = useTranslation();
  const date = checkedAtForLocale(slot.checkedAt, locale);
  return (
    <p
      data-fact-checked-at=""
      className={light
        ? 'mt-1.5 text-[11px] leading-snug text-[#4b5563] break-keep'
        : 'mt-1.5 text-[11px] leading-snug text-[#9ca3af] break-keep'}
    >
      {t('place.facts.source')} <SourceLine sources={slot.sources} locale={locale} light={light} />
      {' · '}
      {t('place.facts.checked', { date })}
    </p>
  );
}

function shellClass(light) {
  return light
    ? 'rounded-2xl border border-[#d1d5db] bg-white'
    : 'rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md';
}

function galleryFactsSectionClass() {
  return 'mb-5';
}

const sectionToggleBtnClass = (light) => (light
  ? 'flex w-full min-h-11 items-start gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600'
  : 'flex w-full min-h-11 items-start gap-2.5 rounded-lg px-1 py-2 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/60');

function PlaceSectionToggleHeader({
  title,
  count,
  open,
  controls,
  onClick,
  light,
  icon: Icon = Compass,
}) {
  const { t } = useTranslation();
  const toggleLabel = open ? t('place.facts.collapse') : t('place.facts.expand');
  return (
    <button
      type="button"
      className={sectionToggleBtnClass(light)}
      aria-expanded={open}
      aria-controls={controls}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon
        size={18}
        className={`mt-0.5 shrink-0 ${light ? 'text-amber-700' : 'text-amber-200'}`}
        aria-hidden
      />
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={`text-base font-bold tracking-tight ${light ? 'text-[#111827]' : 'text-white'}`}>
            {title}
          </span>
          {count ? (
            <span className={`text-xs font-semibold ${light ? 'text-[#4b5563]' : 'text-white/45'}`}>
              {count}
            </span>
          ) : null}
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold leading-none ${light
            ? 'border border-amber-600/35 bg-amber-100 text-amber-950'
            : 'border border-amber-300/45 bg-amber-500/25 text-amber-50'}`}
          data-section-toggle-label=""
        >
          <span>{toggleLabel}</span>
          <ChevronDown
            size={16}
            className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </span>
      </span>
    </button>
  );
}

function DisclosureHeader({
  title,
  count,
  open,
  controls,
  onClick,
  light,
  icon: Icon = Compass,
}) {
  return (
    <PlaceSectionToggleHeader
      title={title}
      count={count}
      open={open}
      controls={controls}
      onClick={onClick}
      light={light}
      icon={Icon}
    />
  );
}

function FactTopicRow({ slot, slug, locale, light }) {
  const { t } = useTranslation();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const label = slotHeading(slot, t);
  return (
    <div
      data-fact-slot={slot.id}
      data-local-info-row={slot.id}
      data-local-info-open={open ? 'true' : 'false'}
      className={open
        ? (light
          ? 'rounded-xl border border-[#b45309] bg-white'
          : 'rounded-xl border border-amber-300/50 bg-white/[0.04]')
        : (light
          ? 'rounded-xl border border-[#d1d5db] bg-white'
          : 'rounded-xl border border-white/10 bg-white/[0.04]')}
    >
      <button
        type="button"
        className={`flex w-full min-h-11 items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors ${light
          ? 'hover:bg-gray-50 active:bg-gray-100'
          : 'hover:bg-white/[0.06] active:bg-white/[0.1]'}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <span className={`min-w-0 text-[15px] font-semibold ${open
          ? (light ? 'text-[#92400e]' : 'text-amber-200')
          : (light ? 'text-[#111827]' : 'text-[#f3f4f6]')}`}
        >
          {label}
        </span>
        <span
          className={`shrink-0 text-lg leading-none ${light ? 'text-[#6b7280]' : 'text-white/45'}`}
          aria-hidden
        >
          ›
        </span>
      </button>
      {open ? (
        <div id={panelId} className="px-3.5 pb-3.5">
          <FactValue slot={slot} slug={slug} locale={locale} light={light} />
          <FactMeta slot={slot} locale={locale} light={light} />
        </div>
      ) : null}
    </div>
  );
}

export default function PlaceVerifiedFacts({ location, className = '' }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const panelId = useId();
  const placeKey = getPlaceStableKey(location) || location?.slug || location?.id || '';
  const [open, setOpen] = usePlaceGallerySectionOpen(PLACE_GALLERY_SECTION.FACTS, placeKey);
  const card = resolveVerifiedFacts(location);
  if (!card) return null;
  const filled = verifiedFactSlots(card);
  if (!filled.length) return null;
  const unverified = unverifiedLine(card.slots, t);

  return (
    <section
      id={PLACE_GALLERY_SECTION.FACTS}
      data-verified-facts={card.slug}
      data-verified-kind={card.kind}
      data-local-info="gallery"
      data-unverified-items={unverified || undefined}
      aria-label={t('place.facts.localTitle')}
      className={`scroll-mt-6 ${galleryFactsSectionClass()} ${className}`.trim()}
    >
      <PlaceSectionToggleHeader
        title={t('place.facts.localTitle')}
        count={t('place.facts.topicCount', { count: filled.length })}
        open={open}
        controls={panelId}
        onClick={() => setOpen((value) => !value)}
        light={false}
      />
      {open ? (
        <div id={panelId} className="mt-2 space-y-2.5 px-0.5 pb-1">
          {filled.map((slot) => (
            <FactTopicRow
              key={slot.id}
              slot={slot}
              slug={card.slug}
              locale={locale}
              light={false}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function PlaceLocalInfoInline({
  location,
  slotId = '',
  toolkitType = '',
  presentation = 'sketch',
  defaultOpen = false,
  className = '',
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const panelId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const card = resolveVerifiedFacts(location);
  if (!card) return null;
  const light = presentation === 'planner';
  const slot = presentation === 'planner'
    ? plannerSlotForToolkit(card, toolkitType)
    : verifiedFactSlots(card).find((item) => item.id === slotId);
  if (!slot) return null;
  const heading = slotHeading(slot, t);
  const confirmedKey = {
    entry: 'place.facts.confirmed.entry',
    airport: 'place.facts.confirmed.airport',
    'money-safety': 'place.facts.confirmed.moneySafety',
    'stay-area': 'place.facts.confirmed.stayArea',
  }[slot.id];
  const title = presentation === 'planner'
    ? t(confirmedKey || 'place.facts.inlineTitle', { label: heading, defaultValue: heading })
    : t('place.facts.inlineTitle', { label: heading });

  return (
    <section
      data-local-info={presentation}
      data-fact-slot={slot.id}
      data-local-info-open={open ? 'true' : 'false'}
      aria-label={title}
      className={`${shellClass(light)} overflow-hidden ${className}`.trim()}
    >
      <DisclosureHeader
        title={title}
        open={open}
        controls={panelId}
        onClick={() => setOpen((value) => !value)}
        light={light}
      />
      {open ? (
        <div id={panelId} className={light ? 'px-4 pb-4 text-[#111827]' : 'px-4 pb-4'}>
          <FactValue slot={slot} slug={card.slug} locale={locale} light={light} />
          <FactMeta slot={slot} locale={locale} light={light} />
        </div>
      ) : null}
    </section>
  );
}

export function PlaceVisitStories({ location, className = '' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const panelId = useId();
  const placeKey = getPlaceStableKey(location) || location?.slug || location?.id || '';
  const [open, setOpen] = usePlaceGallerySectionOpen(PLACE_GALLERY_SECTION.STORIES, placeKey);
  const card = resolveVerifiedFacts(location);
  const { stories, isLoading } = useVisitStories(location);
  if (!card || isLoading || !stories.length) return null;
  const placePath = buildPlacePath(location?.slug || location?.id);

  return (
    <section
      id={PLACE_GALLERY_SECTION.STORIES}
      data-visit-stories=""
      data-local-info="stories"
      aria-label={t('place.facts.storiesTitle')}
      className={`scroll-mt-6 ${galleryFactsSectionClass()} ${className}`.trim()}
    >
      <PlaceSectionToggleHeader
        title={t('place.facts.storiesTitle')}
        count={t('place.facts.storyCount', { count: stories.length })}
        open={open}
        controls={panelId}
        onClick={() => setOpen((value) => !value)}
        light={false}
        icon={PenLine}
      />
      {open ? (
        <div id={panelId} className="mt-2 space-y-2 px-0.5 pb-1">
          {stories.map((story) => {
            const kindLabel = story.kind === 'review'
              ? t('place.facts.reviewLink')
              : t('place.facts.logbookLink');
            const rowClass = 'flex w-full min-h-11 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.07] active:bg-white/[0.1]';
            const body = (
              <>
                <span data-visit-story-title="" className="min-w-0 flex-1 truncate text-sm font-medium text-white">
                  {story.title}
                </span>
                <span className="shrink-0 text-[11px] font-medium text-white/50">
                  {kindLabel} ›
                </span>
              </>
            );
            if (story.kind === 'logbook' && story.href) {
              return (
                <Link
                  key={`${story.kind}-${story.id}`}
                  to={story.href}
                  data-visit-story-kind="logbook"
                  className={rowClass}
                  onClick={(event) => event.stopPropagation()}
                >
                  {body}
                </Link>
              );
            }
            return (
              <button
                key={`${story.kind}-${story.id}`}
                type="button"
                data-visit-story-kind="review"
                className={rowClass}
                onClick={(event) => {
                  event.stopPropagation();
                  if (placePath) navigate(buildPlaceReviewsHref(placePath, story.id));
                }}
              >
                {body}
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function AiGeneratedBanner({ generatedAt, light = false }) {
  const { t } = useTranslation();
  const date = String(generatedAt || '').trim();
  const label = date
    ? t('place.facts.aiGeneratedDated', { date })
    : t('place.facts.aiGenerated');
  return (
    <p
      data-ai-generated-label=""
      className={light
        ? 'mb-3 text-[11px] font-bold tracking-wide text-amber-800'
        : 'mb-3 text-[11px] font-bold tracking-wide text-amber-200/90'}
    >
      {label}
    </p>
  );
}

export { AI_GENERATED_LABEL };
