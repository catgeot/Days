import React, { useState, useMemo } from 'react';
import { BookOpen, Briefcase, Ticket } from 'lucide-react';
import GetYourGuideActivitiesWidget, {
  GYG_ACTIVITIES_FRAME_WIDTH,
} from '../tabs/planner/components/GetYourGuideActivitiesWidget';
import { buildGygActivitiesSearchQuery } from '../tabs/planner/locationRules';

const PlaceWikiNavView = ({
  wikiData,
  isWikiLoading,
  onNavClick,
  location,
  matchedPackage,
  onOpenPackage,
}) => {
  const [activeSection, setActiveSection] = useState(null);

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

  const handleSectionClick = (idx) => {
    setActiveSection(idx);
    onNavClick(`wiki-section-${idx}`);
  };

  const packageButton = matchedPackage ? (
    <button
      type="button"
      onClick={onOpenPackage}
      className="group flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-purple-400/50 bg-gradient-to-r from-purple-600/80 to-blue-600/80 px-2.5 py-2 shadow-sm transition-all duration-300 hover:from-purple-500/90 hover:to-blue-500/90"
    >
      <Briefcase
        size={14}
        className="text-purple-100 transition-transform group-hover:scale-110"
      />
      <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-white">
        패키지
      </span>
    </button>
  ) : null;

  if (isWikiLoading) {
    return (
      <div className="animate-fade-in flex h-full flex-col p-5 pb-4">
        <h2 className="mb-4 flex shrink-0 items-center gap-2 text-lg font-bold text-white">
          <BookOpen size={18} className="text-amber-400" />
          문서 목차
        </h2>
        <div className="flex flex-1 animate-pulse flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 w-full rounded-xl border border-white/5 bg-white/5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (hasGyg) {
    return (
      <div className="animate-fade-in flex h-full min-h-0 flex-col px-2 pt-4 pb-3">
        <div className="mb-2.5 flex shrink-0 items-center gap-2 px-0.5">
          <h2 className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] font-bold text-white">
            <Ticket size={17} className="shrink-0 text-orange-400" />
            <span className="truncate">현지 투어</span>
          </h2>
          {packageButton}
        </div>
        <div className="custom-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <GetYourGuideActivitiesWidget
            location={location}
            query={gygQuery}
            variant="open"
            frameWidth={GYG_ACTIVITIES_FRAME_WIDTH}
            showMoreLink
            linkSponsoredLabel
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex h-full flex-col p-5 pb-4">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-bold text-white">
          <BookOpen size={18} className="shrink-0 text-amber-400" />
          <span className="truncate">문서 목차</span>
        </h2>
        {packageButton}
      </div>

      {hasSections ? (
        <div className="custom-scrollbar flex flex-1 flex-col gap-2 overflow-y-auto pr-1 pb-4">
          {sections.map((sec, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSectionClick(idx)}
              className={`group rounded-xl border px-4 py-3 text-left text-sm transition-all
                ${
                  activeSection === idx
                    ? 'border-white/20 bg-white/10 font-medium text-white shadow-md'
                    : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
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
        <p className="flex-1 break-keep text-sm leading-relaxed text-gray-400">
          아직 매거진 목차가 없어요. 오른쪽 본문에서 매거진을 만들거나 확인해 보세요.
        </p>
      )}
    </div>
  );
};

export default PlaceWikiNavView;
