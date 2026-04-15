import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Search, Plane, Bed, X, ExternalLink, ShieldCheck } from 'lucide-react';

/**
 * Travelpayouts 화이트 라벨(White Label) 통합 검색 모달 연동 컴포넌트
 * @param {string} locationName - 목적지 이름
 * @param {string} type - 'flight' (항공권) 또는 'hotel' (숙박)
 */
const WhiteLabelWidget = ({ locationName, type = 'flight' }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isIframeLoading, setIsIframeLoading] = useState(true);

    const isHotel = type === 'hotel';

    // CNAME으로 연결한 사용자 화이트라벨 전용 도메인
    const BASE_URL = 'https://flights.gateo.kr';

    // 404 방지: /hotels 대신 SPA 해시 라우팅(#/hotels) 및 목적지 파라미터 적용 (자연스러운 흐름)
    const encodedLocation = locationName ? encodeURIComponent(locationName) : '';
    const WHITELABEL_URL = isHotel
        ? `${BASE_URL}/#hotels?destination=${encodedLocation}`
        : `${BASE_URL}/?destination_name=${encodedLocation}`;

    // UI 분기
    const IconComponent = isHotel ? Bed : Plane;
    const titleText = isHotel ? "글로벌 최저가 호텔 통합 검색" : "글로벌 최저가 항공권 통합 검색";
    const highlightText = isHotel ? "숙소/호텔" : "항공권";
    // 모달 아이콘 테마
    const iconColor = isHotel ? "text-indigo-500" : "text-blue-500";
    const iconBgColor = isHotel ? "bg-indigo-100" : "bg-blue-100";
    const iconTextColor = isHotel ? "text-indigo-600" : "text-blue-600";

    // 트리거 버튼 색상 (2안: 하늘색/보라색 파스텔톤)
    const buttonColors = isHotel
        ? "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200"
        : "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200";

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
            {/* 트리거 버튼 디자인 (심플 파스텔 버튼) */}
            <button
                onClick={() => {
                    setIsIframeLoading(true);
                    setIsModalOpen(true);
                }}
                className={`flex items-center justify-center gap-1.5 w-full mt-3 py-3 min-h-[44px] rounded-xl text-xs font-semibold transition-colors border ${buttonColors}`}
                aria-label={titleText}
            >
                <IconComponent size={14} />
                <span>{titleText}</span>
                <Search size={12} className="ml-0.5 opacity-80" />
            </button>

            {/* 전체 화면 항공권/숙박 검색 모달 (createPortal로 최상단 렌더링, z-[9999]) */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex flex-col bg-white animate-fade-in overscroll-none touch-pan-y">
                    {/* 모달 헤더 (닫기 버튼 포함, 모바일 상단 노치/상태표시줄 고려 pt-safe) */}
                    <div
                        className="flex items-center justify-between px-4 pb-3 pt-4 border-b border-gray-200 bg-white shadow-sm z-20 shrink-0"
                        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`${iconBgColor} p-1.5 rounded-lg ${iconTextColor}`}>
                                <IconComponent size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 leading-tight text-sm">{highlightText} 검색</h3>
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
                        />
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default WhiteLabelWidget;
