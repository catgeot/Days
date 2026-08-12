import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen } from 'lucide-react';
import CurationHub from './components/CurationHub';

const Curation = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <div className="page-scroll-end-pad max-w-7xl mx-auto pt-8 px-4 sm:px-6">
        <div className="mb-6 flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-blue-500" size={24} />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight drop-shadow-sm">
                큐레이션
              </h2>
            </div>
            <p className="text-gray-500 mt-1.5 text-sm font-medium break-keep max-w-xl">
              숨은 낙원을 추천받고, 이 페이지에서 팁·계절·이야기를 바로 읽으세요. 지나간 추천은 목록에서 다시 엽니다.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all w-full lg:w-auto"
          >
            <BookOpen size={16} />
            <span className="text-sm">LogBook</span>
          </Link>
        </div>

        <CurationHub />
      </div>
    </div>
  );
};

export default Curation;
