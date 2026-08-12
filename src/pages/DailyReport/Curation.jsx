import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronLeft } from 'lucide-react';
import CurationHub from './components/CurationHub';

const Curation = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <div className="page-scroll-end-pad max-w-7xl mx-auto pt-8 px-4 sm:px-6">
        <div className="mb-6 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to="/blog"
              aria-label="LogBook으로 돌아가기"
              title="LogBook으로 돌아가기"
              className="inline-flex items-center justify-center w-9 h-9 -ml-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <ChevronLeft size={22} strokeWidth={2.25} aria-hidden="true" />
            </Link>
            <Sparkles className="text-blue-500 flex-shrink-0" size={24} />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
              큐레이션
            </h2>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm font-medium break-keep max-w-xl pl-11">
            숨은 낙원을 추천받고, 이 페이지에서 팁·계절·이야기를 바로 읽으세요. 지나간 추천은 목록에서 다시 엽니다.
          </p>
        </div>

        <CurationHub />
      </div>
    </div>
  );
};

export default Curation;
