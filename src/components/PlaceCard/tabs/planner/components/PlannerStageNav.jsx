import React from 'react';
import { useTranslation } from 'react-i18next';
import { PLANNER_STAGE } from '../../../../../utils/placePlannerFocus';

const STAGES = [
  { id: PLANNER_STAGE.ESSENTIAL, labelKey: 'place.planner.stages.essential', step: 1 },
  { id: PLANNER_STAGE.TRANSFER, labelKey: 'place.planner.stages.transfer', step: 2 },
  { id: PLANNER_STAGE.ENJOY, labelKey: 'place.planner.stages.enjoy', step: 3 },
];

const PlannerStageNav = ({ value, onChange }) => {
  const { t } = useTranslation();

  return (
    <div
      role="tablist"
      aria-label={t('place.planner.stages.navAria')}
      className="mb-6 flex flex-wrap gap-2 shrink-0"
    >
      {STAGES.map((stage) => {
        const selected = value === stage.id;
        return (
          <button
            key={stage.id}
            type="button"
            role="tab"
            aria-selected={selected}
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
      })}
    </div>
  );
};

export default PlannerStageNav;
