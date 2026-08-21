import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resolveFooterBlock } from '../data/footerData';
import ReleaseNotesList from '../../../shared/components/ReleaseNotesList';
import MapboxCreditsPanel from '../../../shared/components/MapboxCreditsPanel';

const FooterModal = ({ isOpen, onClose, initialTab = 'about' }) => {
  const { t, i18n } = useTranslation();
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

  const contactBlock = useMemo(
    () => resolveFooterBlock('contact', i18n.language),
    [i18n.language],
  );

  if (!isOpen) return null;

  const tabs = [
    { id: 'about', label: t('home.footerModal.tab.about') },
    { id: 'updates', label: t('home.footerModal.tab.updates') },
    { id: 'credits', label: t('home.footerModal.tab.credits') },
    { id: 'terms', label: t('home.footerModal.tab.terms') },
    { id: 'privacy', label: t('home.footerModal.tab.privacy') },
    { id: 'contact', label: t('home.footerModal.tab.contact') },
  ];

  const contentBlock = ['about', 'terms', 'privacy', 'contact'].includes(activeTab)
    ? resolveFooterBlock(activeTab, i18n.language)
    : null;

  return (
    // LogoPanel z-[140] 위 — Credits 등 패널 내부 모달
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade">
        <div className="flex justify-between items-center p-5 border-b border-white/10 bg-black/50">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {activeTab === 'updates'
              ? t('home.footerModal.updatesTitle')
              : activeTab === 'credits'
                ? t('home.footerModal.creditsTitle')
                : contentBlock?.title}
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
          
          {activeTab === 'updates' ? (
            <>
              <p className="text-gray-400 text-sm leading-relaxed break-keep mb-5">
                {t('home.footerModal.updatesIntro')}
              </p>
              <ReleaseNotesList />
            </>
          ) : activeTab === 'credits' ? (
            <MapboxCreditsPanel />
          ) : (
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
              {contentBlock?.content}
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="mt-8 space-y-4 animate-fade-in">
              
              <button
                onClick={() => window.open(contactBlock.formUrl, '_blank')}
                className="w-full py-4 px-5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-between group transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">{t('home.footerModal.feedbackTitle')}</span>
                  <span className="text-xs text-blue-400">{t('home.footerModal.feedbackHint')}</span>
                </div>
                <ExternalLink size={20} className="text-blue-500 group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>

              <button
                onClick={() => handleCopyEmail(contactBlock.email)}
                className="w-full py-4 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between group transition-all relative"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-sm font-bold text-white tracking-wide">{t('home.footerModal.businessTitle')}</span>
                  <span className="text-xs text-gray-400 font-mono">{contactBlock.email}</span>
                </div>
                
                {isCopied ? (
                  <div className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg animate-fade-in">
                    <Check size={16} />
                    <span className="text-xs font-bold">{t('home.footerModal.emailCopied')}</span>
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