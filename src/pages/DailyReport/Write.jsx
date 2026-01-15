import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Save, ArrowLeft, MapPin, History, Loader2 } from 'lucide-react';

const Write = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // 입력값들
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // ✨ 추가된 상태들
  const [locationLoading, setLocationLoading] = useState(false); // 위치 찾는 중?
  const [recentLocations, setRecentLocations] = useState([]); // 최근 위치 목록
  const [showSuggestions, setShowSuggestions] = useState(false); // 자동완성 박스 보여줄까?

  // 1. 초기 데이터 로드 (수정 모드 데이터 & 최근 위치 이력)
  useEffect(() => {
    const loadInitialData = async () => {
      // 1-1. 수정 모드일 때 기존 글 가져오기
      if (isEditMode) {
        const { data } = await supabase.from('reports').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setLocation(data.location);
          setDate(data.date);
        }
      }

      // 1-2. ✨ 최근 작성한 위치 기록 가져오기 (중복 제거)
      const { data: historyData } = await supabase
        .from('reports')
        .select('location')
        .order('date', { ascending: false })
        .limit(20); // 넉넉히 가져와서 중복 제거

      if (historyData) {
        // Set을 이용해 중복 제거 후 상위 5개만 추출
        const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
        setRecentLocations(uniqueLocs);
      }
    };

    loadInitialData();
  }, [id, isEditMode]);

  // ✨ 2. 현재 위치 찾기 함수 (GPS -> 주소 변환)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("브라우저가 위치 정보를 지원하지 않습니다.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // 무료 주소 변환 API (OpenStreetMap Nominatim) 사용
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          // 주소 조합 (도/시 + 구/군 + 동/읍/면)
          const addr = data.address;
          const displayAddress = [
            addr.city || addr.province || '', // 시/도
            addr.borough || addr.district || '', // 구/군
            addr.quarter || addr.neighbourhood || addr.suburb || '' // 동
          ].filter(Boolean).join(' ');

          setLocation(displayAddress || "위치 정보 없음");
        } catch (error) {
          console.error("주소 변환 실패:", error);
          setLocation("위치 확인 실패 (직접 입력)");
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error("GPS 에러:", error);
        alert("위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.");
        setLocationLoading(false);
      }
    );
  };

  // 저장 함수
  const handleSave = async () => {
    if (!title) return alert("제목을 입력해주세요!");

    const reportData = {
      title,
      content,
      location: location || '위치 미지정',
      date,
      weather: '맑음'
    };

    let error;

    if (isEditMode) {
      const response = await supabase.from('reports').update(reportData).eq('id', id);
      error = response.error;
    } else {
      const response = await supabase.from('reports').insert([reportData]);
      error = response.error;
    }

    if (error) {
      alert("저장 실패!");
      console.error(error);
    } else {
      navigate(isEditMode ? `/report/${id}` : '/report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-20" onClick={() => setShowSuggestions(false)}>
      
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditMode ? '📝 일보 수정하기' : '🖊️ 새 일보 작성'}
        </h2>
      </div>

      <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-xl shadow-sm flex flex-col gap-6">
        
        {/* 날짜 & 위치 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold mb-2 text-sm text-gray-600">날짜</label>
            <input 
              type="date"
              className="w-full border p-3 rounded-lg focus:outline-blue-500 bg-gray-50 font-medium"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}> 
            <label className="block font-bold mb-2 text-sm text-gray-600 flex justify-between">
              위치
              {/* ✨ 현재 위치 버튼 */}
              <button 
                onClick={handleGetCurrentLocation}
                disabled={locationLoading}
                className="text-xs text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                {locationLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                {locationLoading ? '찾는 중...' : '현재 위치 적용'}
              </button>
            </label>
            
            <div className="relative">
              <input 
                type="text"
                className="w-full border p-3 pl-10 rounded-lg focus:outline-blue-500 bg-gray-50"
                placeholder="예: 서울 강남구 현장"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onFocus={() => setShowSuggestions(true)} // 클릭하면 목록 보여주기
                autoComplete="off"
              />
              <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />

              {/* ✨ 최근 위치 자동완성 드롭다운 */}
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-500 flex items-center gap-1 border-b border-gray-100">
                    <History size={12} /> 최근 사용한 위치
                  </div>
                  <ul>
                    {recentLocations.map((loc, idx) => (
                      <li 
                        key={idx}
                        className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setLocation(loc);
                          setShowSuggestions(false);
                        }}
                      >
                        <MapPin size={14} className="text-gray-400" />
                        {loc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label className="block font-bold mb-2 text-sm text-gray-600">제목</label>
          <input 
            type="text"
            className="w-full border p-3 rounded-lg focus:outline-blue-500 bg-gray-50 text-lg font-bold placeholder-gray-300"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="block font-bold mb-2 text-sm text-gray-600">내용</label>
          <textarea 
            className="w-full border p-3 rounded-lg h-64 focus:outline-blue-500 bg-gray-50 resize-none leading-relaxed placeholder-gray-300"
            placeholder="오늘 진행한 업무 내용을 상세히 기록해주세요."
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