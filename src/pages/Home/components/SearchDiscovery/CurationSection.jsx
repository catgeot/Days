import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [spots]);

  if (!spots || spots.length === 0) return null;

  return (
    <div className={`animate-fade-in-up ${delayClass} relative group`}>
      <div className="flex items-center gap-3 mb-4 px-1">
        {icon}
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="relative">
        {/* 왼쪽 스크롤 버튼 */}
        <button
          onClick={() => scroll('left')}
          className={`hidden md:flex absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl ${!showLeftBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronLeft size={20} className="mr-0.5" />
        </button>

        {/* 횡스크롤 컨테이너 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto gap-4 pb-6 pt-2 snap-x custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
        >
          {spots.map((spot, index) => {
            // 네이티브 인피드 광고 삽입 로직: 2번째 카드 앞(index === 1), 6번째 카드 앞(index === 5)
            const isFirstAdPosition = index === 1 && promotedPackages && promotedPackages[0];
            const isSecondAdPosition = index === 5 && promotedPackages && promotedPackages[1];

            return (
              <React.Fragment key={spot.id}>
                {isFirstAdPosition && (
                  promotedPackages[0].type === 'iframe'
                    ? <TripLinkIframeCard key={promotedPackages[0].id} pkg={promotedPackages[0]} />
                    : <PackageThumbnailCard key={promotedPackages[0].id} pkg={promotedPackages[0]} />
                )}
                {isSecondAdPosition && (
                  promotedPackages[1].type === 'iframe'
                    ? <TripLinkIframeCard key={promotedPackages[1].id} pkg={promotedPackages[1]} />
                    : <PackageThumbnailCard key={promotedPackages[1].id} pkg={promotedPackages[1]} />
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
          className={`hidden md:flex absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl ${!showRightBtn && 'opacity-0 pointer-events-none'}`}
        >
          <ChevronRight size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
};

export default CurationSection;
