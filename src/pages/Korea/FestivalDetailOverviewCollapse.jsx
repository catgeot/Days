import React, { useId, useState } from 'react';
import FestivalDetailProse from './FestivalDetailProse';

/**
 * @param {{ text: string, expandLabel: string, collapseLabel: string, overviewLabel: string }} props
 */
export function FestivalDetailOverviewCollapse({
  text,
  expandLabel,
  collapseLabel,
  overviewLabel,
}) {
  const [expanded, setExpanded] = useState(false);
  const bodyId = useId();
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  return (
    <div
      data-festival-detail-overview=""
      className="rounded-2xl border border-stone-200/80 bg-stone-50/60 px-3.5 py-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
        {overviewLabel}
      </p>
      <div
        id={bodyId}
        className={expanded ? '' : 'line-clamp-3'}
        data-festival-overview-body=""
      >
        <FestivalDetailProse text={trimmed} variant="overview" />
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-bold text-amber-800 hover:text-amber-950"
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={() => setExpanded((prev) => !prev)}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}
