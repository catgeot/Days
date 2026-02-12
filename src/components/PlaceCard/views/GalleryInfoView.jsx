import React from 'react';
import { Camera, MapPin } from 'lucide-react';

const GalleryInfoView = ({ selectedPlace, selectedImg }) => {
    
    const isPhotoMode = !!selectedImg;

    // 날짜 포맷팅 유틸리티
    const formatDate = (dateString) => {
        if (!dateString) return 'SYSTEM_ARCHIVE';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0].replace(/-/g, '.');
        } catch (e) {
            return 'RECORD_NOT_FOUND';
        }
    };

    // 사진 설명글
    const description = selectedImg?.alt_description 
        ? selectedImg.alt_description.charAt(0).toUpperCase() + selectedImg.alt_description.slice(1)
        : `Visual data captured at ${selectedPlace.name}`;

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
                            {selectedPlace.desc || "이 장소에 대한 정보가 업데이트 중입니다."}
                        </p>
                        
                        {/* 🚨 [Fix] 하단 태그 스타일 강화 (시인성 확보) */}
                        {selectedPlace.keywords && (
                            <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                                {selectedPlace.keywords.map((tag, idx) => (
                                    <span 
                                        key={idx} 
                                        className={`
                                            px-2 py-0.5 rounded border transition-all duration-300 cursor-default font-medium text-[11px]
                                            /* 🎨 개별 수정 가이드 */
                                            bg-white/5             /* 배경 투명도 (배경색) */
                                            border-white/10        /* 테두리 색상 */
                                            text-gray-400          /* 글자 색상 (기존 gray-600에서 상향) */
                                            hover:text-blue-400    /* 마우스 올렸을 때 글자색 */
                                            hover:border-blue-400/30 /* 마우스 올렸을 때 테두리색 */
                                            hover:bg-blue-400/5    /* 마우스 올렸을 때 배경색 */
                                        `}
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
             </div>
        </div>
    );
};

export default GalleryInfoView;