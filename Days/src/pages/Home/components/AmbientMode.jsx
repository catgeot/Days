import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';

const AmbientMode = ({ bucketList, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 6초마다 슬라이드 변경
  useEffect(() => {
    if (bucketList.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % bucketList.length);
        setIsTransitioning(false);
      }, 1000); 
    }, 6000); 

    return () => clearInterval(interval);
  }, [bucketList]);

  if (!bucketList || bucketList.length === 0) return null;

  const currentItem = bucketList[currentIndex];

  // 🚨 [Fix] 서비스 점검 이슈로 인해 가장 안정적인 'Picsum'으로 교체
  // 여행지 이름(keyword)을 'seed'로 사용하여, 해당 여행지에는 항상 같은 고화질 이미지가 매칭되게 함
  const keyword = currentItem.destination || 'travel';
  const encodedKeyword = encodeURIComponent(keyword);
  
  // Picsum Photos 사용 (고화질, 초고속)
  const bgImage = `https://picsum.photos/seed/${encodedKeyword}/1600/900`;
  
  console.log(`🖼️ Loading Image for [${keyword}]:`, bgImage);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden animate-fade-in">
      {/* 배경 이미지 */}
      <div 
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>

      {/* 텍스트 정보 */}
      <div className="relative z-10 text-center text-white p-8">
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl animate-fade-in-up">
          {currentItem.destination}
        </h1>
        <div className="flex items-center justify-center gap-2 text-xl md:text-2xl font-light tracking-widest uppercase opacity-80">
          <MapPin size={20} />
          <span>{currentItem.code}</span>
        </div>
        <p className="mt-8 max-w-2xl mx-auto text-sm md:text-base font-serif italic text-gray-300 line-clamp-2">
          "{currentItem.prompt_summary || '여행을 꿈꾸는 시간...'}"
        </p>
      </div>

      {/* 닫기 버튼 */}
      <div className="absolute top-8 right-8 z-50">
        <button 
          onClick={onClose}
          className="p-4 rounded-full bg-black/20 hover:bg-black/50 text-white/50 hover:text-white border border-white/10 transition-all backdrop-blur-md"
        >
          <X size={24} />
        </button>
      </div>

      {/* 하단 진행바 */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full">
        <div 
          className="h-full bg-blue-500 transition-all duration-[6000ms] ease-linear"
          style={{ width: isTransitioning ? '100%' : '0%', opacity: isTransitioning ? 0 : 1 }}
        ></div>
      </div>
    </div>
  );
};

export default AmbientMode;