// src/pages/Home/components/FooterModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react'; // 🚨 [Fix] 필요한 아이콘 추가
import { FOOTER_CONTENT } from '../data/footerData';

const FooterModal = ({ isOpen, onClose, initialTab = 'about' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isCopied, setIsCopied] = useState(false); // 🚨 [New] 복사 상태 관리

  // 모달이 열릴 때마다 선택된 탭과 복사 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsCopied(false);
    }
  }, [isOpen, initialTab]);

  // 🚨 [New] 클립보드 복사 로직 (비관적 설계 적용 - 에러 방어)
  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);
      // 2초 후 툴팁 원래대로 복구
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy email: ", err);
    }
  };

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
          
          {/* 공통 텍스트 렌더링 */}
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
            {FOOTER_CONTENT[activeTab].content}
          </div>

          {/* 🚨 [New] Contact 탭일 경우 전용 액션 버튼 렌더링 */}
          {activeTab === 'contact' && (
            <div className="mt-8 space-y-4 animate-fade-in">
              
              {/* 구글 폼 링크 버튼 */}
              <button
                onClick={() => window.open(FOOTER_CONTENT.contact.formUrl, '_blank')}
                className="w-full py-4 px-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">버그 리포트 및 기능 제안</span>
                  <span className="text-xs text-blue-400">구글 폼으로 안전하게 의견 남기기</span>
                </div>
                <ExternalLink size={20} className="text-blue-500 group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>

              {/* 이메일 복사 버튼 */}
              <button
                onClick={() => handleCopyEmail(FOOTER_CONTENT.contact.email)}
                className="w-full py-4 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between group transition-all relative"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">비즈니스 및 제휴 문의</span>
                  <span className="text-xs text-gray-400 font-mono">{FOOTER_CONTENT.contact.email}</span>
                </div>
                
                {/* 툴팁 상태에 따른 렌더링 */}
                {isCopied ? (
                  <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg animate-fade-in">
                    <Check size={16} />
                    <span className="text-xs font-bold">복사 완료!</span>
                  </div>
                ) : (
                  <div className="p-2 bg-black/40 rounded-lg group-hover:bg-black/60 transition-colors">
                    <Copy size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                )}
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FooterModal;