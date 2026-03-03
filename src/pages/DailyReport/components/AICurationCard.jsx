// src/pages/DailyReport/components/AICurationCard.jsx
// 🚨 [Fix] 2-Column 구조(col-span-2)에 맞춰 레이아웃을 좌우 분할(PC) 및 상하 분할(Mobile)로 반응형 와이드 개편
// 🚨 [Fix/New] 조그만 재실행 아이콘을 없애고, 직관적이고 세련된 "✨ 다른 낙원 탐색하기" 텍스트 버튼으로 승격

import React, { useState } from 'react';
import { Sparkles, MapPin, Loader2, Compass, ArrowRight } from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { apiClient } from '../../Home/lib/apiClient';

const FALLBACK_DATA = {
  title: "상업화되지 않은 태평양의 숨결",
  location: "라로통가, 쿡 제도 (Rarotonga)",
  description: "아직 대중의 발길이 닿지 않은 순수한 낙원입니다. 뻔한 휴양지에 지치셨다면, 에메랄드빛 라군과 완벽한 밤하늘의 은하수가 기다리는 이곳으로 떠나보세요. 당신의 영혼을 완벽히 환기해 줄 것입니다.",
  imageUrl: "https://images.unsplash.com/photo-1596525166299-d1fc30777bf4?q=80&w=800&auto=format&fit=crop"
};

const AICurationCard = () => {
  const [status, setStatus] = useState('idle'); 
  const [curationData, setCurationData] = useState(null);

  const handleCuration = async () => {
    setStatus('loading');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("로그인이 필요합니다.");

      const [reportsRes, savedRes] = await Promise.all([
        supabase.from('reports').select('location, title, content, is_deleted').eq('user_id', user.id).limit(10),
        supabase.from('saved_trips').select('destination, prompt_summary, is_bookmarked, is_hidden').eq('user_id', user.id).eq('is_bookmarked', true).limit(10)
      ]);

      const validReports = (reportsRes.data || []).filter(r => r.is_deleted !== true);
      const validSaved = (savedRes.data || []).filter(s => s.is_hidden !== true);
      const totalDataCount = validReports.length + validSaved.length;

      if (totalDataCount < 3) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCurationData(FALLBACK_DATA);
        setStatus('result');
        return;
      }

      const userDataText = `
        [사용자의 과거 기록] ${validReports.map(r => `- ${r.location}`).join(', ')}
        [사용자의 북마크] ${validSaved.map(s => `- ${s.destination}`).join(', ')}
      `;

      const systemPrompt = `당신은 세계 곳곳의 숨겨진 명소를 잘 아는 GATEO의 수석 여행 큐레이터입니다. 
      위키백과식 설명이 아닌, 감성적이고 매혹적인 톤으로 딱 1곳의 '대중에게 덜 알려졌으나, 사용자의 취향에 완벽히 맞는 숨겨진 낙원'을 추천하세요.
      응답은 반드시 JSON 형식으로만 출력하세요:
      {
        "location": "국가, 도시명",
        "title": "매혹적인 한 줄 제목",
        "description": "추천 이유와 장소의 매력을 담은 3~4줄의 감성적인 설명",
        "searchKeyword": "Unsplash 검색용 영어 키워드"
      }`;

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API Key 누락");

      const resultText = await apiClient.fetchGeminiResponse(apiKey, [], systemPrompt, userDataText);
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON 파싱 실패");
      const parsedData = JSON.parse(jsonMatch[0]);

      const unsplashKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
      let finalImageUrl = FALLBACK_DATA.imageUrl;

      if (unsplashKey && parsedData.searchKeyword) {
        const images = await apiClient.fetchUnsplashImages(unsplashKey, parsedData.searchKeyword);
        if (images && images.length > 0) finalImageUrl = images[0].urls.regular;
      }

      setCurationData({
        title: parsedData.title,
        location: parsedData.location,
        description: parsedData.description,
        imageUrl: finalImageUrl
      });
      setStatus('result');

    } catch (error) {
      console.warn("🚨 큐레이션 에러, Fallback 작동:", error);
      setCurationData(FALLBACK_DATA);
      setStatus('result');
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl flex flex-col md:flex-row h-full min-h-[300px] relative overflow-hidden group">
      
      {/* 1. IDLE 상태 */}
      {status === 'idle' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <div className="w-14 h-14 bg-blue-900/20 rounded-full flex items-center justify-center mb-5 border border-blue-500/20">
            <Compass size={24} className="text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">당신만을 위한 큐레이션</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            지금까지의 기록과 취향을 분석하여, 아직 발견하지 못한 완벽한 숨겨진 낙원을 찾아냅니다.
          </p>
          <button 
            onClick={handleCuration}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95"
          >
            <Sparkles size={16} /> 낙원 탐색 시작
          </button>
        </div>
      )}

      {/* 2. LOADING 상태 */}
      {status === 'loading' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-1 animate-pulse">우주의 궤적을 분석 중...</h3>
          <p className="text-sm text-slate-400">취향과 공명하는 별을 찾고 있습니다.</p>
        </div>
      )}

      {/* 3. RESULT 상태 (🚨 와이드 레이아웃 적용) */}
      {status === 'result' && curationData && (
        <div className="flex flex-col md:flex-row w-full h-full animate-in fade-in duration-700">
          
          {/* 좌측(Mobile 상단): Hero 이미지 영역 */}
          <div className="w-full md:w-5/12 h-48 md:h-full relative overflow-hidden">
            <img 
              src={curationData.imageUrl} 
              alt={curationData.location} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
            />
            {/* 자연스러운 그라데이션 경계선 */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-900/20 to-slate-900/90 md:to-slate-900/80"></div>
          </div>

          {/* 우측(Mobile 하단): 타이포그래피 및 내용 영역 */}
          <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-center relative z-10 bg-slate-900/40 md:bg-transparent">
            
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-900/40 border border-blue-500/30 text-blue-300 text-[10px] font-bold rounded-sm uppercase tracking-wider">
                <Sparkles size={10} /> AI Pick
              </span>
              <p className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                <MapPin size={12} /> {curationData.location}
              </p>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-4 tracking-tight drop-shadow-sm">
              {curationData.title}
            </h2>
            
            <p className="text-sm text-slate-300 leading-relaxed font-light mb-6 flex-1">
              {curationData.description}
            </p>

            {/* 🚨 [Fix] 명확한 텍스트형 재탐색 버튼 */}
            <div className="mt-auto pt-4 border-t border-slate-700/50 flex justify-end">
              <button 
                onClick={handleCuration}
                className="group/btn flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-blue-400 transition-colors"
              >
                <Sparkles size={14} className="group-hover/btn:animate-pulse" />
                다른 낙원 탐색하기
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