import React from 'react';
import ExploreMonthlyPickItem from './ExploreMonthlyPickItem';
import {
  EXPLORE_MONTHLY_PICK_DESKTOP_BOARD_CLASS,
  EXPLORE_MONTHLY_PICK_DESKTOP_ROW_CLASS,
  EXPLORE_MONTHLY_PICK_DESKTOP_ROWS,
  EXPLORE_MONTHLY_PICK_LAYOUT_B_GRID_CLASS,
  resolveExploreMonthlyPickLayoutBGridClass,
  resolveExploreMonthlyPickLayoutBVariant,
} from './exploreMonthlyGridLayout.js';
import useExploreMonthlyPickDesktopLayout from './useExploreMonthlyPickDesktopLayout.js';

const ExploreMonthlyPicksLayoutB = ({ cards, onSelectSpot }) => {
  const desktop = useExploreMonthlyPickDesktopLayout();

  if (desktop) {
    return (
      <div data-testid="explore-v2-monthly-layout-b" className="w-full min-w-0">
        <div
          data-testid="explore-v2-monthly-layout-desktop"
          className={EXPLORE_MONTHLY_PICK_DESKTOP_BOARD_CLASS}
        >
          {EXPLORE_MONTHLY_PICK_DESKTOP_ROWS.map((row, rowIdx) => (
            <div
              key={`desktop-row-${rowIdx}`}
              data-testid={`explore-v2-monthly-desktop-row-${rowIdx + 1}`}
              className={`${EXPLORE_MONTHLY_PICK_DESKTOP_ROW_CLASS}${
                rowIdx === 1 ? '' : ' min-h-[22rem] sm:min-h-[24rem]'
              }`}
              data-row-kind={rowIdx === 1 ? 'mid' : 'mirror'}
            >
              {row.map(({ index, colClass, variant }) => {
                const card = cards[index];
                if (!card) return null;
                const slug = String(card.spot?.slug || card.entry?.slug || '').toLowerCase();
                return (
                  <ExploreMonthlyPickItem
                    key={card.spot?.id ?? card.entry?.slug ?? slug}
                    spot={card.spot}
                    entry={card.entry}
                    imageUrl={card.imageUrl}
                    onSelect={onSelectSpot}
                    variant={variant}
                    pickIndex={index}
                    desktop
                    className={colClass}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="explore-v2-monthly-layout-b"
      className={`w-full min-w-0 ${EXPLORE_MONTHLY_PICK_LAYOUT_B_GRID_CLASS}`}
    >
      {cards.map(({ spot, entry, imageUrl }, index) => {
        const slug = String(spot?.slug || entry?.slug || '').toLowerCase();
        return (
          <ExploreMonthlyPickItem
            key={spot.id ?? entry.slug ?? slug}
            spot={spot}
            entry={entry}
            imageUrl={imageUrl}
            onSelect={onSelectSpot}
            variant={resolveExploreMonthlyPickLayoutBVariant(index, slug)}
            pickIndex={index}
            className={resolveExploreMonthlyPickLayoutBGridClass(index, slug)}
          />
        );
      })}
    </div>
  );
};

export default ExploreMonthlyPicksLayoutB;
