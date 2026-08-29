import React from 'react';
import { ExternalLink, MapPin, Search, ShoppingBag, Ticket, Car } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getWorldEventActionChips } from '../../utils/worldEventChips';

const KIND_ICON = {
  official: Ticket,
  map: MapPin,
  search: Search,
  rental: Car,
  tour: Ticket,
  shop: ShoppingBag,
};

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventActionChips({ event, locale = 'ko' }) {
  const { t } = useTranslation();
  const chips = getWorldEventActionChips(event, locale);
  if (!chips.length) return null;

  return (
    <section className="mb-3 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <h2 className="text-xs font-extrabold uppercase tracking-wide text-stone-500">
        {t('worldEventDetail.actionChips.title')}
      </h2>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => {
          const Icon = KIND_ICON[chip.kind] || ExternalLink;
          return (
            <a
              key={chip.id}
              href={chip.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:border-amber-300 hover:bg-amber-100"
            >
              <Icon size={12} aria-hidden />
              <span>{chip.label}</span>
              <ExternalLink size={10} className="opacity-60" aria-hidden />
            </a>
          );
        })}
      </div>
    </section>
  );
}
