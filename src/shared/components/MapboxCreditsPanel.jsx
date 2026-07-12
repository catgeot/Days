import React from 'react';
import { ExternalLink } from 'lucide-react';
import {
  FLIGHT_ROUTE_ATTRIBUTION,
  GATEO_TECH_STACK,
  MAPBOX_ATTRIBUTION_LINKS,
  MAPBOX_CREDITS_INTRO,
  MAPBOX_TELEMETRY,
} from '../../data/mapboxAttribution';

const linkClass =
  'inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors';

const MapboxCreditsPanel = () => (
  <div className="space-y-8 text-sm leading-relaxed">
    <p className="text-gray-400 break-keep">{MAPBOX_CREDITS_INTRO}</p>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">지도 데이터 출처</h3>
      <ul className="space-y-2">
        {MAPBOX_ATTRIBUTION_LINKS.map((item) => (
          <li key={item.label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {item.label}
              <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden />
            </a>
            {item.note ? (
              <span className="text-[11px] text-gray-500">({item.note})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">항공 경로 데이터</h3>
      <p className="text-gray-400 text-xs leading-relaxed break-keep mb-3">
        {FLIGHT_ROUTE_ATTRIBUTION.intro}
      </p>
      <ul className="space-y-2">
        {FLIGHT_ROUTE_ATTRIBUTION.links.map((item) => (
          <li key={item.label} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              {item.label}
              <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden />
            </a>
            {item.note ? (
              <span className="text-[11px] text-gray-500">({item.note})</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Mapbox Telemetry</h3>
      <p className="text-gray-400 text-xs leading-relaxed mb-2">{MAPBOX_TELEMETRY.description}</p>
      <a
        href={MAPBOX_TELEMETRY.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {MAPBOX_TELEMETRY.label}
        <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden />
      </a>
    </section>

    <section>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">기술 및 서비스</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {GATEO_TECH_STACK.map((item) => (
          <li
            key={item.name}
            className="flex items-baseline justify-between gap-3 py-2 px-3 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <span className="font-medium text-gray-200">{item.name}</span>
            <span className="text-[11px] text-gray-500 text-right">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  </div>
);

export default MapboxCreditsPanel;
