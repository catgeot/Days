import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ExternalLink, Landmark, Phone, X } from 'lucide-react';
import { setPlaceReturnTo } from '../Home/lib/placeReturnTo';
import { fetchTourApiAttractionDetail } from '../../utils/fetchTourApiAttractionDetail';

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function cleanUrlCandidate(raw) {
  return String(raw || '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .trim()
    .replace(/[),\];.'"”’]+$/g, '');
}

function normalizeHomepage(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';

  const href = s.match(/href=["']([^"']+)["']/i)?.[1];
  if (href) {
    const fromHref = cleanUrlCandidate(href);
    if (/^https?:\/\//i.test(fromHref)) return fromHref;
    if (/^[\w.-]+\.[\w.-]+/.test(fromHref)) return `https://${fromHref}`;
  }

  const urlInText = s.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  if (urlInText) return cleanUrlCandidate(urlInText);

  const candidate = cleanUrlCandidate(stripHtml(s));
  if (!candidate) return '';
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (/^[\w.-]+\.[\w.-]+(?:\/\S*)?$/.test(candidate)) {
    return `https://${candidate}`;
  }
  return '';
}

function normalizeCompareText(raw) {
  return stripHtml(raw)
    .replace(/\s+/g, '')
    .toLowerCase();
}

function textsSimilarOrEqual(a, b) {
  const left = normalizeCompareText(a);
  const right = normalizeCompareText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 40 && right.includes(left)) return true;
  if (right.length >= 40 && left.includes(right)) return true;
  return false;
}

function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm sm:grid-cols-[5.5rem_minmax(0,1fr)]">
      <dt className="pt-0.5 text-[11px] font-bold text-stone-500">{label}</dt>
      <dd className="min-w-0 whitespace-pre-line leading-relaxed text-stone-700 break-keep">
        {children}
      </dd>
    </div>
  );
}

const INTRO_FIELDS = [
  ['infocenter', '문의'],
  ['usetime', '이용 시간'],
  ['restdate', '휴무일'],
  ['parking', '주차'],
  ['useseason', '이용 시기'],
  ['opendate', '개장'],
  ['expguide', '체험 안내'],
  ['expagerange', '체험 연령'],
  ['accomcount', '수용'],
  ['chkbabycarriage', '유모차'],
  ['chkpet', '반려동물'],
  ['chkcreditcard', '신용카드'],
];

/**
 * @param {{
 *   spot: {
 *     id: string,
 *     name: string,
 *     subtitle?: string,
 *     blurb?: string,
 *     placeSlug?: string | null,
 *     contentId?: string | null,
 *   } | null,
 *   eyebrow?: string,
 *   returnTo: string,
 *   onClose: () => void,
 * }} props
 */
