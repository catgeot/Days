import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { usePlaceChat } from '../hooks/usePlaceChat';
import { getPracticalInfoPrompt, getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';
import { supabase } from '../../../shared/api/supabase'; // 🚨 DB 연동을 위한 Supabase import

const CACHE_VALID_DAYS = 14; // 캐시 유효 기간 설정

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName }) => {
  const { chatHistory, isAiLoading, error, sendMessage } = usePlaceChat();
  
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  const [localAiResponse, setLocalAiResponse] = useState(null); // 🚨 화면 렌더링용 독립 상태 (DB 또는 API 응답 저장)
  
  const aiSectionRef = useRef(null);
  
  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title };
  }, [placeName, wikiData]);

  // 장소가 바뀌면 AI 확장 패널 상태 초기화
  useEffect(() => {
      setIsAiExpanded(false);
      setLocalAiResponse(null);
  }, [placeName]);

  // 🚨 캐시 유효성 검사 (Pessimistic: 날짜 데이터가 이상하면 무조건 만료 처리)
  const checkIsCacheValid = (updatedAt) => {
      if (!updatedAt) return false;
      try {
          const diffTime = Math.abs(new Date() - new Date(updatedAt));
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= CACHE_VALID_DAYS;
      } catch (e) {
          return false;
      }
  };

  const handleRequestAiInfo = useCallback((eventOrRemoteName) => {
    setIsAiExpanded(true);
    
    setTimeout(() => {
        if (aiSectionRef.current) {
            aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);

    // 이미 화면에 렌더링된 응답이 있다면 추가 로직 스킵
    if (localAiResponse) return;

    // 🚨 1. DB 캐시 확인 로직
    const hasCachedInfo = wikiData?.ai_practical_info;
    const isCacheFresh = checkIsCacheValid(wikiData?.ai_info_updated_at);

    if (hasCachedInfo && isCacheFresh) {
        // 캐시 데이터가 유효하면 API 호출 없이 즉시 렌더링
        setLocalAiResponse(wikiData.ai_practical_info);
        return;
    }

    // 🚨 2. API 호출 (캐시가 없거나 만료된 경우)
    if (chatHistory.length === 0 && !isAiLoading) {
      const isClickEvent = eventOrRemoteName && typeof eventOrRemoteName === 'object' && 'type' in eventOrRemoteName;
      const remoteName = isClickEvent ? null : eventOrRemoteName;
      const location = remoteName || requestInfoRef.current.placeName || requestInfoRef.current.wikiTitle || "이 장소";
      
      const userPrompt = getPracticalInfoPrompt(location);
      const systemPrompt = getSystemPrompt(PERSONA_TYPES?.GENERAL || "GENERAL");
      
      sendMessage(userPrompt, systemPrompt);
    }
  }, [localAiResponse, chatHistory.length, isAiLoading, sendMessage, wikiData]);

  // 원격 이벤트 수신
  useEffect(() => {
      const handleRemoteRequest = (e) => {
          handleRequestAiInfo(e.detail?.placeName);
      };
      window.addEventListener('request-ai-info', handleRemoteRequest);
      return () => window.removeEventListener('request-ai-info', handleRemoteRequest);
  }, [handleRequestAiInfo]);

  // 🚨 API 응답 감지 및 DB 백그라운드 업데이트 로직
  useEffect(() => {
      const latestModelMsg = chatHistory.find(m => m.role === 'model')?.text;
      
      // 제미나이로부터 새로운 응답이 도착했고, 그것이 현재 렌더링된 값과 다를 경우
      if (latestModelMsg && latestModelMsg !== localAiResponse) {
          setLocalAiResponse(latestModelMsg); // 화면 업데이트
          
          if (aiSectionRef.current) {
              aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // 🚨 백그라운드 DB 저장 (Pessimistic: 실패해도 화면 동작에는 영향 없음)
          const updateDbCache = async () => {
              // 테이블 구조에 맞춰 place_id 추출 (없으면 무시)
              const targetPlaceId = wikiData?.place_id; 
              if (!targetPlaceId) return;

              try {
                  const { error } = await supabase
                      .from('place_wiki')
                      .update({
                          ai_practical_info: latestModelMsg,
                          ai_info_updated_at: new Date().toISOString()
                      })
                      .eq('place_id', String(targetPlaceId));
                  
                  if (error) console.warn("AI Info Cache Update Failed:", error);
              } catch (e) {
                  // DB에 컬럼이 아직 없거나 에러가 나더라도 무시 (서비스 정상 작동)
              }
          };
          
          updateDbCache();
      }
  }, [chatHistory, localAiResponse, wikiData]);

  return (
    <div className="w-full h-full flex flex-col p-6 pt-24 pb-32 md:p-12 overflow-y-auto text-white custom-scrollbar relative">
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
                        <h3 className="text-xl font-bold text-white tracking-tight">로컬 도슨트의 실전 여행 노트</h3>
                    </div>
                    
                    {/* 로컬 상태(localAiResponse)를 기준으로 렌더링 로직 통일 */}
                    {!localAiResponse && isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 size={32} className="text-blue-400 animate-spin" />
                            <p className="text-sm text-gray-400 animate-pulse">최신 실용 정보를 스캔 및 분석하고 있습니다...</p>
                        </div>
                    ) : !localAiResponse && error ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-400">
                            <p className="text-sm">정보를 불러오는 중 문제가 발생했습니다.</p>
                            <button 
                                onClick={() => {
                                    const location = placeName || wikiData?.title || "이 장소";
                                    sendMessage(getPracticalInfoPrompt(location), getSystemPrompt("GENERAL"));
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                            >
                                <RefreshCw size={16} />
                                <span>다시 시도</span>
                            </button>
                        </div>
                    ) : localAiResponse ? (
                        <div className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep font-light">
                            {localAiResponse}
                        </div>
                    ) : null}
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
                <div className="space-y-8 animate-fade-in">
                    <p className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide bg-white/5 p-5 md:p-6 rounded-2xl border border-white/10 shadow-lg whitespace-pre-line break-keep">
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
                                    제미나이에게 실전 로컬 정보 묻기
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