import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { FOOTER_CONTENT } from '../data/footerData';

const FooterModal = ({ isOpen, onClose, initialTab = 'about' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setActiveTab(initialTab);
        setIsCopied(false);
      });
    }
  }, [isOpen, initialTab]);

  const handleCopyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setIsCopied(true);
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
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade">
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

        <div className="p-6 md:p-8 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
            {FOOTER_CONTENT[activeTab].content}
          </div>

          {activeTab === 'contact' && (
            <div className="mt-8 space-y-4 animate-fade-in">
              
              <button
                onClick={() => window.open(FOOTER_CONTENT.contact.formUrl, '_blank')}
                className="w-full py-4 px-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">버그 리포트 및 기능 제안</span>
                  <span className="text-xs text-blue-400">구글 폼으로 안전하게 의견 보내기</span>
                </div>
                <ExternalLink size={20} className="text-blue-500 group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>

              <button
                onClick={() => handleCopyEmail(FOOTER_CONTENT.contact.email)}
                className="w-full py-4 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between group transition-all relative"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">비즈니스 및 제휴 문의</span>
                  <span className="text-xs text-gray-400 font-mono">{FOOTER_CONTENT.contact.email}</span>
                </div>
                
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