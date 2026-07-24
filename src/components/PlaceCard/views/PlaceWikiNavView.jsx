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

  const watsonPackageBar = (
    <div
      className={`shrink-0 flex flex-col md:flex-row gap-2 ${
        hasGyg || hasSections ? 'mb-4' : ''
      }`}
    >
      <button
        type="button"
        onClick={handleRemoteAiRequest}
        className={`flex-1 group flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300 shadow-sm border
          ${
            activeSection === 'ai'
              ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 border-blue-400/50 ring-2 ring-blue-500/30'
              : 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border-blue-500/30'
          }
        `}
      >
        <Sparkles
          size={15}
          className={`group-hover:scale-110 transition-transform ${
            activeSection === 'ai' ? 'text-white' : 'text-blue-400'
          }`}
        />
        <span
          className={`text-xs font-medium tracking-wide ${
            activeSection === 'ai' ? 'text-white' : 'text-gray-200'
          }`}
        >
          {isAiExpanded ? '로컬 왓슨 정보 보기' : '제미나이 최신 정보'}
        </span>
      </button>

      {matchedPackage ? (
        <button
          type="button"
          onClick={onOpenPackage}
          className="flex-1 group flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300 shadow-sm border bg-gradient-to-r from-purple-600/80 to-blue-600/80 hover:from-purple-500/90 hover:to-blue-500/90 border-purple-400/50"
        >
          <Briefcase
            size={15}
            className="group-hover:scale-110 transition-transform text-purple-100"
          />
          <span className="text-xs font-medium tracking-wide text-white">패키지 여행</span>
        </button>
      ) : null}
    </div>
  );

  if (isWikiLoading) {
    return (
      <div className="animate-fade-in flex flex-col h-full p-8 pb-6">
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
      <div className="animate-fade-in flex flex-col h-full p-8 pb-6">
        <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 shrink-0">
          <Ticket size={18} className="text-orange-400" />
          현지 투어
        </h2>
        {watsonPackageBar}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
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
    <div className="animate-fade-in flex flex-col h-full p-8 pb-6">
      <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2 shrink-0">
        <BookOpen size={18} className="text-amber-400" />
        문서 목차
      </h2>

      {watsonPackageBar}

      {hasSections ? (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
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
