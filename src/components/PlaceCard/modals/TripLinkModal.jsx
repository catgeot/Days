import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

const TripLinkModal = ({ pkg, onClose }) => {
  const [iframeSrc, setIframeSrc] = useState('');
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // 모달이 열려 있을 때 배경 스크롤 방지 및 애니메이션 완료 후 iframe 로드
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // 모달 애니메이션(animate-scale-up)이 끝난 후 iframe을 렌더링하도록 지연
    // 모바일에서 최초 진입 시 iframe 내부의 반응형 계산이 꼬이는 현상 방지
    const timer = setTimeout(() => {
      setIframeSrc(`https://info.triplink.kr/d/${pkg.adKey}`);
    }, 400);

    return () => {
      document.body.style.overflow = '';
      clearTimeout(timer);
    };
  }, [pkg.adKey]);

  if (!pkg) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* 배경 오버레이 (클릭 시 닫힘) */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 - 좁은 폭으로 중앙 정렬 */}
      <div className="relative w-full max-w-[1040px] bg-[#0b101a] rounded-2xl md:rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-scale-up" style={{ maxHeight: '90vh' }}>
        {/* 상단 헤더 영역 */}
        <div className="shrink-0 flex items-center justify-between p-4 md:px-6 border-b border-white/10 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base md:text-lg break-keep">
                트립링크 패키지 여행 둘러보기
              </h3>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed break-keep max-w-2xl">
                본 상품은 제휴사(트립링크/노랑풍선)가 제공하며, 예약·결제·환불 등 모든 거래는 제휴사와 직접 이루어집니다. gateo는 정보 제공 목적의 중개 서비스만 제공합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.open(`https://info.triplink.kr/d/${pkg.adKey}`, '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
            >
              새 창으로 보기 <ExternalLink size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* iframe 영역: flex-auto를 사용하여 90vh에 맞게 자동 축소되도록 하되, 기본 높이를 700px로 설정 */}
        <div className="relative w-full bg-white flex-auto overflow-auto" style={{ height: '700px', minHeight: '50vh' }}>
          {/* 로딩 표시 (iframe이 완전히 로드되기 전까지 표시) */}
          {!isIframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium text-sm">특가 상품을 불러오는 중입니다...</p>
              </div>
            </div>
          )}

          {/* 실제 배너 */}
          {iframeSrc && (
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="yes"
              className={`relative w-full h-full border-none z-10 transition-opacity duration-500 ${isIframeLoaded ? 'opacity-100' : 'opacity-0'}`}
              title="TripLink Package Offer"
              onLoad={() => setIsIframeLoaded(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TripLinkModal;