export default function ThemeSpotDetailModal({
  spot,
  eyebrow = '테마 상세',
  returnTo,
  onClose,
}) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [spot?.id]);

  useEffect(() => {
    if (!spot) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError('');
      return undefined;
    }

    const contentId = String(spot.contentId || '').trim();
    if (!/^\d{1,32}$/.test(contentId)) {
      setDetail(null);
      setDetailLoading(false);
      setDetailError('');
      return undefined;
    }

    let cancelled = false;
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);

    (async () => {
      const data = await fetchTourApiAttractionDetail({ contentId });
      if (cancelled) return;
      setDetailLoading(false);
      if (!data) {
        setDetail(null);
        setDetailError('Tour 상세 없음');
        return;
      }
      setDetail(data);
    })();

    return () => {
      cancelled = true;
    };
  }, [spot?.id, spot?.contentId]);

  const overview = useMemo(
    () => stripHtml(detail?.overview || ''),
    [detail?.overview],
  );

  const homepage = useMemo(
    () => normalizeHomepage(detail?.homepage),
    [detail?.homepage],
  );

  const address = useMemo(() => {
    const a1 = String(detail?.addr1 || '').trim();
    const a2 = String(detail?.addr2 || '').trim();
    return [a1, a2].filter(Boolean).join(' ');
  }, [detail?.addr1, detail?.addr2]);

  const tel = String(detail?.tel || '').trim();

  const introRows = useMemo(() => {
    const intro = detail?.intro;
    if (!intro) return [];
    return INTRO_FIELDS.map(([key, label]) => ({
      key,
      label,
      text: stripHtml(intro[key] || ''),
    })).filter((row) => row.text);
  }, [detail?.intro]);

  const infoSections = useMemo(() => {
    const rows = (detail?.infoItems || [])
      .map((row) => ({
        name: stripHtml(row?.infoname || ''),
        text: stripHtml(row?.infotext || ''),
      }))
      .filter((row) => row.name || row.text);

    const out = [];
    for (const row of rows) {
      if (
        (row.name.includes('개요') || row.name.includes('소개')) &&
        overview &&
        textsSimilarOrEqual(row.text, overview)
      ) {
        continue;
      }
      out.push(row);
    }
    return out;
  }, [detail?.infoItems, overview]);

  if (!spot) return null;

  const hasContentId = /^\d{1,32}$/.test(String(spot.contentId || '').trim());
  const hero =
    toHttps(detail?.imageUrl) ||
    (detail?.galleryUrls?.[0] ? toHttps(detail.galleryUrls[0]) : '');
  const galleryExtra = (
    Array.isArray(detail?.galleryUrls)
      ? detail.galleryUrls.map(toHttps).filter(Boolean)
      : []
  ).filter((url) => url && url !== hero);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openPlace = () => {
    const slug = String(spot.placeSlug || '').trim();
    if (!slug || !returnTo) return;
    setPlaceReturnTo(returnTo);
    navigate(`/place/${slug}`, { state: { returnTo } });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-stretch justify-center bg-stone-900/40 backdrop-blur-[2px] p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] md:items-center md:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl md:h-auto md:max-h-[min(90dvh,52rem)] md:max-w-2xl md:rounded-3xl lg:max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="korea-theme-spot-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {eyebrow}
            </p>
            <h2
              id="korea-theme-spot-modal-title"
              className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
            >
              {spot.name}
            </h2>
            {spot.subtitle ? (
              <p className="mt-1 text-xs text-stone-500 break-keep">
                {spot.subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar"
        >
          {hero ? (
            <img
              src={hero}
              alt=""
              className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-amber-50 text-amber-800 sm:aspect-[2/1]">
              <Landmark size={28} aria-hidden="true" />
            </div>
          )}

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {spot.blurb ? (
              <p className="text-sm font-semibold leading-relaxed text-amber-950/90 break-keep">
                {spot.blurb}
              </p>
            ) : null}

            {detailLoading ? (
              <p className="text-xs text-stone-500">상세를 불러오는 중…</p>
            ) : null}

            {!detailLoading && hasContentId && detailError ? (
              <p className="text-xs text-stone-500 break-keep">{detailError}</p>
            ) : null}

            {!detailLoading && !hasContentId ? (
              <p className="text-xs text-stone-500 break-keep">
                {spot.placeSlug
                  ? '관광공사 Tour 상세는 아직 연결되지 않았습니다. 아래 장소 카드에서 이어서 볼 수 있습니다.'
                  : 'Tour 상세 없음 — GATEO 안내만 표시합니다.'}
              </p>
            ) : null}

            {!detailLoading && detail ? (
              <dl className="space-y-3">
                {overview ? <DetailRow label="개요">{overview}</DetailRow> : null}
                {address ? <DetailRow label="주소">{address}</DetailRow> : null}
                {tel ? (
                  <DetailRow label="전화">
                    <a
                      href={`tel:${tel.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline"
                    >
                      <Phone size={14} aria-hidden="true" />
                      {tel}
                    </a>
                  </DetailRow>
                ) : null}
                {homepage ? (
                  <DetailRow label="홈페이지">
                    <a
                      href={homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-amber-900 underline-offset-2 hover:underline break-all"
                    >
                      {homepage.replace(/^https?:\/\//i, '')}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </DetailRow>
                ) : null}
                {introRows.map((row) => (
                  <DetailRow key={row.key} label={row.label}>
                    {row.text}
                  </DetailRow>
                ))}
                {infoSections.map((row, idx) => (
                  <DetailRow
                    key={`${row.name || 'info'}-${idx}`}
                    label={row.name || '안내'}
                  >
                    {row.text}
                  </DetailRow>
                ))}
              </dl>
            ) : null}

            {galleryExtra.length > 0 ? (
              <div className="space-y-2" aria-label="명소 사진">
                {galleryExtra.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}

            {spot.placeSlug ? (
              <button
                type="button"
                onClick={openPlace}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
              >
                장소 카드 보기
                <ExternalLink size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-stone-200/80 bg-white px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-100"
          >
            <ArrowUp size={16} aria-hidden="true" />
            위로
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <X size={16} aria-hidden="true" />
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
