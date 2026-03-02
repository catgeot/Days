import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { usePlaceChat } from '../hooks/usePlaceChat';
import { getPracticalInfoPrompt, getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts';

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName }) => {
  const { chatHistory, isAiLoading, error, sendMessage } = usePlaceChat();
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  
  // 🚨 [New] 최상단 AI 영역으로 자동 스크롤하기 위한 Ref
  const aiSectionRef = useRef(null);
  
  // 🚨 [Fix] 클로저(Closure) 문제 방지를 위해 최신 데이터를 Ref로 관리 (Pessimistic First)
  const requestInfoRef = useRef({ placeName, wikiTitle: wikiData?.title });
  useEffect(() => {
      requestInfoRef.current = { placeName, wikiTitle: wikiData?.title };
  }, [placeName, wikiData]);

  // 🚨 [New] 정보 요청 핸들러 (NavView 버튼과 하단 버튼 공통 사용)
  const handleRequestAiInfo = useCallback(() => {
    setIsAiExpanded(true);
    
    // 자동 스크롤 트리거 (요청 시작 즉시)
    setTimeout(() => {
        if (aiSectionRef.current) {
            aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);

    if (chatHistory.length === 0 && !isAiLoading) {
      const location = requestInfoRef.current.placeName || requestInfoRef.current.wikiTitle || "이 장소";
      const userPrompt = getPracticalInfoPrompt(location);
      const systemPrompt = getSystemPrompt(PERSONA_TYPES?.GENERAL || "GENERAL");
      
      sendMessage(userPrompt, systemPrompt);
    }
  }, [chatHistory.length, isAiLoading, sendMessage]);

  // 🚨 [New] CustomEvent 리스너 등록 (NavView에서의 원격 요청 수신)
  useEffect(() => {
      const handleRemoteRequest = () => {
          handleRequestAiInfo();
      };
      window.addEventListener('request-ai-info', handleRemoteRequest);
      return () => window.removeEventListener('request-ai-info', handleRemoteRequest);
  }, [handleRequestAiInfo]);

  const aiResponse = chatHistory.find(m => m.role === 'model')?.text;

  // 답변 완료 후 스크롤 보정
  useEffect(() => {
      if (aiResponse && aiSectionRef.current) {
          aiSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  }, [aiResponse]);

  return (
    <div className="w-full h-full flex flex-col p-8 md:p-12 overflow-y-auto text-white custom-scrollbar">
        <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        `}</style>

        <div className="max-w-3xl mx-auto w-full pt-16 md:pt-0 pb-20">
            <h1 className="text-3xl font-bold mb-6 flex items-center gap-3 tracking-tight">
                <BookOpen size={28} className="text-amber-500" />
                GATEO 백과
            </h1>
            
            {/* 🚨 [New] AI 실전 정보 패널 (위키 본문보다 최상단에 배치) */}
            {isAiExpanded && (
                <div ref={aiSectionRef} className="mb-8 bg-[#0F1115]/90 border border-blue-500/30 rounded-2xl p-6 md:p-8 animate-fade-in-up shadow-2xl scroll-mt-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                        <Sparkles size={24} className="text-blue-400" />
                        <h3 className="text-xl font-bold text-white tracking-tight">로컬 도슨트의 실전 여행 노트</h3>
                    </div>
                    
                    {isAiLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 size={32} className="text-blue-400 animate-spin" />
                            <p className="text-sm text-gray-400 animate-pulse">현지의 가장 최신 실용 정보를 스캔하고 있습니다...</p>
                        </div>
                    ) : error ? (
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
                    ) : aiResponse ? (
                        <div className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep font-light">
                            {aiResponse}
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
                    
                    {/* 🚨 [Fix] 모바일 스크롤 유저를 위한 문서 하단 공통 호출 버튼 유지 */}
                    {!isAiExpanded && (
                        <div className="pt-10 mt-10 border-t border-white/10 flex justify-center md:justify-start">
                            <button 
                                onClick={handleRequestAiInfo}
                                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-2xl transition-all duration-300 shadow-lg w-full md:w-auto"
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