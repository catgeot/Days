import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { resolveFooterBlock } from './Home/data/footerData';

const AboutPage = () => {
  const { i18n } = useTranslation();
  const { title, content } = resolveFooterBlock('about', i18n.language);

  return (
    <div className="min-h-screen w-full bg-black text-gray-200 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-8 md:py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          <span>gateo.kr</span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-6">
          {title}
        </h1>

        <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed whitespace-pre-wrap text-gray-300">
          {content}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
