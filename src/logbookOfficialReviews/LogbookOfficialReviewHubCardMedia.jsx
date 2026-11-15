import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { logbookReviewPersonaFallbackGradient } from './logbookReviewPersonaFallback.js';

function HubReviewCardFallback({ cityLabel, personaLabel, preparingLabel, testId }) {
  const gradient = logbookReviewPersonaFallbackGradient(personaLabel);
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradient} text-white`}
      data-testid={testId || 'logbook-official-review-hub-card-fallback'}
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

export function LogbookOfficialReviewHubCardMedia({
  thumb,
  alt,
  cityLabel,
  personaLabel,
  preparingLabel,
  preferEager,
  photoTestId = 'logbook-official-review-hub-card-photo',
  fallbackTestId,
}) {
  const thumbSrc = thumb?.src;
  const [loadState, setLoadState] = useState(() => (thumbSrc ? 'pending' : 'fail'));
  const [inView, setInView] = useState(() => Boolean(preferEager));
  const mediaRef = useRef(null);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !thumbSrc || preferEager) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { rootMargin: '120px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [thumbSrc, preferEager]);

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
        testId={fallbackTestId}
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
        data-testid={loadState === 'ok' ? photoTestId : undefined}
        onLoad={() => setLoadState('ok')}
        {...imgCommon}
      />
    </div>
  );
}