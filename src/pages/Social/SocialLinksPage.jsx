import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useLocation } from 'react-router-dom';
import Logo from '../Home/components/Logo';
import { withGateoTrafficType } from '../../shared/analytics/gateoGaQa.js';
import { trackEvent } from '../../shared/analytics/trackEvent.js';
import { isGateoSocialLinksEnabled } from '../../shared/gateoFeatureFlags.js';
import generated from './data/socialLinks.generated.json';
import {
  formatSocialPostedDate,
  formatSocialStartBadge,
  socialCardEventParams,
  socialCardState,
  socialSecondaryEventParams,
  socialTargetHref,
  visibleSocialCards,
} from './socialLinksView.js';

const VIEW_PREFIX = 'gateo_social_card_view:';

function seenViews() {
  if (typeof window === 'undefined') return new Set();
  if (!window.__GATEO_SOCIAL_CARD_VIEWS__) window.__GATEO_SOCIAL_CARD_VIEWS__ = new Set();
  return window.__GATEO_SOCIAL_CARD_VIEWS__;
}

function trackSocial(name, params) {
  trackEvent(name, withGateoTrafficType(params));
}

function markCardViewed(campaignId) {
  const id = String(campaignId || '');
  if (!id) return false;
  const seen = seenViews();
  if (seen.has(id)) return false;
  const key = `${VIEW_PREFIX}${id}`;
  try {
    if (window.sessionStorage?.getItem(key) === '1') {
      seen.add(id);
      return false;
    }
    window.sessionStorage?.setItem(key, '1');
  } catch {
    /* private mode */
  }
  seen.add(id);
  return true;
}

function SocialPhoto({ url, region, credit, className }) {
  const label = credit?.label || '';
  return (
    <div className={`relative overflow-hidden bg-[#2c261f] ${className}`}>
      {url ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : region ? (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-white/80 break-keep">
          {region}
        </div>
      ) : null}
      {label ? (
        <span className="pointer-events-none absolute bottom-1 left-1 max-w-[calc(100%-8px)] truncate text-[10px] leading-none text-white/80">
          {label}
        </span>
      ) : null}
    </div>
  );
}

function SocialCardLink({ card, index, now, hero, children }) {
  const href = socialTargetHref(card.targets[0]);
  const params = socialCardEventParams(card, index, now, 'primary');
  const ref = React.useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some(
          (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5,
        );
        if (!visible) return;
        if (!markCardViewed(card.campaignId)) return;
        trackSocial('social_card_view', socialCardEventParams(card, index, now));
        observer.disconnect();
      },
      { threshold: [0.5] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [card, index, now]);

  return (
    <div
      ref={ref}
      className={`${hero ? '' : 'min-h-[88px] rounded-2xl bg-white/[0.04]'} ${
        params.placement === 'ended_card' ? 'opacity-60' : ''
      }`}
    >
      <Link
        to={href}
        data-testid={hero ? 'social-hero' : 'social-card'}
        data-campaign={card.campaignId}
        data-placement={params.placement}
        onClick={() => trackSocial('social_card_click', params)}
        className={`block text-inherit no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
          hero ? '' : 'min-h-[88px]'
        }`}
      >
        {children}
      </Link>
    </div>
  );
}

function DateLine({ card, now, hero }) {
  const state = socialCardState(card, now);
  const posted = formatSocialPostedDate(card.firstPostedAt);
  const startBadge = state === 'upcoming' ? formatSocialStartBadge(card.targets[0]) : '';
  return (
    <p className={`break-keep text-white/65 ${hero ? 'text-[13px]' : 'text-[11px]'}`}>
      {hero ? `가장 최근 · 릴스 · ${posted}` : `릴스 · ${posted}`}
      {startBadge ? <span className="ml-2 font-semibold text-white/85">{startBadge}</span> : null}
      {state === 'ended' ? <span className="ml-2 font-semibold text-white/85">종료</span> : null}
    </p>
  );
}

function TogetherLine({ card, index, now }) {
  const extras = (card.targets || []).slice(1).filter((target) => target?.name);
  if (!extras.length) return null;
  return (
    <p className="mt-2 break-keep text-[13px] leading-relaxed text-white/75">
      같이 나온 곳:{' '}
      {extras.map((target, extraIndex) => (
        <React.Fragment key={`${target.slug || target.id}`}>
          {extraIndex > 0 ? ' · ' : null}
          <Link
            to={socialTargetHref(target)}
            className="underline decoration-white/40 underline-offset-2"
            onClick={() =>
              trackSocial('social_card_click', socialSecondaryEventParams(card, index, target, now))
            }
          >
            {target.name}
          </Link>
        </React.Fragment>
      ))}
    </p>
  );
}

