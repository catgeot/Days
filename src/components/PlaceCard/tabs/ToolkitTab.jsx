import React, { useState, useEffect } from 'react';
import { Briefcase, MapPin, FileText, Train, Smartphone, Wifi, Plane, Bed, ShieldAlert, ExternalLink, RefreshCw, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { getAffiliateLink } from '../../../utils/affiliate';

const ToolkitCard = ({ icon: Icon, title, type, data, isSponsored, isOfficial, location }) => {
    // Affiliate logic with Tracker
    const getLink = () => {
        if (!data) return '#';

        const searchQuery = location?.name || location?.country || '';
        const encodedQuery = encodeURIComponent(searchQuery);

        let originalUrl = '#';
        let provider = null;

        switch (type) {
            case 'accommodation':
                originalUrl = `https://www.agoda.com/ko-kr/search?text=${encodedQuery}`;
                provider = 'agoda';
                break;
            case 'flight':
                originalUrl = `https://www.skyscanner.co.kr/transport/flights/kr/${encodedQuery}`;
                provider = 'skyscanner';
                break;
            case 'connectivity':
                originalUrl = `https://www.airalo.com/search?q=${encodedQuery}`;
                provider = 'airalo';
                break;
            case 'transport':
                originalUrl = `https://www.klook.com/ko/search/result/?query=${encodedQuery}`;
                provider = 'klook';
                break;
            case 'map_poi':
                originalUrl = `https://www.google.com/maps/search/${encodedQuery}`;
                break;
            default:
                originalUrl = `https://www.google.com/search?q=${encodedQuery}+여행팁`;
        }

        if (provider) {
             return getAffiliateLink(originalUrl, provider, {
                 campaign: 'toolkit',
                 locationName: location?.name
             });
        }

        return originalUrl;
    };

    const getButtonConfig = () => {
        switch (type) {
            case 'accommodation': return { text: '숙박 시설 검색하기', colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' };
            case 'flight': return { text: '항공권 확인하기', colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' };
            case 'connectivity': return { text: '유심/eSIM 구매하기', colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200' };
            case 'transport': return { text: '교통 패스 예매하기', colorClass: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200' };
            case 'map_poi': return { text: '지도에서 보기', colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'safety': return { text: '안전 정보 확인하기', colorClass: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' };
            case 'visa': return { text: '공식 사이트 확인', colorClass: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' };
            default: return { text: '바로가기', colorClass: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    const btnConfig = getButtonConfig();

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative group">
            {/* Label */}
            <div className="absolute top-4 right-4 flex gap-1">
                {isOfficial && (
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                        Official
                    </span>
                )}
                {isSponsored && (
                    <span className="bg-fuchsia-50 text-fuchsia-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-fuchsia-100 uppercase tracking-wider group-hover:bg-fuchsia-100 transition-colors" title="파트너사 제휴 링크로, 사이트 운영에 도움이 됩니다.">
                        Sponsored
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-gray-50 text-gray-700 rounded-xl">
                    <Icon size={18} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4 flex-1">
                {data?.advice || "관련 정보를 불러올 수 없습니다."}
            </p>

            {type !== 'apps' && (type !== 'visa' && type !== 'safety' || !data?.official_url || data.official_url === 'null') && type !== 'safety' && (
                <a
                    href={getLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-colors border ${btnConfig.colorClass}`}
                >
                    <span>{btnConfig.text}</span>
                    <ExternalLink size={12} />
                </a>
            )}
            {(type === 'visa' || type === 'safety') && data?.official_url && data.official_url !== 'null' && (
                <a
                    href={data.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-semibold transition-colors border ${btnConfig.colorClass}`}
                >
                    <span>{btnConfig.text}</span>
                    <ExternalLink size={12} />
                </a>
            )}
        </div>
    );
};

const LOADING_MESSAGES = [
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

const ToolkitTab = ({ location, wikiData, isWikiLoading }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [localGuideData, setLocalGuideData] = useState(null);
    const [loadingStep, setLoadingStep] = useState(0);

    // 로딩 메시지 순차적 변경
    useEffect(() => {
        let interval;
        if (isUpdating) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep((prev) => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
            }, 1500); // 1.5초마다 다음 메시지로
        }
        return () => clearInterval(interval);
    }, [isUpdating]);

    const handleUpdate = async () => {
        const placeId = wikiData?.place_id || location?.name;
        if (!placeId) return;
        setIsUpdating(true);
        try {
            await supabase.from('place_wiki').update({ ai_practical_info: '[[LOADING]]' }).eq('place_id', placeId);

            const { data, error } = await supabase.functions.invoke('update-place-wiki', {
                body: { placeId: placeId, locationName: location?.name || placeId }
            });

            if (error) throw error;

            if (data?.essentialGuide) {
                setLocalGuideData(data.essentialGuide);
            }
        } catch (e) {
            console.error(e);
            alert('정보 업데이트에 실패했습니다.');
            await supabase.from('place_wiki').update({ ai_practical_info: null }).eq('place_id', placeId);
        } finally {
            setIsUpdating(false);
        }
    };

    // 로컬 상태가 있으면 우선 사용 (새로고침 없이 즉시 표시)
    const guideData = localGuideData || wikiData?.essential_guide;
    const isLoading = isWikiLoading || isUpdating || (wikiData?.ai_practical_info === '[[LOADING]]' && !localGuideData);

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#f8f9fa]">
                <div className="flex flex-col items-center gap-6 max-w-sm w-full">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <Briefcase size={28} className="animate-bounce" />
                    </div>

                    <div className="w-full space-y-3">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-bold text-gray-700">AI 툴킷 생성 중</span>
                            <span className="text-xs font-bold text-blue-600">{Math.round((loadingStep / (LOADING_MESSAGES.length - 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-500 ease-out"
                                style={{ width: `${(loadingStep / (LOADING_MESSAGES.length - 1)) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium h-6">
                        <Loader2 size={14} className="animate-spin text-blue-500" />
                        <span className="animate-pulse">{LOADING_MESSAGES[loadingStep]}</span>
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
        <div className="w-full h-full p-4 md:p-6 overflow-y-auto custom-scrollbar bg-[#f8f9fa]">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                            <Briefcase className="text-blue-600" />
                            스마트 트래블 툴킷
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {location?.name} 여행을 위한 생존 정보 및 핵심 큐레이션
                        </p>
                    </div>
                    <button
                        onClick={handleUpdate}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-200 shadow-sm transition-colors self-start md:self-auto"
                    >
                        <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                        <span>정보 갱신</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToolkitCard icon={MapPin} title="지도 및 명소" type="map_poi" data={guideData?.map_poi} location={location} />
                    <ToolkitCard icon={FileText} title="비자 및 서류" type="visa" data={guideData?.visa} isOfficial location={location} />
                    <ToolkitCard icon={Train} title="교통 및 패스" type="transport" data={guideData?.transport} isSponsored location={location} />
                    <ToolkitCard icon={Smartphone} title="필수 앱" type="apps" data={guideData?.apps} location={location} />
                    <ToolkitCard icon={Wifi} title="유심 및 공항픽업" type="connectivity" data={guideData?.connectivity} isSponsored location={location} />
                    <ToolkitCard icon={Plane} title="항공권" type="flight" data={guideData?.flight} isSponsored location={location} />
                    <ToolkitCard icon={Bed} title="숙박 지역 추천" type="accommodation" data={guideData?.accommodation} isSponsored location={location} />
                    <ToolkitCard icon={ShieldAlert} title="안전 및 비상" type="safety" data={guideData?.safety} isOfficial location={location} />
                </div>

                <div className="mt-8 flex items-start gap-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
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
