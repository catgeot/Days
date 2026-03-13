// src/pages/DailyReport/Write.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [UX/UI] 시인성 개선을 위한 '번호 기반 단계별 레이아웃' 도입 ([01]~[03])
// 2. [Affordance] 입력 영역에 명확한 테두리(Border)와 포커스 하이라이트 추가하여 입력 지점 명확화.
// 3. [Contextual AI] AI 작가 기능을 본문 영역 바로 위로 전진 배치하여 접근성 강화.
// 4. [Copywriting] 질문형 플레이스홀더를 통해 사용자의 작성 의도 가이드.

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X, Sparkles, Undo2, Calendar } from 'lucide-react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import { useLogbookMedia } from './hooks/useLogbookMedia';
import { useLogbookAI } from './hooks/useLogbookAI';

const Write = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const isEditMode = Boolean(id);

  const getLocalDate = () => {
    const dateParam = searchParams.get('date');
    if (dateParam) return dateParam;
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mapLocation, setMapLocation] = useState(''); 
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiLoadingMsg, setAiLoadingMsg] = useState('');

  const { 
    imageFiles, previewUrls, existingImages, setExistingImages, 
    handleImageChange, removeNewImage, removeExistingImage, heroImageUrl,
    isCompressing, compressProgress 
  } = useLogbookMedia();

  const { 
    isAILoading, backupData, handleAIPolish, handleRestoreBackup 
  } = useLogbookAI(title, setTitle, content, setContent, date, mapLocation);

  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (isEditMode && id) {
        const { data } = await supabase.from('reports').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setMapLocation(data.location);
          setDate(data.date);
          setExistingImages(data.images || []); 
        } else {
          alert('존재하지 않는 기록입니다.');
          navigate('/report', { replace: true });
        }
      }
      
      if (user) {
        const { data: historyData } = await supabase.from('reports').select('location').eq('user_id', user.id).neq('location', null).neq('location', '').order('date', { ascending: false }).limit(20);
        if (historyData) {
          const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
          setRecentLocations(uniqueLocs);
        }
      }
    };
    loadInitialData();
  }, [id, isEditMode, setExistingImages, navigate]);

  useEffect(() => {
    if (isAILoading) {
      const msgs = ["위성 통신망 연결 중...", "사진 속 감성을 읽어내는 중...", "문장의 맥락을 조율하는 중...", "마지막 퇴고를 진행 중입니다..."];
      let i = 0;
      setAiLoadingMsg(msgs[0]);
      const timer = setInterval(() => {
        i = (i + 1) % msgs.length;
        setAiLoadingMsg(msgs[i]);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isAILoading]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert("위치 정보를 지원하지 않습니다.");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const addr = data.address;
          const displayAddress = [addr.city || addr.province || '', addr.borough || addr.district || '', addr.quarter || addr.neighbourhood || addr.suburb || ''].filter(Boolean).join(' ');
          setMapLocation(displayAddress || "위치 정보 없음");
        } catch (e) { setMapLocation("위치 확인 실패"); } finally { setLocationLoading(false); }
      }, () => { setLocationLoading(false); alert("위치 권한을 확인해주세요."); }
    );
  };

  const handleSave = async () => {
    if (!title) return alert("제목을 입력해주세요!");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("로그인이 필요합니다.");

    setUploading(true);
    let finalImageUrls = [...existingImages];

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { error } = await supabase.storage.from('images').upload(fileName, file);
        if (error) throw error;
        const { data } = supabase.storage.from('images').getPublicUrl(fileName);
        return data.publicUrl;
      });

      const newUrls = await Promise.all(uploadPromises);
      finalImageUrls = [...finalImageUrls, ...newUrls];

      const reportData = { title, content, location: mapLocation || '위치 미지정', date, images: finalImageUrls, weather: '맑음', user_id: user.id };

      if (isEditMode) {
        await supabase.from('reports').update(reportData).eq('id', id);
        navigate(`/report/${id}`);
      } else {
        await supabase.from('reports').insert([reportData]);
        navigate('/report');
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative font-sans" onClick={() => setShowSuggestions(false)}>
      
      {heroImageUrl && (
        <div className="fixed inset-0 z-0 opacity-10 transition-opacity duration-1000 pointer-events-none">
          <img src={heroImageUrl} alt="Hero Background" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
        </div>
      )}

      {/* 🚨 [Fix] 헤더 디자인 보강 (시인성) */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-2xl border-b border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-900 transition-all p-2.5 bg-gray-100 rounded-xl border border-gray-200 hover:border-gray-300">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">
              {isEditMode ? '기록 수정하기' : '새로운 여정 기록'}
            </h2>
            <p className="text-[10px] text-blue-500 font-mono uppercase tracking-widest mt-0.5">Logbook Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {backupData && (
            <button onClick={handleRestoreBackup} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100/80 rounded-full border border-gray-200 hover:bg-gray-200 transition-all">
              <Undo2 size={14} /> <span className="hidden sm:inline">원본 복구</span>
            </button>
          )}
          <button onClick={handleSave} disabled={uploading || isAILoading || isCompressing} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-blue-500/60 active:scale-95 transition-all disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isEditMode ? '기록 업데이트' : 'GATEO에 저장'}</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto pt-10 pb-32 px-4 sm:px-8 flex flex-col gap-12">
        
        {/* 🚨 [01] 여정 정보 섹션 */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">01</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">여정의 기본 정보</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 날짜 입력창 입체감 강화 */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all focus-within:border-blue-400 focus-within:bg-blue-50/50">
              <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-widest">
                <Calendar size={12} /> Travel Date
              </label>
              <input type="date" className="w-full bg-transparent outline-none text-xl font-bold text-gray-900 transition-colors" value={date} onChange={(e) => setDate(e.target.value)} disabled={isAILoading || isCompressing} />
            </div>

            {/* 위치 입력창 입체감 강화 */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all focus-within:border-blue-400 focus-within:bg-blue-50/50 relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-3">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <MapPin size={12} /> Location
                </label>
                <button type="button" onClick={handleGetCurrentLocation} disabled={locationLoading} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                   {locationLoading ? <Loader2 size={10} className="animate-spin" /> : "현재 위치 찾기"}
                </button>
              </div>
              <input type="text" className="w-full bg-transparent outline-none text-xl font-bold text-gray-900 placeholder-gray-400 transition-colors" value={mapLocation} onChange={(e) => setMapLocation(e.target.value)} onFocus={() => setShowSuggestions(true)} placeholder="어디의 공기를 담아왔나요?" autoComplete="off" disabled={isAILoading || isCompressing} />
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden backdrop-blur-xl">
                   {recentLocations.map((loc, idx) => (<div key={idx} className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-all" onClick={() => { setMapLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="opacity-50" />{loc}</div>))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 🚨 [02] 추억(사진) 섹션 */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">02</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">장면의 포착</h3>
          </div>

          <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 hover:border-gray-300 transition-all relative">
            {isCompressing && (
              <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-600 rounded-3xl">
                <Loader2 size={36} className="animate-spin mb-4" />
                <p className="font-bold text-sm">기록의 용량을 최적화 중...</p>
                <p className="text-[10px] text-blue-500 mt-2 font-mono">Progress: {compressProgress.current} / {compressProgress.total}</p>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {existingImages.map((url, idx) => ( 
                <div key={`exist-${idx}`} className="relative aspect-square group">
                  <img src={url} className="w-full h-full object-cover rounded-2xl border border-gray-200 group-hover:border-gray-300 transition-all" />
                  <button onClick={() => removeExistingImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md scale-0 group-hover:scale-100 transition-transform"><X size={12} /></button>
                </div> 
              ))}
              {previewUrls.map((url, idx) => ( 
                <div key={`new-${idx}`} className="relative aspect-square group">
                  <img src={url} className="w-full h-full object-cover rounded-2xl border border-blue-300 group-hover:border-blue-400 transition-all" />
                  <button onClick={() => removeNewImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md scale-0 group-hover:scale-100 transition-transform"><X size={12} /></button>
                </div> 
              ))}
              {(existingImages.length + previewUrls.length) < 10 && (
                <label className="aspect-square border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-all group">
                  <ImageIcon size={28} className="mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-center">Add Moment</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(e, isAILoading)} className="hidden" disabled={isAILoading || isCompressing} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-500 mt-6 text-center font-bold tracking-widest uppercase">Max 10 images / High-Quality Compression Applied</p>
          </div>
        </section>

        {/* 🚨 [03] 이야기 섹션 (가장 중요) */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 border border-blue-200 text-[10px] font-black text-blue-600">03</span>
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em]">기록의 완성</h3>
          </div>

          <div className="flex flex-col gap-4">
            {/* 제목 섹션 */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 focus-within:border-blue-400 transition-all">
              <input type="text" className="w-full bg-transparent outline-none text-2xl sm:text-4xl font-black text-gray-900 placeholder-gray-400 tracking-tight" placeholder="이번 여정을 한 문장으로 정의한다면?" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isAILoading || isCompressing} />
            </div>

            {/* 본문 및 AI 툴바 섹션 */}
            <div className="bg-gray-50/80 backdrop-blur-md border border-gray-200 rounded-3xl p-6 sm:p-8 focus-within:border-blue-400 transition-all relative min-h-[500px] flex flex-col">
              
              {/* 🚨 [New] Contextual AI Toolbar: 본문 바로 위에서 도움 받기 */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Storytelling</label>
                <div className="flex gap-2">
                  <button onClick={() => handleAIPolish('essay', imageFiles)} disabled={isAILoading || isCompressing} className="group flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 text-purple-600 rounded-full text-[10px] font-black hover:bg-purple-100 hover:text-purple-700 transition-all">
                    <Sparkles size={12} className="group-hover:animate-spin" /> AI 에세이 작가
                  </button>
                  <button onClick={() => handleAIPolish('sns', imageFiles)} disabled={isAILoading || isCompressing} className="group flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 text-pink-600 rounded-full text-[10px] font-black hover:bg-pink-100 hover:text-pink-700 transition-all">
                    <Sparkles size={12} className="group-hover:animate-pulse" /> AI SNS 인플루언서
                  </button>
                </div>
              </div>

              {isAILoading && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center text-purple-600 rounded-3xl">
                  <Loader2 size={40} className="animate-spin mb-6" />
                  <p className="font-black text-sm animate-pulse text-center px-8 tracking-tight">{aiLoadingMsg}</p>
                </div>
              )}

              <textarea 
                className="w-full bg-transparent border-none resize-none outline-none text-lg leading-[2] text-gray-800 placeholder-gray-400 flex-1 min-h-[400px]" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                disabled={isAILoading || isCompressing} 
                placeholder="떠오르는 파편화된 기억들을 자유롭게 적어보세요. 사진을 올리고 위쪽의 AI 버튼을 누르면 투박한 메모가 아름다운 기록으로 변합니다." 
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Write;