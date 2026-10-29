import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import {
  REELS_BENCH_INDICES,
  getVerifiedReelByteSize,
  reelOriginalMp4Url,
  reelPosterUrl,
  reelWebMp4Url,
} from './reelsBenchUrls';
import { useAppAdminGate } from './useAppAdminGate';

/** @typedef {'web' | 'original'} ReelSourceKind */

function formatBytes(length) {
  if (length == null || !Number.isFinite(length) || length < 0) return null;
  if (length < 1024) return `${length} B`;
  if (length < 1024 * 1024) return `${(length / 1024).toFixed(1)} KB`;
  return `${(length / (1024 * 1024)).toFixed(2)} MB`;
}

function resolveActiveKind(globalUseWeb, perIndexOverride) {
  if (perIndexOverride === 'web') return 'web';
  if (perIndexOverride === 'original') return 'original';
  return globalUseWeb ? 'web' : 'original';
}

function ReelsBenchGateShell({ phase }) {
  const location = useLocation();

  if (phase === 'check' || phase === 'no-admin') {
    return <main className="min-h-screen bg-[#0a0a0a]" aria-hidden="true" />;
  }

  if (phase === 'no-session') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center text-white">
        <p className="text-base font-medium">관리자 로그인이 필요합니다.</p>
        <p className="mt-2 text-sm text-white/60">이 페이지는 GATEO 관리자 전용입니다.</p>
        <Link
          to="/auth/login"
          state={{ from: location.pathname }}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-semibold text-black"
        >
          로그인
        </Link>
      </main>
    );
  }

  return null;
}

function ReelBenchCard({
  index,
  globalUseWeb,
  perOverride,
  onPerOverride,
}) {
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const [inView, setInView] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState('');
  const [playError, setPlayError] = useState(false);

  const activeKind = resolveActiveKind(globalUseWeb, perOverride);
  const targetSrc = activeKind === 'web' ? reelWebMp4Url(index) : reelOriginalMp4Url(index);
  const sourceLabel = activeKind === 'web' ? '웹 버전' : '원본';
  const verifiedBytes = getVerifiedReelByteSize(index, activeKind);
  const sizeLabel = formatBytes(verifiedBytes) ?? '크기 알 수 없음';

  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        setInView(hit);
      },
      { rootMargin: '120px 0px', threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    setPlayError(false);
    setLoadedSrc(targetSrc);
  }, [inView, targetSrc]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !loadedSrc) return;
    el.load();
  }, [loadedSrc]);

  const cycleOverride = () => {
    if (perOverride == null) onPerOverride('web');
    else if (perOverride === 'web') onPerOverride('original');
    else onPerOverride(null);
  };

  const overrideHint =
    perOverride == null ? '전역 따름' : perOverride === 'web' ? '웹 고정' : '원본 고정';

  return (
    <article
      ref={wrapRef}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 lg:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">릴스 #{String(index).padStart(2, '0')}</h2>
          <p className="mt-1 text-xs text-white/55">
            활성: <span className="text-white/85">{sourceLabel}</span>
            {' · '}
            {sizeLabel}
            <span className="text-white/40"> (CDN 검증)</span>
          </p>
        </div>
        <button
          type="button"
          onClick={cycleOverride}
          className="shrink-0 rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-white/90"
        >
          개별: {overrideHint}
        </button>
      </div>
      <div className="mx-auto w-full max-w-[min(100%,280px)] overflow-hidden rounded-xl bg-black lg:max-w-[320px]">
        <div className="relative aspect-[9/16] w-full">
          <video
            ref={videoRef}
            className="h-full w-full object-contain"
            controls
            playsInline
            preload="none"
            poster={reelPosterUrl(index)}
            src={loadedSrc || undefined}
            onError={() => setPlayError(true)}
            onLoadedData={() => setPlayError(false)}
          />
          {playError && loadedSrc ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-4 text-center text-sm text-white/90">
              <p className="font-medium">재생할 수 없습니다</p>
              <p className="mt-1 text-xs text-white/60">
                {activeKind === 'web'
                  ? '웹 버전 파일이 아직 준비되지 않았을 수 있습니다.'
                  : '원본 파일을 불러오지 못했습니다.'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ReelsBenchContent() {
  const [globalUseWeb, setGlobalUseWeb] = useState(false);
  const [perOverride, setPerOverride] = useState(() => ({}));

  const setOverrideFor = useCallback((index, value) => {
    setPerOverride((prev) => ({ ...prev, [index]: value }));
  }, []);

  const globalLabel = globalUseWeb ? '웹 버전 (전역)' : '원본 (전역)';

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white lg:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-[390px] lg:max-w-[1280px]">
        <header className="mb-6 lg:mb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">Admin</p>
          <h1 className="mt-1 text-xl font-semibold lg:text-2xl">릴스 테스트 벤치</h1>
          <p className="mt-2 text-sm text-white/60">
            2026-10 세트 · 뷰포트 진입 시에만 MP4를 로드합니다. 검색·사이트맵에 노출되지 않습니다.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-white/70">전역 소스: {globalLabel}</span>
            <button
              type="button"
              onClick={() => setGlobalUseWeb((v) => !v)}
              className="h-10 rounded-full bg-white px-5 text-sm font-semibold text-black"
            >
              {globalUseWeb ? '전역 → 원본' : '전역 → 웹'}
            </button>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {REELS_BENCH_INDICES.map((index) => (
            <ReelBenchCard
              key={index}
              index={index}
              globalUseWeb={globalUseWeb}
              perOverride={perOverride[index] ?? null}
              onPerOverride={(value) => setOverrideFor(index, value)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ReelsBenchPage() {
  const phase = useAppAdminGate('gallery');

  const helmet = useMemo(
    () => (
      <Helmet>
        <title>릴스 테스트 벤치 · GATEO Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    ),
    [],
  );

  if (phase !== 'yes') {
    return (
      <>
        {helmet}
        <ReelsBenchGateShell phase={phase} />
      </>
    );
  }

  return (
    <>
      {helmet}
      <ReelsBenchContent />
    </>
  );
}
