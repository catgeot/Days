import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  Star,
} from 'lucide-react';
import { fetchTourApiFestivalIntro } from '../../utils/fetchTourApiFestivals';

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function festivalImage(item) {
  return item?.firstimage || item?.imageUrl || item?.firstimage2 || '';
}

function pickIntro(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items[0] || null;
}

function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
        {label}
      </p>
      <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-keep">
        {children}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   hubs: Array<{ hubId: string, name: string }>,
 *   favorited?: boolean,
 *   onToggleFavorite?: (item: Record<string, unknown>) => void,
 *   onClose: () => void,
 *   onOpenHub: (hubId: string) => void,
 * }} props
 */
export default function FestivalDetailSheet({
  item,
  hubs = [],
  favorited = false,
  onToggleFavorite,
  onClose,
  onOpenHub,
}) {
  const [intro, setIntro] = useState(null);
  const [introLoading, setIntroLoading] = useState(false);
  const [introError, setIntroError] = useState('');

  useEffect(() => {
    if (!item?.contentId) {
      setIntro(null);
      setIntroError('');
      setIntroLoading(false);
      return undefined;
    }
    let cancelled = false;
    setIntro(null);
    setIntroError('');
    setIntroLoading(true);
    (async () => {
      const data = await fetchTourApiFestivalIntro({
        contentId: item.contentId,
        contentTypeId: item.contentTypeId || '15',
      });
      if (cancelled) return;
      const hit = pickIntro(data);
      if (!data?.ok || !hit) {
        setIntro(null);
        setIntroError('상세 정보를 불러오지 못했습니다.');
        setIntroLoading(false);
        return;
      }
      setIntro(hit);
      setIntroLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [item?.contentId, item?.contentTypeId]);

  if (!item) return null;

  const img = festivalImage(item);
  const start = formatYmdLabel(item.eventStartDate || intro?.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate || intro?.eventEndDate);
  const range = [start, end].filter(Boolean).join(' – ');
  const homepage = String(intro?.eventhomepage || '').trim();
  const tel = String(intro?.sponsor1tel || item.tel || '').trim();

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-stone-900/30 backdrop-blur-sm p-0 md:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-2xl custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="korea-festival-sheet-title"
      >
        {img && (
          <div className="relative h-40 md:h-48 overflow-hidden shrink-0">
            <img
              src={img}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>
        )}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              {range ? (
                <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                  <CalendarDays size={12} aria-hidden="true" />
                  {range}
                </p>
              ) : (
                <span />
              )}
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(item)}
                  aria-label={favorited ? '즐겨찾기 해제' : '즐겨찾기'}
                  aria-pressed={favorited}
                  className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-600 hover:bg-amber-50 hover:border-amber-300"
                >
                  <Star
                    size={16}
                    className={
                      favorited
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-stone-400'
                    }
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
            <h3
              id="korea-festival-sheet-title"
              className="text-xl font-extrabold leading-snug text-stone-900"
            >
              {item.title}
            </h3>
            {item.addr1 && (
              <p className="text-xs text-stone-500 flex items-start gap-1">
                <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{item.addr1}</span>
              </p>
            )}
          </div>

          {introLoading && (
            <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              상세 불러오는 중…
            </div>
          )}

          {!introLoading && introError && (
            <p className="text-xs text-stone-500">{introError}</p>
          )}

          {!introLoading && intro && (
            <div className="space-y-3 border-t border-stone-200 pt-3">
              <DetailRow label="행사 장소">
                {intro.eventplace &&
                String(intro.eventplace) !== String(item.addr1 || '')
                  ? intro.eventplace
                  : null}
              </DetailRow>
              <DetailRow label="행사 시간">{intro.playtime}</DetailRow>
              <DetailRow label="이용 요금">{intro.usetimefestival}</DetailRow>
              <DetailRow label="주최">{intro.sponsor1}</DetailRow>
              {tel && (
                <DetailRow label="문의">
                  <a
                    href={`tel:${tel.replace(/\s+/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-950"
                  >
                    <Phone size={13} aria-hidden="true" />
                    {tel}
                  </a>
                </DetailRow>
              )}
              {homepage && (
                <DetailRow label="홈페이지">
                  <a
                    href={homepage.startsWith('http') ? homepage : `https://${homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-950 break-all"
                  >
                    <ExternalLink size={13} className="shrink-0" aria-hidden="true" />
                    <span className="line-clamp-2">{homepage}</span>
                  </a>
                </DetailRow>
              )}
            </div>
          )}

          {hubs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                인근 여행지
              </p>
              <div className="flex flex-wrap gap-2">
                {hubs.map((hub) => (
                  <button
                    key={hub.hubId}
                    type="button"
                    onClick={() => onOpenHub(hub.hubId)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
