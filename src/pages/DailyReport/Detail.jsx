import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2, Edit } from 'lucide-react'; // 아이콘 추가

const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const getOneReport = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

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

  return (
    <div className="max-w-3xl bg-white border border-gray-200 p-8 rounded-xl shadow-sm">
      
      {/* 상단 정보 */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <div>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded mr-2">
            {report.date}
          </span>
          <span className="text-gray-500 text-sm">
            {report.location} | {report.weather}
          </span>
        </div>
        <button onClick={() => navigate('/report')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* 제목 & 본문 */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">{report.title}</h1>
      <div className="min-h-[200px] text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
        {report.content}
      </div>

      {/* 하단 버튼 그룹 */}
      <div className="mt-10 flex gap-3 border-t pt-6 justify-end">
        
        {/* ✨ [추가] 수정 버튼 */}
        <button 
          onClick={() => navigate(`/report/edit/${id}`)}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
        >
          <Edit size={18} /> 수정
        </button>

        <button 
          onClick={handleDelete}
          className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded hover:bg-red-100 transition-colors"
        >
          <Trash2 size={18} /> 삭제
        </button>
      </div>

    </div>
  );
};

export default Detail;