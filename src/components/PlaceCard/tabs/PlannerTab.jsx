import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Briefcase, MapPin, FileText, Train, Smartphone, Wifi, Plane, Bed, ShieldAlert, AlertCircle, Sparkles, Loader2, Car, Ship, RefreshCw, ArrowUp } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';

import { LOADING_MESSAGES_NEW, LOADING_MESSAGES_UPDATE } from './planner/constants';
import { mobilePlaceHeaderScrollPadding } from '../common/mobilePlaceHeaderInset';
import PreTravelChecklist from './planner/components/PreTravelChecklist';
import JourneyTimeline from './planner/components/JourneyTimeline';
import ToolkitCard from './planner/components/ToolkitCard';
import AiraloBannerWidget from './planner/components/AiraloBannerWidget';
import HolaflyBannerWidget from './planner/components/HolaflyBannerWidget';

// 🆕 [Phase 8 Fix] 전역 요청 캐시 - API 중복 호출 방지 (React StrictMode 대응)
const pendingToolkitRequests = new Map(); // { placeId: Promise }

const PlannerTab = ({
    location,
    plannerData,
    isPlannerLoading,
    refetchPlannerFromDb,
    isPlannerRefreshing = false,
    isActive,
    matchedPackage,
    mobileSecondaryNav = null,
}) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [isRemoteUpdating, setIsRemoteUpdating] = useState(false); // 수동 업데이트 로딩 상태 추가

    // 🆕 [Phase 8 Fix] 스크롤 컨테이너 직접 제어용 ref
    const scrollContainerRef = useRef(null);
    const [showScrollToTop, setShowScrollToTop] = useState(false);

    const scrollPlannerToTop = useCallback(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

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

    // 툴킷 전용 갱신 로직 (update-place-toolkit Edge Function 호출)
    const handleRequestToolkitInfo = useCallback(async (placeName, forceUpdate = false) => {
        const placeId = plannerData?.place_id || location?.name;
        if (!placeId) {
            setIsRemoteUpdating(false);
            return null;
        }

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
    }, [plannerData, location]);

    // 원격 업데이트 요청 이벤트 전송 (수동 직권 갱신 버튼 클릭 시)
    const handleRemoteUpdate = () => {
        console.log("[PlannerTab] 수동 직권 갱신 버튼 클릭됨 - 툴킷 강제 갱신 요청 발송");
        setIsRemoteUpdating(true);
        handleRequestToolkitInfo(location?.name, true);
    };

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

    // 긴 툴킷 스크롤 시 맨 위로 버튼
    useEffect(() => {
        if (!isActive || isLoading || !guideData) {
            setShowScrollToTop(false);
            return;
        }
        const el = scrollContainerRef.current;
        if (!el) return;
        const threshold = 280;
        const onScroll = () => setShowScrollToTop(el.scrollTop > threshold);
        el.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener('scroll', onScroll);
    }, [isActive, isLoading, guideData]);

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    };

    const targetDate = plannerData?.toolkit_updated_at;
    const lastUpdated = targetDate ? formatDate(targetDate) : '';

    if (isLoading) {
        return (
            <div className="w-full h-full flex flex-col bg-[#f8f9fa]">
                {mobileSecondaryNav && (
                    <div className={`md:hidden shrink-0 border-b border-gray-200/90 bg-[#f8f9fa] px-2 pb-2 ${mobilePlaceHeaderScrollPadding}`}>
                        {mobileSecondaryNav}
                    </div>
                )}
                <div className="flex flex-1 flex-col items-center justify-center p-6 min-h-0">
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
            </div>
        );
    }

    if (!guideData && !isLoading) {
        return (
            <div className="w-full h-full flex flex-col bg-[#f8f9fa]">
                {mobileSecondaryNav && (
                    <div className={`md:hidden shrink-0 border-b border-gray-200/90 bg-[#f8f9fa] px-2 pb-2 ${mobilePlaceHeaderScrollPadding}`}>
                        {mobileSecondaryNav}
                    </div>
                )}
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center min-h-0">
                <Briefcase size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">여행자 필수 정보가 없습니다.</h3>
                <p className="text-sm text-gray-500 mb-2 max-w-sm">
                    AI가 분석한 이 지역의 필수 여행 정보(비자, 교통, 숙박, 유심 등) 가이드를 실행할까요?
                </p>
                <p className="text-xs text-gray-400 mb-6 max-w-sm">
                    버튼을 눌렀을 때만 AI 툴킷이 실행됩니다.
                </p>
                <button
                    type="button"
                    onClick={handleRemoteUpdate}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold shadow-lg transition-colors text-sm"
                >
                    <Sparkles size={16} />
                    <span>AI 툴킷 실행하기</span>
                </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <div
                ref={scrollContainerRef}
                className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#f8f9fa] px-4 ${mobilePlaceHeaderScrollPadding} pb-6 md:p-6 md:pt-10 overscroll-none touch-pan-y`}
            >
                {mobileSecondaryNav && (
                    <div className="md:hidden shrink-0 -mx-4 px-2 pb-2 mb-1 border-b border-gray-200/90 bg-[#f8f9fa]">
                        {mobileSecondaryNav}
                    </div>
                )}
                <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col mt-2 md:mt-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4 shrink-0">
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                <span className="inline-flex items-center gap-2">
                                    <Briefcase className="text-blue-600" />
                                    스마트 트래블 툴킷
                                </span>
                                {guideData?.is_complex ? (
                                    <span className="text-base font-bold tabular-nums text-amber-800/90 md:text-lg md:font-black">
                                        (복잡도{' '}
                                        {Number.isFinite(Number(guideData.complexity_score))
                                            ? Number(guideData.complexity_score)
                                            : 80}
                                        /100)
                                    </span>
                                ) : null}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                {location?.name} 여행을 위한 생존 정보 및 핵심 큐레이션
                            </p>
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => refetchPlannerFromDb?.()}
                                    disabled={isPlannerRefreshing || !refetchPlannerFromDb}
                                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:pointer-events-none"
                                    title="DB에 저장된 툴킷만 다시 불러옵니다 (AI 미호출)"
                                >
                                    <RefreshCw size={14} className={isPlannerRefreshing ? 'animate-spin text-blue-600' : 'text-gray-500'} />
                                    저장된 데이터 새로고침
                                </button>
                                {lastUpdated && (
                                    <span className="text-[11px] text-gray-400 font-medium px-1">
                                        마지막 업데이트: {lastUpdated}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🆕 [Phase 8-8] 트립링크 패키지 배너 노출 영역 (데스크탑 전용) */}
                    {matchedPackage && (
                        <div className="hidden md:flex w-full mb-6 rounded-2xl overflow-hidden bg-gray-100 items-center justify-center relative border border-gray-200 shadow-sm" style={{ minHeight: '90px' }}>
                            {/* 상단 뱃지 */}
                            <div className="absolute top-0 left-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg">
                                제휴광고
                            </div>

                            {/* 데스크탑 배너 (728x90) */}
                            <div className="w-full overflow-hidden flex justify-center items-center py-2 md:py-0">
                                <div className="origin-center md:scale-100 w-[728px] h-[90px] flex items-center justify-center my-0">
                                    <iframe
                                        src={`https://info.triplink.kr/d/${matchedPackage.bannerAdKey || matchedPackage.adKey}`}
                                        width="728"
                                        height="90"
                                        frameBorder="0"
                                        scrolling="no"
                                        marginHeight="0"
                                        marginWidth="0"
                                        title={`${location?.name} 패키지 여행 상품`}
                                        className="pointer-events-auto"
                                    ></iframe>
                                </div>
                            </div>

                            {/* 클릭 인터셉트용 오버레이 (클릭 시 모달을 띄우거나, 배너 자체 링크를 타도록 할지 결정. 여기서는 배너 자체 링크 허용을 위해 pointer-events-none 적용) */}
                            <div className="absolute inset-0 pointer-events-none hover:bg-black/5 transition-colors"></div>
                        </div>
                    )}

                {/* 체크리스트 및 타임라인 (상시 렌더링) */}
                {(guideData?.categories?.pre_travel?.length > 0 || guideData?.journey_timeline?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <PreTravelChecklist
                            items={guideData?.categories?.pre_travel || []}
                            locationName={location?.name}
                            location={location}
                            essentialGuide={guideData}
                        />
                        <JourneyTimeline
                            timeline={guideData?.journey_timeline || []}
                            location={location}
                            essentialGuide={guideData}
                        />
                    </div>
                )}

                {/* 3단계 시각적 그룹화(섹션화) 레이아웃 적용 */}

                {/* 섹션 1: 출발 전 필수 준비 */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-800">🛫 출발 전 필수 준비</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        <ToolkitCard icon={FileText} title="비자 및 서류" type="visa" data={guideData?.categories?.visa || guideData?.visa} isOfficial location={location} essentialGuide={guideData} themeColor="warning" />
                        <ToolkitCard icon={Plane} title="항공권" type="flight" data={guideData?.categories?.flight || guideData?.flight} isSponsored location={location} essentialGuide={guideData} themeColor="default" />
                        <ToolkitCard icon={Bed} title="숙박 지역 추천" type="accommodation" data={guideData?.categories?.accommodation || guideData?.accommodation} isSponsored location={location} essentialGuide={guideData} themeColor="default" />
                        <ToolkitCard icon={ShieldAlert} title="안전 및 보험" type="safety" data={guideData?.categories?.safety || guideData?.safety} isOfficial location={location} essentialGuide={guideData} themeColor="danger" />
                    </div>
                </div>

                {/* 섹션 2: 현지 도착 및 이동 */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-5 bg-teal-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-800">🛬 현지 도착 및 이동</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        {(guideData?.categories?.airport_transfer) && (
                            <ToolkitCard icon={Car} title="공항 → 항구/목적지 이동" type="airport_transfer" data={guideData.categories.airport_transfer} isSponsored location={location} essentialGuide={guideData} themeColor="default" />
                        )}
                        {(guideData?.categories?.ferry_booking) && (
                            <ToolkitCard icon={Ship} title="페리 (쾌속선) 예약" type="ferry_booking" data={guideData.categories.ferry_booking} isSponsored location={location} essentialGuide={guideData} themeColor="default" />
                        )}
                        <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-b from-blue-50/45 via-white to-white p-3 shadow-sm ring-1 ring-blue-900/[0.06] md:p-4 flex flex-col gap-4">
                            <ToolkitCard
                                icon={Wifi}
                                title="유심 및 와이파이"
                                type="connectivity"
                                data={guideData?.categories?.connectivity || guideData?.connectivity}
                                isSponsored
                                location={location}
                                essentialGuide={guideData}
                                themeColor="default"
                                className="!border-0 shadow-none bg-transparent hover:!shadow-none hover:!border-transparent"
                            />
                            <div className="grid grid-cols-1 gap-3 border-t border-blue-100/90 pt-4 md:grid-cols-2 md:gap-3">
                                <AiraloBannerWidget />
                                <HolaflyBannerWidget />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 섹션 3: 현지 100% 즐기기 */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-5 bg-orange-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-gray-800">🌴 현지 100% 즐기기</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-5">
                        <ToolkitCard icon={MapPin} title="지도 및 명소" type="map_poi" data={guideData?.categories?.map_poi || guideData?.map_poi} location={location} essentialGuide={guideData} themeColor="default" />
                        <ToolkitCard icon={Train} title="교통 및 패스" type="transport" data={guideData?.categories?.transport || guideData?.transport} isSponsored location={location} essentialGuide={guideData} themeColor="default" />
                        <ToolkitCard icon={Smartphone} title="필수 앱" type="apps" data={guideData?.categories?.apps || guideData?.apps} location={location} essentialGuide={guideData} themeColor="default" />
                    </div>
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
            {showScrollToTop && (
                <button
                    type="button"
                    onClick={scrollPlannerToTop}
                    className="fixed bottom-24 right-4 z-50 flex items-center gap-1.5 rounded-full border border-blue-200/80 bg-white/95 py-2.5 pl-3 pr-3.5 text-[11px] font-bold text-blue-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-blue-50 md:bottom-10 md:right-8"
                    aria-label="플래너 맨 위로"
                >
                    <ArrowUp size={18} className="shrink-0" />
                    <span className="hidden min-[380px]:inline">맨 위</span>
                </button>
            )}
        </div>
    );
};

export default PlannerTab;
