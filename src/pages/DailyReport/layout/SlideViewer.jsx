import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../shared/api/supabase';

const SlideViewer = ({ isOpen, onClose, slides, user }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentSlideIndex(0);
      setIsPlaying(true);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isOpen && isPlaying && slides.length > 1) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isOpen, isPlaying, slides]);

  const nextSlide = (e) => { e?.stopPropagation(); setCurrentSlideIndex((prev) => (prev + 1) % slides.length); };
  const prevSlide = (e) => { e?.stopPropagation(); setCurrentSlideIndex((prev) => (prev - 1 + slides.length) % slides.length); };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!isPlaying) setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    setIsPlaying(!isPlaying);
  };

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
      alert("프로필 사진이 업데이트 되었습니다.");
      window.location.reload();
    } catch (error) { console.error(error); alert("업로드 실패"); }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center animate-fade-in group">
      <div className="absolute inset-0" onClick={onClose}></div>
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors z-30 bg-black/50 p-2 rounded-full"><X size={32} /></button>

      {/* 좌우 네비게이션 버튼을 사진 외부(화면 양끝)로 이동 및 상시 노출(또는 호버시 노출) */}
      {slides.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-20">
            <ChevronLeft size={48} />
          </button>
          <button onClick={nextSlide} className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-20">
            <ChevronRight size={48} />
          </button>
        </>
      )}

      <div className="relative w-full h-full flex items-center justify-center pointer-events-none p-4 sm:px-32">
        {slides.length > 0 ? (
          <div className="relative pointer-events-auto shadow-2xl flex items-center justify-center max-h-[85vh] max-w-full">
            <img src={slides[currentSlideIndex]} alt="Slide" className="max-h-[85vh] w-auto h-auto object-contain transition-opacity duration-500 select-none"/>
            <div className="absolute inset-0 z-10 cursor-pointer" onClick={togglePlay} title={isPlaying ? "일시정지" : "재생"}/>
          </div>
        ) : (
          <div className="text-gray-500 flex flex-col items-center"><ImageIcon size={64} /><p className="mt-4">표시할 사진이 없습니다.</p></div>
        )}
      </div>

      <div className="absolute bottom-8 z-20 flex items-center gap-6 pointer-events-auto bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 hover:bg-black/60 transition-all">
        <span className="text-white/80 font-mono text-sm border-r border-white/20 pr-6 mr-0"> {currentSlideIndex + 1} / {slides.length || 0} </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest"> {isPlaying ? "Playing" : "Paused"} </span>
        <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 text-white/80 hover:text-white text-xs font-bold transition-colors ml-4"> <Camera size={16} /> 프로필 변경</button>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
    </div>,
    document.body
  );
};

export default SlideViewer;
