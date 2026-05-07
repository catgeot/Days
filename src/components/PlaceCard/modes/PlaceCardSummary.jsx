import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Sparkles, Maximize2 } from 'lucide-react';
import BookmarkButton from '../common/BookmarkButton';
import { getPlaceTitleLines } from '../common/locationDisplay';
import { copyToClipboard } from '../common/copyToClipboard';

const PlaceCardSummary = ({ location, isBookmarked, onClose, onExpand, onChat, onToggleBookmark, isTickerExpanded }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [copiedType, setCopiedType] = useState('');
  const isScanning = location?.isScanning;
  const { primaryName, secondaryName } = getPlaceTitleLines(location);

  useEffect(() => {
    queueMicrotask(() => setIsLoading(true));
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [location]);

  const handleCopyName = async (event, text, type) => {
    event.preventDefault();
    event.stopPropagation();

    const copied = await copyToClipboard(text);
    if (!copied) return;

    setCopiedType(type);
    setTimeout(() => setCopiedType(''), 1200);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100vw-3rem)] max-w-[360px] lg:translate-x-0 lg:left-auto lg:right-8 lg:w-80 z-[60] animate-fade-in-up transition-all duration-300">

      <div className="bg-black/70 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4 relative group">

        <div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent group-hover:via-blue-400 transition-all cursor-pointer"
          onClick={!isScanning ? onExpand : undefined}
        ></div>

        <div className="flex items-start justify-between mb-3">
           <div className={`flex flex-col ${!isScanning ? 'cursor-pointer' : ''}`} onClick={!isScanning ? onExpand : undefined}>
             <div className="flex items-center gap-1.5 mb-1">
               <Sparkles size={12} className={isScanning ? "text-blue-400 animate-pulse" : "text-yellow-400"} />
               <span className="text-[10px] text-blue-300 font-bold tracking-widest uppercase">
                 {isScanning ? "SEARCHING..." : (location?.country || "Global")}
               </span>
             </div>
             <div className="flex items-center gap-2 min-w-0">
               <button
                 type="button"
                 onClick={(event) => handleCopyName(event, primaryName || location?.name, 'primary')}
                 className={`text-left min-w-0 truncate text-2xl font-bold leading-none tracking-tight transition-colors ${isScanning ? "text-blue-300 animate-pulse" : "text-white hover:text-blue-200 active:scale-[0.99]"}`}
                 title="여행지명 복사"
               >
                 {primaryName || location?.name}
               </button>
               {!isScanning && <Maximize2 size={14} className="text-gray-500 group-hover:text-white transition-colors shrink-0" />}
             </div>
             {!isScanning && secondaryName && (
               <button
                 type="button"
                 onClick={(event) => handleCopyName(event, secondaryName, 'secondary')}
                 className="mt-1 w-fit text-left text-xs leading-none text-gray-200/90 font-semibold tracking-normal hover:text-white"
                 title="보조 지명 복사"
               >
                 ({secondaryName})
               </button>
             )}
             {!isScanning && copiedType && (
               <span className="mt-1 text-[10px] text-emerald-300 font-semibold">
                 {copiedType === 'primary' ? '여행지명 복사됨' : '보조 지명 복사됨'}
               </span>
             )}
           </div>

           <div className="flex items-center gap-1 -mr-2 -mt-2 z-10">
             {!isScanning && <BookmarkButton location={location} isBookmarked={isBookmarked} onToggle={onToggleBookmark} />}
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onClose();
               }}
               className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
             >
               <X size={18} />
             </button>
           </div>
        </div>

        <div
          className={`transition-all duration-300 ease-out ${!isScanning ? 'cursor-pointer' : ''} ${
            isTickerExpanded ? 'mb-0' : 'mb-6'
          }`}
          onClick={!isScanning ? onExpand : undefined}
        >
          {isLoading || isScanning ? (
            <div className="w-full animate-pulse space-y-3 mt-1 px-1">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded w-full"></div>
                <div className="h-3 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
              <p className={`text-xs text-gray-300 leading-relaxed font-light transition-all duration-300 ${
                isTickerExpanded ? 'line-clamp-2' : 'line-clamp-3'
              }`}>
                {location?.name}의 숨겨진 매력을 발견하세요. 카드를 클릭하면 고화질 갤러리와 AI 가이드가 시작됩니다.
              </p>
            </div>
          )}
        </div>

        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            isTickerExpanded || isScanning ? 'max-h-0 opacity-0 mt-0' : 'max-h-[60px] opacity-100 mt-2'
          }`}
        >
           <button
             onClick={(e) => {
               e.stopPropagation();
               if(onChat) onChat({ text: "" });
             }}
             className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 z-10 relative ${
               isTickerExpanded || isScanning ? 'translate-y-4' : 'translate-y-0'
             }`}
           >
             <MessageSquare size={16} className="text-blue-400" />
             <span className="text-xs font-bold text-gray-200">AI에게 장소 묻기</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCardSummary;
