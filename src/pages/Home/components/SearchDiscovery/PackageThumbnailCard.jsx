import React from 'react';
import { ExternalLink, Tag } from 'lucide-react';

const PackageThumbnailCard = ({ pkg, isGrid = false }) => {
  // 횡스크롤용 고정 크기 vs 그리드용 반응형 비율 크기
  const baseSize = isGrid
    ? "w-full aspect-[3/4] md:aspect-[3/4]"
    : "w-[240px] md:w-[280px] h-[320px] md:h-[380px] flex-none snap-start";

  const handleCardClick = (e) => {
    e.preventDefault();
    if (pkg.url) {
      window.open(pkg.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[2rem] cursor-pointer transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-blue-500/20 hover:border-blue-400/50 ${baseSize}`}
    >
      {/* 배경 사진 영역 */}
      {pkg.image ? (
        <img
          src={pkg.image}
          alt={pkg.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black/80 flex items-center justify-center">
          <Tag size={40} className="text-white/20" />
        </div>
      )}

      {/* 그라디언트 오버레이 (텍스트 가독성 확보) */}
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity" />

      {/* 컨텐츠 (텍스트 및 뱃지) */}
      <div className="relative z-10 p-4 h-full flex flex-col">
        {/* 상단 배지 */}
        <div className="self-end mb-auto flex flex-col items-end gap-2">
          {pkg.badge && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {pkg.badge}
            </span>
          )}
          {/* 외부 링크 아이콘 (호버 시 표시) */}
          <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <ExternalLink size={14} className="text-white" />
          </div>
        </div>

        {/* 하단 텍스트 */}
        <div className="mt-auto p-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-1 rounded bg-black/60 text-yellow-400 border border-yellow-400/30">
              TRIPLINK
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-white group-hover:text-blue-300 transition-colors line-clamp-2 break-keep drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            {pkg.title}
          </h3>
          <p className="text-sm text-gray-200 font-medium mt-2 line-clamp-1 break-keep drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {pkg.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PackageThumbnailCard;
