import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Expand,
  Loader2,
  MapPin,
  Phone,
  Star,
  X,
} from 'lucide-react';
import {
  fetchTourApiFestivalCommon,
  fetchTourApiFestivalImages,
  fetchTourApiFestivalInfo,
  fetchTourApiFestivalIntro,
} from '../../utils/fetchTourApiFestivals';
import { fetchFestivalVideos } from '../../utils/fetchFestivalVideos';

function formatYmdLabel(ymd) {
  const s = String(ymd || '');
  if (!/^\d{8}$/.test(s)) return '';
  return `${Number(s.slice(4, 6))}.${s.slice(6, 8)}`;
}

function festivalImage(item) {
  return item?.firstimage || item?.imageUrl || item?.firstimage2 || '';
}

function pickFirst(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items[0] || null;
}

function toHttps(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) return '';
  return s.replace(/^http:\/\//i, 'https://');
}

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

function textsEqual(a, b) {
  const left = normalizeCompareText(a);
  const right = normalizeCompareText(b);
  return Boolean(left) && left === right;
}

/** 개요 ↔ 행사소개: 동일하거나 한쪽이 다른 쪽을 포함하면 중복으로 본다. */
function textsSimilarOrEqual(a, b) {
  const left = normalizeCompareText(a);
  const right = normalizeCompareText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 40 && right.includes(left)) return true;
  if (right.length >= 40 && left.includes(right)) return true;
  return false;
}

function collectImageUrls(imageData, fallbackUrl) {
  const urls = [];
  const seen = new Set();
  const push = (raw) => {
    const url = toHttps(raw);
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };
  const items = Array.isArray(imageData?.items) ? imageData.items : [];
  for (const it of items) {
    push(it?.imageUrl || it?.originimgurl || it?.smallimageurl || it?.firstimage);
  }
  push(fallbackUrl);
  return urls;
}

function DetailRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] md:text-[11px] font-bold tracking-widest text-stone-400 uppercase">
        {label}
      </p>
      <div className="text-sm md:text-[15px] text-stone-700 leading-relaxed md:leading-relaxed whitespace-pre-wrap break-keep">
        {children}
      </div>
    </div>
  );
}

const TAB_INFO = 'info';
const TAB_PROGRAM = 'program';
const TAB_PHOTOS = 'photos';
const TAB_READING = 'reading';

