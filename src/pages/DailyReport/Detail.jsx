// 🚨 [Fix/New] 라우터 의존성(useParams, useNavigate) 제거 및 Context 연결

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { ArrowLeft, Trash2, Edit, MapPin } from 'lucide-react';

// 🚨 [New] 전역 리모컨 로드
import { useReport } from '../../context/ReportContext';

const Detail = () => {
  // 🚨 [Fix] 파이프 교체: 라우터 대신 Context에서 selectedId 가져오기
  const { selectedId, setCurrentView, setSelectedId } = useReport();
  
  const [report, setReport] = useState(null);

  useEffect(() => {
    const getOneReport = async () => {
      if (!selectedId) return; // 🚨 [비관적 설계] ID가 없으면 중단
      const { data, error } = await supabase.from('reports').select('*').eq('id', selectedId).single();
      if (error) console.error("에러:", error);
      else setReport(data);
    };
    getOneReport();
  }, [selectedId]);

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await supabase.from('reports').delete().eq('id', selectedId);
      // 🚨 [Fix] 삭제 후 대시보드로 복귀 및 ID 초기화
      setCurrentView('dashboard');
      setSelectedId(null);
    }
  };

  if (!report) return <div className="p-10 flex justify-center text-gray-500">데이터를 불러오는 중입니다...</div>;

  const images = report.images || [];

  return (
    <div className="max-w-3xl bg-white border border-gray-200 p-8 rounded-xl shadow-sm mx-auto">
      
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">{report.date}</span>
          <span className="text-gray-500 text-sm flex items-center gap-1 inline-flex"><MapPin size={14} /> {report.location}</span>
        </div>
        {/* 🚨 [Fix] 뒤로가기 버튼: 대시보드로 전환 */}
        <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); }} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">{report.title}</h1>

      {images.length > 0 && (
        <div className={`mb-8 grid gap-2 rounded-xl overflow-hidden
          ${images.length === 1 ? 'grid-cols-1' : ''} 
          ${images.length === 2 ? 'grid-cols-2' : ''} 
          ${images.length === 3 ? 'grid-cols-3' : ''} 
          ${images.length === 4 ? 'grid-cols-2' : ''} 
        `}>
          {images.map((img, idx) => (
            <div key={idx} className={`relative ${images.length === 1 ? 'aspect-video' : 'aspect-square'}`}>
              <img 
                src={img} 
                alt={`첨부 ${idx+1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                onClick={() => window.open(img, '_blank')} 
              />
            </div>
          ))}
        </div>
      )}

      <div className="min-h-[100px] text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
        {report.content}
      </div>

      <div className="mt-10 flex gap-3 border-t pt-6 justify-end">
        {/* 🚨 [Fix] 수정 버튼: 라우터 이동 대신 뷰를 'write'로 전환 (selectedId는 유지됨) */}
        <button onClick={() => setCurrentView('write')} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"><Edit size={18} /> 수정</button>
        <button onClick={handleDelete} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition-colors"><Trash2 size={18} /> 삭제</button>
      </div>
    </div>
  );
};

export default Detail;