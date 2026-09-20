import React from 'react';
import { useTranslation } from 'react-i18next';
import { PLANNER_STAGE } from '../../../../../utils/placePlannerFocus';
import { plannerCaption } from '../readableText';

const STAGES = [
  { id: PLANNER_STAGE.ESSENTIAL, labelKey: 'place.planner.stages.essential', step: 1 },
  { id: PLANNER_STAGE.TRANSFER, labelKey: 'place.planner.stages.transfer', step: 2 },
  { id: PLANNER_STAGE.ENJOY, labelKey: 'place.planner.stages.enjoy', step: 3 },
];

const NEXT_HINT_KEY = {
  [PLANNER_STAGE.ESSENTIAL]: 'place.planner.stages.nextHintEssential',
  [PLANNER_STAGE.TRANSFER]: 'place.planner.stages.nextHintTransfer',
  [PLANNER_STAGE.ENJOY]: 'place.planner.stages.nextHintEnjoy',
};

function StageButtons({ stages, value, onChange, asTabs }) {
  const { t } = useTranslation();

  return stages.map((stage) => {
    const selected = value === stage.id;
    return (
      <button
        key={stage.id}
        type="button"
        {...(asTabs ? { role: 'tab', 'aria-selected': selected } : {})}
        onClick={() => onChange(stage.id)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-sm transition-colors ${
          selected
            ? 'border border-blue-600 bg-blue-600 text-white'
            : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="tabular-nums">{stage.step}</span>
        {t(stage.labelKey)}
      </button>
    );
  });
}

const PlannerStageNav = ({ value, onChange, variant = 'top' }) => {
  const { t } = useTranslation();

  if (variant === 'footer') {
    const nextStages = STAGES.filter((stage) => stage.id !== value);
    return (
      <div className="mt-6 mb-4 shrink-0">
        <p className={`${plannerCaption} mb-3 text-gray-600`}>
          {t(NEXT_HINT_KEY[value] || NEXT_HINT_KEY[PLANNER_STAGE.ESSENTIAL])}
        </p>
        <div
          className="flex flex-wrap gap-2"
          aria-label={t('place.planner.stages.nextNavAria')}
        >
          <StageButtons stages={nextStages} value={value} onChange={onChange} asTabs={false} />
        </div>
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={t('place.planner.stages.navAria')}
      className="mb-6 flex flex-wrap gap-2 shrink-0"
    >
      <StageButtons stages={STAGES} value={value} onChange={onChange} asTabs />
    </div>
  );
};

export default PlannerStageNav;
