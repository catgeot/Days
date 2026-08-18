import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUp,
  CalendarDays,
  ExternalLink,
  Loader2,
  Route,
  X,
} from 'lucide-react';
import { fetchNearbyFestivals } from '../../utils/fetchNearbyFestivals';
import { detectSidoCode } from '../Korea/festivalRegionTags';
import { pushThemeNavBack } from '../Home/lib/koreaThemeNavBack';

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (s.startsWith('//')) return `https:${s}`;
  if (s.startsWith('http://')) return `https://${s.slice('http://'.length)}`;
  return s;
}

function courseThumb(course) {
  return toHttps(course?.imageUrl || course?.firstimage || course?.firstImage || '');
}

function formatDistKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))}m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

/**
 * @param {{
 *   course: Record<string, unknown>,
 *   detail: Record<string, unknown> | null | undefined,
 *   detailLoading?: boolean,
 *   onClose: () => void,
 *   overlayZClass?: string,
 *   showNearbyFestivals?: boolean,
 * }} props
 */
export default function CourseDetailModal({
  course,
  detail,
  detailLoading = false,
  onClose,
  overlayZClass = 'z-40',
  showNearbyFestivals = true,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [nearbyFestivals, setNearbyFestivals] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState('idle');

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
  }, [course?.contentId]);

  useEffect(() => {
    if (!showNearbyFestivals || !course?.contentId) {
      setNearbyFestivals([]);
      setNearbyStatus('idle');
      return undefined;
    }

    const lat = Number(course.lat ?? course.mapy);
    const lng = Number(course.lng ?? course.mapx);
    const areaCode = String(
      course.areaCode ||
        course._areaCode ||
        detectSidoCode(course.addr1) ||
        '',
    ).trim();
    const hasCoords =
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      !(lat === 0 && lng === 0);

    if (!areaCode && !hasCoords) {
      setNearbyFestivals([]);
      setNearbyStatus('nocoords');
      return undefined;
    }

    let cancelled = false;
    setNearbyStatus('loading');
    fetchNearbyFestivals({
      lat: hasCoords ? lat : undefined,
      lng: hasCoords ? lng : undefined,
      areaCode: areaCode || undefined,
      radiusKm: 50,
      limit: 6,
    }).then((res) => {
      if (cancelled) return;
      const list = Array.isArray(res?.festivals) ? res.festivals : [];
      setNearbyFestivals(list);
      if (res?.error) setNearbyStatus('error');
      else if (!list.length) setNearbyStatus('empty');
      else setNearbyStatus('ok');
    });

    return () => {
      cancelled = true;
    };
  }, [
    showNearbyFestivals,
    course?.contentId,
    course?.lat,
    course?.lng,
    course?.mapx,
    course?.mapy,
    course?.areaCode,
    course?._areaCode,
    course?.addr1,
  ]);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!course) return null;

  const id = String(course.contentId || '');
  const thumb = courseThumb(course);
  const hero =
    toHttps(detail?.imageUrl) ||
    (detail?.galleryUrls?.[0] ? toHttps(detail.galleryUrls[0]) : '') ||
    thumb;
  const galleryExtra = (
    Array.isArray(detail?.galleryUrls)
      ? detail.galleryUrls.map(toHttps).filter(Boolean)
      : []
  ).filter((url) => url && url !== hero);

  const areaCode = String(
    course.areaCode || course._areaCode || detectSidoCode(course.addr1) || '',
  ).trim();

  const openFestival = (fest) => {
    const festId = String(fest?.contentId || '').trim();
    if (!festId) return;
    const params = new URLSearchParams();
    params.set('from', 'theme');
    if (areaCode) params.set('area', areaCode);
    params.set('festival', festId);
    pushThemeNavBack('/korea/theme/courses');
    onClose();
    navigate(`/korea?${params.toString()}`);
  };

  const openFestivalPage = () => {
    const params = new URLSearchParams();
    params.set('from', 'theme');
    if (areaCode) params.set('area', areaCode);
    pushThemeNavBack('/korea/theme/courses');
    onClose();
    navigate(`/korea?${params.toString()}`);
  };

  return (
    <div
      className={`fixed inset-0 ${overlayZClass} flex items-stretch justify-center bg-stone-900/40 backdrop-blur-[2px] p-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] pb-[max(0.625rem,env(safe-area-inset-bottom))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] md:items-center md:p-5`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-900 shadow-2xl md:h-auto md:max-h-[min(90dvh,52rem)] md:max-w-2xl md:rounded-3xl lg:max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="korea-course-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              {t('korea.theme.courses.detailTitle')}
            </p>
            <h2
              id="korea-course-modal-title"
              className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
            >
              {course.title || course.name}
            </h2>
            {course.addr1 ? (
              <p className="mt-1 text-xs text-stone-500 break-keep">{course.addr1}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('korea.common.close')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar"
        >
          {hero ? (
            <img
              src={hero}
              alt=""
              className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-amber-50 text-amber-800 sm:aspect-[2/1]">
              <Route size={28} aria-hidden="true" />
            </div>
          )}

          <div className="min-w-0 space-y-4 px-4 py-4 sm:px-5">
            {detailLoading ? (
              <p className="text-xs text-stone-500">{t('korea.common.loading')}</p>
            ) : null}
            {!detailLoading && detail?.empty ? (
              <p className="text-xs text-stone-500 break-keep">
                {t('korea.theme.courses.detailError')}
              </p>
            ) : null}
            {!detailLoading && detail && !detail.empty ? (
              <>
                {(detail.theme ||
                  detail.schedule ||
                  detail.distance ||
                  detail.taketime) && (
                  <p className="text-[11px] font-semibold text-amber-900/90 break-keep break-words">
                    {[
                      detail.theme,
                      detail.schedule,
                      detail.distance,
                      detail.taketime,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {detail.overview ? (
                  <p className="min-w-0 max-w-full whitespace-pre-line text-sm leading-relaxed text-stone-600 break-keep break-words">
                    {stripHtml(detail.overview)}
                  </p>
                ) : null}
                {galleryExtra.length > 0 ? (
                  <div className="space-y-2" aria-label={t('korea.theme.courses.photosAria')}>
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
                {detail.segments?.length ? (
                  <ol className="space-y-5 border-t border-stone-200/80 pt-4">
                    {detail.segments.map((seg, idx) => {
                      const segImg = toHttps(seg.subdetailimg);
                      return (
                        <li
                          key={`${id}-${seg.subnum ?? idx}`}
                          className="space-y-2 text-sm"
                        >
                          {segImg ? (
                            <img
                              src={segImg}
                              alt={seg.subdetailalt || seg.subname || ''}
                              className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
                              loading="lazy"
                            />
                          ) : null}
                          <p className="font-bold text-stone-800 break-keep">
                            {Number(seg.subnum ?? idx) + 1}. {seg.subname || t('korea.theme.courses.segmentFallback')}
                          </p>
                          {seg.subdetailoverview ? (
                            <p className="min-w-0 max-w-full whitespace-pre-line text-sm leading-relaxed text-stone-600 break-keep break-words">
                              {stripHtml(seg.subdetailoverview)}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : detail.overview ? null : (
                  <p className="text-[11px] text-stone-500 break-keep">
                    {t('korea.theme.courses.noSegments')}
                  </p>
                )}
              </>
            ) : null}

            {showNearbyFestivals &&
              nearbyStatus !== 'idle' &&
              nearbyStatus !== 'nocoords' && (
                <div className="space-y-2 border-t border-stone-200/80 pt-4">
                  <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    {t('korea.theme.courses.nearFestivals')}
                  </p>
                  {nearbyStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      {t('korea.theme.courses.nearFestivalsLoading')}
                    </div>
                  )}
                  {nearbyStatus === 'error' && nearbyFestivals.length === 0 && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.courses.nearFestivalsError')}
                    </p>
                  )}
                  {nearbyStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      {t('korea.theme.courses.nearFestivalsEmpty')}
                    </p>
                  )}
                  {nearbyFestivals.length > 0 && (
                    <ul className="space-y-2" aria-label={t('korea.theme.courses.nearFestivalsAria')}>
                      {nearbyFestivals.map((fest) => {
                        const thumbFest = toHttps(fest.firstImage);
                        const dist = formatDistKm(fest.distKm);
                        const when = [
                          formatYmdLabel(fest.eventStartDate),
                          formatYmdLabel(fest.eventEndDate),
                        ]
                          .filter(Boolean)
                          .join('–');
                        const place = String(fest.locality || fest.region || '').trim();
                        return (
                          <li key={fest.contentId}>
                            <button
                              type="button"
                              onClick={() => openFestival(fest)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumbFest ? (
                                <img
                                  src={thumbFest}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
                                  <CalendarDays size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {fest.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[when, place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={openFestivalPage}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                  >
                    {t('korea.theme.courses.moreFestivals')}
                    <ExternalLink size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-stone-200/80 bg-white px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-stone-100"
          >
            <ArrowUp size={16} aria-hidden="true" />
            {t('korea.common.scrollToTop')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
          >
            <X size={16} aria-hidden="true" />
            {t('korea.common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
