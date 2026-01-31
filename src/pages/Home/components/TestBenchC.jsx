import React, { useState } from 'react';
import { 
  X, MessageSquare, Play, Maximize2, Send, ArrowLeft, Video, 
  TestTube2, MoreHorizontal, Sparkles, Expand 
} from 'lucide-react';

/**
 * 🚨 [Project Days] TestBench B (Deep Blue Refined)
 * - Design: 푸른 계열의 시안(Cyan) 포인트 + 컴팩트 타이포그래피
 * - Fix: 보라색 제거 및 푸른색 계열로 전면 교체
 * - New: 상세 보기 창 내 '전체 보기' 버튼 추가 및 텍스트 3줄 고정
 */

const TestBenchC = ({ onClose }) => {
  const [isChatting, setIsChatting] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  
  const handleBackToMedia = () => {
    setIsChatting(false);
    setSelectedImg(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex p-6 gap-6 animate-fade-in overflow-hidden font-sans">
      
      {/* 🏷️ Lab Label (Cyan Blue) */}
      <div className="absolute top-8 left-8 z-[110] px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 flex items-center gap-2 backdrop-blur-md">
         <TestTube2 size={14} className="text-cyan-400" />
         <span className="text-[10px] font-bold tracking-widest text-cyan-400">BENCH B - BLUE VER.</span>
      </div>

      {/* 1. 좌측 영역: Narrative & Control (35%) */}
      <div className="w-[35%] h-full bg-[#0d1117] border border-white/5 rounded-[2rem] flex flex-col relative shadow-2xl overflow-hidden">
        
        {/* [Header] 타이틀 및 설명 - 🚨 [Fix] 텍스트 3줄 제한 및 푸른색 강조 */}
        <div className="pt-16 px-8 pb-6 flex flex-col gap-3 z-10">
          <div className="flex items-start justify-between">
             <h1 className={`font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-blue-400 transition-all duration-500 ${selectedImg || isChatting ? 'text-3xl' : 'text-6xl'}`}>
                OSAKA
             </h1>
             
             {/* 🚨 [Fix] Watch 버튼 색상 변경 (Cyan) */}
             {(isChatting || selectedImg) && (
               <button 
                 onClick={handleBackToMedia}
                 className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/80 text-xs font-bold hover:bg-cyan-600 hover:text-white hover:border-cyan-400 transition-all animate-fade-in"
               >
                 <Video size={14} /> <span>Watch</span>
               </button>
             )}
          </div>

          {/* 서정적 설명구 - 🚨 [Fix] 3줄 컴팩트 디자인 */}
          <div className={`overflow-hidden transition-all duration-500 ${selectedImg || isChatting ? 'max-h-0 opacity-0' : 'max-h-40 opacity-100'}`}>
            <p className="text-gray-400 text-sm leading-relaxed font-light">
              네온 사인이 도톤보리 강물 위로 춤추는 미식의 도시.<br/>
              <span className="text-cyan-400/90 font-medium">과거와 미래가 교차하는 푸른 밤</span>의 정취 속에서<br/> 
              당신만의 특별한 오사카 이야기를 시작해보세요.
            </p>
          </div>
        </div>

        {/* [Middle] 콘텐츠 영역 */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar">
          {isChatting ? (
            <div className="h-full flex flex-col animate-fade-in">
               <div className="flex-1 space-y-4 py-2">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none text-sm text-gray-200 leading-relaxed border border-white/5 backdrop-blur-sm">
                      안녕하세요! 오사카의 푸른 밤을 가이드해 드릴게요.<br/>
                      현지인만 아는 맛집이나 야경 명소가 궁금하신가요?
                    </div>
                  </div>
               </div>
            </div>
          ) : (
             <div className="space-y-4 animate-fade-in-up">
                <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-lg hover:shadow-blue-900/40 transition-all duration-500">
                  <img 
                    src={`https://img.youtube.com/vi/C9tY814tG48/maxresdefault.jpg`} 
                    alt="Thumbnail" 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300 shadow-xl">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                     <span className="text-[10px] bg-blue-600/80 px-2 py-1 rounded text-white font-medium backdrop-blur-md border border-white/20">4K Cinematic</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-colors"></div>
                      <div className="w-16 h-10 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 cursor-pointer transition-colors"></div>
                   </div>
                   <button className="text-xs text-gray-500 hover:text-cyan-400 flex items-center gap-1 transition-colors font-medium">
                     <MoreHorizontal size={14} /> More
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* [Bottom] 입력창 영역 */}
        <div className="p-6 pt-0 mt-auto">
          {isChatting ? (
            <div className="relative group">
              <input type="text" placeholder="오사카 맛집 추천해줘..." className="w-full bg-black/40 border border-white/10 rounded-full py-4 pl-6 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-all shadow-inner" autoFocus />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-cyan-500 transition-all shadow-lg">
                <Send size={16} className="ml-0.5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsChatting(true)}
              className="w-full py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-blue-900/20 text-gray-300 hover:text-white font-medium flex items-center justify-center gap-3 transition-all group backdrop-blur-md"
            >
              <MessageSquare size={18} className="text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="tracking-wide text-sm">AI 가이드에게 질문하기</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 우측 영역: Media Gallery (65%) */}
      <div className="flex-1 h-full bg-[#0d1117] rounded-[2rem] border border-white/5 overflow-hidden relative shadow-2xl">
        {selectedImg ? (
          /* 상세 보기 모드 - 🚨 [New] 전체 보기 및 닫기 버튼 레이아웃 고도화 */
          <div className="w-full h-full relative animate-fade-in bg-[#05070a]">
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="w-4/5 h-4/5 bg-blue-900/10 border border-blue-500/20 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                   <span className="text-white/10 text-8xl font-black italic tracking-widest group-hover:scale-110 transition-transform duration-700">IMAGE {selectedImg}</span>
                </div>
              </div>
              
              {/* 상단 컨트롤바 */}
              <div className="absolute top-8 right-8 flex items-center gap-3 z-10">
                <button className="p-3 bg-white/5 backdrop-blur-md border border-white/10 text-white/50 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-xl">
                  <Expand size={20} />
                </button>
                <button onClick={() => setSelectedImg(null)} className="p-3 bg-white/5 backdrop-blur-md border border-white/10 text-white/50 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl">
                  <X size={20} />
                </button>
              </div>

              <button onClick={() => setSelectedImg(null)} className="absolute bottom-8 left-8 flex items-center gap-2 px-6 py-3 bg-black/40 backdrop-blur-md border border-white/10 text-white/80 rounded-full hover:bg-white/10 transition-all text-sm font-bold">
                <ArrowLeft size={18} /> Back to Grid
              </button>
          </div>
        ) : (
          /* 🚨 [Fix] Bento Grid (8개 아이템 / Cyan Accent) */
          <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar">
             <div className="grid grid-cols-4 grid-rows-3 gap-4 h-full min-h-[600px]">
                {/* 1번: 대형 (2x2) */}
                <div onClick={() => setSelectedImg(1)} className="col-span-2 row-span-2 bg-white/5 rounded-[2rem] border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-blue-500/20">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-black text-4xl group-hover:text-cyan-400/50 transition-colors">01</div>
                   <Maximize2 className="absolute top-6 right-6 text-white/0 group-hover:text-cyan-400 transition-all opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100" size={24}/>
                </div>
                
                {/* 2,3번: 소형 */}
                <div onClick={() => setSelectedImg(2)} className="col-span-1 row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all group relative">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold group-hover:text-cyan-400/50">02</div>
                </div>
                <div onClick={() => setSelectedImg(3)} className="col-span-1 row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all group relative">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold group-hover:text-cyan-400/50">03</div>
                </div>

                {/* 4번: 가로형 (2x1) */}
                <div onClick={() => setSelectedImg(4)} className="col-span-2 row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all group relative">
                   <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold group-hover:text-cyan-400/50 text-xl">04 EXPLORE</div>
                </div>

                {/* 5,6,7,8번: 하단 소형 */}
                {[5, 6, 7, 8].map(i => (
                  <div key={i} onClick={() => setSelectedImg(i)} className="col-span-1 row-span-1 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-500/50 cursor-pointer transition-all group relative">
                     <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold group-hover:text-cyan-400/50">{i < 10 ? `0${i}` : i}</div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-8 right-8 text-white/20 hover:text-white hover:rotate-90 transition-all z-[120]"><X size={24}/></button>
    </div>
  );
};

export default TestBenchC;