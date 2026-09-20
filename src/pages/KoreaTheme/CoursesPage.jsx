import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Route } from 'lucide-react';
import SEO from '../../components/SEO';
import {
  buildCourseAreaChips,
  COURSE_OTHER_CHIP_ID,
} from '../Home/lib/koreaThemeCourseChips';
import { listKoreaThemeAreas } from '../Home/lib/koreaThemeRegions';
import { reconcileThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import {
  fetchTourApiCourseDetail,
  fetchTourApiTravelCourseAreaCounts,
  fetchTourApiTravelCourses,
} from '../../utils/fetchTourApiCourses';
import ThemeModuleBackButton, {
  ThemeNavBackHint,
} from './ThemeModuleBackButton';
import CourseDetailModal from './CourseDetailModal';

const RETURN_TO = '/korea/theme/courses';
const AREAS = listKoreaThemeAreas();
/** 코스가 비교적 많은 권역을 기본 후보로 */
const PREFERRED_DEFAULT_AREAS = ['31', '32', '2'];

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

function pickDefaultChipId(chips) {
  for (const code of PREFERRED_DEFAULT_AREAS) {
    if (chips.some((c) => c.id === code)) return code;
  }
  return chips[0]?.id || null;
}

/** deep-link `?area=` → 단독 칩 또는 기타 칩 */
function pickChipIdForArea(chips, areaCode) {
  const code = String(areaCode || '').trim();
  if (!code || !Array.isArray(chips) || chips.length === 0) return null;
  if (chips.some((c) => c.id === code)) return code;
  const other = chips.find((c) => c.id === COURSE_OTHER_CHIP_ID);
  if (other?.areaCodes?.includes(code)) return COURSE_OTHER_CHIP_ID;
  return null;
}

export default function KoreaThemeCoursesPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const areaFromQuery = String(searchParams.get('area') || '').trim();
  const courseFromQuery = String(
    searchParams.get('course') || searchParams.get('spot') || '',
  ).trim();
  const [chips, setChips] = useState([]);
  const [chipsLoading, setChipsLoading] = useState(true);
  const [selectedChipId, setSelectedChipId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detailById, setDetailById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const courseQueryAppliedRef = useRef('');

  useEffect(() => {
    const path = areaFromQuery
      ? `${RETURN_TO}?area=${encodeURIComponent(areaFromQuery)}`
      : RETURN_TO;
    reconcileThemeNavBack(path);
  }, [areaFromQuery]);

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
      const nextChips = buildCourseAreaChips(counts, {
        otherLabel: t('korea.theme.courses.chipOther'),
      });
      setChips(nextChips);
      setSelectedChipId((prev) => {
        if (prev && nextChips.some((c) => c.id === prev)) return prev;
        const fromQuery = pickChipIdForArea(nextChips, areaFromQuery);
        if (fromQuery) return fromQuery;
        return pickDefaultChipId(nextChips);
      });
      setChipsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [areaFromQuery, t]);

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
        setError(t('korea.theme.courses.loadError'));
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
  }, [selectedChipId, chips, chipsLoading, t]);

  const openCourse = useCallback(
    async (course) => {
      const id = String(course.contentId || '');
      if (!id) return;
      setSelectedId(id);
      if (detailById[id]) return;

      setDetailLoadingId(id);
      const detail = await fetchTourApiCourseDetail({ contentId: id });
      setDetailById((prev) => ({ ...prev, [id]: detail || { empty: true } }));
      setDetailLoadingId(null);
    },
    [detailById],
  );

  useEffect(() => {
    if (!courseFromQuery || loading || !courses.length) return;
    if (courseQueryAppliedRef.current === courseFromQuery) return;
    const hit = courses.find(
      (c) => String(c.contentId || '') === courseFromQuery,
    );
    if (!hit) return;
    courseQueryAppliedRef.current = courseFromQuery;
    openCourse(hit);
  }, [courseFromQuery, loading, courses, openCourse]);

  const closeModal = useCallback(() => setSelectedId(null), []);

  const countLabel = (() => {
    const loadingStatus = loading
      ? t('korea.theme.courses.chipStatusLoading')
      : t('korea.theme.courses.chipStatusCount', { count: courses.length });
    if (chipsLoading || !activeChip) {
      return chipsLoading
        ? t('korea.theme.courses.regionChecking')
        : t('korea.common.region');
    }
    if (activeChip.id === COURSE_OTHER_CHIP_ID) {
      return t('korea.theme.courses.otherChipMeta', {
        regions: activeChip.areaNames.join('·'),
        status: loadingStatus,
      });
    }
    return t('korea.theme.courses.chipMeta', {
      label: activeChip.label,
      status: loadingStatus,
    });
  })();

  const countLocale = i18n.language?.startsWith('en') ? 'en-US' : 'ko-KR';

  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-stone-100 text-stone-900">
      <SEO
        title={t('korea.theme.courses.seoTitle')}
        description={t('korea.theme.courses.seoDescription')}
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
                  {t('korea.theme.courses.title')}
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeModuleBackButton />
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  aria-label={t('korea.common.home')}
                  title={t('korea.common.home')}
                  className="flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100"
                >
                  <Home size={14} aria-hidden="true" />
                  {t('korea.common.home')}
                </button>
              </div>
            </div>
            <ThemeNavBackHint />
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="page-scroll-end-pad mx-auto w-full max-w-3xl px-3 pt-6 md:px-5 lg:max-w-6xl lg:px-8 xl:max-w-7xl">
          <section aria-labelledby="korea-courses-heading" className="space-y-4">
            <div className="flex items-center gap-2 text-stone-700">
              <Route size={18} className="text-amber-700" aria-hidden="true" />
              <h2
                id="korea-courses-heading"
                className="text-sm font-bold tracking-tight md:text-base"
              >
                {t('korea.theme.courses.heading')}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-stone-600 break-keep">
              {t('korea.theme.courses.blurb')}
            </p>

            <div
              role="group"
              aria-label={t('korea.theme.courses.areaFilterAria')}
              className="flex flex-wrap gap-1.5"
            >
              {chipsLoading ? (
                <span className="text-xs text-stone-500">
                  {t('korea.theme.courses.chipsLoading')}
                </span>
              ) : null}
              {!chipsLoading && chips.length === 0 ? (
                <span className="text-xs text-stone-500">
                  {t('korea.theme.courses.noChips')}
                </span>
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
                        ? 'inline-flex items-center gap-1 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-950'
                        : 'inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50'
                    }
                  >
                    <span>{chip.label}</span>
                    {Number.isFinite(chip.count) ? (
                      <span className="opacity-70 tabular-nums">
                        {chip.count.toLocaleString(countLocale)}
                      </span>
                    ) : null}
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
                {t('korea.theme.courses.empty')}
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
