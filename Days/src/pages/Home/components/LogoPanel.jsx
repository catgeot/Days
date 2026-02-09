import React from 'react';
import { X, LogIn, LogOut, Plane, Star, Play, BookOpen, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo'; // 🚨 [Fix] 일관된 로고 사용

const LogoPanel = ({ isOpen, onClose, user, bucketList, onLogout, onStartAmbient }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* 배경 오버레이 */}
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* 사이드 패널 */}
      <div 
        className={`fixed top-0 left-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-r border-white/10 z-50 transform transition-transform duration-500 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* 1. 헤더 영역 */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-b from-blue-900/10 to-transparent">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">
              <Logo />
            </h2>
            <p className="text-xs text-blue-400 tracking-[0.2em] font-bold mt-1 uppercase">Passport Control</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors border border-white/5 rounded-full hover:bg-white/5">
            <X size={24} />
          </button>
        </div>

        {/* 2. 메인 컨텐츠 영역 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          
          {user ? (
            <div className="space-y-10 animate-fade-in">
              
              {/* 사용자 프로필 및 로그북 진입로 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] text-blue-400 font-bold tracking-widest">ACTIVE TRAVELER</p>
                    <p className="text-sm text-white font-medium truncate">{user.email}</p>
                  </div>
                </div>

                {/* 🚨 [New] 출력일보(LOGBOOK) 바로가기 버튼 */}
                <button 
                  onClick={() => navigate('/report')}
                  className="w-full group flex items-center justify-between p-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-2xl transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white tracking-wide">LOGBOOK</p>
                      <p className="text-[10px] text-blue-300/60 uppercase">Daily Work Report</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* 버킷리스트 영역 */}
              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    My Bucket List
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">{bucketList.length} / 50</span>
                </div>

                {bucketList.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {bucketList.map((trip) => {
                      const keyword = encodeURIComponent(trip.destination || 'travel');
                      const thumbUrl = `https://picsum.photos/seed/${keyword}/400/400`;

                      return (
                        <div key={trip.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer">
                          <img 
                            src={thumbUrl} 
                            alt={trip.destination}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                          <div className="absolute bottom-3 left-3">
                            <p className="text-xs font-bold text-white leading-none mb-1">{trip.destination}</p>
                            <p className="text-[9px] text-blue-400 tracking-wider font-mono uppercase">{trip.code}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <Plane size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-400">아직 담은 여행지가 없습니다.</p>
                    <p className="text-[10px] text-gray-600 mt-1">지구본에서 도시를 클릭하고 '별'을 눌러보세요!</p>
                  </div>
                )}
              </div>

              {/* 앰비언트 모드 버튼 */}
              {bucketList.length > 0 && (
                <button 
                  onClick={onStartAmbient}
                  className="w-full py-5 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-white transition-all group shadow-xl"
                >
                  <Play size={20} className="text-blue-400 group-hover:scale-125 transition-transform" />
                  <span className="font-bold tracking-widest text-sm">START AMBIENT MODE</span>
                </button>
              )}
            </div>
          ) : (
            /* 비로그인 상태 */
            <div className="h-full flex flex-col justify-center items-center text-center space-y-8 animate-fade-in">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10">
                <BookOpen size={40} className="text-gray-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white tracking-tight">당신의 여행을 기록하세요</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[280px]">
                  로그인하면 나만의 버킷리스트를 만들고,<br/>
                  감성적인 앰비언트 모드로<br/>
                  여행의 꿈을 시각화할 수 있습니다.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/auth/login')}
                className="w-full max-w-[200px] py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 group"
              >
                <LogIn size={18} className="group-hover:-translate-x-1 transition-transform" />
                SIGN IN
              </button>
            </div>
          )}
        </div>

        {/* 3. 푸터 영역 (로그아웃) */}
        {user && (
          <div className="p-8 border-t border-white/5 bg-black/40">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-[0.3em]"
            >
              <LogOut size={14} />
              Terminating Session
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LogoPanel;