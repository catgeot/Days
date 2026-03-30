import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, MapPin, FileText, Train, Smartphone, Wifi, Plane, Bed, ShieldAlert, ExternalLink, RefreshCw, AlertCircle, Sparkles, Loader2, Search } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { getAffiliateLink } from '../../../utils/affiliate';
import CopyableText, { isMobileDevice } from '../common/CopyableText';
import { parseAiPracticalInfo } from '../../../utils/aiDataParser';
import { WIKI_AUTO_UPDATE_DAYS } from '../../../shared/constants';

// 🎨 [Phase 6-4] 카테고리별 색상 테마 정의
const THEME_COLORS = {
    emerald: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'bg-emerald-100 text-emerald-700',
        hover: 'hover:shadow-emerald-100/50'
    },
    blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-700',
        hover: 'hover:shadow-blue-100/50'
    },
    sky: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        icon: 'bg-sky-100 text-sky-700',
        hover: 'hover:shadow-sky-100/50'
    },
    purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-700',
        hover: 'hover:shadow-purple-100/50'
    },
    teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        icon: 'bg-teal-100 text-teal-700',
        hover: 'hover:shadow-teal-100/50'
    },
    green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-700',
        hover: 'hover:shadow-green-100/50'
    },
    amber: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'bg-amber-100 text-amber-700',
        hover: 'hover:shadow-amber-100/50'
    },
    red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-700',
        hover: 'hover:shadow-red-100/50'
    },
    gray: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        icon: 'bg-gray-100 text-gray-700',
        hover: 'hover:shadow-gray-100/50'
    }
};

