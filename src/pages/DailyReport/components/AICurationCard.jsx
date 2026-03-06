// src/pages/DailyReport/components/AICurationCard.jsx
// 🚨 [Fix/Subtraction] 수정 이유: 
// 1. [Subtraction] onSelectPlace 및 handlePlaceClick 등 모든 라우팅 로직 완전 삭제.
// 2. [UI] 이미지와 제목의 cursor-pointer, 확대 아이콘(Maximize2) 등 링크를 암시하는 모든 요소 제거. 철저한 '정적 매거진' UI로 탈바꿈.

import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Loader2, Compass, ArrowRight, Bookmark, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { useCurationAI } from '../hooks/useLogbookAI'; 

const FALLBACK_DATA = {
  title: "태평양의 순수한 숨결",
  location: "아이투타키", 
  locationEn: "Aitutaki, Cook Islands", 
  description: "아직 대중의 발길이 닿지 않은 순수한 낙원입니다. 뻔한 휴양지에 지치셨다면, 에메랄드빛 라군과 완벽한 밤하늘의 은하수가 기다리는 이곳으로 떠나보세요. 당신의 영혼을 완벽히 환기해 줄 것입니다.",
  imageUrl: "https://images.unsplash.com/photo-1596525166299-d1fc30777bf4?q=80&w=800&auto=format&fit=crop",
  searchKeyword: "Aitutaki tropical island pristine beach clear water landscape"
};

const AICurationCard = () => {
  const { status, setStatus, curationData, generateCuration } = useCurationAI();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingText, setLoadingText] = useState("우주의 궤적을 분석 중...");
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  useEffect(() => {
    if (status !== 'loading') return;
    const texts = [
      "사용자의 기억을 스캔하는 중...",
      "취향의 별자리를 연결하는 중...",
      "완벽한 낙원의 좌표를 수신 중...",
      "가장 순수한 풍경을 렌더링 중..."
    ];
    let i = 0;
    const timer = setInterval(() => {
      setLoadingText(texts[i % texts.length]);
      i++;
    }, 2000);
    return () => clearInterval(timer);
  }, [status]);

  const handleCuration = async () => {
    setIsSaved(false);
    setIsTextExpanded(false); 
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const [reportsRes, savedRes] = await Promise.all([
      supabase.from('reports').select('location').eq('user_id', user.id).eq('is_deleted', false).limit(10),
      supabase.from('saved_trips').select('destination').eq('user_id', user.id).eq('is_bookmarked', true).eq('is_hidden', false).limit(10)
    ]);

    await generateCuration(user, reportsRes.data || [], savedRes.data || [], FALLBACK_DATA);
  };

  const handleSaveCuration = async (e) => {
    e.stopPropagation();
    if (isSaving || isSaved || !curationData) return;
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: existing } = await supabase
        .from('saved_trips')
        .select('id')
        .eq('user_id', user.id)
        .eq('destination', curationData.location) 
        .single();

      if (existing) {
        setIsSaved(true);
        return;
      }

      const { error } = await supabase.from('saved_trips').insert([{
        user_id: user.id,
        destination: curationData.location, 
        is_bookmarked: true,
        curation_data: curationData,
        prompt_summary: curationData.title
      }]);

      if (error) throw error;
      setIsSaved(true);
    } catch (error) {
      console.error("저장 실패:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col md:flex-row h-full min-h-[340px] relative overflow-hidden group">
      
      {status === 'idle' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <div className="w-14 h-14 bg-blue-900/20 rounded-full flex items-center justify-center mb-5 border border-blue-500/20">
            <Compass size={24} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">당신만을 위한 큐레이션</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm font-light">
            지금까지의 기록을 분석하여, 아직 발견하지 못한 완벽한 숨겨진 낙원을 찾아냅니다.
          </p>
          <button 
            onClick={handleCuration}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-lg active:scale-95"
          >
            <Sparkles size={16} /> 낙원 탐색 시작
          </button>
        </div>
      )}

      {status === 'loading' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-1 animate-pulse">{loadingText}</h3>
          <p className="text-xs text-slate-500">당신의 취향과 공명하는 별을 찾고 있습니다.</p>
        </div>
      )}

      {status === 'result' && curationData && (
        <div className="flex flex-col md:flex-row w-full h-full animate-in fade-in zoom-in-95 duration-700">
          
          <div className="w-full md:w-5/12 h-52 md:h-full relative overflow-hidden">
            <img 
              src={curationData.imageUrl} 
              alt={curationData.location} 
              onError={(e) => { e.target.src = FALLBACK_DATA.imageUrl; }}
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105" 
            />
          </div>

          <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col relative z-10">
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded tracking-wider flex-shrink-0">
                  <Sparkles size={10} /> AI CURATION
                </span>
                <p className="flex items-center gap-1 text-slate-400 text-xs font-medium truncate max-w-[150px]">
                  <MapPin size={12} className="flex-shrink-0" /> <span className="truncate">{curationData.location}</span>
                </p>
              </div>
              
              <button 
                onClick={handleSaveCuration}
                className={`p-2 rounded-full transition-all flex-shrink-0 z-20 ${isSaved ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'}`}
                title={isSaved ? "저장됨" : "위시리스트에 저장"}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <Check size={16} /> : <Bookmark size={16} />}
              </button>
            </div>
            
            {/* 🚨 [Fix] 링크/호버 액션 및 커서 변경 완전 삭제 */}
            <h2 className="text-lg md:text-xl font-bold text-white leading-tight mb-3 tracking-tight line-clamp-2">
              {curationData.title}
            </h2>
            
            <div className="mb-6 flex-1">
              <p className={`text-sm text-slate-300 leading-relaxed font-light transition-all duration-300 ${isTextExpanded ? '' : 'line-clamp-3'}`}>
                {curationData.description}
              </p>
              {curationData.description.length > 80 && (
                <button 
                  onClick={() => setIsTextExpanded(!isTextExpanded)}
                  className="mt-2 flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors z-20 relative"
                >
                  {isTextExpanded ? (
                    <><ChevronUp size={14} /> 간략히 보기</>
                  ) : (
                    <><ChevronDown size={14} /> 자세히 보기</>
                  )}
                </button>
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-slate-700/30 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Gateo Intelligence v5.0</span>
              <button 
                onClick={handleCuration}
                className="group/btn flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors z-20 relative"
              >
                <Sparkles size={14} className="group-hover/btn:animate-pulse" />
                다른 낙원 탐색
                <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AICurationCard;