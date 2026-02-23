// src/components/Write.jsx (경로에 맞게 확인)
// 🚨 [Fix] 달력에서 전달한 preSelectedDate를 최우선으로 받도록 날짜 로직 보강
// 🚨 [Fix/Subtraction] 비관적 설계: iOS 및 인앱 브라우저에서 잦은 오류(Silent Fail)를 일으키는 '현재 위치 적용' 기능을 모바일 환경(md 미만)에서 완전히 렌더링 제외(hidden)하여 Safe Path 확보.

import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

import { useReport } from '../../context/ReportContext';

const Write = () => {
  // ✨ [Fix] preSelectedDate 수신 파이프 추가
  const { setCurrentView, selectedId, setSelectedId, preSelectedDate, setPreSelectedDate } = useReport();
  
  const isEditMode = Boolean(selectedId);

  // ✨ [Fix] 달력 날짜가 있으면 그것을, 없으면 KST 기준 오늘 날짜를 사용
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

  // ✨ [New] 컴포넌트를 떠날 때(언마운트) 날짜 캐시를 초기화하여 다음 번 '새 일보 작성' 시 꼬이지 않게 방지 (비관적 설계)
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

  return (
    <div className="max-w-2xl mx-auto min-h-screen pb-20" onClick={() => setShowSuggestions(false)}>
      <div className="flex items-center gap-4 mb-6 pt-6 px-4">
        <button onClick={() => { setCurrentView('dashboard'); setSelectedId(null); setPreSelectedDate(null); }} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? '📝 일보 수정하기' : '🖊️ 새 일보 작성'}</h2>
      </div>

      <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-xl shadow-sm flex flex-col gap-6 mx-4">
        
        {/* 날짜/위치 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold mb-2 text-sm text-gray-600">날짜</label>
            <input type="date" className="w-full border p-3 rounded-lg bg-gray-50 text-gray-900" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
            <label className="block font-bold mb-2 text-sm text-gray-600 flex justify-between">
              위치 
              {/* 🚨 [Fix/Subtraction] 비관적 설계: 모바일(md 미만)에서는 숨기고 PC(md 이상)에서만 노출하여 아이폰 등에서의 오류를 원천 차단 */}
              <button type="button" onClick={handleGetCurrentLocation} disabled={locationLoading} className="hidden md:flex text-xs text-blue-600 items-center gap-1 hover:underline disabled:opacity-50">
                {locationLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                {locationLoading ? '찾는 중...' : '현재 위치 적용'}
              </button>
            </label>
            <div className="relative">
              <input type="text" 
                className="w-full border p-3 pl-10 rounded-lg bg-gray-50 text-gray-900" 
                value={mapLocation} 
                onChange={(e) => setMapLocation(e.target.value)} 
                onFocus={() => setShowSuggestions(true)} 
                autoComplete="off"
              />
              <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                   {recentLocations.map((loc, idx) => (
                      <div key={idx} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center gap-2" onClick={() => { setMapLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="text-gray-400" />{loc}</div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사진 첨부 */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block font-bold text-sm text-gray-600">사진 첨부 (최대 4장)</label>
            <span className="text-xs text-blue-600 font-bold">{existingImages.length + previewUrls.length} / 4</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {existingImages.map((url, idx) => ( <div key={`exist-${idx}`} className="relative aspect-square"><img src={url} className="w-full h-full object-cover rounded-lg border" /><button onClick={() => removeExistingImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button></div> ))}
            {previewUrls.map((url, idx) => ( <div key={`new-${idx}`} className="relative aspect-square"><img src={url} className="w-full h-full object-cover rounded-lg border" /><button onClick={() => removeNewImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={12} /></button></div> ))}
            {(existingImages.length + previewUrls.length) < 4 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                <ImageIcon size={20} /><span className="text-[10px] font-bold mt-1">추가</span>
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 제목/내용 */}
        <div><label className="block font-bold mb-2 text-sm text-gray-600">제목</label><input type="text" className="w-full border p-3 rounded-lg bg-gray-50 text-gray-900 text-lg font-bold" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="block font-bold mb-2 text-sm text-gray-600">내용</label><textarea className="w-full border p-3 rounded-lg h-64 bg-gray-50 text-gray-900 resize-none leading-relaxed" value={content} onChange={(e) => setContent(e.target.value)} /></div>

        <button onClick={handleSave} disabled={uploading} className="bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:bg-gray-400">
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}{uploading ? '사진 업로드 중...' : (isEditMode ? '수정 완료' : '저장하기')}
        </button>

      </div>
    </div>
  );
};

export default Write;