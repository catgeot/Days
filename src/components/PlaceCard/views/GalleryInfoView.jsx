import React, { useMemo } from 'react';
import { Camera, MapPin, Compass, Sparkles } from 'lucide-react'; 
import { getRelatedPlaces } from '../../../pages/Home/hooks/useSearchEngine';

const GalleryInfoView = React.memo(({ selectedPlace, selectedImg, onRelatedClick }) => {
    
    const isPhotoMode = !!selectedImg;

    const description = useMemo(() => {
        if (selectedImg?.alt_description) {
            return selectedImg.alt_description.charAt(0).toUpperCase() + selectedImg.alt_description.slice(1);
        }
        return `Visual data captured at ${selectedPlace?.name || 'Unknown Location'}`;
    }, [selectedImg, selectedPlace]);

    const relatedPlaces = useMemo(() => getRelatedPlaces(selectedPlace), [selectedPlace]);

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
             <div className={`items-center justify-between border-b border-white/5 pb-3 sticky top-0 bg-[#1a1a1a]/40 backdrop-blur-md z-10 ${!isPhotoMode ? 'hidden xl:flex' : 'flex'}`}>
                 <span className={`text-[11px] font-semibold uppercase tracking-[0.25em] flex items-center gap-2.5 ${
                     isPhotoMode ? 'text-blue-400/90' : 'text-gray-500'
                 }`}>
                    {isPhotoMode ? (
                        <>
                            <Camera size={13} /> 
                            PHOTO_LOG 
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
                        <p className="text-[14px] text-gray-300/90 leading-8 font-normal tracking-wide whitespace-pre-line">
                            {selectedPlace?.desc || "이 장소에 대한 정보가 업데이트 중입니다."}
                        </p>
                        
                        <div className="pt-6 border-t border-white/5">
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
                            
                            {relatedPlaces.length > 0 && (
                                <div className="flex flex-wrap gap-2">                                   
                                    {relatedPlaces.map((place, idx) => (
                                        <button 
                                            key={`rel-${idx}`} 
                                            onClick={() => onRelatedClick && onRelatedClick(place.data)}
                                            className={`group px-3 py-1.5 rounded-lg border transition-all duration-300 font-medium text-[12px] flex items-center gap-1.5 ${
                                                place.isBridge 
                                                ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-300 hover:text-white hover:border-fuchsia-400/60 hover:bg-fuchsia-500/30'
                                                : 'bg-blue-500/5 border-blue-500/20 text-gray-300 hover:text-white hover:border-blue-400/50 hover:bg-blue-500/20'
                                            }`}
                                        >
                                            {place.isBridge ? (
                                                <Sparkles size={13} className="text-fuchsia-400 group-hover:animate-pulse" />
                                            ) : (
                                                <Compass size={13} className="text-blue-400 group-hover:animate-pulse" />
                                            )}
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
});

export default GalleryInfoView;
