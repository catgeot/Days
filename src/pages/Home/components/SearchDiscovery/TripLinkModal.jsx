import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

const TripLinkModal = ({ pkg, onClose }) => {
  // 모달이 열려 있을 때 배경 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

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
        <div className="flex items-center justify-between p-4 md:px-6 border-b border-white/10 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-base md:text-lg">
                gateo x 트립링크 특가 패키지
              </h3>
              <p className="text-xs text-gray-400 hidden md:block">
                안전하고 편안한 여행을 위한 검증된 파트너 상품입니다
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

        {/* iframe 영역 */}
        <div className="relative w-full bg-white flex items-center justify-center overflow-auto" style={{ height: '700px' }}>
          {/* 로딩 표시 (iframe 로드 전까지) */}
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium text-sm">특가 상품을 불러오는 중입니다...</p>
            </div>
          </div>

          {/* 실제 배너: 1024x768 규격을 꽉 채우거나 가운데 정렬 */}
          <iframe
            src={`https://info.triplink.kr/d/${pkg.adKey}`}
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="yes"
            className="relative z-10 w-full h-full border-none"
            title="TripLink Package Offer"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
};

export default TripLinkModal;
