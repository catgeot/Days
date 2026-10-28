import React from 'react';
import { resolveVerifiedFacts } from '../../../data/placeVerifiedFacts/index.js';
import { verifiedFactSlots } from '../../../data/placeVerifiedFacts/localInfoLayout.js';
import { useVisitStories } from '../hooks/useVisitStories';
import PlaceVerifiedFacts, { PlaceVisitStories } from './PlaceVerifiedFacts';

/**
 * Gallery «현지 정보» + «다녀온 이야기» — single mount (no duplicate #facts/#stories).
 * Parent supplies responsive visibility (e.g. lg:hidden vs hidden lg:block).
 */
export default function PlaceGalleryFactsAndStories({
  location,
  className = '',
  sectionClassName = '',
  wrapperClassName = '',
}) {
  const card = resolveVerifiedFacts(location);
  const filled = card ? verifiedFactSlots(card) : [];
  const hasFacts = filled.length > 0;
  const { stories, isLoading } = useVisitStories(location);
  const hasStories = Boolean(card && !isLoading && stories.length > 0);

  if (!hasFacts && !hasStories) return null;

  const sections = (
    <>
      {hasFacts ? (
        <PlaceVerifiedFacts location={location} className={sectionClassName} />
      ) : null}
      {hasStories || (card && isLoading) ? (
        <PlaceVisitStories
          location={location}
          className={sectionClassName}
          stories={stories}
          isLoading={isLoading}
        />
      ) : null}
    </>
  );

  if (wrapperClassName) {
    return (
      <div className={`${wrapperClassName} ${className}`.trim()}>
        {sections}
      </div>
    );
  }

  if (className) {
    return <div className={className}>{sections}</div>;
  }

  return sections;
}
