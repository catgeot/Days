import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { parseAiPracticalInfo } from '../../../utils/aiDataParser';
import CopyableText from '../common/CopyableText';
import PlaceMiniMap from '../common/PlaceMiniMap';
import { WIKI_AUTO_UPDATE_DAYS } from '../../../shared/constants';

const LOADING_MESSAGES_NEW = [
    "지역 위키백과 정보 분석 및 연동 중...",
    "핵심 랜드마크와 역사적 배경 스캔 중...",
    "여행자를 위한 실용적인 로컬 팁 추출 중...",
    "날씨, 문화, 예절 등 필수 지식 정리 중...",
    "명소 주변 숨겨진 핫플레이스 탐색 중...",
    "AI가 최종 로컬 왓슨 노트를 완성하는 중..."
];

const LOADING_MESSAGES_UPDATE = [
    "기존 로컬 왓슨 노트를 불러오는 중...",
    "최근 변경된 현지 이슈와 팁을 확인하는 중...",
    "새로운 여행 트렌드를 기반으로 데이터 비교 중...",
    "변경 사항을 반영하여 정보를 재조립하는 중...",
    "AI가 최종 로컬 왓슨 노트를 검수하는 중..."
];

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName, countryName, location, galleryData, setMediaMode, isActive }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [localAiResponse, setLocalAiResponse] = useState(null);
  const [localUpdatedAt, setLocalUpdatedAt] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const isUpdatingExisting = !!wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';
  const currentMessages = isUpdatingExisting ? LOADING_MESSAGES_UPDATE : LOADING_MESSAGES_NEW;

  const aiSectionRef = useRef(null);

  useEffect(() => {
      let interval;
      if (isAiLoading) {
          setLoadingStep(0);
          interval = setInterval(() => {
              setLoadingStep((prev) => (prev < currentMessages.length - 1 ? prev + 1 : prev));
          }, 4000);
      }
      return () => clearInterval(interval);
  }, [isAiLoading, currentMessages]);

  // 🔒 [Phase 9-3 Fix] placeId는 placeName(한글명) 사용 - wikiData 없어도 작동
  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id || placeName };
  }, [placeName, wikiData]);

  useEffect(() => {
      setIsAiExpanded(false);
      setLocalAiResponse(null);
      setLocalUpdatedAt(null);
      setError(null);
  }, [placeName]);

  const prevAiInfoRef = useRef(wikiData?.ai_practical_info);

  const handleRequestAiInfo = useCallback(async (eventOrRemoteName, forceUpdate = false) => {
    setIsAiExpanded(true);

    setTimeout(() => {
        if (aiSectionRef.current) {
            aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);

    // 수동 갱신이 아니고 이미 캐시된 정상 응답이 있다면 로컬 상태로 표시 (네트워크 호출 안 함)
    const hasCachedInfo = wikiData?.ai_practical_info && wikiData.ai_practical_info !== '[[LOADING]]';

    if (!forceUpdate && hasCachedInfo) {
        console.log("[PlaceWikiDetailsView] 기존 캐시된 응답 있음 - 네트워크 호출 생략");
        setIsAiLoading(true);
        // [조절가능] 이미 저장된 정보를 불러올 때도 AI가 '스캔 및 분석'하는 듯한 신뢰성 있는 대기 시간(텀)을 주는 곳
        // 현재 2500ms(2.5초)로 설정되어 있으며, 필요에 따라 이 숫자를 변경하시면 됩니다.
        setTimeout(() => {
            setLocalAiResponse(wikiData.ai_practical_info);
            setIsAiLoading(false);
        }, 3000);
        return;
    }

    if (!isAiLoading || forceUpdate) {
      console.log(`[PlaceWikiDetailsView] API 요청 시작 (location: ${eventOrRemoteName}, forceUpdate: ${forceUpdate})`);
      const isClickEvent = eventOrRemoteName && typeof eventOrRemoteName === 'object' && 'type' in eventOrRemoteName;
      const remoteName = isClickEvent ? null : eventOrRemoteName;
      let location = remoteName || requestInfoRef.current.placeName || requestInfoRef.current.wikiTitle || "이 장소";

      if (countryName && countryName !== "Explore" && countryName !== "Ocean" && countryName !== "바다" && countryName !== "해양" && !location.includes(countryName)) {
          location = `${location} ${countryName}`;
      }

      const placeId = requestInfoRef.current.placeId;

      if (!placeId) {
          setError("장소 정보를 확인할 수 없습니다.");
          return;
      }

      setIsAiLoading(true);
      setError(null);
      setLocalAiResponse(null);

      // 🔒 [Phase 9-3 Fix] RLS 정책으로 인해 클라이언트에서 DB 직접 조작 불가
      // Edge Function(Service Role)에서 UPSERT로 모든 DB 작업 처리
      console.log("[PlaceWikiDetailsView] Edge Function에서 DB 레코드 생성/업데이트 처리");

      // 기존 정보 보관 (에러 시 복구용)
      const oldAiInfo = wikiData?.ai_practical_info !== '[[LOADING]]' ? wikiData?.ai_practical_info : localAiResponse;

      try {
          console.log("[PlaceWikiDetailsView] Supabase Edge Function 호출");
          const { data, error: functionError } = await supabase.functions.invoke('update-place-wiki', {
              body: { placeId, locationName: location, oldAiInfo, forceUpdate }
          });

          if (functionError) {
              console.error("[PlaceWikiDetailsView] Edge Function Error:", functionError);
              throw new Error("정보를 가져오는데 실패했습니다.");
          }

          console.log("[PlaceWikiDetailsView] Edge Function 호출 완료 - 응답 데이터:", data);

          if (data && data.success) {
              setLocalAiResponse(data.aiResponse);
              setLocalUpdatedAt(new Date().toISOString());
          } else {
              throw new Error(data?.error || "AI 응답을 생성하지 못했습니다.");
          }
      } catch (err) {
          console.error('Request Error:', err);
          setError(err.message || "오류가 발생했습니다.");
          // 🔒 [Phase 9-3 Fix] RLS 정책으로 클라이언트 롤백 불가
          // Edge Function에서 에러 시 자동 롤백 처리됨 (index.ts:193-208)
      } finally {
          setIsAiLoading(false);
      }
    }
  }, [isAiLoading, wikiData, countryName]); // countryName 추가 (의존성 경고 방지)

  // --- 14일 경과 시 백그라운드 자동 갱신 (Lazy Update) ---
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
                  console.log(`[Wiki] ${WIKI_AUTO_UPDATE_DAYS}일 경과 자동 갱신 실행 (${diffDays}일 지남)`);
                  autoUpdateTriggered.current = true;
                  handleRequestAiInfo(placeName || wikiData.title, true);
              }
          }
      }
  }, [isActive, wikiData?.ai_practical_info, wikiData?.ai_info_updated_at, placeName, handleRequestAiInfo]);


  // DB에서 주기적으로 폴링된 데이터 상태 감지 (백그라운드 로딩 상태 동기화)
  useEffect(() => {
    const currentInfo = wikiData?.ai_practical_info;
    const prevInfo = prevAiInfoRef.current;

    if (currentInfo === '[[LOADING]]') {
      setIsAiExpanded(true);
      setIsAiLoading(true);
      setLocalAiResponse(null);
      setError(null);
    } else if (prevInfo === '[[LOADING]]' && currentInfo && currentInfo !== '[[LOADING]]') {
      // DB 폴링으로 로딩 중이었다가 실제 데이터가 들어온 경우에만 동기화
      setLocalAiResponse(currentInfo);
      if (wikiData?.ai_info_updated_at) {
          setLocalUpdatedAt(wikiData.ai_info_updated_at);
      }
      setIsAiLoading(false);
    }

    prevAiInfoRef.current = currentInfo;
  }, [wikiData?.ai_practical_info, wikiData?.ai_info_updated_at]);

  useEffect(() => {
      const handleRemoteRequest = (e) => {
          handleRequestAiInfo(e.detail?.placeName, e.detail?.forceUpdate);
      };
      window.addEventListener('request-ai-info', handleRemoteRequest);
      return () => window.removeEventListener('request-ai-info', handleRemoteRequest);
  }, [handleRequestAiInfo]);

  return (
    <div className="w-full h-full flex flex-col p-6 pt-[96px] pb-32 md:p-12 overflow-y-auto text-white custom-scrollbar relative">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        <div className="max-w-3xl mx-auto w-full pt-4 md:pt-0 pb-20">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 tracking-tight">
                <BookOpen size={28} className="text-amber-500" />
                GATEO 백과
            </h1>

            {isAiExpanded && (
                <div ref={aiSectionRef} className="mb-8 bg-[#0F1115]/90 border border-blue-500/30 rounded-2xl p-6 md:p-8 animate-fade-in-up shadow-2xl scroll-mt-6">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Sparkles size={24} className="text-blue-400" />
                            <h3 className="text-xl font-bold text-white tracking-tight">로컬 왓슨의 안전 여행 노트</h3>
                        </div>
                        {(!isAiLoading && localAiResponse) && (
                            <button
                                onClick={() => handleRequestAiInfo(placeName || wikiData?.title, true)}
                                className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-full transition-colors border border-blue-500/30 flex items-center gap-1.5 group"
                                title="AI 툴킷 강제 최신화 (관리자/테스트용)"
                            >
                                <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span className="text-[11px] font-bold hidden md:inline">강제 갱신</span>
                            </button>
                        )}
                    </div>

                    {!localAiResponse && isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-full max-w-sm space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm font-bold text-gray-300">
                                        {isUpdatingExisting ? "AI 정보 점검 중" : "AI 정보 생성 중"}
                                    </span>
                                    <span className="text-xs font-bold text-blue-400">
                                        {Math.round((loadingStep / (currentMessages.length - 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out"
                                        style={{ width: `${(loadingStep / (currentMessages.length - 1)) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 font-medium h-6 justify-center mt-4">
                                    <Loader2 size={14} className="animate-spin text-blue-400" />
                                    <span className="animate-pulse">{currentMessages[loadingStep]}</span>
                                </div>
                            </div>
                        </div>
                    ) : !localAiResponse && error ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-400">
                            <p className="text-sm">정보를 불러오는 중 문제가 발생했습니다.</p>
                            <button
                                onClick={() => handleRequestAiInfo(placeName || wikiData?.title)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                            >
                                <RefreshCw size={16} />
                                <span>다시 시도</span>
                            </button>
                        </div>
                    ) : localAiResponse ? (
                        <div className="flex flex-col gap-6">
                            <div className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep font-light">
                                <CopyableText text={parseAiPracticalInfo(localAiResponse).wikiContent || localAiResponse} locationName={placeName || wikiData?.title} type="wiki" />
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="text-xs text-gray-500">
                                    {(localUpdatedAt || wikiData?.ai_info_updated_at) && wikiData?.ai_practical_info !== '[[LOADING]]' ?
                                        `마지막 갱신: ${new Date(localUpdatedAt || wikiData.ai_info_updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                        : ''}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}

            {isAiExpanded && localAiResponse && (
                <div className="flex items-center justify-center my-12 opacity-50">
                    <div className="h-[1px] w-12 bg-gray-500"></div>
                    <div className="px-4 text-gray-500"><BookOpen size={16} /></div>
                    <div className="h-[1px] w-12 bg-gray-500"></div>
                </div>
            )}

            {isWikiLoading ? (
                <div className="space-y-8 animate-pulse">
                    <div className="h-32 bg-white/5 rounded-2xl border border-white/10 w-full"></div>
                    <div className="space-y-4 pt-8 border-t border-white/10">
                        <div className="h-8 bg-white/10 rounded w-1/3"></div>
                        <div className="space-y-2">
                            <div className="h-4 bg-white/5 rounded w-full"></div>
                            <div className="h-4 bg-white/5 rounded w-5/6"></div>
                            <div className="h-4 bg-white/5 rounded w-4/6"></div>
                        </div>
                    </div>
                </div>
            ) : wikiData ? (
                <div className="space-y-8 animate-fade-in bg-white/[0.02] p-6 md:p-8 rounded-3xl border border-white/5">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <BookOpen size={22} className="text-gray-400" />
                        <h2 className="text-lg md:text-xl font-bold text-gray-300 tracking-tight">위키백과 기본 정보</h2>
                    </div>

                    {location?.lat && location?.lng && (
                        <PlaceMiniMap lat={location.lat} lng={location.lng} name={location.name} />
                    )}

                    <p className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep">
                        {wikiData.summary}
                    </p>

                    {wikiData.sections && wikiData.sections.map((sec, idx) => {
                        const images = galleryData?.images || [];
                        // 첫 번째 이미지는 대표 이미지로 사용될 가능성이 높으므로 인덱스 1부터 시작
                        const imageForSection = images.length > 0 ? images[(idx + 1) % images.length] : null;

                        return (
                            <section key={idx} id={`wiki-section-${idx}`} className="pt-8 border-t border-white/10 scroll-mt-8">
                                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-amber-100 tracking-tight">{sec.title}</h3>
                                <p className="text-sm md:text-base text-gray-400 leading-[1.8] tracking-wide whitespace-pre-line break-keep">{sec.content}</p>

                                {/* 짝수 번째 섹션마다 이미지 추가하여 매거진 느낌 연출 */}
                                {imageForSection && idx % 2 === 0 && (
                                    <div className="mt-8 mb-2 rounded-2xl overflow-hidden border border-white/10 bg-white/5 relative group animate-fade-in">
                                        <img
                                            src={imageForSection.urls?.regular || imageForSection.urls?.small}
                                            alt={imageForSection.alt_description || `${sec.title} 관련 이미지`}
                                            className="w-full h-48 md:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <p className="text-xs text-gray-300 truncate font-medium">
                                                {imageForSection.alt_description || imageForSection.description || 'Photo by ' + (imageForSection.user?.name || 'Unknown')}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </section>
                        );
                    })}

                    {!isAiExpanded && (
                        <div className="fixed md:static bottom-0 left-0 w-full md:w-auto p-4 pb-8 md:p-0 md:pb-8 md:pt-10 md:mt-10 bg-[#05070a]/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-white/10 flex justify-center md:justify-start z-[160] md:z-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:shadow-none animate-fade-in-up md:animate-none">
                            <button
                                onClick={handleRequestAiInfo}
                                className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-2xl transition-all duration-300 shadow-lg w-full md:w-auto"
                            >
                                <Sparkles size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm md:text-base font-bold text-gray-200 tracking-wide">
                                    AI에게 안전 로컬 정보 묻기
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-col items-center justify-center h-[40vh] text-gray-500 gap-4 animate-fade-in">
                        <BookOpen size={48} className="opacity-20" />
                        <p className="text-center">아직 이 장소의 백과사전 정보가 준비되지 않았습니다.</p>
                    </div>

                    {/* 🆕 [Phase 9-3] wikiData 없을 때 모바일에서만 하단 버튼 표시 */}
                    {!isAiExpanded && (
                        <div className="fixed md:hidden bottom-0 left-0 w-full p-4 pb-8 bg-[#05070a]/90 backdrop-blur-xl border-t border-white/10 flex justify-center z-[160] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] animate-fade-in-up">
                            <button
                                onClick={handleRequestAiInfo}
                                className="group flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-2xl transition-all duration-300 shadow-lg w-full"
                            >
                                <Sparkles size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm font-bold text-gray-200 tracking-wide">
                                    AI에게 안전 로컬 정보 묻기
                                </span>
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};

export default PlaceWikiDetailsView;
