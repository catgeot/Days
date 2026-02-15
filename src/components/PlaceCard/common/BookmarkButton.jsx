// src/components/common/BookmarkButton.jsx
// 🚨 [New] 여러 뷰(Summary, Expanded, Compact)에서 재사용하기 위한 즐겨찾기 독립 컴포넌트

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

const BookmarkButton = ({ location, onToggle, className = "" }) => {
  // 🚨 [비관적 우선] 위치 데이터가 없으면 버튼 자체를 렌더링하지 않음
  if (!location) return null;

  // 낙관적 UI 업데이트를 위한 로컬 상태 (누르는 즉시 반응)
  const [isStarred, setIsStarred] = useState(location.is_bookmarked || false);

  // 외부 DB 상태와 동기화
  useEffect(() => {
    setIsStarred(location.is_bookmarked || false);
  }, [location.is_bookmarked]);

  const handleClick = (e) => {
    e.stopPropagation(); // 카드 확장 등 뒤로 이벤트가 새어나가는 것(버블링) 완벽 차단
    setIsStarred(!isStarred); 
    if (onToggle) onToggle(location); // 컨트롤 타워(index.jsx)로 명령 하달
  };

  return (
    <button 
      onClick={handleClick} 
      className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${className}`}
      title="즐겨찾기"
    >
      <Star size={18} className={isStarred ? "text-yellow-400 fill-yellow-400" : "text-gray-500 hover:text-yellow-400"} />
    </button>
  );
};

export default BookmarkButton;