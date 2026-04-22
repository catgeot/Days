import React from 'react';

const TripLinkIframeCard = ({ pkg }) => {
  const adWidth = pkg.width || 300;
  const adHeight = pkg.height || 250;

  // 기존 여행지 카드와 동일한 외곽 크기 적용
  const baseSize = "w-[240px] md:w-[280px] h-[320px] md:h-[380px] flex-none snap-start";

  return (
    <div
      className={`group relative flex flex-col rounded-[2rem] transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-sky-500/30 hover:border-sky-300/60 ${baseSize}`}
    >
      {/* 백그라운드 장식 효과: 하늘색에서 모래/흙(amber/orange) 색상으로 부드럽게 떨어지는 여행지 사진 느낌의 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200/80 to-[#d4a373] pointer-events-none opacity-90" />

      {/* 텍스처 느낌을 위한 약간의 어두운 오버레이 */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none mix-blend-overlay" />

      {/* 테두리 (사진 카드와 비슷한 느낌을 주기 위해 살짝 밝은 테두리) */}
      <div className="absolute inset-0 border border-white/20 rounded-[2rem] pointer-events-none" />

      {/* 상단 뱃지 */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
         <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            트립링크 제휴
         </span>
      </div>

      {/* iframe 래퍼 (카드 너비에 맞춰 scale 축소: 336x280 기준 0.7 적용 시 235.2px) */}
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10 pt-8 pointer-events-auto">
        <div className="transform scale-[0.7] md:scale-[0.8] origin-center flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-white transition-transform duration-500 group-hover:scale-[0.75] md:group-hover:scale-[0.85]">
          <iframe
            src={`https://info.triplink.kr/d/${pkg.adKey}`}
            width={adWidth}
            height={adHeight}
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            loading="lazy"
            style={{ display: 'block' }}
            title="TripLink Dynamic Banner"
          />
        </div>
      </div>

      {/* 하단 텍스트 영역 (시각적 균형) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none text-center">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 text-white/90 backdrop-blur-md border border-white/20 shadow-sm">
          제휴광고
        </span>
      </div>
    </div>
  );
};

export default TripLinkIframeCard;
