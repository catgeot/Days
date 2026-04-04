import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Compass } from 'lucide-react';
import { usePlaceGallery } from '../../../../components/PlaceCard/hooks/usePlaceGallery';
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS } from './constants';

const CardBackgroundImage = ({ spot, categoryStyle, CategoryIcon }) => {
  const { images, isImgLoading } = usePlaceGallery(spot);
  const bgImgUrl = images && images.length > 0 ? (images[0].urls?.regular || images[0].url) : null;

  if (bgImgUrl) {
    return (
      <img
        src={bgImgUrl}
        alt={spot.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
    );
  }

  return (
    <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent ${categoryStyle.split(' ')[0]}`}>
      {isImgLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
        </div>
      ) : (
        <CategoryIcon size={100} className="absolute -bottom-4 -right-4 opacity-20" />
      )}
    </div>
  );
};

const SpotThumbnailCard = ({ spot, onClick, isGrid = false }) => {
  const categoryStyle = CATEGORY_COLORS[spot.primaryCategory] || CATEGORY_COLORS.paradise;
  const categoryLabel = CATEGORY_LABELS[spot.primaryCategory] || '기타';
  const CategoryIcon = CATEGORY_ICONS[spot.primaryCategory] || Compass;

  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // 한 번 로드되면 계속 유지
        }
      },
      { rootMargin: '200px' } // 화면에 보이기 200px 전부터 로드
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  // 횡스크롤용 고정 크기 vs 그리드용 반응형 비율 크기
  const baseSize = isGrid
    ? "w-full aspect-[3/4] md:aspect-[4/5]"
    : "w-[220px] md:w-[260px] h-[280px] md:h-[320px] flex-none snap-start";

  return (
    <div
      ref={ref}
      onClick={() => onClick(spot)}
      className={`group relative flex flex-col bg-white/[0.03] border border-white/[0.08] rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-white/20 ${baseSize}`}
    >
      {/* 배경 사진 영역 (Lazy Load) */}
      {inView ? (
        <CardBackgroundImage spot={spot} categoryStyle={categoryStyle} CategoryIcon={CategoryIcon} />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent ${categoryStyle.split(' ')[0]}`} />
      )}

      {/* 그라디언트 오버레이 (가독성 향상) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b101a] via-[#0b101a]/50 to-transparent opacity-90 transition-opacity" />

      {/* 컨텐츠 (텍스트) */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* 상단 배지 */}
        <div className="self-end mb-auto">
          <span className={`flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold rounded-lg bg-black/40 backdrop-blur-md border border-white/10 ${categoryStyle.split(' ')[1]}`}>
            <CategoryIcon size={12} />
            {categoryLabel}
          </span>
        </div>

        {/* 하단 텍스트 */}
        <div className="mt-auto">
          <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 break-keep drop-shadow-md">
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium mt-1.5 drop-shadow-md">
            <MapPin size={12} className="text-gray-400" />
            <span className="truncate">{spot.country} · {spot.name_en}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotThumbnailCard;
