import React, { useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Landmark, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { resolveScenicSpotForPlace } from '../../../pages/Home/lib/placeScenicGateway';

/**
 * 장소카드 갤러리(기본 홈)에서 한국 테마 명승/명소 본문 상세 페이지로 자연스럽게 연결하는 게이트웨이 카드.
 *
 * @param {{
 *   location?: object | null,
 *   variant?: 'dark' | 'summary',
 *   className?: string
 * }} props
 */
export default function PlaceScenicGateway({
  location = null,
  variant = 'dark',
  className = '',
}) {
  const { t } = useTranslation();
  const routeLocation = useLocation();

  const returnPath = useMemo(() => {
    if (routeLocation?.pathname?.startsWith('/place/')) {
      return routeLocation.pathname + (routeLocation.search || '');
    }
    const placeSlug =
      location?.slug || location?.placeSlug || location?.canonical_slug;
    if (placeSlug) {
      return `/place/${placeSlug}/gallery`;
    }
    return null;
  }, [
    routeLocation?.pathname,
    routeLocation?.search,
    location?.slug,
    location?.placeSlug,
    location?.canonical_slug,
  ]);

  const scenicInfo = useMemo(() => {
    return resolveScenicSpotForPlace(location, { returnTo: returnPath });
  }, [location, returnPath]);

  const handleClick = useCallback(() => {
    if (!returnPath) return;
    try {
      sessionStorage.setItem('gateo:scenic-gateway-return-to', returnPath);
    } catch {
      /* private mode */
    }
  }, [returnPath]);

  if (!scenicInfo) return null;

  const isSummary = variant === 'summary';

  const shellClass = isSummary
    ? 'rounded-xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 p-3 backdrop-blur-md transition-all duration-300 hover:border-amber-400/40 hover:from-amber-500/15'
    : 'rounded-2xl border border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-black/45 to-black/70 p-4 backdrop-blur-md shadow-lg shadow-black/20 transition-all duration-300 hover:border-amber-400/45 hover:from-amber-500/15';

  const badgeText =
    scenicInfo.type === 'heritage'
      ? t('place.scenicGateway.badgeHeritage', '국가지정 명승')
      : scenicInfo.type === 'hub'
      ? t('place.scenicGateway.badgeHub', '지역 명소 컬렉션')
      : t('place.scenicGateway.badgeTheme', '한국의 명승 · 테마 명소');

  const actionText =
    scenicInfo.type === 'hub'
      ? t('place.scenicGateway.actionHub', '명소 목록 보기')
      : t('place.scenicGateway.actionSpot', '명소 본문 보기');

  return (
    <div className={`animate-fade-in ${className}`.trim()}>
      <Link
        to={scenicInfo.deepPath}
        state={returnPath ? { returnTo: returnPath } : undefined}
        onClick={handleClick}
        className={`group block w-full text-left ${shellClass}`}
        aria-label={`${scenicInfo.name} ${actionText}`}
      >
        {/* 상단 뱃지 및 액션 안내 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Landmark size={12} className="shrink-0 text-amber-300" aria-hidden />
            <span>{badgeText}</span>
          </div>

          <div className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-200/90 transition-transform duration-200 group-hover:text-amber-100 group-hover:translate-x-0.5">
            <span>{actionText}</span>
            <ChevronRight size={14} className="shrink-0 text-amber-300/80 group-hover:text-amber-200" aria-hidden />
          </div>
        </div>

        {/* 메인 명소명 & 한 줄 소개 */}
        <div className="space-y-1">
          <h4 className="flex items-center gap-1.5 text-[14px] font-bold text-white group-hover:text-amber-100 transition-colors">
            <Sparkles size={13} className="shrink-0 text-amber-400/90" aria-hidden />
            <span className="truncate">
              「{scenicInfo.name}」 {t('place.scenicGateway.titleSuffix', '상세 해설 & 스토리')}
            </span>
          </h4>

          {scenicInfo.blurb && (
            <p className="line-clamp-2 text-[12px] leading-relaxed text-gray-300/90">
              {scenicInfo.blurb}
            </p>
          )}
        </div>

        {/* 하단 안내 태그들 */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
          <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300/80">
            <Compass size={10} className="text-amber-300/70" aria-hidden />
            {t('place.scenicGateway.tagStory', '개요 & 사진')}
          </span>
          <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-300/80">
            {t('place.scenicGateway.tagSurroundings', '주변 맛집·숙소')}
          </span>
          {scenicInfo.region && (
            <span className="inline-flex items-center rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200/80">
              {scenicInfo.region}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
