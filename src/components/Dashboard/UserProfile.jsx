import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, LogOut, User, ShieldCheck } from 'lucide-react';

const UserProfile = ({ user, loading, onLogout }) => {
  
  // 1. 로딩 중일 때 (깜빡이는 UI)
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. 로그인 상태일 때
  if (user) {
    // 이메일의 @ 앞부분만 따서 아이디처럼 보여주기
    const username = user.email.split('@')[0];
    // 이메일 첫 글자 대문자로 변환 (아바타용)
    const initial = user.email.charAt(0).toUpperCase();

    return (
      <div className="flex items-center gap-4 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        {/* 아바타 (프사) */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-inner">
          {initial}
        </div>

        {/* 유저 정보 */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="font-bold text-gray-800 text-sm">{username}</span>
            <ShieldCheck size={12} className="text-blue-500" />
          </div>
          <span className="text-[10px] text-gray-400 font-medium tracking-wide">
            {user.email}
          </span>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* 로그아웃 버튼 (작고 심플하게) */}
        <button 
          onClick={onLogout}
          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
          title="로그아웃"
        >
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  // 3. 비로그인(게스트) 상태일 때
  return (
    <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-gray-100 shadow-sm">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
        <User size={20} />
      </div>
      
      <div className="flex flex-col">
        <span className="font-bold text-gray-800 text-sm">방문자 (Guest)</span>
        <span className="text-[10px] text-gray-400">로그인이 필요합니다</span>
      </div>

      <div className="w-px h-6 bg-gray-200 mx-1"></div>

      <Link 
        to="/auth/login"
        className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
        title="로그인"
      >
        <LogIn size={16} />
      </Link>
    </div>
  );
};

export default UserProfile;