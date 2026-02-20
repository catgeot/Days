// src/pages/Home/components/FooterModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FOOTER_CONTENT } from '../data/footerData';

const FooterModal = ({ isOpen, onClose, initialTab = 'about' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // 모달이 열릴 때마다 선택된 탭으로 초기화
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'about', label: 'About Us' },
    { id: 'terms', label: 'Terms' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      {/* 모달 컨테이너 */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/50">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {FOOTER_CONTENT[activeTab].title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-500 hover:text-white transition-colors border border-white/5 rounded-full hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-white/10 bg-black overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-white border-b-2 border-blue-500 bg-white/5' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 컨텐츠 영역 */}
        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
            {FOOTER_CONTENT[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterModal;