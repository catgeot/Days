import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const Write = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [existingImages, setExistingImages] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // ✨ [수정] 여기 있던 "로그인 안 했으면 쫓아내는 코드" 삭제함!
    // 이제 누구나 들어올 수 있음.

    const loadInitialData = async () => {
      if (isEditMode) {
        const { data } = await supabase.from('reports').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title); setContent(data.content); setLocation(data.location); setDate(data.date);
          setExistingImages(data.images || []); 
        }
      }
      // 최근 위치 등은 로그인 안 하면 안 나올 수 있으나 에러는 안 나게 처리됨
      const { data: historyData } = await supabase.from('reports').select('location').order('date', { ascending: false }).limit(20);
      if (historyData) {
        const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
        setRecentLocations(uniqueLocs);
      }
    };
    loadInitialData();
  }, [id, isEditMode]);

  const handleGetCurrentLocation = () => { /* 기존 코드 유지 (길어서 생략, 그대로 두세요) */ 
    if (!navigator.geolocation) return alert("위치 정보를 지원하지 않습니다.");
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          const addr = data.address;
          const displayAddress = [addr.city || addr.province || '', addr.borough || addr.district || '', addr.quarter || addr.neighbourhood || addr.suburb || ''].filter(Boolean).join(' ');
          setLocation(displayAddress || "위치 정보 없음");
        } catch (e) { setLocation("위치 확인 실패"); } finally { setLocationLoading(false); }
      }, () => { setLocationLoading(false); alert("위치 권한을 확인해주세요."); }
    );
  };

  const handleImageChange = async (e) => { /* 기존 코드 유지 */
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

  // ✨ [핵심] 저장 버튼 누를 때 로그인 체크!
  const handleSave = async () => {
    if (!title) return alert("제목을 입력해주세요!");

    // 1. 여기서 로그인 체크를 합니다.
    const { data: { user } } = await supabase.auth.getUser();

    // 2. 로그인을 안 했다면? -> 회원가입으로 유도
    if (!user) {
      const wantToSignup = window.confirm(
        "작성하신 내용을 저장하려면 로그인이 필요합니다.\n\n회원가입 페이지로 이동하시겠습니까?\n(가입 후 다시 작성해야 할 수 있습니다)"
      );
      if (wantToSignup) {
        navigate('/auth/signup'); // 바로 회원가입으로 보냄
      }
      return; // 저장 로직 중단
    }

    // 3. 로그인 했다면? -> 저장 진행 (기존 로직)
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
        title, content, location: location || '위치 미지정', date,
        images: finalImageUrls, weather: '맑음',
        user_id: user.id 
      };

      if (isEditMode) {
        await supabase.from('reports').update(reportData).eq('id', id);
      } else {
        await supabase.from('reports').insert([reportData]);
      }
      navigate(isEditMode ? `/report/${id}` : '/report');
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
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? '📝 일보 수정하기' : '🖊️ 새 일보 작성'}</h2>
      </div>

      <div className="bg-white p-6 sm:p-8 border border-gray-200 rounded-xl shadow-sm flex flex-col gap-6 mx-4">
        {/* 날짜/위치 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block font-bold mb-2 text-sm text-gray-600">날짜</label>
            <input type="date" className="w-full border p-3 rounded-lg bg-gray-50" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex-1 relative" onClick={(e) => e.stopPropagation()}>
            <label className="block font-bold mb-2 text-sm text-gray-600 flex justify-between">
              위치 <button onClick={handleGetCurrentLocation} disabled={locationLoading} className="text-xs text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50">{locationLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}{locationLoading ? '찾는 중...' : '현재 위치 적용'}</button>
            </label>
            <div className="relative">
              <input type="text" className="w-full border p-3 pl-10 rounded-lg bg-gray-50" value={location} onChange={(e) => setLocation(e.target.value)} onFocus={() => setShowSuggestions(true)} />
              <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
              {showSuggestions && recentLocations.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 overflow-hidden">
                   {recentLocations.map((loc, idx) => (
                      <div key={idx} className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer flex items-center gap-2" onClick={() => { setLocation(loc); setShowSuggestions(false); }}><MapPin size={14} className="text-gray-400" />{loc}</div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사진 첨부 (기존 UI 유지) */}
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
        <div><label className="block font-bold mb-2 text-sm text-gray-600">제목</label><input type="text" className="w-full border p-3 rounded-lg bg-gray-50 text-lg font-bold" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="block font-bold mb-2 text-sm text-gray-600">내용</label><textarea className="w-full border p-3 rounded-lg h-64 bg-gray-50 resize-none leading-relaxed" value={content} onChange={(e) => setContent(e.target.value)} /></div>

        <button onClick={handleSave} disabled={uploading} className="bg-blue-600 text-white p-4 rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 disabled:bg-gray-400">
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}{uploading ? '사진 업로드 중...' : (isEditMode ? '수정 완료' : '저장하기')}
        </button>

      </div>
    </div>
  );
};

export default Write;