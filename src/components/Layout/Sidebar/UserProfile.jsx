import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Image as ImageIcon } from 'lucide-react';

const UserProfile = ({ user, onLogout, onOpenSlide }) => {
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="p-4 border-t border-gray-800">
      {user ? (
        <div className="bg-gray-800/50 rounded-2xl p-4">
          <div 
            className="w-full aspect-[4/3] bg-gray-700 rounded-lg mb-3 overflow-hidden relative group cursor-pointer border border-gray-600"
            onClick={onOpenSlide}
            title="추억 액자 열기"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <ImageIcon size={24} className="mb-1" />
                <span className="text-[10px]">사진 없음</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">Gallery</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="overflow-hidden">
              <p className="text-white text-sm font-bold truncate">{user.email.split('@')[0]}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-400 p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-2xl p-4 text-center">
          <p className="text-gray-400 text-sm mb-3">로그인이 필요합니다</p>
          <Link to="/auth/login" className="block w-full bg-blue-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-blue-500">
            로그인 하기
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserProfile;