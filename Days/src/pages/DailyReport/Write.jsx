import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../../shared/api/supabase';
import { Save, ArrowLeft, MapPin, Loader2, Image as ImageIcon, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';

const Write = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 달력에서 보낸 날짜 받기용
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // 1. 날짜 초기값 설정 (달력에서 선택한 날짜가 있으면 그것을, 없으면 오늘 날짜를 사용)
  const [date, setDate] = useState(
    location.state?.preSelectedDate || new Date().toISOString().split('T')[0]
  );

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mapLocation, setMapLocation] = useState(''); // location 변수명 충돌 방지 위해 mapLocation으로 변경
  
  const [imageFiles, setImageFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]); 
  const [existingImages, setExistingImages] = useState([]); 
  const [uploading, setUploading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [recentLocations, setRecentLocations] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      
      // 1. ✨ 현재 로그인한 유저 정보부터 가져옵니다.
      const { data: { user } } = await supabase.auth.getUser();

      // 수정 모드일 때 데이터 불러오기
      if (isEditMode) {
        const { data } = await supabase.from('reports').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setContent(data.content);
          setMapLocation(data.location);
          setDate(data.date);
          setExistingImages(data.images || []); 
        }
      }
      
      // 2. ✨ 최근 위치 가져오기 (내 것만!)
      // user가 있을 때만 쿼리를 날립니다.
      if (user) {
        const { data: historyData } = await supabase
          .from('reports')
          .select('location')
          .eq('user_id', user.id) // 🔥 [핵심] 내 아이디랑 똑같은 것만 가져와!
          .neq('location', null)   // (혹시 모를 빈 값 제외)
          .neq('location', '')     // (빈 문자열 제외)
          .order('date', { ascending: false })
          .limit(20);

        if (historyData) {
          // 중복 제거
          const uniqueLocs = [...new Set(historyData.map(item => item.location))].slice(0, 5);
          setRecentLocations(uniqueLocs);
        }
      }
    };

    loadInitialData();
  }, [id, isEditMode]);
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

    // 저장 시 로그인 체크
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const wantToSignup = window.confirm(
        "작성하신 내용을 저장하려면 로그인이 필요합니다.\n\n회원가입 페이지로 이동하시겠습니까?\n(가입 후 다시 작성해야 할 수 있습니다)"
      );
      if (wantToSignup) {
        navigate('/auth/signup');
      }
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
              <input type="text" 
								className="w-full border p-3 pl-10 rounded-lg bg-gray-50" 
								value={mapLocation} 
								onChange={(e) => setMapLocation(e.target.value)} 
								onFocus={() => setShowSuggestions(true)} 
								// ✨ [추가] 브라우저야, 너는 끼어들지 마. 내가 만든 목록만 보여줄 거야.
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