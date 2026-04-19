import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';
import SpotThumbnailCard from './SpotThumbnailCard';
import TripLinkIframeCard from './TripLinkIframeCard';
import PackageThumbnailCard from './PackageThumbnailCard';

const CurationSection = ({ title, subtitle, icon, spots, promotedPackages, delayClass, onSelectSpot, onMoreClick }) => {
  const scrollRef = useRef(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftBtn(scrollLeft > 10);
    setShowRightBtn(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = window.innerWidth > 768 ? 600 : 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const scrollToAd = () => {
    if (!scrollRef.current) return;
    const isMobile = window.innerWidth <= 768;
    const cardWidth = isMobile ? 256 : 296; // card width + gap(16px)
    scrollRef.current.scrollTo({ left: cardWidth * 5, behavior: 'smooth' });
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [spots]);

  if (!spots || spots.length === 0) return null;

  // subtitle 내에서 강조할 키워드를 찾아 버튼화하는 함수
  const renderSubtitle = (text) => {
    if (!text) return null;
    const keywords = ['아시아 단거리 패키지 추천', '장거리 패키지 추천', '휴양 패키지 추천'];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        const parts = text.split(keyword);
        return (
          <>
            {parts[0]}
            <button
              onClick={scrollToAd}
              className="inline-flex items-center gap-1 px-2.5 py-1 ml-1 text-xs md:text-sm font-bold text-white bg-sky-500/20 border border-sky-400/30 rounded-lg hover:bg-sky-500/40 hover:text-white transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.15)] group-hover:border-sky-400/50"
            >
              {keyword} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            {parts[1]}
          </>
        );
      }
    }
    return text;
  };

  return (
    <div className={`animate-fade-in-up ${delayClass} relative group`}>
      <div className="flex items-center gap-3 mb-4 px-1">
        {icon}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 flex flex-wrap items-center">
             {renderSubtitle(subtitle)}
          </p>
        </div>
      </div>

      <div className="relative">
        {/* 왼쪽 스크롤 버튼 */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-0 md:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-md border border-white items-center justify-center text-gray-800 hover:bg-white hover:scale-110 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${!showLeftBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft size={24} className="mr-0.5" />
        </button>

        {/* 횡스크롤 컨테이너 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        >
          {spots.map((spot, index) => {
            // 네이티브 인피드 광고 삽입 로직: 우리 카드 5개(index 0~4) 이후 연속으로 6,7번째에 배치 (index 5 카드 렌더링 직전)
            const isAdPosition = index === 5 && promotedPackages && promotedPackages.length > 0;

            return (
              <React.Fragment key={spot.id}>
                {isAdPosition && (
                  <>
                    {promotedPackages[0] && (
                      promotedPackages[0].type === 'iframe'
                        ? <TripLinkIframeCard key={`iframe-ad-1-${promotedPackages[0].id}`} pkg={promotedPackages[0]} />
                        : <PackageThumbnailCard key={`pkg-ad-1-${promotedPackages[0].id}`} pkg={promotedPackages[0]} />
                    )}
                    {promotedPackages[1] && (
                      promotedPackages[1].type === 'iframe'
                        ? <TripLinkIframeCard key={`iframe-ad-2-${promotedPackages[1].id}`} pkg={promotedPackages[1]} />
                        : <PackageThumbnailCard key={`pkg-ad-2-${promotedPackages[1].id}`} pkg={promotedPackages[1]} />
                    )}
                  </>
                )}
                <SpotThumbnailCard spot={spot} onClick={onSelectSpot} />
              </React.Fragment>
            );
          })}

          {/* 전체보기 모어 타일 */}
          <div
            onClick={onMoreClick}
            className="group/more relative flex-none w-[120px] md:w-[150px] h-[280px] md:h-[320px] flex items-center justify-center bg-white/[0.03] border border-white/[0.08] rounded-2xl cursor-pointer hover:bg-white/[0.06] snap-start transition-colors"
          >
            <div className="flex flex-col items-center gap-3 text-gray-500 group-hover/more:text-blue-400 transition-colors">
              <div className="w-12 h-12 rounded-full bg-white/5 group-hover/more:bg-blue-500/20 flex items-center justify-center transition-colors">
                <ChevronRight size={24} />
              </div>
              <span className="text-sm font-bold">더 찾아보기</span>
            </div>
          </div>
        </div>

        {/* 오른쪽 스크롤 버튼 */}
        <button
          onClick={() => scroll('right')}
          className={`hidden md:flex absolute right-0 md:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 backdrop-blur-md border border-white items-center justify-center text-gray-800 hover:bg-white hover:scale-110 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${!showRightBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight size={24} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default CurationSection;
