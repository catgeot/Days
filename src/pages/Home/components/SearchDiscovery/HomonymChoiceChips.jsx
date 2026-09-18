import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  isKoreaHomonymCandidate,
  isKoreaHomonymChoiceSet,
  koreaHomonymChipLabel,
  koreaHomonymChoiceQuery,
} from '../../lib/detectHomonymLocation';

export function HomonymChoiceChips({
  query = '',
  candidates = [],
  onSelect,
  compact = false,
  showPrompt = true,
}) {
  const { t } = useTranslation();
  if (!isKoreaHomonymChoiceSet(candidates)) return null;
  const placeName = koreaHomonymChoiceQuery(candidates, query);
  const chipItems = candidates.filter(isKoreaHomonymCandidate);
  if (!placeName || chipItems.length < 2) return null;

  return (
    <div data-homonym-choice-chips="true" className={compact ? 'px-3 py-2' : 'mb-4'}>
      {showPrompt ? (
        <p
          className={`break-keep font-bold text-white ${
            compact ? 'mb-2 text-[13px]' : 'mb-3 text-base md:text-lg'
          }`}
        >
          {t('home.explore.homonymChoiceTitle', { query: placeName })}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {chipItems.map((item) => (
          <button
            key={item.id || koreaHomonymChipLabel(item)}
            type="button"
            onClick={() => onSelect?.(item)}
            className="rounded-full border border-white/25 bg-[#32281f]/95 px-3 py-1.5 text-[13px] font-semibold text-white shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all break-keep hover:border-sky-300/50 hover:bg-[#3a2f25]"
          >
            {koreaHomonymChipLabel(item)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HomonymChoiceChips;
