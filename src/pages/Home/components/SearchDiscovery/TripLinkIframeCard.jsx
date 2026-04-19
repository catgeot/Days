import React, { useState, useEffect, useRef } from 'react';

const TripLinkIframeCard = ({ pkg }) => {
  const adWidth = pkg.width || 300;
  const adHeight = pkg.height || 250;

  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let timeoutId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timeoutId = setTimeout(() => {
            setInView(true);
            observer.disconnect();
          }, 300);
        } else {
          if (timeoutId) clearTimeout(timeoutId);
        }
      },
      { rootMargin: '200px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // 기존 여행지 카드와 동일한 외곽 크기 적용
  const baseSize = "w-[240px] md:w-[280px] h-[320px] md:h-[380px] flex-none snap-start";

  return (
    <div
      ref={ref}
      className={`group relative flex flex-col bg-white/[0.02] border border-white/[0.05] rounded-[2rem] transition-all duration-500 ease-out overflow-hidden hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-blue-500/20 hover:border-blue-400/50 ${baseSize}`}
    >
      {/* 백그라운드 장식 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-black/40 pointer-events-none" />

      {/* 상단 뱃지 */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
         <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]">
            트립링크 특가
         </span>
      </div>

      {/* iframe 래퍼 (카드 너비에 맞춰 scale 축소: 336x280 기준 0.7 적용 시 235.2px) */}
      <div className="w-full h-full flex flex-col items-center justify-center relative z-10 pt-8 pointer-events-auto">
        <div className="transform scale-[0.7] md:scale-[0.8] origin-center flex items-center justify-center rounded-xl overflow-hidden shadow-2xl bg-white/5 transition-transform duration-500 group-hover:scale-[0.75] md:group-hover:scale-[0.85]">
          {inView ? (
            <iframe
              src={`https://info.triplink.kr/d/${pkg.adKey}`}
              width={adWidth}
              height={adHeight}
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              style={{ display: 'block' }}
              title="TripLink Dynamic Banner"
            />
          ) : (
            <div
              className="bg-white/5 animate-pulse flex items-center justify-center"
              style={{ width: adWidth, height: adHeight }}
            >
               <div className="w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 텍스트 영역 (시각적 균형) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none text-center">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/60 text-yellow-400 border border-yellow-400/30">
          AD
        </span>
      </div>
    </div>
  );
};

export default TripLinkIframeCard;
