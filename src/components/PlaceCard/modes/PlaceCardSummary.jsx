import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Maximize2 } from 'lucide-react';
import BookmarkButton from '../common/BookmarkButton';
import { getPlaceTitleLines } from '../common/locationDisplay';

const PlaceCardSummary = ({ location, isBookmarked, onClose, onExpand, onChat, onToggleBookmark }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [glowPhase, setGlowPhase] = useState('enter');
  const isScanning = location?.isScanning;
  const isEnterGlow = glowPhase === 'enter';
  const { primaryName, secondaryName } = getPlaceTitleLines(location);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    queueMicrotask(() => {
      setIsLoading(true);
      setGlowPhase(prefersReducedMotion ? 'idle' : 'enter');
    });

    const loadTimer = setTimeout(() => setIsLoading(false), 500);
    const glowTimer = prefersReducedMotion
      ? null
      : setTimeout(() => setGlowPhase('idle'), 3800);

    return () => {
      clearTimeout(loadTimer);
      if (glowTimer) clearTimeout(glowTimer);
    };
  }, [location?.id, location?.name, location?.lat, location?.lng]);

  return (
    <div className="absolute bottom-[calc(6.75rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-[360px] lg:bottom-6 lg:translate-x-0 lg:left-auto lg:right-8 lg:w-80 z-[60] animate-fade-in-up transition-all duration-300">
      <div className={`relative ${isEnterGlow ? 'place-summary-shell-enter' : ''}`}>
        {isEnterGlow && (
          <>
            <div className="place-summary-halo" aria-hidden="true" />
            <div className="place-summary-orbit-ring" aria-hidden="true" />
            {!isScanning && (
              <div className="place-summary-open-hint absolute -top-9 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap lg:hidden">
                클릭하여 탐색 시작
              </div>
            )}
          </>
        )}

        <div
          className={`place-summary-card relative z-[1] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4 group ${
            isEnterGlow ? 'place-summary-card-enter' : glowPhase === 'idle' ? 'place-summary-card-idle' : ''
          }`}
        >
          <div
            className="place-summary-top-shine absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all duration-500 cursor-pointer"
            onClick={!isScanning ? onExpand : undefined}
          />

          <div className="flex items-start justify-between mb-3">
            <div className={`flex flex-col ${!isScanning ? 'cursor-pointer' : ''}`} onClick={!isScanning ? onExpand : undefined}>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={12} className={isScanning ? 'text-blue-400 animate-pulse' : 'text-yellow-400'} />
                <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                  {isScanning ? 'SEARCHING...' : (location?.country || 'Global')}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-left min-w-0 truncate text-2xl font-bold leading-none tracking-tight transition-colors ${isScanning ? 'text-blue-300 animate-pulse' : 'text-white group-hover:text-blue-100'}`}
                >
                  {primaryName || location?.name}
                </span>
                {!isScanning && <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors shrink-0" />}
              </div>
              {!isScanning && secondaryName && (
                <span className="mt-1 w-fit text-left text-xs leading-none text-gray-200/90 font-semibold tracking-normal">
                  ({secondaryName})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 -mr-2 -mt-2 z-10">
              {!isScanning && <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className={`${!isScanning ? 'cursor-pointer mb-6' : ''}`}
            onClick={!isScanning ? onExpand : undefined}
          >
            {isLoading || isScanning ? (
              <div className="w-full animate-pulse space-y-3 mt-1 px-1">
                <div className="h-4 bg-white/10 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.07] rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-xs text-gray-200 leading-relaxed line-clamp-3">
                  {location?.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.
                </p>
              </div>
            )}
          </div>

          <div
            className={`overflow-hidden ${
              isScanning ? 'max-h-0 opacity-0 mt-0' : 'max-h-[60px] opacity-100 mt-2'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onChat) onChat({ text: '' });
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.08] border border-white/15 hover:bg-white/12 hover:border-blue-400/30 transition-all duration-300 z-10 relative"
            >
              <MessageSquare size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-gray-200">AI에게 장소 묻기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCardSummary;
