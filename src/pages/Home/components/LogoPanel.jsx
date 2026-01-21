import React from 'react';
import { X, LogIn, LogOut, Plane, Star, Play, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LogoPanel = ({ isOpen, onClose, user, bucketList, onLogout, onStartAmbient }) => {
  const navigate = useNavigate();

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <div 
        className={`fixed top-0 left-0 h-full w-full md:w-[450px] bg-[#0a0a0a] border-r border-white/10 z-50 transform transition-transform duration-500 ease-out shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter">GATE 0</h2>
            <p className="text-xs text-blue-400 tracking-[0.2em] font-bold mt-1">PASSPORT CONTROL</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          
          {user ? (
            <div className="space-y-8 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-400">TRAVELER</p>
                  <p className="text-sm text-white font-medium">{user.email}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star size={18} className="text-yellow-400 fill-yellow-400" />
                    My Bucket List
                  </h3>
                  <span className="text-xs text-gray-500">{bucketList.length} Destinations</span>
                </div>

                {bucketList.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {bucketList.map((trip) => {
                      // 🚨 [Fix] Picsum 사용 (썸네일)
                      const keyword = encodeURIComponent(trip.destination || 'travel');
                      const thumbUrl = `https://picsum.photos/seed/${keyword}/400/400`;

                      return (
                        <div key={trip.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 border border-white/5 hover:border-blue-500/50 transition-all cursor-pointer">
                          <img 
                            src={thumbUrl} 
                            alt={trip.destination}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                          <div className="absolute bottom-3 left-3">
                            <p className="text-xs font-bold text-white">{trip.destination}</p>
                            <p className="text-[10px] text-gray-400 tracking-wider">{trip.code}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <Plane size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500">아직 담은 여행지가 없습니다.</p>
                    <p className="text-xs text-gray-600 mt-1">채팅창에서 '별표'를 눌러보세요!</p>
                  </div>
                )}
              </div>

              {bucketList.length > 0 && (
                <button 
                  onClick={onStartAmbient}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-white transition-all group"
                >
                  <Play size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold tracking-wide">START AMBIENT MODE</span>
                </button>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center space-y-6 animate-fade-in">
              <BookOpen size={48} className="text-gray-600 mb-4" />
              <h3 className="text-2xl font-bold text-white">여행을 기록하고 싶으신가요?</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                로그인하면 나만의 버킷리스트를 만들고,<br/>
                감성적인 앰비언트 모드로<br/>
                여행의 꿈을 시각화할 수 있습니다.
              </p>
              
              <button 
                onClick={() => navigate('/auth/login')}
                className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-lg shadow-blue-900/30 transition-all flex items-center gap-2"
              >
                <LogIn size={18} />
                로그인 / 회원가입
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="p-6 border-t border-white/10 bg-black/20">
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-400 transition-colors py-2"
            >
              <LogOut size={14} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default LogoPanel;