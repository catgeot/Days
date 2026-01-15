import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Edit, MapPin } from 'lucide-react';

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const getOneReport = async () => {
      const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();
      if (error) console.error("에러:", error);
      else setReport(data);
    };
    getOneReport();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await supabase.from('reports').delete().eq('id', id);
      navigate('/report');
    }
  };

  if (!report) return <div className="p-10">로딩 중...</div>;

  // ✨ 이미지 배열 확보 (없으면 빈 배열)
  const images = report.images || [];

  return (
    <div className="max-w-3xl bg-white border border-gray-200 p-8 rounded-xl shadow-sm mx-auto">
      
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">{report.date}</span>
          <span className="text-gray-500 text-sm flex items-center gap-1 inline-flex"><MapPin size={14} /> {report.location}</span>
        </div>
        <button onClick={() => navigate('/report')} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-6">{report.title}</h1>

      {/* ✨ 스마트 이미지 그리드 (여기가 핵심!) */}
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
                onClick={() => window.open(img, '_blank')} // 클릭하면 원본보기
              />
            </div>
          ))}
        </div>
      )}

      <div className="min-h-[100px] text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
        {report.content}
      </div>

      <div className="mt-10 flex gap-3 border-t pt-6 justify-end">
        <button onClick={() => navigate(`/report/edit/${id}`)} className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"><Edit size={18} /> 수정</button>
        <button onClick={handleDelete} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition-colors"><Trash2 size={18} /> 삭제</button>
      </div>
    </div>
  );
};

export default Detail;