const ToolkitCard = ({ icon: Icon, title, type, data, isSponsored, isOfficial, location, themeColor = 'gray' }) => {
    const theme = THEME_COLORS[themeColor] || THEME_COLORS.gray;
    // Affiliate logic with Tracker
    const getMultiLinks = () => {
        const searchQuery = location?.name || location?.country || '';
        const encodedQuery = encodeURIComponent(searchQuery);

        const links = [];

        switch (type) {
            case 'accommodation':
                links.push({
                    url: getAffiliateLink(`https://www.agoda.com/ko-kr/search?text=${encodedQuery}`, 'agoda', { campaign: 'toolkit', locationName: location?.name }),
                    text: '아고다',
                    colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                });
                links.push({
                    // 부킹닷컴은 searchresults.ko.html?ss= 형태를 많이 씀
                    url: getAffiliateLink(`https://www.booking.com/searchresults.ko.html?ss=${encodedQuery}`, 'booking', { campaign: 'toolkit', locationName: location?.name }),
                    text: '부킹닷컴',
                    colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                });
                break;
            case 'flight':
                links.push({
                    // 스카이스캐너는 deep link 시 에러(Promo not found)가 자주 나므로 안전하게 메인 홈페이지 연결
                    url: getAffiliateLink(`https://www.skyscanner.co.kr/`, 'skyscanner', { campaign: 'toolkit', locationName: location?.name }),
                    text: '스카이스캐너',
                    colorClass: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                });
                links.push({
                    url: getAffiliateLink(`https://kr.trip.com/flights/`, 'tripcom', { campaign: 'toolkit', locationName: location?.name }),
                    text: '트립닷컴',
                    colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                });
                break;
            case 'connectivity':
                links.push({
                    // Airalo 메인 연결
                    url: getAffiliateLink(`https://www.airalo.com/ko/`, 'airalo', { campaign: 'toolkit', locationName: location?.name }),
                    text: 'Airalo (eSIM)',
                    colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                });
                links.push({
                    // 클룩의 경우 쿼리 파라미터가 포함된 복잡한 URL은 딥링크 변환 시 거부될 수 있으므로, 가장 안전한 기본 도메인(또는 단순 검색)으로 변경
                    url: getAffiliateLink(`https://www.klook.com/ko/`, 'klook', { campaign: 'toolkit', locationName: location?.name }),
                    text: '클룩 유심/와이파이',
                    colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                });
                break;
            case 'transport':
                links.push({
                    // 클룩 기본 도메인으로 안전하게 우회
                    url: getAffiliateLink(`https://www.klook.com/ko/`, 'klook', { campaign: 'toolkit', locationName: location?.name }),
                    text: '클룩 (Klook)',
                    colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                });
                links.push({
                    url: getAffiliateLink(`https://12go.asia/ko`, '12go', { campaign: 'toolkit', locationName: location?.name }),
                    text: '12Go (아시아 교통)',
                    colorClass: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'
                });
                break;
            case 'map_poi':
                links.push({
                    url: `https://www.google.com/maps/search/${encodedQuery}`,
                    text: '구글 맵에서 보기',
                    colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                });
                break;
            case 'safety':
            case 'visa':
                if (data?.official_url && data.official_url !== 'null') {
                     links.push({
                        url: data.official_url,
                        text: '공식 사이트 확인',
                        colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    });
                } else if (type === 'safety' || type === 'visa') {
                     links.push({
                        url: `https://www.0404.go.kr/dev/country_search.moa`,
                        text: '외교부 안전여행',
                        colorClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    });
                }
                break;
            case 'apps':
                break; // Apps don't have a default button anymore unless specified
            default:
                break;
        }

        return links;
    };

    const links = getMultiLinks();

    return (
        <div className={`${theme.bg} border ${theme.border} rounded-2xl p-5 shadow-sm hover:shadow-md ${theme.hover} transition-all flex flex-col h-full relative group`}>
            {/* Label */}
            <div className="absolute top-4 right-4 flex gap-1">
                {isOfficial && (
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                        Official
                    </span>
                )}
                {isSponsored && (
                    <span className="bg-fuchsia-50 text-fuchsia-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-fuchsia-100 uppercase tracking-wider group-hover:bg-fuchsia-100 transition-colors" title="파트너사 제휴 링크로, 사이트 운영에 도움이 됩니다.">
                        Sponsored
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2.5 mb-3">
                <div className={`p-2.5 ${theme.icon} rounded-xl`}>
                    <Icon size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-base">{title}</h3>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-5 flex-1 select-text break-keep">
                <CopyableText text={data?.advice} locationName={location?.name} type={type} />
            </p>

            {links.length > 0 && (
                <div className="mt-auto grid grid-cols-2 gap-2">
                    {links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target={isMobileDevice() ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-semibold transition-colors border ${link.colorClass} ${links.length === 1 ? 'col-span-2' : ''}`}
                        >
                            <span>{link.text}</span>
                            <ExternalLink size={12} />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

const LOADING_MESSAGES_NEW = [
    "지도 및 명소를 가져오는 중...",
    "비자 및 서류 정보를 확인하는 중...",
    "교통 패스 및 렌터카 정보를 찾는 중...",
    "국가별 필수 앱을 선별하는 중...",
    "유심 및 공항 픽업 정보를 정리하는 중...",
    "최적의 항공권 및 직항 팁을 분석하는 중...",
    "가장 위치가 좋은 숙박 지역을 선정하는 중...",
    "안전 및 치안 정보를 스캔하는 중...",
    "AI가 여행자 툴킷을 최종 완성하는 중..."
];

const LOADING_MESSAGES_UPDATE = [
    "기존 툴킷 정보를 불러오는 중...",
    "최신 비자 및 출입국 규정 변동을 확인하는 중...",
    "교통 및 환율 정보를 업데이트하는 중...",
    "최적화된 앱 및 편의 정보를 점검하는 중...",
    "현지 치안 및 안전 상황을 스캔하는 중...",
    "스마트 가이드라인을 새롭게 구성하는 중...",
    "기존 데이터와 변경점을 비교하는 중...",
    "변경 사항을 반영하여 툴킷을 재조립하는 중...",
    "AI가 최종 툴킷 검수를 마치는 중..."
];

const ToolkitTab = ({ location, wikiData, isWikiLoading, isActive }) => {
    // 위키의 단일 소스(ai_practical_info)를 사용하므로,
    // ToolkitTab 자체의 독립적인 업데이트/디펜서 로직을 제거하고 상태만 참조합니다.
    const [loadingStep, setLoadingStep] = useState(0);
    const [isRemoteUpdating, setIsRemoteUpdating] = useState(false); // 수동 업데이트 로딩 상태 추가

    const sourceAiInfo = wikiData?.ai_practical_info !== '[[LOADING]]' ? wikiData?.ai_practical_info : null;
    const { toolkitData } = parseAiPracticalInfo(sourceAiInfo);

    // 파싱된 데이터가 있으면 최우선, 없으면 예전 JSON 형식(essential_guide)으로 Fallback
    const guideData = toolkitData || wikiData?.essential_guide;
    const isUpdatingExisting = !!guideData;
    const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

    // isRemoteUpdating 플래그를 로딩 조건에 추가
    const isLoading = isWikiLoading || (wikiData?.ai_practical_info === '[[LOADING]]') || isRemoteUpdating;

    // 만약 상위에서 데이터가 들어와서 캐시되었거나 상태가 변경되었다면 로컬 업데이트 플래그 해제
    useEffect(() => {
        if (wikiData?.ai_practical_info !== '[[LOADING]]') {
            setIsRemoteUpdating(false);
        }
    }, [wikiData?.ai_practical_info]);

    // 로딩 메시지 순차적 변경 (주기 4초로 변경)
    useEffect(() => {
        let interval;
        if (isLoading) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev < currentMessages.length - 1 ? prev + 1 : prev));
            }, 4000); // 4초마다 다음 메시지로
        }
        return () => clearInterval(interval);
    }, [isLoading, currentMessages]);

    // 위키 뷰로 원격 업데이트 요청 이벤트 전송 (수동 직권 갱신 버튼 클릭 시)
    const handleRemoteUpdate = () => {
        console.log("[ToolkitTab] 수동 직권 갱신 버튼 클릭됨 - 위키 탭으로 강제 갱신 요청 발송");
        setIsRemoteUpdating(true);
        const event = new CustomEvent('request-ai-info', { detail: { placeName: location?.name, forceUpdate: true } });
        window.dispatchEvent(event);
    };

    // 🆕 [Phase 6-2] 툴킷 진입 시 wikiData가 없으면 자동으로 데이터 요청 (로딩 동기화)
    const initialDataRequested = useRef(false);
    useEffect(() => {
        // wikiData가 없고, 로딩 중도 아니고, 아직 요청하지 않았고, 탭이 활성화되어 있을 때
        if (isActive && !wikiData && !isWikiLoading && !initialDataRequested.current && location?.name) {
            console.log("[ToolkitTab] 위키 데이터 없음 - 자동 데이터 요청 발송");
            initialDataRequested.current = true;
            setIsRemoteUpdating(true);
            const event = new CustomEvent('request-ai-info', {
                detail: { placeName: location?.name, forceUpdate: false }
            });
            window.dispatchEvent(event);
        }
    }, [isActive, wikiData, isWikiLoading, location?.name]);

    // 툴킷 진입 시 14일 경과 자동 갱신 원격 트리거
    const autoUpdateTriggered = useRef(false);
    useEffect(() => {
        if (isActive && !autoUpdateTriggered.current && wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]') {
            const lastUpdated = wikiData.ai_info_updated_at;
            if (lastUpdated) {
                const lastDate = new Date(lastUpdated);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > WIKI_AUTO_UPDATE_DAYS) {
                    console.log(`[ToolkitTab] ${WIKI_AUTO_UPDATE_DAYS}일 경과 위키 자동 갱신 원격 요청 발송 (${diffDays}일 지남)`);
                    autoUpdateTriggered.current = true;
                    // 자동 갱신 시에는 툴킷 화면을 방해하지 않고 백그라운드로 처리할 수 있으나, 만약 로딩 화면이 필요하다면 setIsRemoteUpdating(true) 가능
                    const event = new CustomEvent('request-ai-info', { detail: { placeName: location?.name, forceUpdate: true } });
                    window.dispatchEvent(event);
                }
            }
        }
    }, [isActive, wikiData?.ai_practical_info, wikiData?.ai_info_updated_at, location?.name]);

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const targetDate = wikiData?.ai_info_updated_at;
    const lastUpdated = targetDate ? formatDate(targetDate) : '';

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#f8f9fa]">
                <div className="flex flex-col items-center gap-6 max-w-sm w-full">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Briefcase size={28} className="animate-bounce" />
                    </div>

                    <div className="w-full space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-bold text-gray-700">{isUpdatingExisting ? "AI 툴킷 점검 중" : "AI 툴킷 생성 중"}</span>
                            <span className="text-xs font-bold text-blue-600">{Math.round((loadingStep / (currentMessages.length - 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${(loadingStep / (currentMessages.length - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium h-6">
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                        <span className="animate-pulse">{currentMessages[loadingStep]}</span>
                    </div>

                    {/* 타임아웃(100%) 시 멈췄을 때 강제 갱신 버튼 표시 */}
                    {loadingStep >= currentMessages.length - 1 && (
                        <button
                            onClick={handleRemoteUpdate}
                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-500"
                        >
                            <RefreshCw size={14} />
                            <span>로딩이 지연되나요? 강제 다시 시도</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (!guideData && !isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#f8f9fa]">
                <Briefcase size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">여행자 필수 정보가 없습니다.</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">
                    AI가 분석한 이 지역의 필수 여행 정보(비자, 교통, 숙박, 유심 등) 가이드를 생성하시겠습니까?
                </p>
                <button
                    onClick={handleRemoteUpdate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-colors text-sm"
                >
                    <Sparkles size={16} />
                    <span>AI 툴킷 생성하기</span>
                </button>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#f8f9fa] px-4 pt-[116px] pb-4 md:p-6 md:pt-10 overscroll-none touch-pan-y">
            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col mt-2 md:mt-0">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Briefcase className="text-blue-600" />
                            스마트 트래블 툴킷
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {location?.name} 여행을 위한 생존 정보 및 핵심 큐레이션
                        </p>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
                        {lastUpdated && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] text-gray-400 font-medium px-1">
                                    마지막 업데이트: {lastUpdated}
                                </span>
                                <button
                                    onClick={handleRemoteUpdate}
                                    className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-full transition-colors border border-blue-100/50 flex items-center gap-1 bg-white shadow-sm group"
                                    title="AI 툴킷 강제 최신화 (관리자/테스트용)"
                                >
                                    <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
                                    <span className="text-[10px] font-bold">강제 갱신</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    {/* 1. 먼저 어디를 갈지 확인 - 초록 (자연, 탐험) */}
                    <ToolkitCard icon={MapPin} title="지도 및 명소" type="map_poi" data={guideData?.map_poi} location={location} themeColor="emerald" />

                    {/* 2. 출입국 준비 - 파랑 (공식, 신뢰) */}
                    <ToolkitCard icon={FileText} title="비자 및 서류" type="visa" data={guideData?.visa} isOfficial location={location} themeColor="blue" />

                    {/* 3. 이동 수단 - 하늘 (비행, 자유) */}
                    <ToolkitCard icon={Plane} title="항공권" type="flight" data={guideData?.flight} isSponsored location={location} themeColor="sky" />

                    {/* 4. 숙소 - 보라 (편안함, 휴식) */}
                    <ToolkitCard icon={Bed} title="숙박 지역 추천" type="accommodation" data={guideData?.accommodation} isSponsored location={location} themeColor="purple" />

                    {/* 5. 현지 연결 - 청록 (통신, 기술) */}
                    <ToolkitCard icon={Wifi} title="유심 및 공항픽업" type="connectivity" data={guideData?.connectivity} isSponsored location={location} themeColor="teal" />

                    {/* 6. 현지 이동 - 녹색 (Go, 진행) */}
                    <ToolkitCard icon={Train} title="교통 및 패스" type="transport" data={guideData?.transport} isSponsored location={location} themeColor="green" />

                    {/* 7. 편의 도구 - 황금 (가치, 도구) */}
                    <ToolkitCard icon={Smartphone} title="필수 앱" type="apps" data={guideData?.apps} location={location} themeColor="amber" />

                    {/* 8. 안전 정보 - 빨강 (주의, 중요) */}
                    <ToolkitCard icon={ShieldAlert} title="안전 및 비상" type="safety" data={guideData?.safety} isOfficial location={location} themeColor="red" />
                </div>

                <div className="mt-8 mb-4 flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shrink-0">
                    <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed">
                        <strong>하이브리드 정보 안내:</strong> 본 툴킷은 객관적인 공공 정보(비자, 치안 등)와 함께, 원활한 여행 준비를 돕기 위한 파트너사 제휴 링크(숙박, 유심 등)가 일부 포함되어 있습니다. 제휴 링크를 통한 서비스 이용 시 사이트 운영에 큰 도움이 됩니다. AI에 의해 자동 생성된 팁이므로 시기에 따라 일부 정보가 다를 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ToolkitTab;
