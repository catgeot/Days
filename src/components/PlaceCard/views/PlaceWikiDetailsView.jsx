import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw, ChevronLeft } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName, countryName, setMediaMode }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [localAiResponse, setLocalAiResponse] = useState(null);

  const aiSectionRef = useRef(null);

  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title, placeId: wikiData?.place_id };
  }, [placeName, wikiData]);

  useEffect(() => {
      setIsAiExpanded(false);
      setLocalAiResponse(null);
      setError(null);
  }, [placeName]);

  const prevAiInfoRef = useRef(wikiData?.ai_practical_info);

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
      setIsAiLoading(false);
    }

    prevAiInfoRef.current = currentInfo;
  }, [wikiData?.ai_practical_info]);

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

      // 클라이언트에서 먼저 [[LOADING]] 상태로 덮어씌워 UI 즉각 동기화 및 폴링 트리거
      await supabase.from('place_wiki').update({ ai_practical_info: '[[LOADING]]' }).eq('place_id', placeId);

      try {
          const { data, error: functionError } = await supabase.functions.invoke('update-place-wiki', {
              body: { placeId, locationName: location }
          });

          if (functionError) {
              console.error("Edge Function Error:", functionError);
              throw new Error("정보를 가져오는데 실패했습니다.");
          }

          if (data && data.success) {
              setLocalAiResponse(data.aiResponse);
          } else {
              throw new Error(data?.error || "AI 응답을 생성하지 못했습니다.");
          }
      } catch (err) {
          console.error('Request Error:', err);
          setError(err.message || "오류가 발생했습니다.");
          // 실패 시 로컬 및 DB 상태 롤백
          await supabase.from('place_wiki').update({ ai_practical_info: null }).eq('place_id', placeId);
      } finally {
          setIsAiLoading(false);
      }
    }
  }, [isAiLoading, wikiData, countryName]); // countryName 추가 (의존성 경고 방지)

  useEffect(() => {
      const handleRemoteRequest = (e) => {
          handleRequestAiInfo(e.detail?.placeName);
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
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <Sparkles size={24} className="text-blue-400" />
                        <h3 className="text-xl font-bold text-white tracking-tight">로컬 왓슨의 안전 여행 노트</h3>
                    </div>

                    {!localAiResponse && isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 size={32} className="text-blue-400 animate-spin" />
                            <p className="text-sm text-gray-400 animate-pulse">최신 실용 정보를 스캔 및 분석하고 있습니다...</p>
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
                                {localAiResponse}
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="text-xs text-gray-500">
                                    {wikiData?.ai_info_updated_at && wikiData.ai_practical_info !== '[[LOADING]]' ?
                                        `마지막 갱신: ${new Date(wikiData.ai_info_updated_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                        : ''}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRequestAiInfo(placeName || wikiData?.title, true);
                                    }}
                                    className="group flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
                                >
                                    <RefreshCw size={14} className="text-gray-400 group-hover:text-amber-400 transition-colors" />
                                    <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">
                                        최신 정보로 다시 묻기
                                    </span>
                                </button>
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

                    <p className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep">
                        {wikiData.summary}
                    </p>

                    {wikiData.sections && wikiData.sections.map((sec, idx) => (
                        <section key={idx} id={`wiki-section-${idx}`} className="pt-8 border-t border-white/10 scroll-mt-8">
                            <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-amber-100 tracking-tight">{sec.title}</h3>
                            <p className="text-sm md:text-base text-gray-400 leading-[1.8] tracking-wide whitespace-pre-line break-keep">{sec.content}</p>
                        </section>
                    ))}

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
                <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 gap-4 animate-fade-in">
                    <BookOpen size={48} className="opacity-20" />
                    <p>아직 이 장소의 백과사전 정보가 준비되지 않았습니다.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default PlaceWikiDetailsView;
