import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Image as ImageIcon, UserRoundPen } from 'lucide-react';
import { usePenNameContext } from '../context/PenNameContext';

const UserProfile = ({ user, onLogout, onOpenSlide }) => {
  const avatarUrl = user?.user_metadata?.avatar_url?.replace(/^http:\/\//i, 'https://');
  const { displayName, setDisplayName, loading: penLoading, saving, save, maxLen } = usePenNameContext();
  const [saveHint, setSaveHint] = useState('');

  const previewName = (displayName.trim() || user?.email?.split('@')[0] || '').trim();

  const handleSavePenName = async () => {
    const { ok } = await save();
    if (ok) {
      setSaveHint('저장됨');
      setTimeout(() => setSaveHint(''), 2000);
      return;
    }
    alert('필명 저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
  };

  return (
    <div className="p-4 border-t border-gray-200">
      {user ? (
        <div className="bg-gray-100/50 rounded-2xl p-4">
          <div
            className="w-full aspect-[4/3] bg-gray-200 rounded-lg mb-3 overflow-hidden relative group cursor-pointer border border-gray-300"
            onClick={onOpenSlide}
            title="추억 상자 열기"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                <ImageIcon size={24} className="mb-1" />
                <span className="text-[10px]">사진 없음</span>
              </div>
            )}
            <div className="absolute inset-0 bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-gray-800 text-xs font-bold bg-white/60 px-2 py-1 rounded-full backdrop-blur-sm border border-gray-200/50 shadow-sm">Gallery</span>
            </div>
          </div>

          <div className="mb-3 space-y-2">
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <UserRoundPen size={12} className="text-blue-500" />
              공개 필명
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, maxLen))}
                disabled={penLoading}
                placeholder={user.email?.split('@')[0] || '닉네임'}
                className="flex-1 min-w-0 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200"
                maxLength={maxLen}
                autoComplete="nickname"
              />
              <button
                type="button"
                onClick={handleSavePenName}
                disabled={penLoading || saving}
                className="shrink-0 px-2.5 py-1.5 text-[11px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? '…' : '저장'}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 leading-snug break-keep">
              공개 로그북·명소 여행기에 표시됩니다. 비우면 이메일 앞부분·ID로 대체됩니다.
            </p>
            {saveHint && <p className="text-[10px] font-bold text-emerald-600">{saveHint}</p>}
          </div>

          <div className="flex justify-between items-center border-t border-gray-200/80 pt-3">
            <div className="overflow-hidden min-w-0 pr-2">
              <p className="text-gray-800 text-sm font-bold truncate" title={previewName}>{previewName}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-500 p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100/50 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-sm mb-3">로그인이 필요합니다.</p>
          <Link to="/auth/login" className="block w-full bg-blue-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-blue-500">
            로그인 하기
          </Link>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
