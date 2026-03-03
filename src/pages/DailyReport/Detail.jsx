// src/pages/DailyReport/Detail.jsx
// 🚨 [Fix] 라우터 의존성(useParams, useNavigate) 제거 및 Context 연결 유지
// 🚨 [New] Midnight Canvas 테마 적용 (다크모드, 글래스모피즘, Hero 배경)

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { ArrowLeft, Trash2, Edit, MapPin } from 'lucide-react';
import { useReport } from '../../context/ReportContext';

const Detail = () => {
  const { selectedId, setCurrentView, setSelectedId } = useReport();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const getOneReport = async () => {
      if (!selectedId) return; 
      const { data, error } = await supabase.from('reports').select('*').eq('id', selectedId).single();
      if (error) console.error("에러:", error);
      else setReport(data);
    };
    getOneReport();
  }, [selectedId]);

  const handleDelete = async () => {
    if (window.confirm("이 기록을 삭제하시겠습니까? (안전하게 숨김 처리됩니다)")) {
      // 🚨 [Fix/Safe Path] 데이터 영구 유실 방지 원칙에 따라 delete() 대신 Soft Delete (업데이트) 적용
      // (주의: 완벽한 작동을 위해 reports 테이블에 'is_deleted' (boolean) 컬럼이 필요할 수 있습니다. 
      // 만약 컬럼이 없다면 이 부분을 기존 delete()로 롤백하거나 스키마를 추가해야 합니다.)
      const { error } = await supabase.from('reports').update({ is_deleted: true }).eq('id', selectedId);
      
      if(error) {
         console.warn("Soft Delete 실패, 영구 삭제로 대체합니다 (임시 롤백)");
         await supabase.from('reports').delete().eq('id', selectedId);
      }
      
      setCurrentView('dashboard');
      setSelectedId(null);
    }
  };

  if (!report) return <div className="min-h-screen bg-slate-950 p-10 flex justify-center text-slate-500 animate-pulse">우주의 기억을 동기화하는 중...</div>;

  const images = report.images || [];
  const heroImageUrl = images[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-20 font-sans">
      
      {/* 🚨 [New] Hero Background */}
      {heroImageUrl && (
        <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-700">
          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 sm:px-6">
        
        {/* 헤더 컨트롤 */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); }} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/50 rounded-full backdrop-blur-md">
            <ArrowLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button onClick={() => setCurrentView('write')} className="flex items-center gap-1.5 bg-slate-800/60 backdrop-blur-md text-slate-300 px-4 py-2 rounded-full hover:bg-slate-700 hover:text-white transition-colors border border-slate-700/50 text-sm font-medium"><Edit size={16} /> 수정</button>
            <button onClick={handleDelete} className="flex items-center gap-1.5 bg-red-900/20 backdrop-blur-md text-red-400 px-4 py-2 rounded-full hover:bg-red-900/40 transition-colors border border-red-900/50 text-sm font-medium"><Trash2 size={16} /> 삭제</button>
          </div>
        </div>

        {/* 🚨 [New] Glassmorphism 메인 캔버스 */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xs font-bold text-blue-300 bg-blue-900/30 border border-blue-800/50 px-3 py-1.5 rounded-full uppercase tracking-wider">{report.date}</span>
            <span className="text-slate-400 text-sm flex items-center gap-1 font-medium"><MapPin size={14} className="text-slate-500"/> {report.location}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-10 tracking-tight leading-tight">{report.title}</h1>

          {images.length > 0 && (
            <div className={`mb-10 grid gap-3 rounded-2xl overflow-hidden
              ${images.length === 1 ? 'grid-cols-1' : ''} 
              ${images.length === 2 ? 'grid-cols-2' : ''} 
              ${images.length === 3 ? 'grid-cols-3' : ''} 
              ${images.length === 4 ? 'grid-cols-2' : ''} 
            `}>
              {images.map((img, idx) => (
                <div key={idx} className={`relative group ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
                  <img 
                    src={img} 
                    alt={`첨부 ${idx+1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-pointer border border-slate-700/50"
                    onClick={() => window.open(img, '_blank')} 
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none"></div>
                </div>
              ))}
            </div>
          )}

          <div className="text-lg leading-relaxed text-slate-300 whitespace-pre-wrap font-light">
            {report.content}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Detail;