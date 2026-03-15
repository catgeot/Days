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
