import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, MapPin, FileText, Train, Smartphone, Wifi, Plane, Bed, ShieldAlert, ExternalLink, RefreshCw, AlertCircle, Sparkles, Loader2, Search } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { getAffiliateLink } from '../../../utils/affiliate';

// 모바일 환경 감지 훅 또는 유틸
const isMobileDevice = () => {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

const CopyableWord = ({ word, displayText, locationName, type }) => {
    const handleSmartLink = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const searchTarget = word;
        const isMapSearch = ['map_poi', 'accommodation', 'transport'].includes(type);

        let queryStr = searchTarget;

        // 카테고리별 아웃링크 검색어 고도화
        if (['apps', 'connectivity'].includes(type)) {
            // 앱 및 통신사(eSIM 등)는 글로벌 브랜드가 대부분이므로 지역명 결합 시 앱스토어 대신 SGE(AI 개요)가 뜨는 왜곡 방지
            queryStr = searchTarget;
        } else if (locationName) {
            // 구글 맵스의 경우 콤마(,) 결합으로 위치/장소 검색 정확도 극대화
            // 비자/안전 등 일반 웹 검색의 경우 지역명(예: 러시아 비자)이 필수적이므로 띄어쓰기 결합 유지
            queryStr = isMapSearch ? `${searchTarget}, ${locationName}` : `${searchTarget} ${locationName}`;
        }

        const query = encodeURIComponent(queryStr);

        const url = isMapSearch
            ? `https://www.google.com/maps/search/?api=1&query=${query}`
            : `https://www.google.com/search?q=${query}`;

        window.open(url, isMobileDevice() ? '_self' : '_blank');
    };

    const isMapSearch = ['map_poi', 'accommodation', 'transport'].includes(type);

    return (
        <button
            onClick={handleSmartLink}
            className="inline-flex items-center gap-0.5 mx-0.5 font-bold text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 underline-offset-2 whitespace-nowrap transition-colors focus:outline-none"
            title={isMapSearch ? "구글 맵에서 검색하기" : "구글 웹에서 검색하기"}
        >
            {displayText || word}
            <Search size={10} className="opacity-70" />
        </button>
    );
};