function HeroCard({ card, index, now }) {
  const placeLabel = card.targets[0]?.type === 'festival' ? '이 축제 보기' : '이 여행지 보기';
  return (
    <div>
      <SocialCardLink card={card} index={index} now={now} hero>
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-8">
          <SocialPhoto
            url={card.photoUrl}
            region={card.region}
            credit={card.photoCredit}
            className="aspect-[16/10] w-full rounded-2xl"
          />
          <div className="pt-3 lg:pt-0">
            <DateLine card={card} now={now} hero />
            <h2 className="mt-2 break-keep text-[26px] font-bold leading-snug tracking-tight lg:text-[32px]">
              {card.title}
            </h2>
            {card.region ? (
              <p data-testid="social-region" className="mt-1 break-keep text-sm text-white/70">
                {card.region}
              </p>
            ) : null}
            <span className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-white text-[15px] font-semibold text-black">
              {placeLabel}
            </span>
          </div>
        </div>
      </SocialCardLink>
      <TogetherLine card={card} index={index} now={now} />
    </div>
  );
}

function ListCard({ card, index, now }) {
  return (
    <div>
      <SocialCardLink card={card} index={index} now={now}>
        <div className="flex min-h-[88px] items-stretch gap-3">
          <SocialPhoto
            url={card.photoUrl}
            region={card.region}
            credit={card.photoCredit}
            className="w-[104px] shrink-0 self-stretch"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-3">
            <DateLine card={card} now={now} />
            <h3 className="mt-0.5 break-keep text-[15px] font-semibold leading-snug">{card.title}</h3>
            {card.region ? (
              <p data-testid="social-region" className="break-keep text-xs text-white/60">
                {card.region}
              </p>
            ) : null}
            <span className="mt-1 text-sm text-white/80">보기 ›</span>
          </div>
        </div>
      </SocialCardLink>
      <TogetherLine card={card} index={index} now={now} />
    </div>
  );
}

function EmptyState() {
  return (
    <div data-testid="social-empty" className="py-16 text-center">
      <p className="break-keep text-base text-white/85">곧 소개할 여행지를 준비하고 있어요</p>
      <p className="mt-4 text-sm">
        <Link to="/korea" className="underline decoration-white/40 underline-offset-4">
          축제 보기
        </Link>
        <span aria-hidden="true"> · </span>
        <Link to="/explore" className="underline decoration-white/40 underline-offset-4">
          여행지 찾기
        </Link>
      </p>
    </div>
  );
}

export default function SocialLinksPage({ cards, now }) {
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const clock = useMemo(() => (now instanceof Date ? now : new Date()), [now]);
  const source = Array.isArray(cards) ? cards : generated.cards || [];
  const view = useMemo(
    () => visibleSocialCards(source, expanded, clock),
    [source, expanded, clock],
  );

  if (!isGateoSocialLinksEnabled(location.search)) {
    return <Navigate to="/" replace />;
  }

  const visible = view.visible;
  const hero = visible[0] && socialCardState(visible[0], clock) !== 'ended' ? visible[0] : null;
  const rest = hero ? visible.slice(1) : visible;
  const past = rest.filter((card) => socialCardState(card, clock) !== 'ended');
  const ended = rest.filter((card) => socialCardState(card, clock) === 'ended');
  const indexOf = (card) => visible.findIndex((item) => item.campaignId === card.campaignId);

  return (
    <div className="min-h-screen overflow-y-auto bg-black text-white">
      <Helmet>
        <title>릴스·게시물에 나온 곳 | GATEO</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto w-full max-w-[980px] px-4 py-6 lg:px-6 lg:py-10">
        <header className="mb-6">
          <Link to="/" aria-label="GATEO" className="inline-block">
            <Logo size="header" />
          </Link>
          <h1 className="mt-4 break-keep text-[22px] font-bold tracking-tight lg:text-[28px]">
            릴스·게시물에 나온 곳
          </h1>
          <p className="mt-1 break-keep text-sm text-white/70">
            인스타그램·페이스북 게시물에 나온 곳이에요.
          </p>
        </header>

        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-6">
            {hero ? <HeroCard card={hero} index={indexOf(hero)} now={clock} /> : null}
            {past.length ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-white/80">지난 게시물</h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {past.map((card) => (
                    <ListCard key={card.campaignId} card={card} index={indexOf(card)} now={clock} />
                  ))}
                </div>
              </section>
            ) : null}
            {ended.length ? (
              <section data-testid="social-ended">
                <h2 className="mb-3 text-sm font-semibold text-white/80">지난 축제</h2>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {ended.map((card) => (
                    <ListCard key={card.campaignId} card={card} index={indexOf(card)} now={clock} />
                  ))}
                </div>
              </section>
            ) : null}
            {view.canMore ? (
              <button
                type="button"
                data-testid="social-more"
                className="self-start text-sm text-white underline decoration-white/40 underline-offset-4"
                onClick={() => {
                  trackSocial('social_more_click', {
                    surface: 'social_links',
                    placement: 'more_text',
                  });
                  setExpanded(true);
                }}
              >
                더 오래된 게시물 보기
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
