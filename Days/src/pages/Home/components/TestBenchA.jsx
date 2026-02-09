// src/components/TestBench.jsx
import React, { useState } from 'react';
import { 
  X, Image as ImageIcon, Youtube, Play, 
  MessageSquare, Sparkles, LayoutTemplate 
} from 'lucide-react';

const TestBench = ({ onClose }) => {
  // Tabs: 'photos' | 'videos'
  const [activeTab, setActiveTab] = useState('photos'); // 기본값: 사진
  const [currentVideo, setCurrentVideo] = useState(0);

  // --- Mock Data ---
  const MOCK_VIDEOS = [
    { id: 1, title: "Tokyo 4K Walk - Night Rain", duration: "24:12", views: "1.2M", thumb: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80" },
    { id: 2, title: "Hidden Gems in Shinjuku", duration: "12:05", views: "450K", thumb: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&q=80" },
  ];

  const MOCK_PHOTOS = Array(6).fill(null).map((_, i) => ({
    id: i, url: `https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&q=80&sig=${i}`
  }));

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-10 font-sans">
      
      <div className="w-full h-full max-w-7xl bg-[#0b0d14] rounded-[2rem] border border-white/10 shadow-2xl flex overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-all"><X size={20} /></button>

        {/* =======================================================
            LEFT PANEL (Control Tower) 🎮
           ======================================================= */}
        <div className="w-[35%] h-full border-r border-white/5 bg-[#05070a]/50 p-8 flex flex-col relative backdrop-blur-sm">
           
           {/* Header Area */}
           <div className="mb-8 space-y-4">
             <div>
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles size={14} className="text-cyan-400" />
                 <span className="text-xs font-bold text-blue-300 tracking-widest">TOKYO, JAPAN</span>
               </div>
               <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                 TOKYO
               </h1>
             </div>

             {/* 🚨 [New] Toggle Button Here! */}
             <div className="flex gap-2">
                {/* Mode Switcher Button */}
                <button 
                  onClick={() => setActiveTab(activeTab === 'photos' ? 'videos' : 'photos')}
                  className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg group ${
                    activeTab === 'photos' 
                      ? 'bg-gradient-to-r from-red-600 to-red-800 text-white hover:scale-[1.02]' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {activeTab === 'photos' ? (
                    <>
                      <Youtube size={18} /> <span>영상으로 보기</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon size={18} /> <span>사진첩 보기</span>
                    </>
                  )}
                </button>

                {/* Info Button (Small) */}
                <button className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                   <LayoutTemplate size={18} />
                </button>
             </div>
           </div>

           {/* Chat Bubble */}
           <div className="flex-1 space-y-4 opacity-70">
             <div className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center"><MessageSquare size={14} className="text-blue-300"/></div>
               <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none text-sm text-gray-300 leading-relaxed">
                 좌측 상단의 붉은색 버튼을 눌러보세요.<br/>
                 우측 화면이 가려지는 것 없이 시원하게 전환됩니다.
               </div>
             </div>
           </div>
        </div>


        {/* =======================================================
            RIGHT PANEL (Display Only) 📺
           ======================================================= */}
        <div className="flex-1 h-full flex flex-col bg-[#020305] relative">
          
          {/* 🚨 [Clean] No Floating Buttons Here! */}

          <div className="flex-1 overflow-hidden p-6">
            
            {/* Case A: Photo Grid */}
            {activeTab === 'photos' && (
              <div className="grid grid-cols-3 gap-4 h-full animate-fade-in overflow-y-auto pr-2 custom-scrollbar">
                {MOCK_PHOTOS.map((photo) => (
                  <div key={photo.id} className="aspect-[4/5] bg-white/5 rounded-xl overflow-hidden relative group cursor-pointer border border-white/5">
                    <img src={photo.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100" alt="mock" />
                  </div>
                ))}
              </div>
            )}

            {/* Case B: Youtube Cinematic Mode */}
            {activeTab === 'videos' && (
              <div className="flex flex-col h-full gap-6 animate-fade-in">
                {/* Main Player */}
                <div className="flex-[3] w-full bg-white/5 rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl group">
                  <img src={MOCK_VIDEOS[currentVideo].thumb} className="w-full h-full object-cover opacity-50" alt="video_bg" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/50 hover:scale-110 transition-transform">
                      <Play size={24} className="text-white fill-white ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/60 to-transparent">
                    <h3 className="text-xl font-bold text-white mb-1">{MOCK_VIDEOS[currentVideo].title}</h3>
                  </div>
                </div>
                {/* Playlist */}
                <div className="flex-[2] overflow-y-auto custom-scrollbar">
                  <h4 className="text-xs font-bold text-gray-500 mb-3 px-1">UP NEXT</h4>
                  <div className="space-y-3">
                    {MOCK_VIDEOS.map((video, idx) => (
                      <div key={video.id} onClick={() => setCurrentVideo(idx)} className={`flex gap-4 p-3 rounded-xl cursor-pointer ${currentVideo === idx ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5 border border-transparent'}`}>
                        <div className="w-32 aspect-video bg-gray-800 rounded-lg overflow-hidden relative shrink-0">
                          <img src={video.thumb} className="w-full h-full object-cover" alt="thumb" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h5 className={`font-bold text-sm mb-1 ${currentVideo === idx ? 'text-white' : 'text-gray-300'}`}>{video.title}</h5>
                          <span className="text-xs text-gray-500">{video.views} views</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBench;