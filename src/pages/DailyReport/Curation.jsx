import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import CurationHub from './components/CurationHub';

const Curation = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans relative">
      <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 pb-20">
        <div className="mb-6 border-b border-gray-100 pb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={14} /> 홈
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 transition-colors"
            >
              LogBook
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="text-blue-500" size={22} />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">AI 큐레이션</h1>
          </div>
          <p className="text-gray-500 mt-1.5 text-sm font-medium break-keep max-w-xl">
            숨은 낙원을 추천받고, 이 페이지에서 팁·계절·이야기를 바로 읽으세요. 지나간 추천은 목록에서 다시 엽니다.
          </p>
        </div>

        <CurationHub />
      </div>
    </div>
  );
};

export default Curation;
