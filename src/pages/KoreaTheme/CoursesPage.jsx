import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Home, Route, X } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  buildCourseAreaChips,
  COURSE_OTHER_CHIP_ID,
} from '../Home/lib/koreaThemeCourseChips';
import { listKoreaThemeAreas } from '../Home/lib/koreaThemeRegions';
import {
  fetchTourApiCourseDetail,
  fetchTourApiTravelCourseAreaCounts,
  fetchTourApiTravelCourses,
} from '../../utils/fetchTourApiCourses';

const RETURN_TO = '/korea/theme/courses';
const AREAS = listKoreaThemeAreas();
/** 코스가 비교적 많은 권역을 기본 후보로 */
const PREFERRED_DEFAULT_AREAS = ['31', '32', '2'];

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
  return toHttps(course?.imageUrl || course?.firstimage || '');
}

function CourseDetailModal({
  course,
  detail,
  detailLoading,
  onClose,
}) {
  const scrollRef = useRef(null);

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
        aria-labelledby="korea-course-modal-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-200/80 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
              여행코스 상세
            </p>
            <h2
              id="korea-course-modal-title"
              className="mt-0.5 text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg"
            >
              {course.title}
            </h2>
            {course.addr1 ? (
              <p className="mt-1 text-xs text-stone-500 break-keep">{course.addr1}</p>
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
              <Route size={28} aria-hidden="true" />
            </div>
          )}

          <div className="space-y-4 px-4 py-4 sm:px-5">
            {detailLoading ? (
              <p className="text-xs text-stone-500">상세를 불러오는 중…</p>
            ) : null}
            {!detailLoading && detail?.empty ? (
              <p className="text-xs text-stone-500 break-keep">
                상세 정보를 가져오지 못했습니다.
              </p>
            ) : null}
            {!detailLoading && detail && !detail.empty ? (
              <>
                {(detail.theme ||
                  detail.schedule ||
                  detail.distance ||
                  detail.taketime) && (
                  <p className="text-[11px] font-semibold text-amber-900/90 break-keep">
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
                  <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600 break-keep">
                    {stripHtml(detail.overview)}
                  </p>
                ) : null}
                {galleryExtra.length > 0 ? (
                  <div className="space-y-2" aria-label="코스 사진">
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
                            {Number(seg.subnum ?? idx) + 1}. {seg.subname || '구간'}
                          </p>
                          {seg.subdetailoverview ? (
                            <p className="whitespace-pre-line text-sm leading-relaxed text-stone-600 break-keep">
                              {stripHtml(seg.subdetailoverview)}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : detail.overview ? null : (
                  <p className="text-[11px] text-stone-500 break-keep">
                    이 코스의 구간 상세는 아직 없습니다.
                  </p>
                )}
              </>
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

function pickDefaultChipId(chips) {
  for (const code of PREFERRED_DEFAULT_AREAS) {
    if (chips.some((c) => c.id === code)) return code;
  }
  return chips[0]?.id || null;
}

export default function KoreaThemeCoursesPage() {
  const navigate = useNavigate();
  const [chips, setChips] = useState([]);
  const [chipsLoading, setChipsLoading] = useState(true);
  const [selectedChipId, setSelectedChipId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detailById, setDetailById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);

  const activeChip = chips.find((c) => c.id === selectedChipId) || null;
  const selectedCourse =
    courses.find((c) => String(c.contentId || '') === selectedId) || null;

  useEffect(() => {
    let cancelled = false;
    setChipsLoading(true);

    (async () => {
      const counts = await fetchTourApiTravelCourseAreaCounts(AREAS, {
        concurrency: 5,
      });
      if (cancelled) return;
      const nextChips = buildCourseAreaChips(counts);
      setChips(nextChips);
      setSelectedChipId((prev) => {
        if (prev && nextChips.some((c) => c.id === prev)) return prev;
        return pickDefaultChipId(nextChips);
      });
      setChipsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const chip = chips.find((c) => c.id === selectedChipId) || null;
    if (!selectedChipId || !chip) {
      if (!chipsLoading) {
        setCourses([]);
        setLoading(false);
      }
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    setCourses([]);

    (async () => {
      const results = await Promise.all(
        chip.areaCodes.map((code) =>
          fetchTourApiTravelCourses({
            areaCode: code,
            numOfRows: 30,
            pageNo: 1,
          }),
        ),
      );
      if (cancelled) return;

      if (results.every((r) => !r)) {
        setError('여행코스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setCourses([]);
        setLoading(false);
        return;
      }

      const seen = new Set();
      /** @type {any[]} */
      const merged = [];
      results.forEach((data, idx) => {
        const areaCode = chip.areaCodes[idx];
        const areaName = chip.areaNames[idx] || areaCode;
        for (const item of data?.items || []) {
          const id = String(item?.contentId || '');
          if (!id || seen.has(id)) continue;
          seen.add(id);
          merged.push({ ...item, _areaCode: areaCode, _areaName: areaName });
        }
      });
      setCourses(merged);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedChipId, chips, chipsLoading]);

  const openCourse = async (course) => {
    const id = String(course.contentId || '');
    if (!id) return;
    setSelectedId(id);
    if (detailById[id]) return;

    setDetailLoadingId(id);
    const detail = await fetchTourApiCourseDetail({ contentId: id });
    setDetailById((prev) => ({ ...prev, [id]: detail || { empty: true } }));
    setDetailLoadingId(null);
  };

  const closeModal = useCallback(() => setSelectedId(null), []);

  const countLabel = (() => {
    if (chipsLoading || !activeChip) return chipsLoading ? '지역 확인 중…' : '지역';
    if (activeChip.id === COURSE_OTHER_CHIP_ID) {
      const regions = activeChip.areaNames.join('·');
      return `기타(${regions}) · ${loading ? '불러오는 중…' : `${courses.length}개`}`;
    }
    return `${activeChip.label} · ${loading ? '불러오는 중…' : `${courses.length}개`}`;
  })();

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title="여행코스 · 한국의 테마여행"
        description="한국관광공사 TourAPI 여행코스(지역별). 드라이브·당일·1박2일 코스 개요와 구간을 이어갑니다."
        url={RETURN_TO}
      />

      <header className="relative z-30 shrink-0 border-b border-stone-200/80 bg-stone-100/95 pt-[max(0.5rem,env(safe-area-inset-top,0px))] backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-3 pb-2.5 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <div className="min-w-0 rounded-2xl border border-stone-200/90 bg-white px-3 py-2.5 shadow-sm md:px-4">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                  Korea · Theme · TourAPI
                </p>
                <h1 className="truncate text-base font-extrabold tracking-tight md:text-lg lg:text-xl">
                  여행코스
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/korea/theme"
                  aria-label="테마여행으로"
                  title="테마여행"
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  테마
                </Link>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  aria-label="홈으로"
                  title="홈으로"
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Home size={14} aria-hidden="true" />
                  홈으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-3 py-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-courses-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Route size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-courses-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                TourAPI 여행코스
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">
              한국관광공사 공개 여행코스입니다.
            </p>

            <div role="group" aria-label="시도 필터" className="flex flex-wrap gap-1.5">
              {chipsLoading ? (
                <span className="text-xs text-stone-500">코스가 있는 지역을 확인하는 중…</span>
              ) : null}
              {!chipsLoading && chips.length === 0 ? (
                <span className="text-xs text-stone-500">표시할 지역이 없습니다.</span>
              ) : null}
              {chips.map((chip) => {
                const active = selectedChipId === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedChipId(chip.id)}
                    aria-pressed={active}
                    title={
                      chip.id === COURSE_OTHER_CHIP_ID
                        ? chip.areaNames.join(', ')
                        : undefined
                    }
                    className={
                      active
                        ? 'rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                        : 'rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                    }
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs font-semibold text-stone-500 break-keep">
              {countLabel}
            </p>

            {error ? (
              <p className="text-sm text-rose-700 break-keep">{error}</p>
            ) : null}

            {!chipsLoading && !loading && !error && courses.length === 0 ? (
              <p className="text-sm text-stone-500 break-keep">
                이 지역에 등록된 여행코스가 아직 없습니다. 다른 시도를 골라 보세요.
              </p>
            ) : null}

            <ul className="space-y-5">
              {courses.map((course) => {
                const id = String(course.contentId || '');
                const thumb = courseThumb(course);
                return (
                  <li
                    key={id || course.title}
                    className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => openCourse(course)}
                      className="w-full text-left transition-colors hover:bg-amber-50/30"
                      aria-haspopup="dialog"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="aspect-[16/9] w-full object-cover sm:aspect-[2/1]"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex aspect-[16/9] w-full items-center justify-center bg-amber-50 text-amber-800 sm:aspect-[2/1]">
                          <Route size={28} aria-hidden="true" />
                        </span>
                      )}
                      <span className="block px-4 py-3.5 sm:px-5">
                        <span className="text-base font-extrabold tracking-tight text-stone-900 break-keep sm:text-lg">
                          {course.title}
                        </span>
                        {activeChip?.id === COURSE_OTHER_CHIP_ID && course._areaName ? (
                          <span className="mt-1 block text-[11px] font-semibold text-amber-800/90">
                            {course._areaName}
                          </span>
                        ) : null}
                        {course.addr1 ? (
                          <span className="mt-1 block text-xs text-stone-500 break-keep">
                            {course.addr1}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </main>

      {selectedCourse ? (
        <CourseDetailModal
          course={selectedCourse}
          detail={detailById[selectedId]}
          detailLoading={detailLoadingId === selectedId}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}
