import React from 'react';
import PlaceWorldEventsSection from '../common/PlaceWorldEventsSection';
import { mobilePlaceHeaderSpacerClass, mobileLandscapeChromeHidden } from '../common/mobilePlaceHeaderInset';

export default function PlaceWorldEventsTabView({ location, mobileSecondaryNav }) {
  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#0a0a0a]">
      <div className={mobilePlaceHeaderSpacerClass} aria-hidden="true" />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden custom-scrollbar-blue md:pt-10 md:pb-6">
        {mobileSecondaryNav ? (
          <div className={`md:hidden shrink-0 px-2 pb-2 ${mobileLandscapeChromeHidden}`}>
            {mobileSecondaryNav}
          </div>
        ) : null}
        <div className="px-4 pb-8 pt-2 md:px-6 md:pt-4">
          <PlaceWorldEventsSection location={location} variant="dark" layout="tab" />
        </div>
      </div>
    </div>
  );
}
