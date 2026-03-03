// src/pages/DailyReport/Write.jsx
// 🚨 [Fix] UI 고도화: 스티키 헤더 구축 및 저장/생성 버튼의 명확한 디자인 분리
// 🚨 [Fix] 레이어드 구조: 각 입력 섹션(날짜, 제목, 사진, 본문)을 독립된 카드로 분리
// 🚨 [New] 상태 피드백 강화: 10장 일괄 압축 진행률 및 AI 생성 단계별 텍스트 애니메이션 추가

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X, Sparkles, Undo2 } from 'lucide-react';

import { useReport } from '../../context/ReportContext';
import { useLogbookMedia } from './hooks/useLogbookMedia';
import { useLogbookAI } from './hooks/useLogbookAI';

const Write = () => {
  const { setCurrentView, selectedId, setSelectedId, preSelectedDate, setPreSelectedDate } = useReport();
  const isEditMode = Boolean(selectedId);

  const getLocalDate = () => {
    if (preSelectedDate) return preSelectedDate;
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

  // 🚨 [New] AI 생성 진행 상태 텍스트 (지루함 방지용)
  const [aiLoadingMsg, setAiLoadingMsg] = useState('');

  const { 
    imageFiles, previewUrls, existingImages, setExistingImages, 
    handleImageChange, removeNewImage, removeExistingImage, heroImageUrl,
    isCompressing, compressProgress // 추가된 상태
  } = useLogbookMedia();

  const { 
    isAILoading, backupData, handleAIPolish, handleRestoreBackup 
  } = useLogbookAI(title, setTitle, content, setContent, date, mapLocation);

  // 초기 데이터 로드
  useEffect(() => {
    return () => setPreSelectedDate(null);
  }, [setPreSelectedDate]);

  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (isEditMode && selectedId) {
        const { data } = await supabase.from('reports').select('*').eq('id', selectedId).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setMapLocation(data.location);
          setDate(data.date);
          setExistingImages(data.images || []); 
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
  }, [selectedId, isEditMode, setExistingImages]);

  // 🚨 [New] AI 로딩 시 동적 메시지 변경 로직 (인내심 보완)
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
        await supabase.from('reports').update(reportData).eq('id', selectedId);
        setCurrentView('detail');
      } else {
        await supabase.from('reports').insert([reportData]);
        setCurrentView('dashboard');
        setSelectedId(null);
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative font-sans" onClick={() => setShowSuggestions(false)}>
      
      {/* Hero Background */}
      {heroImageUrl && (
        <div className="fixed inset-0 z-0 opacity-20 transition-opacity duration-1000 pointer-events-none">
          <img src={heroImageUrl} alt="Hero Background" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>
      )}

      {/* 🚨 [New] 스티키 헤더 (컨트롤 타워) */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* 헤더 좌측: 네비게이션 */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); setPreSelectedDate(null); }} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/50 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-semibold text-white/90 hidden sm:block">
            {isEditMode ? 'LogBook 수정' : '새로운 LogBook'}
          </h2>
        </div>

        {/* 헤더 우측: 액션 버튼들 (명확한 디자인 분리) */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* AI 창작 구역 (글래스모피즘 + 네온) */}
          {!backupData ? (
            <div className="flex gap-1 sm:gap-2 bg-slate-900/50 p-1 rounded-full border border-slate-700/50">
              <button onClick={() => handleAIPolish('essay', imageFiles)} disabled={isAILoading || isCompressing} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-purple-200 bg-purple-900/20 border border-purple-500/30 rounded-full hover:bg-purple-800/40 disabled:opacity-50 transition-all">
                {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-purple-400" />}
                <span className="hidden sm:inline">감성 에세이</span>
                <span className="sm:hidden">에세이</span>
              </button>
              <button onClick={() => handleAIPolish('sns', imageFiles)} disabled={isAILoading || isCompressing} className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-bold text-pink-200 bg-pink-900/20 border border-pink-500/30 rounded-full hover:bg-pink-800/40 disabled:opacity-50 transition-all">
                {isAILoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-pink-400" />}
                <span className="hidden sm:inline">SNS 숏폼</span>
                <span className="sm:hidden">숏폼</span>
              </button>
            </div>
          ) : (
            <button onClick={handleRestoreBackup} disabled={isAILoading || isCompressing} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-full hover:bg-slate-700 border border-slate-600 transition-colors">
              <Undo2 size={14} /> 원본 복구
            </button>
          )}

          <div className="w-px h-6 bg-slate-700/50 hidden sm:block"></div>

          {/* 최종 저장 구역 (솔리드 블루) */}
          <button onClick={handleSave} disabled={uploading || isAILoading || isCompressing} className="bg-blue-600 hover:bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:bg-slate-700 disabled:shadow-none transition-all">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span className="hidden sm:inline">{isEditMode ? '수정 완료' : 'GATEO에 기록하기'}</span>
            <span className="sm:hidden">저장</span>
          </button>
        </div>

      </header>

      {/* 🚨 [New] 메인 캔버스: 레이어드 섹션 구조 */}
      <main className="relative z-10 max-w-3xl mx-auto pt-8 pb-24 px-4 sm:px-6 flex flex-col gap-6">
        
        {/* 섹션 1: 날짜 & 위치 카드 */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Date</label>
            <input type="date" className="w-full bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none py-2 text-slate-100 transition-colors" value={date} onChange={(e) => setDate(e.target.value)} disabled={isAILoading || isCompressing} />
          </div>
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
            <label className="flex justify-between text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Location 
              <button type="button" onClick={handleGetCurrentLocation} disabled={locationLoading || isAILoading || isCompressing} className="text-blue-400 items-center gap-1 hover:text-blue-300 transition-colors disabled:opacity-50 hidden md:flex">
                {locationLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />} 현재 위치
              </button>
            </label>
            <div className="relative">
              <input type="text" className="w-full bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none py-2 pl-8 text-slate-100 placeholder-slate-600 transition-colors" value={mapLocation} onChange={(e) => setMapLocation(e.target.value)} onFocus={() => setShowSuggestions(true)} placeholder="어디에 다녀오셨나요?" autoComplete="off" disabled={isAILoading || isCompressing} />
              <MapPin className="absolute left-0 top-2.5 text-slate-500" size={18} />
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-50 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl mt-2 overflow-hidden backdrop-blur-lg">
                   {recentLocations.map((loc, idx) => (<div key={idx} className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer flex items-center gap-3 transition-colors" onClick={() => { setMapLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="text-slate-500" />{loc}</div>))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 섹션 2: 제목 카드 */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-8 shadow-lg">
          <input type="text" className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold text-white placeholder-slate-700 tracking-tight" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isAILoading || isCompressing} />
        </section>

        {/* 섹션 3: 사진 카드 (10장 지원 및 압축 피드백) */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
          
          {/* 🚨 [New] 압축 로딩 오버레이 */}
          {isCompressing && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-blue-400">
              <Loader2 size={36} className="animate-spin mb-4" />
              <p className="font-semibold text-sm">위성 통신망으로 사진을 압축 중입니다...</p>
              <p className="text-xs text-blue-300 mt-2 font-mono">Processing: {compressProgress.current} / {compressProgress.total}</p>
            </div>
          )}

          <div className="flex justify-between items-end mb-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Memories</label>
            <span className="text-xs text-slate-500 font-medium">{existingImages.length + previewUrls.length} / 10</span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
            {existingImages.map((url, idx) => ( <div key={`exist-${idx}`} className="relative aspect-square group"><img src={url} className="w-full h-full object-cover rounded-2xl border border-slate-700/50" /><button onClick={() => removeExistingImage(idx)} disabled={isAILoading || isCompressing} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14} /></button></div> ))}
            {previewUrls.map((url, idx) => ( <div key={`new-${idx}`} className="relative aspect-square group"><img src={url} className="w-full h-full object-cover rounded-2xl border border-slate-700/50" /><button onClick={() => removeNewImage(idx)} disabled={isAILoading || isCompressing} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14} /></button></div> ))}
            {(existingImages.length + previewUrls.length) < 10 && (
              <label className={`aspect-square border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-all ${isAILoading || isCompressing ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon size={24} className="mb-2" /><span className="text-xs font-medium text-center px-1">사진 추가<br/>(일괄 선택)</span>
                <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(e, isAILoading)} className="hidden" disabled={isAILoading || isCompressing} />
              </label>
            )}
          </div>
        </section>

        {/* 섹션 4: 스토리 본문 카드 */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 sm:p-8 shadow-lg relative overflow-hidden min-h-[400px]">
          
          {/* 🚨 [New] AI 생성 로딩 오버레이 (동적 메시지) */}
          {isAILoading && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-purple-400">
              <Loader2 size={36} className="animate-spin mb-4" />
              <p className="font-semibold text-sm animate-pulse text-center px-4">{aiLoadingMsg}</p>
            </div>
          )}

          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Story</label>
          <textarea 
            className="w-full bg-transparent border-none resize-none outline-none text-lg leading-[1.8] text-slate-200 placeholder-slate-700 h-full min-h-[350px]" 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            disabled={isAILoading || isCompressing} 
            placeholder="사진을 여러 장 선택해 올린 뒤, 상단의 [감성 에세이] 버튼을 눌러보세요. AI가 멋진 블로그 글을 작성해 줍니다." 
          />
        </section>

      </main>
    </div>
  );
};

export default Write;