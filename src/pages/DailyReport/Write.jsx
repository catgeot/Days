// src/pages/DailyReport/Write.jsx (경로에 맞게 확인)
// 🚨 [Fix] 달력에서 전달한 preSelectedDate를 최우선으로 받도록 날짜 로직 보강
// 🚨 [Fix/Subtraction] 비관적 설계: 모바일 환경 '현재 위치 적용' 렌더링 제외 (Safe Path)
// 🚨 [New] GATEO 정체성 반영: 'Midnight Canvas' 다크/글래스모피즘 UI 전면 적용

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X, Sparkles, Undo2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { useReport } from '../../context/ReportContext';
import { getLogbookPrompt } from '../Home/lib/prompts'; 
import { apiClient } from '../../pages/Home/lib/apiClient';

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
  
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [existingImages, setExistingImages] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isAILoading, setIsAILoading] = useState(false);
  const [backupData, setBackupData] = useState(null);

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
        const { data: historyData } = await supabase
          .from('reports')
          .select('location')
          .eq('user_id', user.id) 
          .neq('location', null)  
          .neq('location', '')    
          .order('date', { ascending: false })
          .limit(20);

        if (historyData) {
          const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
          setRecentLocations(uniqueLocs);
        }
      }
    };

    loadInitialData();
  }, [selectedId, isEditMode]);

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

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    const totalCount = existingImages.length + imageFiles.length + files.length;
    if (totalCount > 4) { alert("사진은 최대 4장까지만 업로드 가능합니다."); return; }
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    try {
      const compressedFiles = await Promise.all(files.map(file => imageCompression(file, options)));
      setImageFiles(prev => [...prev, ...compressedFiles]);
      const newPreviews = compressedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    } catch (error) { console.error("이미지 압축 실패:", error); }
  };

  const removeNewImage = (index) => { setImageFiles(prev => prev.filter((_, i) => i !== index)); setPreviewUrls(prev => prev.filter((_, i) => i !== index)); };
  const removeExistingImage = (index) => { setExistingImages(prev => prev.filter((_, i) => i !== index)); };

  // 🚨 [Fix] 시뮬레이터 제거 및 실제 Gemini API 클라이언트 연결
  const handleAIPolish = async (mode) => {
    if (!content.trim()) {
      alert("AI가 변환할 내용이 없습니다. 키워드나 짧은 메모라도 먼저 작성해주세요.");
      return;
    }

    // 비관적 설계: 통신 전 원본 데이터 백업
    setBackupData({ title, content });
    setIsAILoading(true);

    try {
      // 1. 환경 변수 검증 (Safe Path)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("시스템 오류: AI 통신 키가 존재하지 않습니다.");
        setIsAILoading(false);
        return;
      }

      // 2. 프롬프트 생성
      const prompt = getLogbookPrompt(mode, date, mapLocation, content);
      
      // 3. API 호출
      // getLogbookPrompt에서 이미 페르소나와 지시사항이 완결된 형태로 나오므로, 
      // systemInstruction은 기본값으로 두고 userText에 통합된 프롬프트를 전달합니다.
      const resultText = await apiClient.fetchGeminiResponse(
        apiKey,
        [], // history (단발성 요청이므로 빈 배열)
        "다음 사용자의 메모를 지시사항에 맞게 변환해주세요.", // systemInstruction
        prompt // userText
      );

      // 4. 결과 적용
      setContent(resultText); 
      if (!title) setTitle(`${mapLocation ? mapLocation : '어느 멋진 곳'}에서의 기록`);
      
    } catch (error) {
      console.error("AI 변환 실패:", error);
      alert("AI 변환 통신 중 오류가 발생했습니다. 원본을 안전하게 유지합니다.");
      // 실패 시 즉각 롤백
      setTitle(backupData.title);
      setContent(backupData.content);
      setBackupData(null);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleRestoreBackup = () => {
    if (!backupData) return;
    setTitle(backupData.title);
    setContent(backupData.content);
    setBackupData(null);
  };

  const handleSave = async () => {
    if (!title) return alert("제목을 입력해주세요!");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("작성하신 내용을 저장하려면 로그인이 필요합니다.");
      return;
    }

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

      const reportData = {
        title,
        content,
        location: mapLocation || '위치 미지정',
        date,
        images: finalImageUrls,
        weather: '맑음',
        user_id: user.id 
      };

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

  // 🚨 [New] Hero 배경 이미지 결정 로직 (업로드된 첫 번째 사진)
  const heroImageUrl = previewUrls[0] || existingImages[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden pb-20 font-sans" onClick={() => setShowSuggestions(false)}>
      
      {/* 🚨 [New] Hero Background (Glassmorphism & Blur Effect) */}
      {heroImageUrl && (
        <div className="absolute inset-0 z-0 opacity-20 transition-opacity duration-700">
          <img src={heroImageUrl} alt="Hero Background" className="w-full h-full object-cover blur-3xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto pt-8 px-4 sm:px-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); setPreSelectedDate(null); }} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800/50 rounded-full backdrop-blur-md">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-semibold tracking-tight text-white/90">
            {isEditMode ? 'LogBook 수정' : '새로운 LogBook'}
          </h2>
        </div>

        {/* 🚨 [New] Glassmorphism 메인 캔버스 */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col gap-8">
          
          {/* 날짜/위치 입력 (Borderless) */}
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Date</label>
              <input type="date" className="w-full bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none py-2 text-slate-100 transition-colors" value={date} onChange={(e) => setDate(e.target.value)} disabled={isAILoading} />
            </div>
            
            <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
              <label className="flex justify-between text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Location
                <button type="button" onClick={handleGetCurrentLocation} disabled={locationLoading || isAILoading} className="hidden md:flex text-blue-400 items-center gap-1 hover:text-blue-300 transition-colors disabled:opacity-50">
                  {locationLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                  현재 위치
                </button>
              </label>
              <div className="relative">
                <input type="text" 
                  className="w-full bg-transparent border-b border-slate-700 focus:border-blue-500 outline-none py-2 pl-8 text-slate-100 placeholder-slate-600 transition-colors" 
                  value={mapLocation} 
                  onChange={(e) => setMapLocation(e.target.value)} 
                  onFocus={() => setShowSuggestions(true)} 
                  placeholder="어디에 다녀오셨나요?"
                  autoComplete="off"
                  disabled={isAILoading}
                />
                <MapPin className="absolute left-0 top-2.5 text-slate-500" size={18} />
                
                {/* 🚨 [New] 드롭다운 다크 테마 적용 */}
                {showSuggestions && recentLocations.length > 0 && (
                  <div className="absolute z-50 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl mt-2 overflow-hidden backdrop-blur-lg">
                     {recentLocations.map((loc, idx) => (
                        <div key={idx} className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer flex items-center gap-3 transition-colors" onClick={() => { setMapLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="text-slate-500" />{loc}</div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제목 입력 (타이포그래피 강조) */}
          <div>
            <input type="text" className="w-full bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold text-white placeholder-slate-700 tracking-tight" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isAILoading} />
          </div>

          {/* 사진 첨부 영역 */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Memories</label>
              <span className="text-xs text-slate-500 font-medium">{existingImages.length + previewUrls.length} / 4</span>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {existingImages.map((url, idx) => ( <div key={`exist-${idx}`} className="relative aspect-square group"><img src={url} className="w-full h-full object-cover rounded-2xl border border-slate-700/50" /><button onClick={() => removeExistingImage(idx)} disabled={isAILoading} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14} /></button></div> ))}
              {previewUrls.map((url, idx) => ( <div key={`new-${idx}`} className="relative aspect-square group"><img src={url} className="w-full h-full object-cover rounded-2xl border border-slate-700/50" /><button onClick={() => removeNewImage(idx)} disabled={isAILoading} className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14} /></button></div> ))}
              {(existingImages.length + previewUrls.length) < 4 && (
                <label className={`aspect-square border border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-all ${isAILoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <ImageIcon size={24} className="mb-2" /><span className="text-xs font-medium">사진 추가</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" disabled={isAILoading} />
                </label>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-slate-800/80 my-2"></div>
          
          {/* 내용 및 AI 다듬기 영역 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Story</label>
              
              {/* 🚨 [New] AI 컨트롤 영역 (Neon Glow) */}
              {!backupData ? (
                <div className="flex gap-2">
                  <button onClick={() => handleAIPolish('essay')} disabled={isAILoading} className="group relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-purple-200 bg-purple-900/40 border border-purple-500/30 rounded-full hover:bg-purple-800/60 disabled:opacity-50 transition-all overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                    {isAILoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-purple-400 group-hover:animate-pulse" />}
                    감성 에세이
                  </button>
                  <button onClick={() => handleAIPolish('sns')} disabled={isAILoading} className="group relative flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-pink-200 bg-pink-900/40 border border-pink-500/30 rounded-full hover:bg-pink-800/60 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(236,72,153,0.2)] hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                    {isAILoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-pink-400 group-hover:animate-pulse" />}
                    SNS 숏폼
                  </button>
                </div>
              ) : (
                <button onClick={handleRestoreBackup} disabled={isAILoading} className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-300 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors border border-slate-600">
                  <Undo2 size={14} />
                  원본 복구
                </button>
              )}
            </div>

            <textarea 
              className={`w-full bg-transparent border-none resize-none outline-none text-lg leading-relaxed text-slate-200 placeholder-slate-700 min-h-[300px] ${isAILoading ? 'opacity-50' : ''}`} 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              disabled={isAILoading} 
              placeholder={isAILoading ? "AI가 영감을 불어넣고 있습니다..." : "머릿속에 맴도는 단어나 짧은 문장들을 툭툭 던져보세요. AI가 완벽한 이야기로 다듬어 드립니다."} 
            />
          </div>

        </div>

        {/* 저장 버튼 (플로팅 스타일) */}
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={uploading || isAILoading} className="bg-blue-600/90 backdrop-blur-md text-white px-8 py-4 rounded-full font-bold hover:bg-blue-500 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] active:scale-95 disabled:bg-slate-700 disabled:shadow-none">
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {uploading ? '위성 업로드 중...' : (isEditMode ? '수정 완료' : 'GATEO에 기록하기')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Write;