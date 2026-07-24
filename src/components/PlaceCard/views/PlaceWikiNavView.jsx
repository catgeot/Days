import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Sparkles, Briefcase, Ticket } from 'lucide-react';
import GetYourGuideActivitiesWidget from '../tabs/planner/components/GetYourGuideActivitiesWidget';
import { buildGygActivitiesSearchQuery } from '../tabs/planner/locationRules';

const PlaceWikiNavView = ({
  wikiData,
  isWikiLoading,
  onNavClick,
  placeName,
  location,
  matchedPackage,
  onOpenPackage,
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [isAiExpanded, setIsAiExpanded] = useState(false);

  const gygQuery = useMemo(
    () => buildGygActivitiesSearchQuery(location),
    [
      location?.slug,
      location?.name,
      location?.name_en,
      location?.curation_data?.locationEn,
    ]
  );
  const hasGyg = Boolean(gygQuery);
  const sections = wikiData?.sections;
  const hasSections = Array.isArray(sections) && sections.length > 0;

  useEffect(() => {
    const handleState = (e) => {
      setIsAiExpanded(e.detail);
      if (e.detail) {
        setActiveSection('ai');
      } else if (activeSection === 'ai') {
        setActiveSection(null);
      }
    };
    window.addEventListener('ai-expanded-state', handleState);
    return () => window.removeEventListener('ai-expanded-state', handleState);
  }, [activeSection]);

  const handleRemoteAiRequest = () => {
    setActiveSection('ai');
    if (isAiExpanded) {
      window.dispatchEvent(new CustomEvent('scroll-to-ai-section'));
    } else {
      window.dispatchEvent(
        new CustomEvent('request-ai-info', {
          detail: { placeName: placeName },
        })
      );
    }
  };

  const handleSectionClick = (idx) => {
    setActiveSection(idx);
    onNavClick(`wiki-section-${idx}`);
  };

  const watsonBtnClass = (compact) =>
    `group flex items-center justify-center gap-1.5 rounded-xl transition-all duration-300 shadow-sm border ${
      compact ? 'px-2.5 py-2 shrink-0' : 'flex-1 px-3 py-2.5'
    } ${
      activeSection === 'ai'
        ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 border-blue-400/50 ring-2 ring-blue-500/30'
        : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border-blue-500/30'
    }`;

  const watsonButton = (compact = false) => (
    <button type="button" onClick={handleRemoteAiRequest} className={watsonBtnClass(compact)}>
      <Sparkles
        size={compact ? 14 : 15}
        className={`group-hover:scale-110 transition-transform ${
          activeSection === 'ai' ? 'text-white' : 'text-blue-400'
        }`}
      />
      <span
        className={`font-medium tracking-wide ${
          compact ? 'text-[11px] whitespace-nowrap' : 'text-xs'
        } ${activeSection === 'ai' ? 'text-white' : 'text-gray-200'}`}
      >
        {isAiExpanded ? '로컬 왓슨' : '제미나이'}
      </span>
    </button>
  );

  const packageButton = (compact = false) =>
    matchedPackage ? (
      <button
        type="button"
        onClick={onOpenPackage}
        className={`group flex items-center justify-center gap-1.5 rounded-xl transition-all duration-300 shadow-sm border bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/90 hover:to-blue-500/90 border-purple-400/50 ${
          compact ? 'px-2.5 py-2 shrink-0' : 'flex-1 px-3 py-2.5'
        }`}
      >
        <Briefcase
          size={compact ? 14 : 15}
          className="group-hover:scale-110 transition-transform text-purple-100"
        />
        <span
          className={`font-medium tracking-wide text-white ${
            compact ? 'text-[11px] whitespace-nowrap' : 'text-xs'
          }`}
        >
          패키지
        </span>
      </button>
    ) : null;

  if (isWikiLoading) {
    return (
      <div className="animate-fade-in flex flex-col h-full p-5 pb-4">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 shrink-0">
          <BookOpen size={18} className="text-amber-400" />
          문서 목차
        </h2>
        <div className="flex flex-col gap-3 animate-pulse flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-white/5 border border-white/5 rounded-xl w-full"
            />
          ))}
        </div>
      </div>
    );
  }

  if (hasGyg) {
    return (
      <div className="animate-fade-in flex h-full min-h-0 flex-col px-3 pt-4 pb-3 md:px-4">
        <div className="mb-2.5 flex shrink-0 items-center gap-2">
          <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] font-bold text-white">
            <Ticket size={17} className="shrink-0 text-orange-400" />
            <span className="truncate">현지 투어</span>
          </h2>
          <div className="flex shrink-0 items-center gap-1.5">
            {watsonButton(true)}
            {packageButton(true)}
          </div>
        </div>
        {/* GYG는 컨테이너 폭에 따라 열이 잡힘 — 패딩 최소화로 2열·패널 폭 활용 */}
        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <GetYourGuideActivitiesWidget
            location={location}
            query={gygQuery}
            variant="open"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-full p-5 pb-4">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold text-white">
          <BookOpen size={18} className="shrink-0 text-amber-400" />
          <span className="truncate">문서 목차</span>
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          {watsonButton(true)}
          {packageButton(true)}
        </div>
      </div>

      {hasSections ? (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {sections.map((sec, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSectionClick(idx)}
              className={`text-left px-4 py-3 rounded-xl transition-all text-sm border group
                ${
                  activeSection === idx
                    ? 'bg-white/10 border-white/20 text-white font-medium shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border-white/5'
                }
              `}
            >
              <span
                className={`${
                  activeSection === idx
                    ? 'text-amber-400'
                    : 'text-amber-500/50 group-hover:text-amber-400'
                } mr-2`}
              >
                {idx + 1}.
              </span>
              {sec.title}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm flex-1 break-keep leading-relaxed">
          아직 매거진 목차가 없어요. 오른쪽 본문에서 매거진을 만들거나 확인해 보세요.
        </p>
      )}
    </div>
  );
};

export default PlaceWikiNavView;
