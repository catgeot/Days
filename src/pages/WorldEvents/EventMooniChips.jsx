import React from 'react';
import { useTranslation } from 'react-i18next';
import { getWorldEventMooniChips } from '../../utils/worldEventChips';

/**
 * @param {{
 *   event: import('../../utils/worldEvents').WorldEvent,
 *   locale?: string,
 *   onSelect: (prompt: string) => void,
 * }} props
 */
export default function EventMooniChips({ event, locale = 'ko', onSelect }) {
  const { t } = useTranslation();
  const chips = getWorldEventMooniChips(event, locale);
  if (!chips.length) return null;

  return (
    <section className="rounded-2xl border border-cyan-200/80 bg-cyan-50/60 p-3 shadow-sm">
      <h2 className="text-xs font-extrabold uppercase tracking-wide text-cyan-800">
        {t('worldEventDetail.mooniChips.title')}
      </h2>
      <p className="mt-1 text-[11px] leading-relaxed text-cyan-900/80">
        {t('worldEventDetail.mooniChips.hint')}
      </p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.prompt)}
            className="inline-flex shrink-0 items-center rounded-full border border-cyan-400/40 bg-white px-3 py-1.5 text-xs font-semibold text-cyan-950 hover:border-cyan-500/60 hover:bg-cyan-100/80"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </section>
  );
}
