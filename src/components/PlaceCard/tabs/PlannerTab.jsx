import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, MapPin, FileText, Train, Smartphone, Wifi, Plane, Bed, ShieldAlert, ExternalLink, RefreshCw, AlertCircle, Sparkles, Loader2, Search, CheckCircle2, Clock, Car, Ship, Map as MapIcon } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { getAffiliateLink } from '../../../utils/affiliate';
import CopyableText, { isMobileDevice } from '../common/CopyableText';
import WhiteLabelWidget from '../common/WhiteLabelWidget';

// 🆕 [Phase 8 Fix] 전역 요청 캐시 - API 중복 호출 방지 (React StrictMode 대응)
const pendingToolkitRequests = new Map(); // { placeId: Promise }

// 🎨 [Phase 6-4] 카테고리별 색상 테마 정의
const THEME_COLORS = {
    default: {
        bg: 'bg-white',
        border: 'border-blue-100',
        icon: 'bg-blue-50 text-blue-600',
        hover: 'hover:border-blue-200 hover:shadow-blue-100/50'
    },
    warning: {
        bg: 'bg-amber-50/30',
        border: 'border-amber-200',
        icon: 'bg-amber-100 text-amber-700',
        hover: 'hover:border-amber-300 hover:shadow-amber-100/50'
    },
    danger: {
        bg: 'bg-red-50/30',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-700',
        hover: 'hover:border-red-300 hover:shadow-red-100/50'
    }
};

// 🆕 [Phase 8-4] TravelPayouts 숙소 전용 검색 위젯 (Search Form) - 높이/이탈 이슈로 임시 비활성화
const HotelWidget = ({ location }) => {
    return null;
};

