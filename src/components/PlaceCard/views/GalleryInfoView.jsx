// src/components/PlaceCard/views/GalleryInfoView.jsx
// 🚨 [Fix/New] 수정 이유: 
// 1. [Subtraction] 길고 장황한 서술형 꼬꼬무 버튼을 미니멀한 가로형 태그 리스트로 다이어트.
// 2. [UI/UX] 사용자에게 다음 행동을 강요하지 않고, 기존 해시태그 디자인과 자연스럽게 어우러지도록 배치.

import React from 'react';
import { Camera, MapPin, Compass } from 'lucide-react'; // 🚨 [New] 꼬꼬무 버튼용 나침반 아이콘 추가
import { getRelatedPlaces } from '../../../pages/Home/hooks/useSearchEngine';

const GalleryInfoView = ({ selectedPlace, selectedImg, onRelatedClick }) => {
    
    const isPhotoMode = !!selectedImg;

    const formatDate = (dateString) => {
        if (!dateString) return 'SYSTEM_ARCHIVE';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0].replace(/-/g, '.');
        } catch (e) {
            return 'RECORD_NOT_FOUND';
        }
    };

    const description = selectedImg?.alt_description 
        ? selectedImg.alt_description.charAt(0).toUpperCase() + selectedImg.alt_description.slice(1)
        : `Visual data captured at ${selectedPlace?.name || 'Unknown Location'}`;

    const relatedPlaces = getRelatedPlaces(selectedPlace);

    return (
        <div className="animate-fade-in space-y-8 min-h-[200px] max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 2px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { 
                    background: rgba(255, 255, 255, 0.03); 
                    border-radius: 10px; 
                }
            `}</style>

             {/* Header */}
             <div className="flex items-center justify-between border-b border-white/5 pb-4 sticky top-0 bg-[#1a1a1a]/40 backdrop-blur-md z-10">
                 <span className={`text-[11px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2.5 ${
                     isPhotoMode ? 'text-blue-400/90' : 'text-gray-500'
                 }`}>
                    {isPhotoMode ? (
                        <>
                            <Camera size={13} /> 
                            PHOTO_LOG // {formatDate(selectedImg.created_at)}
                        </>
                    ) : (
                        <>
                            <MapPin size={13} /> 
                            PLACE_OVERVIEW
                        </>
                    )}
                 </span>
             </div>
             
             {/* Content Area */}
             <div className="px-0.5">
                {isPhotoMode ? (
                    <div className="animate-fade-in">
                        <p className="text-[16px] text-gray-200 leading-relaxed font-normal opacity-90 tracking-tight">
                            {description}
                        </p>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-10">
                        <p className="text-[15px] text-gray-300/90 leading-8 font-normal tracking-wide whitespace-pre-line">
                            {selectedPlace?.desc || "이 장소에 대한 정보가 업데이트 중입니다."}
                        </p>
                        
                        <div className="pt-6 border-t border-white/5">
                            {/* 1. 기존 장소의 범용 태그 */}
                            {selectedPlace?.keywords && (
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {selectedPlace.keywords.map((tag, idx) => (
                                        <span 
                                            key={`tag-${idx}`} 
                                            className="px-2 py-0.5 rounded border transition-all duration-300 cursor-default font-medium text-[11px] bg-white/5 border-white/10 text-gray-400 hover:text-blue-400 hover:border-blue-400/30 hover:bg-blue-400/5"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                            
                            {/* 🚨 [Fix/New] 2. 꼬꼬무 연관 장소 (미니멀 가로 버튼형) */}
                            {relatedPlaces.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <div className="w-full text-[11px] text-gray-500/80 font-medium mb-1 tracking-wider uppercase">
                                        연관 탐험지
                                    </div>
                                    {relatedPlaces.map((place, idx) => (
                                        <button 
                                            key={`rel-${idx}`} 
                                            onClick={() => onRelatedClick && onRelatedClick(place.data)}
                                            className="group px-3 py-1.5 rounded-lg border transition-all duration-300 font-medium text-[12px] bg-blue-500/5 border-blue-500/20 text-gray-300 hover:text-white hover:border-blue-400/50 hover:bg-blue-500/20 flex items-center gap-1.5"
                                        >
                                            <Compass size={13} className="text-blue-400 group-hover:animate-pulse" />
                                            {place.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
             </div>
        </div>
    );
};

export default GalleryInfoView;