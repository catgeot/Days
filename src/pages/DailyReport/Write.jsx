import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // useParams 추가
import { supabase } from '../../lib/supabase';
import { Save, ArrowLeft } from 'lucide-react';

const Write = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ✨ 주소창에 id가 있으면 '수정 모드'입니다.
  const isEditMode = Boolean(id); // id가 있으면 true, 없으면 false

  // 입력값들
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('서울 본사');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // 날짜 추가

  // ✨ [수정 모드일 때] 기존 데이터 불러오기
  useEffect(() => {
    if (isEditMode) {
      const loadData = async () => {
        const { data } = await supabase.from('reports').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setLocation(data.location);
          setDate(data.date);
        }
      };
      loadData();
    }
  }, [id, isEditMode]);

  // 저장 함수 (신규 vs 수정 분기 처리)
  const handleSave = async () => {
    if (!title) return alert("제목을 입력해주세요!");

    const reportData = {
      title,
      content,
      location,
      date, // 날짜도 수정 가능하게 변경
      weather: '맑음'
    };

    let error;

    if (isEditMode) {
      // ✨ 수정(Update) : id가 일치하는 녀석을 덮어씀
      const response = await supabase.from('reports').update(reportData).eq('id', id);
      error = response.error;
    } else {
      // ✨ 신규(Insert) : 새로 추가함
      const response = await supabase.from('reports').insert([reportData]);
      error = response.error;
    }

    if (error) {
      alert("저장 실패!");
      console.error(error);
    } else {
      alert(isEditMode ? "수정되었습니다!" : "작성되었습니다!");
      navigate(isEditMode ? `/report/${id}` : '/report'); // 수정 후엔 상세페이지로, 작성 후엔 목록으로
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">
          {isEditMode ? '📝 일보 수정하기' : '🖊️ 새 일보 작성'}
        </h2>
      </div>

      <div className="bg-white p-8 border border-gray-200 rounded-xl shadow-sm flex flex-col gap-6">
        
        {/* 날짜 & 위치 (한 줄에 배치) */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-bold mb-2 text-sm text-gray-600">날짜</label>
            <input 
              type="date"
              className="w-full border p-3 rounded-lg focus:outline-blue-500 bg-gray-50"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block font-bold mb-2 text-sm text-gray-600">위치</label>
            <input 
              type="text"
              className="w-full border p-3 rounded-lg focus:outline-blue-500 bg-gray-50"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block font-bold mb-2 text-sm text-gray-600">제목</label>
          <input 
            type="text"
            className="w-full border p-3 rounded-lg focus:outline-blue-500 bg-gray-50 text-lg font-bold"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block font-bold mb-2 text-sm text-gray-600">내용</label>
          <textarea 
            className="w-full border p-3 rounded-lg h-64 focus:outline-blue-500 bg-gray-50 resize-none leading-relaxed"
            placeholder="오늘의 업무 내용을 적어주세요."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* 저장 버튼 */}
        <button 
          onClick={handleSave} 
          className="bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Save size={20} />
          {isEditMode ? '수정 완료' : '저장하기'}
        </button>

      </div>
    </div>
  );
};

export default Write;