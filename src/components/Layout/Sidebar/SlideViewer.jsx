import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../lib/supabase'; // 경로 주의 (깊어졌으므로 ../ 추가)

const SlideViewer = ({ isOpen, onClose, slides, user }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const fileInputRef = useRef(null);

  // 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setCurrentSlideIndex(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  // 자동 재생
  useEffect(() => {
    let interval;
    if (isOpen && isPlaying && slides.length > 1) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, slides]);

  // 슬라이드 이동 함수들
  const nextSlide = (e) => { e?.stopPropagation(); setCurrentSlideIndex((prev) => (prev + 1) % slides.length); };
  const prevSlide = (e) => { e?.stopPropagation(); setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length); };
  
  const togglePlay = (e) => {
    e.stopPropagation();
    if (!isPlaying) setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setIsPlaying(!isPlaying);
  };

  // 프로필 업로드 (내부 로직)
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 3, maxWidthOrHeight: 2560, useWebWorker: true, fileType: 'image/jpeg' };
      const compressedFile = await imageCompression(file, options);
      const fileName = `${user.id}_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('profiles').upload(fileName, compressedFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName);
      await supabase.auth.updateUser({ data: { avatar_url: `${publicUrl}?t=${Date.now()}` } });
      alert("프로필 사진이 업데이트 되었습니다!");
      window.location.reload(); 
    } catch (error) { console.error(error); alert("업로드 실패"); }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fade-in group">
      <div className="absolute inset-0" onClick={onClose}></div>
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-20 bg-black/50 p-2 rounded-full"><X size={32} /></button>

      <div className="relative w-full h-full flex items-center justify-center pointer-events-none p-4">
        {slides.length > 0 ? (
          <div className="relative pointer-events-auto shadow-2xl group/image max-h-[85vh] max-w-[95vw] flex items-center justify-center">
            <img src={slides[currentSlideIndex]} alt="Slide" className="max-h-[85vh] max-w-[95vw] w-auto h-auto object-contain transition-opacity duration-500 select-none"/>
            <div className="absolute inset-0 z-0 cursor-pointer" onClick={togglePlay} title={isPlaying ? "일시정지" : "재생"}/>
            {slides.length > 1 && (
              <>
                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all z-10"><ChevronLeft size={32} /></button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-all z-10"><ChevronRight size={32} /></button>
              </>
            )}
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center"><ImageIcon size={64} /><p className="mt-4">표시할 사진이 없습니다.</p></div>
        )}
      </div>

      <div className="absolute bottom-8 z-20 flex items-center gap-6 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-black/60 transition-all">
        <span className="text-white/80 font-mono text-sm border-r border-white/20 pr-6 mr-0"> {currentSlideIndex + 1} / {slides.length || 0} </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest"> {isPlaying ? "Playing" : "Paused"} </span>
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors ml-4"> <Camera size={16} /> 프로필 변경 </button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
    </div>,
    document.body
  );
};

export default SlideViewer;