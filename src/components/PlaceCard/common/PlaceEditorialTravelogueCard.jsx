import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown } from 'lucide-react';
import { usePlaceEditorialTravelogues } from '../hooks/usePlaceEditorialTravelogues';
import { publicLogbookDetailPath } from '../../../utils/logbookEditorial';
import { resolveLogbookDek } from '../../../utils/logbookDek';
import { logbookHeroImageUrl } from '../../../utils/logbookImageSrc';
import { travelogueRowKey } from '../../../utils/placeEditorialTravelogue';

function TravelogueCover({ report }) {
  const [broken, setBroken] = useState(false);
  const thumb = logbookHeroImageUrl(report.images, { role: 'thumb' });
  if (!thumb || broken) {
    return (
      <div
        className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-black/40 flex items-center justify-center"
        aria-hidden
      >
        <BookOpen className="h-7 w-7 text-indigo-200/50" />
      </div>
    );
  }
  return (
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <img
        src={thumb}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function TravelogueRow({ report }) {
  const dek = resolveLogbookDek(report, { maxLeadLen: 120 });
  const href = publicLogbookDetailPath(report);
  return (
    <Link
      to={href}
      data-place-travelogue-item=""
      data-place-travelogue-slug={report.slug || undefined}
      className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition-colors hover:border-indigo-300/35 hover:bg-white/[0.06]"
      onClick={(event) => event.stopPropagation()}
    >
      <TravelogueCover report={report} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white line-clamp-2 break-keep">{report.title}</h3>
        {dek ? (
          <p className="mt-1 text-[12px] leading-snug text-white/55 line-clamp-2 break-keep">{dek}</p>
        ) : null}
        <p className="mt-1.5 text-[11px] font-medium text-indigo-200/80">기행문 읽기 ›</p>
      </div>
    </Link>
  );
}

export default function PlaceEditorialTravelogueCard({ location, className = '' }) {
  const panelId = useId();
  const [open, setOpen] = useState(true);
  const { enabled, items, isLoading } = usePlaceEditorialTravelogues(location);

  if (!enabled || isLoading || !items.length) return null;

  return (
    <section
      data-place-travelogue-card=""
      aria-label="GATEO 기행문"
      className={`rounded-2xl border border-white/10 bg-black/35 backdrop-blur-md mb-4 ${className}`.trim()}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <BookOpen size={16} className="shrink-0 text-indigo-200" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-bold text-white">GATEO 기행문</span>
        <span className="shrink-0 text-[10px] font-semibold text-white/45">{items.length}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/60 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="space-y-2 px-3 pb-3.5">
          {items.map((report) => (
            <TravelogueRow key={travelogueRowKey(report) || String(report.id)} report={report} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
