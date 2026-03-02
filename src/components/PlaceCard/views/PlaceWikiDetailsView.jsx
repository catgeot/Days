// src/components/PlaceCard/views/PlaceWikiDetailsView.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [New] 위키백과 원문 링크를 제거하고 '제미나이 여행 정보' 요청 버튼으로 교체 (인플레이스 확장).
// 2. [New] usePlaceChat 훅을 연결하여, 현재 페이지 이탈 없이 하단에 AI 답변을 매거진 형식으로 렌더링.
// 3. [Subtraction] 에러 발생 시 복잡한 핸들러 대신 재시도 버튼만 노출하여 단순화 (Pessimistic First).
// 4. [Architecture] 프롬프트는 prompts.js의 getPracticalInfoPrompt를 참조하도록 분리하여 유지보수성 극대화.

import React, { useState } from 'react';
import { BookOpen, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { usePlaceChat } from '../hooks/usePlaceChat';
import { getPracticalInfoPrompt, getSystemPrompt, PERSONA_TYPES } from '../../../pages/Home/lib/prompts'; // 🚨 경로가 맞는지 확인 필요

const PlaceWikiDetailsView = ({ wikiData, isWikiLoading, placeName }) => {
  // 🚨 [New] AI 통신을 위한 훅 및 상태 추가
  const { chatHistory, isAiLoading, error, sendMessage } = usePlaceChat();
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  // 🚨 [New] 정보 요청 핸들러
  const handleRequestAiInfo = () => {
    setIsAiExpanded(true);
    // 이미 데이터를 가져왔거나 로딩 중이면 중복 요청 방지
    if (chatHistory.length === 0 && !isAiLoading) {
      // placeName prop이 없다면 wikiData의 title을 폴백으로 사용
      const location = placeName || wikiData?.title || "이 장소";
      const userPrompt = getPracticalInfoPrompt(location);
      const systemPrompt = getSystemPrompt ? getSystemPrompt(PERSONA_TYPES?.GENERAL || "GENERAL") : "당신은 유능한 로컬 가이드입니다.";
      
      sendMessage(userPrompt, systemPrompt);
    }
  };

  // AI의 응답만 필터링 (user 프롬프트는 화면에 노출하지 않음)
  const aiResponse = chatHistory.find(m => m.role === 'model')?.text;

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
            
            {isWikiLoading ? (
                // 스켈레톤 UI
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
                    
                    {/* 🚨 [Fix/New] 위키백과 링크를 대체하는 제미나이 실전 정보 요청 섹션 */}
                    <div className="pt-10 mt-10 border-t border-white/10">
                        {!isAiExpanded ? (
                            <button 
                                onClick={handleRequestAiInfo}
                                className="group flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 rounded-2xl transition-all duration-300 shadow-lg w-full md:w-auto"
                            >
                                <Sparkles size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-sm md:text-base font-bold text-gray-200 tracking-wide">
                                    제미나이에게 실전 로컬 정보 묻기
                                </span>
                            </button>
                        ) : (
                            <div className="bg-[#0F1115]/80 border border-blue-500/20 rounded-2xl p-6 md:p-8 animate-fade-in-up">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                                    <Sparkles size={24} className="text-blue-400" />
                                    <h3 className="text-xl font-bold text-white tracking-tight">로컬 도슨트의 시크릿 노트</h3>
                                </div>
                                
                                {isAiLoading ? (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                        <Loader2 size={32} className="text-blue-400 animate-spin" />
                                        <p className="text-sm text-gray-400 animate-pulse">현지 최신 정보를 스캔하고 있습니다...</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4 text-gray-400">
                                        <p className="text-sm">정보를 불러오는 중 문제가 발생했습니다.</p>
                                        <button 
                                            onClick={() => {
                                              const location = placeName || wikiData?.title || "이 장소";
                                              sendMessage(getPracticalInfoPrompt(location), "당신은 유능한 로컬 가이드입니다.");
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <RefreshCw size={16} />
                                            <span>다시 시도</span>
                                        </button>
                                    </div>
                                ) : aiResponse ? (
                                    // 매거진 규격 유지 (행간 1.8, 자간 wide)
                                    <div className="text-sm md:text-base text-gray-300 leading-[1.8] tracking-wide whitespace-pre-line break-keep font-light">
                                        {aiResponse}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
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