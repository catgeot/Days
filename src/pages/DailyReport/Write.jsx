import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Calendar, MapPin, Cloud, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // ✨ 마법 연결 통로 가져오기

const Write = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // 저장 중인지 확인하는 상태
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    location: '서울 본사',
    weather: '맑음',
    content: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✨ 진짜 저장 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. 유효성 검사
    if (!formData.title || !formData.content) {
      alert("제목과 내용은 필수입니다!");
      return;
    }

    try {
      setLoading(true); // 로딩 시작 (버튼 비활성화)

      // 2. Supabase에 데이터 쏘기
      // 'reports' 테이블에 우리가 쓴 formData를 집어넣어라(insert)!
      const { error } = await supabase
        .from('reports')
        .insert([
          {
            title: formData.title,
            content: formData.content,
            date: formData.date,
            location: formData.location,
            weather: formData.weather
          }
        ]);

      if (error) throw error; // 에러가 있으면 잡아서 경고창 띄우기

      // 3. 성공 시 처리
      alert("✅ 일보가 안전하게 저장되었습니다!");
      navigate('/report'); // 대시보드로 이동

    } catch (error) {
      console.error('저장 실패:', error);
      alert(`저장에 실패했습니다 ㅠㅠ\n원인: ${error.message}`);
    } finally {
      setLoading(false); // 로딩 끝
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      {/* 상단 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">일보 작성</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/report')}
            disabled={loading} // 로딩 중엔 취소 불가
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <X size={18} /> 취소
          </button>
          
          <button 
            onClick={handleSubmit}
            disabled={loading} // 로딩 중엔 중복 클릭 방지
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:bg-blue-400"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 저장 중...
              </>
            ) : (
              <>
                <Save size={18} /> 저장하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 입력 폼 (이전과 동일) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Calendar size={16} /> 날짜
              </label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <MapPin size={16} /> 근무지 / 위치
              </label>
              <input 
                type="text" 
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <Cloud size={16} /> 날씨
              </label>
              <select 
                name="weather"
                value={formData.weather}
                onChange={handleChange}
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="맑음">☀️ 맑음</option>
                <option value="구름">☁️ 구름 많음</option>
                <option value="비">🌧️ 비</option>
                <option value="눈">☃️ 눈</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-600">제목</label>
            <input 
              type="text" 
              name="title"
              placeholder="오늘의 주요 업무 요약"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 text-lg font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
            />
          </div>

          <div className="flex flex-col gap-2 h-96">
            <label className="text-sm font-medium text-gray-600">업무 내용</label>
            <textarea 
              name="content"
              placeholder="자유롭게 작성하세요..."
              value={formData.content}
              onChange={handleChange}
              className="w-full h-full p-4 resize-none border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300 leading-relaxed"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default Write;