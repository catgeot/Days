// 🚨 [Fix/New] 수정 이유: 
// [Subtraction] 낙관적 UI 업데이트 명목으로 만들어진 '가짜 로컬 상태(useState)'를 완전히 파괴함.
// 오직 부모로부터 내려오는 단일 진실 공급원(isBookmarked Props)에만 의존하여 100% 동기화 달성.

import React from 'react';
import { Star } from 'lucide-react';

const BookmarkButton = ({ location, isBookmarked, onToggle, className = "" }) => {
  if (!location) return null;

  const handleClick = (e) => {
    e.stopPropagation(); 
    if (onToggle) onToggle(location); 
  };

  return (
    <button 
      onClick={handleClick} 
      className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${className}`}
      title="즐겨찾기"
    >
      <Star size={18} className={isBookmarked ? "text-yellow-400 fill-yellow-400" : "text-gray-500 hover:text-yellow-400"} />
    </button>
  );
};

export default BookmarkButton;