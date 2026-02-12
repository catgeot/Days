import React from 'react';

const GalleryInfoView = ({ infoData }) => {
    if (!infoData) return null;

    // infoData 구조: { title, summary, tags, mode }
    // mode가 'PHOTO' 또는 'LOCATION'일 때 사용됨

    return (
        <div className="animate-fade-in space-y-6">
             {/* Summary Section */}
             <div className="space-y-3">
                 <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">
                        {infoData.mode === 'PHOTO' ? 'PHOTO DETAILS' : 'ABOUT THIS PLACE'}
                     </span>
                 </div>
                 
                 {/* 🚨 [Design] 기존 폰트 스타일, 줄간격(leading-7) 100% 유지 */}
                 <p className="text-[15px] text-gray-200 leading-7 font-normal tracking-wide whitespace-pre-line">
                    {infoData.summary}
                 </p>
                 
                 <div className="flex flex-wrap gap-1.5 pt-2">
                     {infoData.tags && infoData.tags.map((tag, idx) => (
                         <span key={idx} className="px-2.5 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-gray-400 hover:text-white hover:border-white/20 transition-all cursor-default">
                             #{tag.replace ? tag.replace('#','') : tag}
                         </span>
                     ))}
                 </div>
             </div>
        </div>
    );
};

export default GalleryInfoView;