const CopyableText = ({ text, locationName, type }) => {
    if (!text) return <span>관련 정보를 불러올 수 없습니다.</span>;

    // 한글명('영문명') 패턴을 예쁘게 통째로 추출하는 정규식
    // 띄어쓰기 최대 1번 포함된 단어(예: "아마조나스 극장")를 잡음
    const regex = /([^(\s]+(?:\s[^(\s]+)?)\('(.+?)'\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        const koreanName = match[1].trim(); // 예: "마나우스", "아마조나스 극장"
        const englishName = match[2].trim(); // 예: "Manaus", "Teatro Amazonas"

        parts.push(
            <CopyableWord
                key={match.index}
                word={englishName}
                displayText={`${koreanName}(${englishName})`}
                locationName={locationName}
                type={type}
            />
        );

        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    // 만약 정규식 매칭이 한 건도 없다면, 기존 Fallback (작은따옴표만 찾기) 적용
    if (parts.length === 1 && parts[0] === text) {
        const fallbackParts = text.split(/('[^']+')/g);
        return (
            <span className="select-text">
                {fallbackParts.map((part, i) => {
                    if (part.startsWith("'") && part.endsWith("'")) {
                        const word = part.slice(1, -1);
                        return <CopyableWord key={i} word={word} displayText={word} locationName={locationName} type={type} />;
                    }
                    return <span key={i}>{part}</span>;
                })}
            </span>
        );
    }

    return (
        <span className="select-text break-keep">
            {parts.map((part, i) => (
                <React.Fragment key={i}>{part}</React.Fragment>
            ))}
        </span>
    );
};

const ToolkitCard = ({ icon: Icon, title, type, data, isSponsored, isOfficial, location }) => {
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
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative group">
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
                <div className="p-2.5 bg-gray-50 text-gray-700 rounded-xl">
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

const ToolkitTab = ({ location, wikiData, isWikiLoading }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [localGuideData, setLocalGuideData] = useState(null);
    const [localUpdatedAt, setLocalUpdatedAt] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    // 로컬 상태가 있으면 우선 사용
    const guideData = localGuideData || wikiData?.essential_guide;
    const isUpdatingExisting = !!guideData;
    const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

    // 로딩 메시지 순차적 변경 (주기 4초로 변경)
    useEffect(() => {
        let interval;
        if (isUpdating) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev < currentMessages.length - 1 ? prev + 1 : prev));
            }, 4000); // 4초마다 다음 메시지로
        }
        return () => clearInterval(interval);
    }, [isUpdating, currentMessages]);

    // 쿨타임 타이머
    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const autoUpdateTriggered = useRef(false);

    const handleUpdate = async () => {
        if (cooldown > 0) return;

        const placeId = wikiData?.place_id || location?.name;
        if (!placeId) return;
        setIsUpdating(true);

        const startTime = Date.now();

        // 기존 텍스트를 보존하여 Edge Function에 넘김
        const oldAiInfo = wikiData?.ai_practical_info !== '[[LOADING]]' ? wikiData?.ai_practical_info : null;

        try {
            // 프론트에서 [[LOADING]] 설정 시 기존 정보가 사라지므로 Edge에서 처리하게 하거나, oldAiInfo를 따로 보관해서 복구
            await supabase.from('place_wiki').update({ ai_practical_info: '[[LOADING]]' }).eq('place_id', placeId);

            const { data, error } = await supabase.functions.invoke('update-place-wiki', {
                body: { placeId: placeId, locationName: location?.name || placeId, oldAiInfo: oldAiInfo }
            });

            if (error) throw error;
            if (data && data.success === false) throw new Error(data.error || 'Edge Function failed');

            // Defensor가 NO_CHANGES를 뱉었더라도 신뢰도를 위해 최소 3초는 로딩 연출
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 3000) {
                await new Promise(resolve => setTimeout(resolve, 3000 - elapsedTime));
            }

            if (data?.essentialGuide) {
                setLocalGuideData(data.essentialGuide);
            }

            // 갱신 완료 후 1분(60초) 쿨타임 적용
            setCooldown(60);
            setLocalUpdatedAt(new Date().toISOString());

            if (data?.noChanges) {
                console.log('No changes detected by AI');
            }
        } catch (e) {
            console.error(e);
            alert('정보 업데이트에 실패했습니다.');
            // 실패 시 이전 데이터로 롤백 (null이 아님)
            await supabase.from('place_wiki').update({ ai_practical_info: oldAiInfo || null }).eq('place_id', placeId);
        } finally {
            setIsUpdating(false);
        }
    };

    useEffect(() => {
        if (!autoUpdateTriggered.current && wikiData?.essential_guide && wikiData?.ai_practical_info !== '[[LOADING]]') {
            const lastUpdated = wikiData.ai_info_updated_at;
            if (lastUpdated) {
                const lastDate = new Date(lastUpdated);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 14) {
                    console.log(`[Lazy Update] ToolkitTab 14일 경과 자동 갱신 실행 (${diffDays}일 지남)`);
                    autoUpdateTriggered.current = true;
                    handleUpdate();
                }
            }
        }
    }, [wikiData?.essential_guide, wikiData?.ai_info_updated_at, wikiData?.ai_practical_info]);

    const isLoading = isWikiLoading || isUpdating || (wikiData?.ai_practical_info === '[[LOADING]]' && !localGuideData);

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const targetDate = localUpdatedAt || wikiData?.ai_info_updated_at;
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
                    onClick={handleUpdate}
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
                            <span className="text-[11px] text-gray-400 font-medium px-1">
                                마지막 업데이트: {lastUpdated}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <ToolkitCard icon={MapPin} title="지도 및 명소" type="map_poi" data={guideData?.map_poi} location={location} />
                    <ToolkitCard icon={FileText} title="비자 및 서류" type="visa" data={guideData?.visa} isOfficial location={location} />
                    <ToolkitCard icon={Train} title="교통 및 패스" type="transport" data={guideData?.transport} isSponsored location={location} />
                    <ToolkitCard icon={Smartphone} title="필수 앱" type="apps" data={guideData?.apps} location={location} />
                    <ToolkitCard icon={Wifi} title="유심 및 공항픽업" type="connectivity" data={guideData?.connectivity} isSponsored location={location} />
                    <ToolkitCard icon={Plane} title="항공권" type="flight" data={guideData?.flight} isSponsored location={location} />
                    <ToolkitCard icon={Bed} title="숙박 지역 추천" type="accommodation" data={guideData?.accommodation} isSponsored location={location} />
                    <ToolkitCard icon={ShieldAlert} title="안전 및 비상" type="safety" data={guideData?.safety} isOfficial location={location} />
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
