import React from 'react';
import { ImageIcon, Play, PenTool, BookOpen, Briefcase, Smartphone } from 'lucide-react';

const handleAppBridgeClick = () => {
  alert(
    '🚀 현재 gateo.kr 전용 스마트 플래너 앱을 열심히 준비 중입니다!\n\n앱이 출시되면 저장하신 여정을 모바일에서 곧바로 이어서 계획할 수 있습니다. 빠른 시일 내에 찾아뵙겠습니다.'
  );
};

/**
 * placement="header": 데스크톱 PlaceChatPanel 2행 (리뷰 탭 포함).
 * placement="scroll": 모바일 미디어 스크롤 영역 상단 (리뷰는 숨김 — 기존 UX 유지).
 */
const PlaceMobileSecondaryNav = ({
  mediaMode,
  setMediaMode,
  matchedPackage,
  onOpenPackage,
  placement = 'scroll'
}) => {
  if (placement === 'scroll' && mediaMode === 'REVIEWS') return null;

  if (mediaMode === 'PLANNER') {
    if (placement === 'header') return null;
    return (
      <div className="flex items-center justify-center w-full pb-0.5 px-2">
        {matchedPackage ? (
          <button
            type="button"
            onClick={onOpenPackage}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:from-purple-500 hover:to-blue-500 transition-colors"
          >
            <Briefcase size={14} />
            패키지 여행 둘러보기
          </button>
        ) : (
          <button
            type="button"
            onClick={handleAppBridgeClick}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-800 transition-colors"
          >
            <Smartphone size={14} />
            앱으로 전체 일정 보내기
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`items-center justify-center gap-2 w-full overflow-x-auto no-scrollbar pb-0.5 px-2 overscroll-contain touch-pan-x flex border-b border-white/10 bg-[#05070a]/95 ${
        placement === 'header' ? 'md:justify-end md:px-0 md:border-b-0 md:bg-transparent' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => setMediaMode(mediaMode === 'WIKI' ? 'GALLERY' : 'WIKI')}
        className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
          mediaMode === 'WIKI'
            ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20'
            : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        }`}
      >
        {mediaMode === 'WIKI' ? (
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <BookOpen className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'WIKI' ? '갤러리 복귀' : '여행 위키'}</span>
      </button>
      <button
        type="button"
        onClick={() => setMediaMode(mediaMode === 'VIDEO' ? 'GALLERY' : 'VIDEO')}
        className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
          mediaMode === 'VIDEO'
            ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20'
            : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        }`}
      >
        {mediaMode === 'VIDEO' ? (
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <Play fill="currentColor" className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'VIDEO' ? '갤러리 복귀' : '유튜브 영상'}</span>
      </button>
      <button
        type="button"
        onClick={() => setMediaMode(mediaMode === 'REVIEWS' ? 'GALLERY' : 'REVIEWS')}
        className={`px-3 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 group shrink-0 active:scale-95 ${
          mediaMode === 'REVIEWS'
            ? 'bg-blue-600/90 text-white font-bold border border-blue-500/50 shadow-lg shadow-blue-900/20'
            : 'bg-white/[0.06] hover:bg-white/[0.18] text-gray-300 hover:text-white border border-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
        }`}
      >
        {mediaMode === 'REVIEWS' ? (
          <ImageIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
        ) : (
          <PenTool className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
        )}
        <span className="text-xs font-bold whitespace-nowrap">{mediaMode === 'REVIEWS' ? '갤러리 복귀' : '리뷰'}</span>
      </button>
    </div>
  );
};

export default PlaceMobileSecondaryNav;