function youtubeThumb(videoId) {
  const id = String(videoId || '').trim();
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

function naverNewsSearchUrl(title) {
  const q = String(title || '').trim();
  if (!q) return '';
  return `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(q)}`;
}

function wikiSearchUrl(title) {
  const q = String(title || '').trim();
  if (!q) return '';
  return `https://ko.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`;
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
  const [common, setCommon] = useState(null);
  const [infoItems, setInfoItems] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_INFO);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState('');
  const [videosLoadedFor, setVideosLoadedFor] = useState('');

  useEffect(() => {
    if (!item?.contentId) {
      setIntro(null);
      setCommon(null);
      setInfoItems([]);
      setImageUrls([]);
      setDetailError('');
      setDetailLoading(false);
      setActiveImage(0);
      setLightboxOpen(false);
      setActiveTab(TAB_INFO);
      setVideos([]);
      setVideosLoading(false);
      setVideosError('');
      setVideosLoadedFor('');
      return undefined;
    }

    let cancelled = false;
    const seed = festivalImage(item);
    setIntro(null);
    setCommon(null);
    setInfoItems([]);
    setImageUrls(seed ? [toHttps(seed)].filter(Boolean) : []);
    setActiveImage(0);
    setLightboxOpen(false);
    setActiveTab(TAB_INFO);
    setDetailError('');
    setDetailLoading(true);
    setVideos([]);
    setVideosLoading(false);
    setVideosError('');
    setVideosLoadedFor('');

    (async () => {
      const contentId = item.contentId;
      const contentTypeId = item.contentTypeId || '15';
      const [introData, commonData, infoData, imageData] = await Promise.all([
        fetchTourApiFestivalIntro({ contentId, contentTypeId }),
        fetchTourApiFestivalCommon({ contentId }),
        fetchTourApiFestivalInfo({ contentId, contentTypeId, numOfRows: 30 }),
        fetchTourApiFestivalImages({ contentId, numOfRows: 12 }),
      ]);
      if (cancelled) return;

      const introHit = pickFirst(introData);
      const commonHit = pickFirst(commonData);
      const infoRows = Array.isArray(infoData?.items) ? infoData.items : [];
      const urls = collectImageUrls(imageData, seed);

      if (
        !introData?.ok &&
        !commonData?.ok &&
        !infoData?.ok &&
        !imageData?.ok
      ) {
        setIntro(null);
        setCommon(null);
        setInfoItems([]);
        setDetailError('상세 정보를 불러오지 못했습니다.');
        setDetailLoading(false);
        return;
      }

      setIntro(introHit);
      setCommon(commonHit);
      setInfoItems(infoRows);
      setImageUrls(urls);
      setActiveImage(0);
      setDetailLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [item?.contentId, item?.contentTypeId]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (lightboxOpen) {
          setLightboxOpen(false);
          return;
        }
        onClose();
        return;
      }
      if (!lightboxOpen || imageUrls.length < 2) return;
      if (event.key === 'ArrowLeft') {
        setActiveImage((i) => (i - 1 + imageUrls.length) % imageUrls.length);
      } else if (event.key === 'ArrowRight') {
        setActiveImage((i) => (i + 1) % imageUrls.length);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, imageUrls.length, onClose]);

  const overview = useMemo(
    () => stripHtml(common?.overview || ''),
    [common?.overview],
  );

  const homepage = useMemo(() => {
    const fromIntro = normalizeHomepage(intro?.eventhomepage);
    if (fromIntro) return fromIntro;
    return normalizeHomepage(common?.homepage);
  }, [intro?.eventhomepage, common?.homepage]);

  const programText = useMemo(
    () => stripHtml(intro?.program || ''),
    [intro?.program],
  );

  const detailSections = useMemo(() => {
    const rows = (infoItems || [])
      .map((row) => ({
        name: stripHtml(row?.infoname || ''),
        text: stripHtml(row?.infotext || ''),
        serial: String(row?.serialnum || ''),
      }))
      .filter((row) => row.name || row.text);

    const out = [];
    for (const row of rows) {
      // Keep overview / program; drop detailInfo duplicates only
      if (
        row.name.includes('행사소개') &&
        overview &&
        textsSimilarOrEqual(row.text, overview)
      ) {
        continue;
      }
      if (
        row.name.includes('행사내용') &&
        programText &&
        textsEqual(row.text, programText)
      ) {
        continue;
      }
      out.push(row);
    }
    return out;
  }, [infoItems, overview, programText]);

  const showProgram = Boolean(programText);
  const hasProgramTab = showProgram || detailSections.length > 0;
  const hasPhotoTab = imageUrls.length > 1;
  const showTabs = true;

  useEffect(() => {
    if (activeTab === TAB_PROGRAM && !hasProgramTab) {
      setActiveTab(TAB_INFO);
    } else if (activeTab === TAB_PHOTOS && !hasPhotoTab) {
      setActiveTab(TAB_INFO);
    }
  }, [activeTab, hasProgramTab, hasPhotoTab]);

  useEffect(() => {
    if (activeTab !== TAB_READING || !item?.contentId || !item?.title) return;
    const id = String(item.contentId);
    if (videosLoadedFor === id) return;

    let cancelled = false;
    setVideosLoading(true);
    setVideosError('');

    const ymd = String(item.eventStartDate || intro?.eventStartDate || '');
    const year = /^\d{8}$/.test(ymd) ? ymd.slice(0, 4) : '';

    (async () => {
      const result = await fetchFestivalVideos({
        contentId: id,
        title: String(item.title),
        year,
      });
      if (cancelled) return;
      setVideosLoadedFor(id);
      setVideosLoading(false);
      if (!result.ok) {
        setVideos([]);
        setVideosError('관련 영상을 찾지 못했습니다.');
        return;
      }
      setVideos(Array.isArray(result.videos) ? result.videos.slice(0, 5) : []);
      if (!result.videos?.length) {
        setVideosError('관련 영상을 찾지 못했습니다.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    item?.contentId,
    item?.title,
    item?.eventStartDate,
    intro?.eventStartDate,
    videosLoadedFor,
  ]);

  if (!item) return null;

  const start = formatYmdLabel(item.eventStartDate || intro?.eventStartDate);
  const end = formatYmdLabel(item.eventEndDate || intro?.eventEndDate);
  const range = [start, end].filter(Boolean).join(' – ');
  const tel = String(intro?.sponsor1tel || item.tel || '').trim();
  const sponsor2tel = String(intro?.sponsor2tel || '').trim();
  const hero = imageUrls[activeImage] || imageUrls[0] || '';
  const eventplace = String(intro?.eventplace || '').trim();
  const showEventPlace =
    Boolean(eventplace) && eventplace !== String(item.addr1 || '').trim();
  const sponsor1 = String(intro?.sponsor1 || '').trim();
  const sponsor2 = String(intro?.sponsor2 || '').trim();
  const showSponsor2 =
    Boolean(sponsor2) &&
    normalizeCompareText(sponsor2) !== normalizeCompareText(sponsor1);

  const openLightbox = () => {
    if (!hero) return;
    setLightboxOpen(true);
  };
  const stepLightbox = (delta) => {
    if (imageUrls.length < 2) return;
    setActiveImage((i) => (i + delta + imageUrls.length) % imageUrls.length);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-stretch justify-center bg-stone-900/30 backdrop-blur-sm p-0 md:py-2 md:px-3 lg:px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-lg md:max-w-6xl xl:max-w-7xl max-h-[92vh] md:my-0 md:h-full md:max-h-none flex-col md:flex-row overflow-hidden rounded-t-3xl md:rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="korea-festival-sheet-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/95 text-stone-700 shadow-sm hover:bg-stone-50"
        >
          <X size={18} aria-hidden="true" />
        </button>

        {hero ? (
          <div className="relative flex shrink-0 flex-col md:w-[46%] lg:w-1/2 md:min-h-0 md:self-stretch bg-stone-100">
            <button
              type="button"
              onClick={openLightbox}
              className="group relative flex h-44 md:min-h-0 md:flex-1 items-center justify-center overflow-hidden bg-stone-200/70 text-left"
              aria-label="사진 확대보기"
            >
              <img
                src={hero}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-stone-900/55 px-2.5 py-1 text-[11px] font-bold text-white opacity-95 group-hover:bg-stone-900/70">
                <Expand size={13} aria-hidden="true" />
                확대보기
              </span>
              {imageUrls.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-stone-900/55 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                  {activeImage + 1}/{imageUrls.length}
                </span>
              )}
            </button>
            {imageUrls.length > 1 && (
              <div
                className="flex gap-2 overflow-x-auto px-4 md:px-4 py-2.5 md:py-3 border-b border-stone-100 md:border-b-0 md:border-t md:border-stone-200/80 bg-white md:bg-stone-50 custom-scrollbar"
                role="listbox"
                aria-label="축제 사진"
              >
                {imageUrls.map((url, index) => {
                  const selected = index === activeImage;
                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => setActiveImage(index)}
                      onDoubleClick={() => {
                        setActiveImage(index);
                        setLightboxOpen(true);
                      }}
                      className={[
                        'relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl border transition-colors',
                        selected
                          ? 'border-amber-500 ring-2 ring-amber-200'
                          : 'border-stone-200 opacity-85 hover:opacity-100',
                      ].join(' ')}
                    >
                      <img
                        src={url}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-5 md:p-7 lg:p-8 space-y-4 md:space-y-5 custom-scrollbar">
          <div className="space-y-1.5 pr-10">
            <div className="flex items-start justify-between gap-2">
              {range ? (
                <p className="text-[11px] md:text-xs font-bold text-amber-700 flex items-center gap-1">
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
              className="text-xl md:text-2xl lg:text-3xl font-extrabold leading-snug text-stone-900"
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

          {homepage && (
            <a
              href={homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-100 hover:shadow-md hover:ring-2 hover:ring-amber-200"
            >
              <ExternalLink size={15} aria-hidden="true" />
              공식 홈페이지
            </a>
          )}

          {detailLoading && (
            <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              상세 불러오는 중…
            </div>
          )}

          {!detailLoading && detailError && (
            <p className="text-xs text-stone-500">{detailError}</p>
          )}

          {!detailLoading && showTabs && (
            <div
              className="flex gap-1.5 overflow-x-auto border-b border-stone-200 pb-2 custom-scrollbar"
              role="tablist"
              aria-label="축제 상세 구분"
            >
              <TabChip
                selected={activeTab === TAB_INFO}
                onClick={() => setActiveTab(TAB_INFO)}
              >
                안내
              </TabChip>
              {hasProgramTab && (
                <TabChip
                  selected={activeTab === TAB_PROGRAM}
                  onClick={() => setActiveTab(TAB_PROGRAM)}
                >
                  프로그램·내용
                </TabChip>
              )}
              {hasPhotoTab && (
                <TabChip
                  selected={activeTab === TAB_PHOTOS}
                  onClick={() => setActiveTab(TAB_PHOTOS)}
                >
                  사진
                </TabChip>
              )}
              <TabChip
                selected={activeTab === TAB_READING}
                onClick={() => setActiveTab(TAB_READING)}
              >
                읽을거리
              </TabChip>
            </div>
          )}

          {!detailLoading && activeTab === TAB_INFO && (
            <div className="space-y-3">
              {overview && <DetailRow label="개요">{overview}</DetailRow>}

              {(intro || hubs.length > 0) && (
                <div
                  className={[
                    'space-y-3',
                    overview ? 'border-t border-stone-200 pt-3' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <DetailRow label="행사 장소">
                    {showEventPlace ? eventplace : null}
                  </DetailRow>
                  <DetailRow label="행사 시간">
                    {stripHtml(intro?.playtime || '') || null}
                  </DetailRow>
                  <DetailRow label="이용 요금">
                    {stripHtml(intro?.usetimefestival || '') || null}
                  </DetailRow>
                  <DetailRow label="관람 연령">
                    {stripHtml(intro?.agelimit || '') || null}
                  </DetailRow>
                  <DetailRow label="소요 시간">
                    {stripHtml(intro?.spendtimefestival || '') || null}
                  </DetailRow>
                  <DetailRow label="할인">
                    {stripHtml(intro?.discountinfofestival || '') || null}
                  </DetailRow>
                  <DetailRow label="예매/입장">
                    {stripHtml(intro?.bookingplace || '') || null}
                  </DetailRow>
                  <DetailRow label="주최">{sponsor1 || null}</DetailRow>
                  <DetailRow label="주관/후원">
                    {showSponsor2 ? (
                      <>
                        {sponsor2}
                        {sponsor2tel ? (
                          <>
                            {'\n'}
                            <a
                              href={`tel:${sponsor2tel.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-amber-800 hover:text-amber-950"
                            >
                              <Phone size={13} aria-hidden="true" />
                              {sponsor2tel}
                            </a>
                          </>
                        ) : null}
                      </>
                    ) : null}
                  </DetailRow>
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
                  <DetailRow label="장소 안내">
                    {stripHtml(intro?.placeinfo || '') || null}
                  </DetailRow>
                  <DetailRow label="부대행사">
                    {stripHtml(intro?.subevent || '') || null}
                  </DetailRow>
                </div>
              )}

              {hubs.length > 0 && (
                <div className="space-y-2 pt-1">
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
            </div>
          )}

          {!detailLoading && activeTab === TAB_PROGRAM && hasProgramTab && (
            <div className="space-y-3">
              {showProgram && (
                <DetailRow label="프로그램">{programText}</DetailRow>
              )}
              {detailSections.map((row, index) => (
                <DetailRow
                  key={`${row.serial || row.name}-${index}`}
                  label={row.name || '상세'}
                >
                  {row.text || null}
                </DetailRow>
              ))}
            </div>
          )}

          {!detailLoading && activeTab === TAB_PHOTOS && hasPhotoTab && (
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                사진 {imageUrls.length}장
              </p>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {imageUrls.map((url, index) => (
                  <button
                    key={`tab-photo-${url}-${index}`}
                    type="button"
                    onClick={() => {
                      setActiveImage(index);
                      setLightboxOpen(true);
                    }}
                    className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                    aria-label={`사진 ${index + 1} 확대보기`}
                  >
                    <img
                      src={url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!detailLoading && activeTab === TAB_READING && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                  더 찾아보기
                </p>
                <div className="flex flex-wrap gap-2">
                  {naverNewsSearchUrl(item.title) && (
                    <a
                      href={naverNewsSearchUrl(item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      네이버 뉴스 검색
                    </a>
                  )}
                  {wikiSearchUrl(item.title) && (
                    <a
                      href={wikiSearchUrl(item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      위키백과 검색
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                  관련 영상
                </p>
                {videosLoading && (
                  <div className="flex items-center gap-2 text-sm text-stone-500 py-2">
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    영상 불러오는 중…
                  </div>
                )}
                {!videosLoading && videosError && videos.length === 0 && (
                  <p className="text-xs text-stone-500">{videosError}</p>
                )}
                {!videosLoading && videos.length > 0 && (
                  <ul className="space-y-2">
                    {videos.map((video) => {
                      const id = String(video?.id || '').trim();
                      if (!id) return null;
                      const thumb = youtubeThumb(id);
                      const href = `https://www.youtube.com/watch?v=${id}`;
                      return (
                        <li key={id}>
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                          >
                            {thumb ? (
                              <img
                                src={thumb}
                                alt=""
                                className="h-16 w-28 shrink-0 rounded-xl object-cover bg-stone-200"
                              />
                            ) : (
                              <div className="h-16 w-28 shrink-0 rounded-xl bg-stone-200" />
                            )}
                            <span className="min-w-0 flex-1 text-sm font-bold text-stone-800 leading-snug line-clamp-3 break-keep">
                              {video.title || 'YouTube 영상'}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
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

      {lightboxOpen && hero && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-3 md:p-8"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxOpen(false);
          }}
          role="presentation"
        >
          <div
            className="relative flex h-full w-full max-w-6xl flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="사진 확대보기"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 pb-3">
              <p className="text-sm font-bold text-white/90 tabular-nums">
                {imageUrls.length > 1
                  ? `${activeImage + 1} / ${imageUrls.length}`
                  : '사진'}
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="확대보기 닫기"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1">
              <div className="flex h-full items-center justify-center">
                <img
                  src={hero}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              {imageUrls.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-stone-900/55 text-white hover:bg-stone-900/75 md:left-2"
                  >
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-stone-900/55 text-white hover:bg-stone-900/75 md:right-2"
                  >
                    <ChevronRight size={22} aria-hidden="true" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabChip({ selected, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={[
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors',
        selected
          ? 'border-amber-400 bg-amber-50 text-amber-900'
          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
