import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveVerifiedFacts } from '../../../data/placeVerifiedFacts/cairo.js';
import { splitItineraryPlaceMentions } from '../../../data/placeVerifiedFacts/itineraryLinks.js';
import {
  AI_GENERATED_LABEL,
  presentFactText,
  publicSourceName,
  slotLooksEmpty,
} from '../../../data/placeVerifiedFacts/schema.js';

function slotHeading(slot, t) {
  return t(`place.facts.slots.${slot.id}`, { defaultValue: slot.label });
}

function unverifiedLine(slots, t) {
  const labels = (Array.isArray(slots) ? slots : [])
    .filter(slotLooksEmpty)
    .map((slot) => slotHeading(slot, t))
    .filter(Boolean);
  if (!labels.length) return '';
  return t('place.facts.unverified', { items: labels.join(', ') });
}

function SourceLine({ sources }) {
  return (
    <span data-fact-source="">
      {sources.map((source, index) => {
        const name = publicSourceName(source.name || source.url);
        const node = source.url ? (
          <a
            key={`${source.url}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white"
          >
            {name}
          </a>
        ) : (
          <span key={`${name}-${index}`}>{name}</span>
        );
        return (
          <React.Fragment key={`${name}-${index}`}>
            {index > 0 ? ' · ' : null}
            {node}
          </React.Fragment>
        );
      })}
    </span>
  );
}

function FactValue({ slot, light }) {
  const text = presentFactText(slot.value);
  if ((slot.linkRole === 'booking' || slot.linkRole === 'map') && /^https?:\/\//.test(slot.value)) {
    const label = slot.linkLabel
      || (slot.linkRole === 'booking' ? '공식 예매' : 'Google 지도');
    return (
      <p data-fact-value="" className="text-sm">
        <a
          href={slot.value}
          target="_blank"
          rel="noopener noreferrer"
          data-official-link={slot.linkRole}
          className={light
            ? 'font-semibold text-sky-800 underline underline-offset-2'
            : 'font-semibold text-sky-200 underline underline-offset-2'}
        >
          {label}
        </a>
      </p>
    );
  }
  const valueClass = light
    ? 'text-sm leading-relaxed text-gray-900 break-keep whitespace-pre-line'
    : 'text-sm leading-relaxed text-white/95 break-keep whitespace-pre-line';
  if (slot.id === 'itinerary') {
    const linkClass = light
      ? 'font-semibold text-sky-800 underline underline-offset-2'
      : 'font-semibold text-sky-200 underline underline-offset-2';
    return (
      <p data-fact-value="" className={valueClass}>
        {splitItineraryPlaceMentions(text).map((part, index) => (
          part.type === 'link' ? (
            <Link
              key={`${part.href}-${index}`}
              to={part.href}
              data-itinerary-place={part.href}
              className={linkClass}
            >
              {part.text}
            </Link>
          ) : (
            <React.Fragment key={`t-${index}`}>{part.text}</React.Fragment>
          )
        ))}
      </p>
    );
  }
  return (
    <p data-fact-value="" className={valueClass}>
      {text}
    </p>
  );
}

export default function PlaceVerifiedFacts({ location, variant = 'dark' }) {
  const { t } = useTranslation();
  const card = resolveVerifiedFacts(location);
  if (!card) return null;
  const light = variant === 'light';
  const filled = card.slots.filter((slot) => !slotLooksEmpty(slot));
  const unverified = unverifiedLine(card.slots, t);
  const metaClass = light
    ? 'mt-0.5 text-[11px] leading-snug text-gray-600 break-all'
    : 'mt-0.5 text-[11px] leading-snug text-white/60 break-all';

  return (
    <section
      data-verified-facts={card.slug}
      data-verified-kind={card.kind}
      className={light
        ? 'mb-4 rounded-2xl border border-emerald-700/20 bg-emerald-50 px-3.5 py-3 text-gray-900'
        : 'mb-4 rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-3.5 py-3 text-white'}
    >
      <h2 className={light
        ? 'text-[11px] font-bold tracking-wide text-emerald-900'
        : 'text-[11px] font-bold tracking-wide text-emerald-100'}
      >
        {t('place.facts.title')}
      </h2>
      <ol className="mt-2 space-y-3">
        {filled.map((slot) => (
          <li key={slot.id} data-fact-slot={slot.id} className="min-w-0">
            <p className={light ? 'text-[11px] font-semibold text-emerald-800' : 'text-[11px] font-semibold text-emerald-200/90'}>
              {slotHeading(slot, t)}
            </p>
            <FactValue slot={slot} light={light} />
            <p className={metaClass}>
              {t('place.facts.source')} <SourceLine sources={slot.sources} />
            </p>
            <p
              data-fact-checked-at=""
              className={light ? 'text-[11px] text-gray-500' : 'text-[11px] text-white/45'}
            >
              {t('place.facts.checked', { date: slot.checkedAt })}
            </p>
          </li>
        ))}
      </ol>
      {unverified ? (
        <p data-unverified-items="" className={metaClass}>
          {unverified}
        </p>
      ) : null}
    </section>
  );
}

export function AiGeneratedBanner({ generatedAt, light = false }) {
  const { t } = useTranslation();
  const date = String(generatedAt || '').trim();
  const label = date
    ? t('place.facts.aiGeneratedDated', { date })
    : t('place.facts.aiGenerated');
  return (
    <p
      data-ai-generated-label=""
      className={light
        ? 'mb-3 text-[11px] font-bold tracking-wide text-amber-800'
        : 'mb-3 text-[11px] font-bold tracking-wide text-amber-200/90'}
    >
      {label}
    </p>
  );
}

export { AI_GENERATED_LABEL };
