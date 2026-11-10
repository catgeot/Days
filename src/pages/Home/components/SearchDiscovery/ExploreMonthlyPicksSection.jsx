import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildVisibleMonthlyPickCards,
  exploreV2MonthlyPickHeadline,
  exploreV2MonthlyPickPreviewHeadline,
  getExploreMonthlyPickSchedule,
  monthlyPickHeadingMonthNumber,
  partitionExploreMonthlyPickCardsByHero,
} from '../../lib/exploreMonthlyPicks';
import ExploreMonthlyPicksLayoutB from './ExploreMonthlyPicksLayoutB';

const ExploreMonthlyPickRow = ({
  monthKey,
  headline,
  onSelectSpot,
  sectionTestId,
  headingTestId,
}) => {
  const cards = useMemo(
    () => (monthKey ? buildVisibleMonthlyPickCards(monthKey) : []),
    [monthKey],
  );
  const { withHero, excluded: excludedNoHero } = useMemo(
    () => partitionExploreMonthlyPickCardsByHero(cards),
    [cards],
  );

  const excludedLabels = useMemo(
    () => excludedNoHero.map((row) => row.name),
    [excludedNoHero],
  );

  if (!monthKey || cards.length === 0 || withHero.length === 0) return null;

  return (
    <section
      data-testid={sectionTestId}
      data-explore-v2-excluded={excludedLabels.join(',') || undefined}
      className="mb-10 w-full animate-fade-in"
      aria-label={headline}
    >
      <h2
        data-testid={headingTestId}
        className="mb-4 text-base font-bold text-white md:text-lg"
      >
        {headline}
      </h2>
      <ExploreMonthlyPicksLayoutB cards={withHero} onSelectSpot={onSelectSpot} />
    </section>
  );
};

const ExploreMonthlyPicksSection = ({ onSelectSpot }) => {
  const { t, i18n } = useTranslation();
  const schedule = useMemo(() => getExploreMonthlyPickSchedule(), []);

  const currentHeadline = useMemo(() => {
    if (!schedule.currentPickKey) return '';
    const monthNum = monthlyPickHeadingMonthNumber(schedule.currentPickKey);
    const isEnUi = String(i18n.language || '')
      .toLowerCase()
      .startsWith('en');
    if (isEnUi && monthNum) {
      return t('home.explore.monthlyPickHeadline', { month: monthNum });
    }
    return exploreV2MonthlyPickHeadline(schedule.currentPickKey);
  }, [schedule.currentPickKey, i18n.language, t]);

  const previewHeadline = useMemo(() => {
    if (!schedule.previewPickKey) return '';
    const monthNum = monthlyPickHeadingMonthNumber(schedule.previewPickKey);
    const isEnUi = String(i18n.language || '')
      .toLowerCase()
      .startsWith('en');
    if (isEnUi && monthNum) {
      return t('home.explore.monthlyPickPreviewHeadline', { month: monthNum });
    }
    return exploreV2MonthlyPickPreviewHeadline(schedule.previewPickKey);
  }, [schedule.previewPickKey, i18n.language, t]);

  return (
    <>
      <ExploreMonthlyPickRow
        monthKey={schedule.currentPickKey}
        headline={currentHeadline}
        onSelectSpot={onSelectSpot}
        sectionTestId="explore-v2-monthly-section"
        headingTestId="explore-v2-monthly-heading"
      />
      <ExploreMonthlyPickRow
        monthKey={schedule.previewPickKey}
        headline={previewHeadline}
        onSelectSpot={onSelectSpot}
        sectionTestId="explore-v2-monthly-preview-section"
        headingTestId="explore-v2-monthly-preview-heading"
      />
    </>
  );
};

export default ExploreMonthlyPicksSection;
