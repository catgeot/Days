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
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
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
    let timeoutId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            setInView(true);
            observer.disconnect(); // 한 번 로드되면 계속 유지
          }, 500); // 화면에 0.5초 이상 머물렀을 때만 로드 (API 방어)
        } else {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      },
      { rootMargin: '200px' } // 화면에 보이기 200px 전부터 감지
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 횡스크롤용 고정 크기 vs 그리드용 반응형 비율 크기
  const baseSize = isGrid
    ? "w-full aspect-[3/4] md:aspect-[3/4]"
    : "w-[240px] md:w-[280px] h-[320px] md:h-[380px] flex-none snap-start";

  return (
    <div
      ref={ref}
      onClick={() => onClick(spot)}
      className={`group relative flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[2rem] cursor-pointer transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-blue-500/20 hover:border-white/20 ${baseSize}`}
    >
      {/* 배경 사진 영역 (Lazy Load) */}
      {inView ? (
        <CardBackgroundImage spot={spot} categoryStyle={categoryStyle} CategoryIcon={CategoryIcon} />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent ${categoryStyle.split(' ')[0]}`} />
      )}

      {/* 그라디언트 오버레이 (밝기 개선: 하단 50% 영역에만 강하게, 상단은 원본 사진 유지) */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity" />

      {/* 컨텐츠 (텍스트) */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* 상단 배지 */}
        <div className="self-end mb-auto">
          <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-black/40 backdrop-blur-md border border-white/10 ${categoryStyle.split(' ')[1]}`}>
            <CategoryIcon size={12} />
            {categoryLabel}
          </span>
        </div>

        {/* 하단 텍스트 (그림자 효과 강화) */}
        <div className="mt-auto p-1">
          <h3 className="text-xl md:text-3xl font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-1 break-keep drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {spot.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-200 font-medium mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            <MapPin size={14} className="text-gray-300" />
            <span className="truncate">{spot.country} · {spot.name_en}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotThumbnailCard;
