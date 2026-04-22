import React, { useState, useEffect, useRef } from 'react';
import { Package, MapPin } from 'lucide-react';
import { usePlaceGallery } from '../../../../components/PlaceCard/hooks/usePlaceGallery';

const TripLinkSectionCard = ({ pkg, onClick }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  // usePlaceGallery는 spot 객체를 받으므로, pkg 데이터를 이용해 가짜 spot 객체를 생성
  const dummySpot = {
    name: pkg.targetKeyword,
    name_en: pkg.targetKeyword,
    // 필요시 다른 fallback 속성
  };

  const { images, isImgLoading } = usePlaceGallery(dummySpot);
  const bgImgUrl = images && images.length > 0 ? (images[0].urls?.regular || images[0].url) : null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
    };
  }, []);

  const baseSize = "w-[240px] md:w-[280px] h-[320px] md:h-[380px] flex-none snap-start";

  return (
    <div
      ref={ref}
      onClick={() => onClick(pkg)}
      className={`group relative flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[2rem] cursor-pointer transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-sky-500/30 hover:border-sky-300/60 ${baseSize}`}
    >
      {/* 배경 사진 영역 */}
      {inView && bgImgUrl ? (
        <img
          src={bgImgUrl}
          alt={pkg.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-sky-200/80 to-[#d4a373] flex items-center justify-center">
          {inView && isImgLoading && (
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
          )}
        </div>
      )}

      {/* 그라디언트 오버레이 */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/50 to-transparent transition-opacity" />

      {/* 컨텐츠 */}
      <div className="relative z-10 p-4 h-full flex flex-col pointer-events-none">
        {/* 상단 뱃지 */}
        <div className="self-start mb-auto">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border border-white/20">
            <Package size={12} />
            패키지 여행
          </span>
        </div>

        {/* 하단 텍스트 */}
        <div className="mt-auto p-1">
          <h3 className="text-xl md:text-2xl font-extrabold text-white group-hover:text-sky-300 transition-colors line-clamp-2 break-keep drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] leading-tight">
            {pkg.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-200 font-medium mt-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            <MapPin size={14} className="text-sky-400" />
            <span className="truncate">{pkg.description}</span>
          </div>
        </div>

        {/* AD 뱃지 */}
        <div className="absolute top-4 right-4">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-white/90 backdrop-blur-md border border-white/20">
            제휴광고
          </span>
        </div>
      </div>
    </div>
  );
};

export default TripLinkSectionCard;
