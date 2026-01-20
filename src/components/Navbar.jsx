import React, { useState } from 'react';
import { User, LogOut, Book, Plane } from 'lucide-react';

const Navbar = () => {
  // 로그인 상태 (추후 실제 인증 로직과 연동 필요)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <nav className="flex justify-between items-center p-6 w-full z-50 pointer-events-auto">
      {/* Left: Logo & Identity */}
      <div className="flex items-center gap-4">
        <button 
          className="group relative flex items-center gap-2"
          onClick={() => {
             // 추후 여기에 '설명서 모달' 또는 '버킷리스트' 로직 연결
             console.log("Logo Clicked");
          }}
        >
          {/* 로고 아이콘 */}
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform duration-300">
             <Plane className="text-black transform -rotate-45" size={20} fill="black" />
          </div>
          
          {/* 텍스트 로고 */}
          <div className="flex flex-col items-start">
            <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
              GATE 0
            </span>
            <span className="text-[10px] text-blue-300 tracking-[0.2em] uppercase opacity-60 group-hover:opacity-100 transition-opacity -mt-1">
              Departure Lounge
            </span>
          </div>
        </button>

        {/* 로그인 상태일 때만 보이는 로그아웃 버튼 (사장님 요청사항) */}
        {isLoggedIn && (
           <button 
             onClick={() => setIsLoggedIn(false)}
             className="ml-2 px-2 py-1 text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 transition-colors border border-transparent hover:border-red-500/30 rounded"
           >
             <LogOut size={12} /> Logout
           </button>
        )}
      </div>

      {/* Right: Login / Menu */}
      <div className="flex items-center gap-6">
        {!isLoggedIn ? (
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all text-sm text-gray-200 shadow-lg"
          >
            <User size={16} />
            <span className="font-medium tracking-wide">Sign In</span>
          </button>
        ) : (
          <div className="flex items-center gap-4">
             <span className="text-xs text-gray-400">Welcome, Traveler</span>
             <button className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-blue-400 hover:bg-gray-700 transition-colors">
               <Book size={18} />
             </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;