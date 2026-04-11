import React, { useState } from 'react';
import { Loader2, Search, Plane, X, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * Travelpayouts 화이트 라벨(White Label) 검색 모달 연동 컴포넌트
 * 기존 위젯 방식의 스크롤 충돌을 해결하기 위해 모달 & iframe 방식으로 리팩토링됨.
 */
const WhiteLabelWidget = ({ locationName }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIframeLoading, setIsIframeLoading] = useState(true);

    // CNAME으로 연결한 사용자 화이트라벨 전용 도메인
    const WHITELABEL_URL = 'https://flights.gateo.kr';

    // body 스크롤 방지 (모달 오픈 시)
    React.useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    return (
        <>
            {/* 트리거 버튼 디자인 (기존 카드 디자인 유지 및 클릭 유도) */}
            <button
                onClick={() => {
                    setIsIframeLoading(true);
                    setIsModalOpen(true);
                }}
                className="w-full mt-5 bg-white border border-blue-200 hover:border-blue-400 rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] hover:shadow-blue-200/50 transition-all duration-300 relative group flex flex-col text-left"
            >
                {/* 상단 장식 헤더 바 */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-white">
                        <Plane size={18} className="animate-pulse" />
                        <span className="text-sm font-bold tracking-wide">글로벌 최저가 항공권 통합 검색</span>
                    </div>
                    <ExternalLink size={16} className="text-white/80 group-hover:text-white transition-colors" />
                </div>

                {/* 본문 안내 영역 */}
                <div className="p-5 flex flex-col items-center justify-center bg-blue-50/30 gap-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
                        <Search size={24} className="text-blue-500" />
                    </div>
                    <div className="text-center">
                        <h4 className="text-sm font-black text-gray-800 mb-1">
                            여기를 눌러 {locationName ? <span className="text-blue-600">'{locationName}'행</span> : ''} 항공권 검색하기
                        </h4>
                        <p className="text-[11px] text-gray-500 font-medium">새 창에서 스크롤 꼬임 없이 쾌적하게 검색하세요</p>
                    </div>
                </div>

                {/* 하단 신뢰도 문구 */}
                <div className="bg-gray-50 border-t border-gray-100 px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-400 font-medium gap-1">
                    <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-green-500"/> 스카이스캐너, 아고다 등 전세계 예약망 연동</span>
                    <span>실시간 가격 비교 시스템</span>
                </div>
            </button>

            {/* 전체 화면 항공권 검색 모달 (z-[100]으로 최상단 배치) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-fade-in overscroll-none touch-pan-y">
                    {/* 모달 헤더 (닫기 버튼 포함) */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm z-20 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
                                <Plane size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight text-sm">항공권 검색</h3>
                                <p className="text-[10px] text-gray-500">flights.gateo.kr</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* 혹시 iframe에서 결제가 막히거나 새창을 원할 경우를 대비한 아웃링크 */}
                            <a
                                href={WHITELABEL_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-100 transition-colors"
                            >
                                새 탭 열기 <ExternalLink size={10} />
                            </a>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-full transition-colors focus:outline-none"
                                aria-label="닫기"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* iframe 렌더링 영역 */}
                    <div className="flex-1 w-full relative bg-[#f8f9fa] overflow-hidden">
                        {isIframeLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#f8f9fa]">
                                <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                                <p className="text-xs text-gray-600 font-bold tracking-wide">검색 엔진을 안전하게 불러오는 중...</p>
                                <p className="text-[10px] text-gray-400 mt-1">최초 접속 시 SSL 인증 시간이 소요될 수 있습니다</p>
                            </div>
                        )}

                        {/* iframe 내부 스크롤이 원활하도록 처리 */}
                        <iframe
                            src={WHITELABEL_URL}
                            className={`absolute inset-0 w-full h-full border-0 z-20 transition-opacity duration-500 ${isIframeLoading ? 'opacity-0' : 'opacity-100'}`}
                            title="Travelpayouts White Label Search"
                            onLoad={() => setIsIframeLoading(false)}
                            allow="geolocation; clipboard-write"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default WhiteLabelWidget;