// 🆕 [Phase 8] 복잡한 여행지 특화 컴포넌트: 출발 전 필수 체크리스트
const PreTravelChecklist = ({ items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 mb-5 shadow-sm">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-sm md:text-base">
                <AlertCircle className="text-amber-600 shrink-0" size={18} />
                출발 전 필수 준비사항
            </h3>
            <div className="space-y-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 size={18} className="text-amber-500 shrink-0" />
                            <div>
                                <p className="text-xs md:text-sm font-bold text-gray-800">{item.title}</p>
                                {item.cost && <p className="text-[10px] md:text-xs text-gray-500 font-medium">{item.cost}</p>}
                            </div>
                        </div>
                        {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                <span>바로가기</span>
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🆕 [Phase 8] 복잡한 여행지 특화 컴포넌트: 여정 타임라인
const JourneyTimeline = ({ timeline }) => {
    if (!timeline || timeline.length === 0) return null;
    return (
        <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-5 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2 text-sm md:text-base">
                <MapIcon className="text-blue-600 shrink-0" size={18} />
                상세 여정 플래너
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-[2px] before:bg-blue-200">
                {timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                        {/* 둥근 점 */}
                        <div className="absolute -left-[30px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-blue-50 shadow-sm z-10" />
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-blue-500 tracking-wider uppercase mb-0.5">STEP {step.step || (idx + 1)}</span>
                            <span className="text-sm font-bold text-gray-800 leading-tight">{step.title}</span>
                            {step.duration && (
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 font-medium bg-blue-100/50 w-fit px-1.5 py-0.5 rounded-md">
                                    <Clock size={10} />
                                    <span>{step.duration}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 🆕 [Phase 8-4] 검증된 공식 비자/입국 서류 URL 매핑 (AI 할루시네이션 방지용)
const OFFICIAL_VISA_LINKS = [
    { keywords: ['ESTA', '미국', '하와이', '괌', '사이판'], url: 'https://esta.cbp.dhs.gov/', label: '미국 ESTA 공식 신청' },
    { keywords: ['K-ETA', '한국', '대한민국'], url: 'https://www.k-eta.go.kr/', label: '한국 K-ETA 공식 신청' },
    { keywords: ['NZeTA', '뉴질랜드'], url: 'https://nzeta.immigration.govt.nz/', label: '뉴질랜드 NZeTA 신청' },
    { keywords: ['eTA', '캐나다'], url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html', label: '캐나다 eTA 신청' },
    { keywords: ['ETA', '호주', '시드니', '멜버른'], url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601', label: '호주 ETA 신청 앱 안내' },
    { keywords: ['SG Arrival', 'SG카드', '싱가포르', '싱가폴'], url: 'https://eservices.ica.gov.sg/sgarrivalcard/', label: '싱가포르 입국 신고서' },
    { keywords: ['MDAC', '말레이시아', '코타키나발루', '쿠알라룸푸르'], url: 'https://imigresen-online.imi.gov.my/mdac/main', label: '말레이시아 MDAC 등록' },
    { keywords: ['Visit Japan', 'VJW', '일본', '도쿄', '오사카', '후쿠오카', '삿포로'], url: 'https://vjw-lp.digital.go.jp/ko/', label: 'Visit Japan Web (빠른 입국)' },
    { keywords: ['e-Visa', '베트남', '다낭', '나트랑', '하노이'], url: 'https://evisa.xuatnhapcanh.gov.vn/', label: '베트남 e-Visa 공식 신청' },
    { keywords: ['e-VOA', '인도네시아', '발리', '자카르타'], url: 'https://molina.imigresi.go.id/', label: '인도네시아 e-VOA 공식 신청' },
    { keywords: ['eTravel', '이트래블', '필리핀', '세부', '보라카이', '마닐라'], url: 'https://etravel.gov.ph/', label: '필리핀 eTravel (필수)' },
    { keywords: ['대만', '타이완', '타이베이', '가오슝', '온라인 입국신고서'], url: 'https://niaspeedy.immigration.gov.tw/webacard/', label: '대만 온라인 입국신고서' },
    { keywords: ['e-Arrival', '캄보디아', '씨엠립', '프놈펜'], url: 'https://www.arrival.gov.kh/', label: '캄보디아 e-Arrival (도착비자)' },
    { keywords: ['ETIAS', '유럽', '프랑스', '이탈리아', '스페인', '독일', '스위스', '영국'], url: 'https://travel-europe.europa.eu/etias_en', label: '유럽 ETIAS (시행 예정 확인)' }
];

const ToolkitCard = ({ icon: Icon, title, type, data, isSponsored, isOfficial, location, themeColor = 'gray' }) => {
    const theme = THEME_COLORS[themeColor] || THEME_COLORS.gray;

    // 🆕 [Phase 8-3] 텍스트 정제 함수 고도화 (불필요한 기호 혼합 제거 및 리스트 통일)
    const cleanAdviceText = (text) => {
        if (!text) return text;

        return text
            // 1. 콜론 뒤에 불필요하게 붙은 혼합 특수기호만 보수적으로 제거 (예: :*•, : •)
            .replace(/:\s*\*\s*•/g, ':')
            .replace(/:\s*•\s*/g, ': ')

            // 2. 닫히지 않은 시작 ** 를 - 로 치환 (오류로 인해 한쪽만 남은 볼드체를 일반 리스트로 강등)
            // (줄의 시작에 **가 있고, 같은 줄 안에 닫는 **가 없는 경우)
            .replace(/^[ \t]*\*\*(?!(?:[^\n]*\*\*))/gm, '- ')

            // 3. 모든 리스트 시작 기호(*, •)를 '-'로 통일 (볼드체 항목 앞에도 깔끔하게 - 기호 유지)
            .replace(/^[ \t]*[•*]\s+/gm, '- ')

            // 4. 문장 끝에 잉여 특수기호 단일 개체만 제거 (볼드체 종결인 **는 안전하게 보존)
            .replace(/([^*])\*[ \t]*$/gm, '$1')
            .replace(/•[ \t]*$/gm, '')

            // 5. 백틱(`) 기호 모두 제거 (AI가 남발하는 경우 방지)
            .replace(/`/g, '')

            // 6. 과도한 줄바꿈 제거
            .replace(/\n{3,}/g, '\n\n')

            // 7. 각 줄 양끝 공백 제거
            .replace(/^\s+|\s+$/gm, '')
            .trim();
    };

    // Affiliate logic with Tracker
    const getMultiLinks = () => {
        const searchQuery = location?.name || location?.country || '';
        const encodedQuery = encodeURIComponent(searchQuery);

        const links = [];

        switch (type) {
            case 'accommodation':
                // TravelPayouts 위젯 보류로 인해 임시 구글 호텔 링크 복구
                links.push({
                    url: `https://www.google.com/travel/search?q=${encodedQuery}%20hotels`,
                    text: '구글 호텔 최저가 검색',
                    colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                });
                break;
            case 'flight':
                // 스카이스캐너, 트립닷컴 제거 (하단의 WhiteLabelWidget 통합 검색으로 완벽히 대체됨)
                break;
            case 'connectivity':
                links.push({
                    // Airalo 메인 연결
                    url: getAffiliateLink(`https://www.airalo.com/ko/`, 'airalo', { campaign: 'toolkit', locationName: location?.name }),
                    text: 'Airalo (eSIM)',
                    colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
                });
                const klookWifiTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}%20유심`;
                const klookWifiDeepLink = `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookWifiTargetUrl)}`;

                links.push({
                    // 클룩 다이렉트 어필리에이트 동적 딥링크
                    url: klookWifiDeepLink,
                    text: '클룩 유심/와이파이',
                    colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                });
                break;
            case 'transport':
                // 클룩 다이렉트 어필리에이트 동적 딥링크
                const klookTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}`;
                const klookDirectDeepLink = `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookTargetUrl)}`;

                links.push({
                    url: klookDirectDeepLink,
                    text: '클룩 (Klook)',
                    colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
                });
                // 12Go 반려로 제거
                break;
            case 'airport_transfer':
                const klookTransferTargetUrl = `https://www.klook.com/ko/airport-transfers/`;
                const klookTransferDeepLink = `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookTransferTargetUrl)}`;

                const klookCarRentalTargetUrl = `https://www.klook.com/ko/car-rentals/`;
                const klookCarRentalDeepLink = `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookCarRentalTargetUrl)}`;

                links.push({
                    url: klookTransferDeepLink,
                    text: '공항 픽업 예약',
                    colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                });

                links.push({
                    url: klookCarRentalDeepLink,
                    text: '렌터카 검색',
                    colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                });
                break;
            case 'ferry_booking':
                // 12Go 반려로 제거
                const klookFerryTargetUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}%20페리`;
                const klookFerryDeepLink = `https://affiliate.klook.com/redirect?aid=118544&aff_adid=1256120&k_site=${encodeURIComponent(klookFerryTargetUrl)}`;

                links.push({
                    url: klookFerryDeepLink,
                    text: '클룩 페리 예약',
                    colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
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
                if (data?.official_url && data.official_url !== 'null') {
                     links.push({
                        url: data.official_url,
                        text: '공식 사이트 확인',
                        colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    });
                } else {
                     links.push({
                        url: `https://www.0404.go.kr/dev/country_search.moa`,
                        text: '외교부 안전여행',
                        colorClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    });
                }
                break;
            case 'visa':
                // 1. 키워드 매칭 기반 검증된 링크 우선 탐색 (할루시네이션 방지)
                let foundOfficialLink = null;
                // data.advice에 "한국인 무비자" 등이 포함되어 K-ETA 등으로 오인 매칭되는 것을 방지하기 위해 목적지(이름/국가)로만 매칭
                const searchTarget = ((location?.name || '') + ' ' + (location?.country || '')).toLowerCase();

                for (const item of OFFICIAL_VISA_LINKS) {
                    if (item.keywords.some(kw => searchTarget.includes(kw.toLowerCase()))) {
                        foundOfficialLink = item;
                        break;
                    }
                }

                if (foundOfficialLink) {
                    links.push({
                        url: foundOfficialLink.url,
                        text: foundOfficialLink.label,
                        colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    });
                } else if (data?.official_url && data.official_url !== 'null' && data.official_url.startsWith('http')) {
                    // 2. 매칭된 정적 링크가 없고 AI가 반환한 URL이 유효할 때
                     links.push({
                        url: data.official_url,
                        text: '비자/입국 정보 확인',
                        colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
                    });
                } else {
                    // 3. 둘 다 없으면 외교부 안전여행 (가장 보수적 접근)
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

            <p className="text-sm text-gray-700 leading-[1.7] mb-5 flex-1 select-text break-keep">
                <CopyableText text={cleanAdviceText(data?.advice)} locationName={location?.name} type={type} />
            </p>

            {links.length > 0 && (
                <div className="mt-auto grid grid-cols-2 gap-2">
                    {links.map((link, idx) => (
                        <a
                            key={idx}
                            href={link.url}
                            target={isMobileDevice() ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            className={`flex items-center justify-center gap-1.5 w-full py-3 min-h-[44px] rounded-xl text-xs font-semibold transition-colors border ${link.colorClass} ${links.length === 1 ? 'col-span-2' : ''}`}
                            aria-label={`${link.text}에서 검색하기`}
                        >
                            <span>{link.text}</span>
                            <ExternalLink size={12} />
                        </a>
                    ))}
                </div>
            )}

            {/* Travelpayouts 화이트 라벨 위젯 (항공권 검색 전용) */}
            {type === 'flight' && (
                <WhiteLabelWidget locationName={location?.name} type="flight" />
            )}
            {/* 🆕 [Phase 8-4] TravelPayouts 숙소 전용 검색 위젯 */}
            {type === 'accommodation' && (
                <HotelWidget location={location} />
            )}
        </div>
    );
};

// 🆕 [Phase 6-5] 로딩 메시지에 이모지 추가 및 카드 순서에 맞게 재배치
const LOADING_MESSAGES_NEW = [
    "🗺️ 지도 및 명소를 가져오는 중...",
    "📄 비자 및 서류 정보를 확인하는 중...",
    "✈️ 최적의 항공권 및 직항 팁을 분석하는 중...",
    "🏨 가장 위치가 좋은 숙박 지역을 선정하는 중...",
    "📱 유심 및 공항 픽업 정보를 정리하는 중...",
    "🚇 교통 패스 및 렌터카 정보를 찾는 중...",
    "📲 국가별 필수 앱을 선별하는 중...",
    "🚨 안전 및 치안 정보를 스캔하는 중...",
    "✨ AI가 여행자 툴킷을 최종 완성하는 중..."
];

const LOADING_MESSAGES_UPDATE = [
    "📦 기존 툴킷 정보를 불러오는 중...",
    "🔄 최신 비자 및 출입국 규정 변동을 확인하는 중...",
    "🛫 항공 및 교통 정보를 업데이트하는 중...",
    "🏠 숙박 및 편의 정보를 점검하는 중...",
    "📡 통신 및 연결 정보를 갱신하는 중...",
    "🛡️ 현지 치안 및 안전 상황을 스캔하는 중...",
    "📊 기존 데이터와 변경점을 비교하는 중...",
    "🔧 변경 사항을 반영하여 툴킷을 재조립하는 중...",
    "✅ AI가 최종 툴킷 검수를 마치는 중..."
];

const PlannerTab = ({ location, plannerData, isPlannerLoading, isActive }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [isRemoteUpdating, setIsRemoteUpdating] = useState(false); // 수동 업데이트 로딩 상태 추가

    // 🆕 [Phase 8 Fix] 스크롤 컨테이너 직접 제어용 ref
    const scrollContainerRef = useRef(null);

    // 🆕 [Phase 8-3] 분리된 아키텍처에 따라 plannerData.essential_guide 사용
    const guideData = plannerData?.essential_guide;
    const isUpdatingExisting = !!guideData;
    const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

    // isRemoteUpdating 플래그를 로딩 조건에 추가
    const isLoading = isPlannerLoading || isRemoteUpdating;

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

    // 원격 업데이트 요청 이벤트 전송 (수동 직권 갱신 버튼 클릭 시)
    const handleRemoteUpdate = () => {
        console.log("[PlannerTab] 수동 직권 갱신 버튼 클릭됨 - 툴킷 강제 갱신 요청 발송");
        setIsRemoteUpdating(true);
        handleRequestToolkitInfo(location?.name, true);
    };

    // 🆕 [Phase 8-3] 앱 연동 브릿지 UI 액션
    const handleAppBridgeClick = () => {
        alert("🚀 현재 gateo.kr 전용 스마트 플래너 앱을 열심히 준비 중입니다!\n\n앱이 출시되면 저장하신 여정을 모바일에서 곧바로 이어서 계획할 수 있습니다. 빠른 시일 내에 찾아뵙겠습니다.");
    };

    // 🆕 [Phase 6-2 + Phase 7-1 + Phase 8-3] 툴킷 진입 시 essential_guide가 없으면 자동으로 데이터 요청
    const initialDataRequested = useRef(false);
    useEffect(() => {
        // essential_guide가 없고, 아직 요청하지 않았을 때만 자동 호출
        if (isActive && !guideData && !isPlannerLoading && !initialDataRequested.current && location?.name) {
            console.log("[PlannerTab] 툴킷 데이터 완전 없음 - 자동 데이터 요청 발송");
            initialDataRequested.current = true;
            setIsRemoteUpdating(true);
            handleRequestToolkitInfo(location?.name, false);
        }
    }, [isActive, guideData, isPlannerLoading, location?.name]);

    // 🆕 [Phase 7-1] 장소 변경 시 플래그 리셋
    useEffect(() => {
        initialDataRequested.current = false;
        autoUpdateTriggered.current = false; // 장소 변경 시 자동 업데이트 플래그도 초기화
    }, [location?.name]);

    // 🆕 [Phase 8 Fix] 툴킷 탭 재진입 시 및 데이터 갱신 시 스크롤 상단 리셋
    useEffect(() => {
        if (isActive && !isLoading && scrollContainerRef.current) {
            // 로딩이 끝나고 데이터가 표시될 때 스크롤을 강제로 상단(0)으로
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = 0;
                    console.log('[PlannerTab] 스크롤 상단으로 리셋 완료');
                }
            }, 150); // DOM 렌더링 완료 대기
        }
    }, [isActive, isLoading]);

    // 툴킷 전용 갱신 로직 (update-place-toolkit Edge Function 호출)
    const handleRequestToolkitInfo = async (placeName, forceUpdate = false) => {
        const placeId = plannerData?.place_id || location?.name;
        if (!placeId) return;

        // 🆕 [Phase 8 Fix] 중복 요청 방지 - 이미 요청 중이면 기존 Promise 재사용
        if (pendingToolkitRequests.has(placeId)) {
            console.log('[PlannerTab] [DEV] 중복 요청 방지 - 기존 요청 재사용 (StrictMode 이중 렌더링)');
            return pendingToolkitRequests.get(placeId);
        }

        setIsRemoteUpdating(true);

        // 새 요청 생성 및 전역 캐시 등록
        const requestPromise = (async () => {
            try {
                console.log("[PlannerTab] Supabase Edge Function (update-place-toolkit) 호출 시작");
                const { data, error } = await supabase.functions.invoke('update-place-toolkit', {
                    body: { placeId, locationName: placeName || location?.name }
                });

                if (error) {
                    console.error("[PlannerTab] Edge Function Error response:", error);
                    throw error;
                }

                console.log("[PlannerTab] Edge Function 호출 완료 - 응답 데이터:", data);

                // 🆕 [Phase 8 Fix] 이벤트 기반 즉시 반영으로 Race Condition 해결
                if (data?.success) {
                    console.log(`[PlannerTab] 업데이트 완료. 이벤트 발생 (forceUpdate: ${forceUpdate})`);
                    window.dispatchEvent(new CustomEvent('toolkit-updated', {
                        detail: { placeId, essentialGuide: data.essentialGuide }
                    }));
                } else {
                    console.error("[PlannerTab] 백엔드 응답 에러 (success: false):", data);
                }

                // 성공 여부와 상관없이 로딩 상태는 해제
                setIsRemoteUpdating(false);

                return data;
            } catch (err) {
                console.error('[PlannerTab] Request Error catch:', err);
                setIsRemoteUpdating(false);
                throw err;
            } finally {
                // 요청 완료 후 캐시에서 제거 (메모리 누수 방지)
                pendingToolkitRequests.delete(placeId);
            }
        })();

        // 전역 캐시에 등록
        pendingToolkitRequests.set(placeId, requestPromise);
        return requestPromise;
    };

    // 툴킷 진입 시 14일 경과 자동 갱신 원격 트리거
    const autoUpdateTriggered = useRef(false);
    useEffect(() => {
        // 기존(Phase 7)에 있던 14일 경과 위키 통합 자동 갱신은
        // 툴킷 전용 테이블 분리에 따라 일단 비활성화 (필요시 별도로 툴킷 전용 업데이트 날짜 컬럼을 사용해야 함)
        /*
        if (isActive && !autoUpdateTriggered.current && guideData) {
            const lastUpdated = plannerData?.toolkit_updated_at;
            if (lastUpdated) {
                const lastDate = new Date(lastUpdated);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > WIKI_AUTO_UPDATE_DAYS) {
                    console.log(`[PlannerTab] ${WIKI_AUTO_UPDATE_DAYS}일 경과 툴킷 자동 갱신 발송 (${diffDays}일 지남)`);
                    autoUpdateTriggered.current = true;
                    // 여기서 forceUpdate=true로 넘기면 window.location.reload()를 유발함.
                    handleRequestToolkitInfo(location?.name, true);
                }
            }
        }
        */
    }, [isActive, guideData, plannerData?.toolkit_updated_at, location?.name]);

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const targetDate = plannerData?.toolkit_updated_at;
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
        <div className="w-full h-full relative">
            <div
                ref={scrollContainerRef}
                className="w-full h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#f8f9fa] px-4 pt-[116px] pb-6 md:p-6 md:pt-10 overscroll-none touch-pan-y"
            >
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

                        {/* 🆕 [Phase 7-3] 강제 갱신 버튼 제거 (위키 탭에는 유지, 툴킷은 제거) */}
                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            {/* 데스크탑: 상단 앱 연동 버튼 */}
                            <div className="hidden md:flex items-center gap-2">
                                <button onClick={handleAppBridgeClick} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm">
                                    <Smartphone size={14} />
                                    <span>앱으로 여정 보내기</span>
                                </button>
                            </div>
                            {lastUpdated && (
                                <span className="text-[11px] text-gray-400 font-medium px-1">
                                    마지막 업데이트: {lastUpdated}
                                </span>
                            )}
                        </div>
                    </div>

                {/* 🆕 [Phase 8] 복잡한 여행지 배지 및 확장 컴포넌트 */}
                {guideData?.is_complex && (
                    <div className="mb-6 animate-fade-in">
                        <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                            <AlertCircle size={20} className="text-red-600 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="font-bold text-red-900 text-sm">이 여행지는 복잡한 준비가 필요합니다!</h4>
                                <p className="text-[11px] md:text-xs text-red-700 mt-1 font-medium leading-relaxed">
                                    인천 출발 기준 다단계 이동(페리 등)이나 E-비자, 관광세 사전 납부 등의 절차가 필수적입니다. 아래 가이드를 꼼꼼히 확인하세요. (복잡도: {guideData.complexity_score || 80}/100)
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 체크리스트 및 타임라인 (상시 렌더링) */}
                {(guideData?.categories?.pre_travel?.length > 0 || guideData?.journey_timeline?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <PreTravelChecklist items={guideData?.categories?.pre_travel || []} />
                        <JourneyTimeline timeline={guideData?.journey_timeline || []} />
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5">
                    {/* 특화 예약: 공항 픽업 및 페리 (is_complex가 true일 때만 또는 해당 카테고리가 있을 때만 표시) */}
                    {(guideData?.categories?.airport_transfer) && (
                        <ToolkitCard icon={Car} title="공항 → 항구/목적지 이동" type="airport_transfer" data={guideData.categories.airport_transfer} isSponsored location={location} themeColor="default" />
                    )}
                    {(guideData?.categories?.ferry_booking) && (
                        <ToolkitCard icon={Ship} title="페리 (쾌속선) 예약" type="ferry_booking" data={guideData.categories.ferry_booking} isSponsored location={location} themeColor="default" />
                    )}
                    {/* 1. 먼저 어디를 갈지 확인 - 초록 (자연, 탐험) */}
                    <ToolkitCard icon={MapPin} title="지도 및 명소" type="map_poi" data={guideData?.categories?.map_poi || guideData?.map_poi} location={location} themeColor="default" />

                    {/* 2. 출입국 준비 - 파랑 (공식, 신뢰) */}
                    <ToolkitCard icon={FileText} title="비자 및 서류" type="visa" data={guideData?.categories?.visa || guideData?.visa} isOfficial location={location} themeColor="warning" />

                    {/* 3. 이동 수단 - 하늘 (비행, 자유) */}
                    <ToolkitCard icon={Plane} title="항공권" type="flight" data={guideData?.categories?.flight || guideData?.flight} isSponsored location={location} themeColor="default" />

                    {/* 4. 숙소 - 보라 (편안함, 휴식) */}
                    <ToolkitCard icon={Bed} title="숙박 지역 추천" type="accommodation" data={guideData?.categories?.accommodation || guideData?.accommodation} isSponsored location={location} themeColor="default" />

                    {/* 5. 현지 연결 - 청록 (통신, 기술) */}
                    <ToolkitCard icon={Wifi} title="유심 및 공항픽업" type="connectivity" data={guideData?.categories?.connectivity || guideData?.connectivity} isSponsored location={location} themeColor="default" />

                    {/* 6. 현지 이동 - 녹색 (Go, 진행) */}
                    <ToolkitCard icon={Train} title="교통 및 패스" type="transport" data={guideData?.categories?.transport || guideData?.transport} isSponsored location={location} themeColor="default" />

                    {/* 7. 편의 도구 - 황금 (가치, 도구) */}
                    <ToolkitCard icon={Smartphone} title="필수 앱" type="apps" data={guideData?.categories?.apps || guideData?.apps} location={location} themeColor="default" />

                    {/* 8. 안전 정보 - 빨강 (주의, 중요) */}
                    <ToolkitCard icon={ShieldAlert} title="안전 및 비상" type="safety" data={guideData?.categories?.safety || guideData?.safety} isOfficial location={location} themeColor="danger" />
                </div>

                <div className="mt-8 mb-4 flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 shrink-0">
                    <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed">
                        <strong>하이브리드 정보 안내:</strong> 본 툴킷은 객관적인 공공 정보(비자, 치안 등)와 함께, 원활한 여행 준비를 돕기 위한 파트너사 제휴 링크(숙박, 유심 등)가 일부 포함되어 있습니다. 제휴 링크를 통한 서비스 이용 시 사이트 운영에 큰 도움이 됩니다. AI에 의해 자동 생성된 팁이므로 시기에 따라 일부 정보가 다를 수 있습니다.
                    </p>
                </div>

                <div className="flex justify-end pb-4">
                    <button
                        onClick={() => handleRequestToolkitInfo(plannerData?.place_id || location?.name, true)}
                        disabled={isLoading}
                        className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors opacity-30 hover:opacity-100"
                        title="기존 툴킷 강제 업데이트"
                    >
                        {isLoading ? 'Updating...' : 'Force Update Toolkit'}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
};

export default PlannerTab;
