import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUp,
  Bike,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Expand,
  Landmark,
  Loader2,
  MapPin,
  Phone,
  Route,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import {
  fetchTourApiFestivalDetail,
  fetchTourApiFestivalImages,
} from '../../utils/fetchTourApiFestivals';
import { fetchFestivalVideos, FESTIVAL_VIDEOS_MAX, FESTIVAL_VIDEOS_PAGE } from '../../utils/fetchFestivalVideos';
import { fetchNearbyTourAttractions } from '../../utils/fetchNearbyTourAttractions';
import {
  fetchNearbyTourRestaurants,
  RESTAURANT_CONTENT_TYPE_ID,
} from '../../utils/fetchNearbyTourRestaurants';
import {
  CULTURE_CONTENT_TYPE_ID,
  fetchNearbyTourCulture,
  fetchNearbyTourLeports,
  LEPORTS_CONTENT_TYPE_ID,
} from '../../utils/fetchNearbyTourLeisureCulture';
import {
  COURSE_CONTENT_TYPE_ID,
  fetchNearbyTourCourses,
} from '../../utils/fetchNearbyTourCourses';
import { fetchTourApiCourseDetail } from '../../utils/fetchTourApiCourses';
import { listKoreaScenicSpots } from '../Home/lib/koreaScenicSpots';
import { scenicRegionForAreaCode } from '../Home/lib/koreaTourAttractionMap';
import { resolveFestivalThemeCrossLinks } from '../Home/lib/koreaThemeCrossLinks';
import { pushThemeNavBack } from '../Home/lib/koreaThemeNavBack';
import { getMrtAccommodationSearchUrl } from '../../utils/affiliate';
import { buildMrtTnaSearchMoreUrl } from '../../utils/fetchMrtTnas';
import { festivalLngLat } from './koreaFestivalCorridors';
import { detectSidoCode } from './festivalRegionTags';
import {
  formatDistanceKm,
  rankSpotsByDistance,
} from '../KoreaTheme/nearbyScenicRank';
import ThemeSpotDetailModal from '../KoreaTheme/ThemeSpotDetailModal';
import CourseDetailModal from '../KoreaTheme/CourseDetailModal';

const SCENIC_PATH = '/korea/theme/scenic';
const COURSES_PATH = '/korea/theme/courses';
const FESTIVAL_RETURN = '/korea';
const SCENIC_LIST_LIMIT = 8;

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

function festivalSearchQuery(title) {
  let s = String(title || '').trim();
  if (!s) return '';
  // 검색용: 「2026 …」「제22회 …」「00회 …」접두 제거
  s = s.replace(/^(?:19|20)\d{2}\s*년?\s*/u, '');
  s = s.replace(/^제?\s*\d{1,3}\s*회\s*/u, '');
  s = s.trim();
  return s || String(title || '').trim();
}

function formatDistKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(1, Math.round(km * 1000))}m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
}

function nearbyPlaceLabel(spot) {
  return String(spot?.locality || spot?.region || '').trim();
}

function nearbyEyebrow(spot) {
  const t = String(spot?.contentTypeId || '');
  if (t === RESTAURANT_CONTENT_TYPE_ID) return '주변 맛집';
  if (t === LEPORTS_CONTENT_TYPE_ID) return '주변 레포츠';
  if (t === CULTURE_CONTENT_TYPE_ID) return '주변 문화';
  if (t === COURSE_CONTENT_TYPE_ID) return '인근 여행코스';
  return '주변 관광지';
}

function toNearbyModalSpot(spot) {
  if (!spot) return null;
  const place = nearbyPlaceLabel(spot);
  return {
    id: spot.id || spot.contentId,
    name: spot.name,
    subtitle: [place, formatDistKm(spot.distKm)].filter(Boolean).join(' · '),
    blurb: spot.blurb,
    placeSlug: spot.placeSlug,
    contentId: spot.contentId,
    contentTypeId: spot.contentTypeId || null,
    hubId: spot.hubId,
    region: spot.region,
    nameEn: spot.attractionNameEn || null,
    lat: spot.lat,
    lng: spot.lng,
    areaCode: spot.areaCode,
  };
}

function naverSearchUrl(title) {
  const q = festivalSearchQuery(title);
  if (!q) return '';
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(q)}`;
}

function googleSearchUrl(title) {
  const q = festivalSearchQuery(title);
  if (!q) return '';
  return `https://www.google.com/search?q=${encodeURIComponent(q)}&hl=ko`;
}

function toScenicModalSpot(spot) {
  if (!spot) return null;
  return {
    id: spot.id || spot.contentId,
    name: spot.name,
    subtitle: spot.region || '',
    blurb: spot.blurb,
    placeSlug: spot.placeSlug,
    contentId: spot.contentId,
    contentTypeId: '12',
    hubId: spot.hubId,
    region: spot.region,
    nameEn: spot.attractionNameEn || null,
    lat: spot.lat,
    lng: spot.lng,
    areaCode: spot.areaCode || null,
  };
}

/**
 * @param {{
 *   item: Record<string, unknown>,
 *   favorited?: boolean,
 *   onToggleFavorite?: (item: Record<string, unknown>) => void,
 *   onClose: () => void,
 * }} props
 */
export default function FestivalDetailSheet({
  item,
  favorited = false,
  onToggleFavorite,
  onClose,
}) {
  const navigate = useNavigate();
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
  const [videosExpanded, setVideosExpanded] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [nearbySpots, setNearbySpots] = useState([]);
  const [nearbyStatus, setNearbyStatus] = useState('idle');
  const [nearbyFood, setNearbyFood] = useState([]);
  const [nearbyFoodStatus, setNearbyFoodStatus] = useState('idle');
  const [nearbyLeports, setNearbyLeports] = useState([]);
  const [nearbyLeportsStatus, setNearbyLeportsStatus] = useState('idle');
  const [nearbyCulture, setNearbyCulture] = useState([]);
  const [nearbyCultureStatus, setNearbyCultureStatus] = useState('idle');
  const [nearbyCourses, setNearbyCourses] = useState([]);
  const [nearbyCoursesStatus, setNearbyCoursesStatus] = useState('idle');
  const [selectedNearby, setSelectedNearby] = useState(null);
  const [selectedScenic, setSelectedScenic] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetail, setCourseDetail] = useState(null);
  const [courseDetailLoading, setCourseDetailLoading] = useState(false);
  const sheetScrollRef = useRef(null);
  const tabListRef = useRef(null);

  const festivalAreaCode = useMemo(() => {
    // searchFestival2 응답에 areaCode가 비는 경우가 많아 addr1 시도 감지 폴백
    const code =
      item?.areaCode ?? item?.areacode ?? detectSidoCode(item?.addr1);
    return code != null ? String(code).trim() : '';
  }, [item?.areaCode, item?.areacode, item?.addr1]);

  const scenicRegion = useMemo(
    () => scenicRegionForAreaCode(festivalAreaCode),
    [festivalAreaCode],
  );

  const scenicSpotsRanked = useMemo(() => {
    if (!scenicRegion) return [];
    const spots = listKoreaScenicSpots(scenicRegion);
    const origin = festivalLngLat(item?.mapx, item?.mapy);
    if (!origin) {
      return spots.slice(0, SCENIC_LIST_LIMIT).map((spot) => ({
        spot,
        km: null,
      }));
    }
    return rankSpotsByDistance(spots, origin.lat, origin.lng)
      .slice(0, SCENIC_LIST_LIMIT)
      .map(({ item: spot, km }) => ({
        spot,
        km: Number.isFinite(km) ? km : null,
      }));
  }, [scenicRegion, item?.mapx, item?.mapy]);

  const scenicPageHref = useMemo(() => {
    if (!scenicRegion) return SCENIC_PATH;
    return `${SCENIC_PATH}?region=${encodeURIComponent(scenicRegion)}`;
  }, [scenicRegion]);

  const festivalCross = useMemo(
    () =>
      resolveFestivalThemeCrossLinks(item, {
        areaCode: festivalAreaCode,
        region: scenicRegion || undefined,
        utmContentPrefix: 'korea-festival-cross',
      }),
    [item, festivalAreaCode, scenicRegion],
  );

  const festivalStayHref = festivalCross?.stay?.keyword
    ? getMrtAccommodationSearchUrl(festivalCross.stay.keyword, {
        isDomestic: true,
      })
    : '';
  const festivalTnaHref = festivalCross?.tna?.keyword
    ? buildMrtTnaSearchMoreUrl(festivalCross.tna.keyword)
    : '';

  const openScenicPage = () => {
    const back = {
      path: FESTIVAL_RETURN,
      label: String(item?.title || '축제').trim() || '축제',
      moduleLabel: '축제',
    };
    pushThemeNavBack(back);
    onClose();
    navigate(scenicPageHref, { state: { themeBack: back } });
  };

  const coursesPageHref = useMemo(() => {
    if (!festivalAreaCode) return COURSES_PATH;
    return `${COURSES_PATH}?area=${encodeURIComponent(festivalAreaCode)}`;
  }, [festivalAreaCode]);

  const openCoursesPage = () => {
    const back = {
      path: FESTIVAL_RETURN,
      label: String(item?.title || '축제').trim() || '축제',
      moduleLabel: '축제',
    };
    pushThemeNavBack(back);
    onClose();
    navigate(coursesPageHref, { state: { themeBack: back } });
  };

  const openCourseModal = async (spot) => {
    if (!spot?.contentId) return;
    setSelectedCourse(spot);
    setCourseDetail(null);
    setCourseDetailLoading(true);
    const detail = await fetchTourApiCourseDetail({
      contentId: spot.contentId,
    });
    setCourseDetail(detail || { empty: true });
    setCourseDetailLoading(false);
  };

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
      setVideosExpanded(false);
      setNearbySpots([]);
      setNearbyStatus('idle');
      setNearbyFood([]);
      setNearbyFoodStatus('idle');
      setNearbyCourses([]);
      setNearbyCoursesStatus('idle');
      setSelectedNearby(null);
      setSelectedScenic(null);
      setSelectedCourse(null);
      setCourseDetail(null);
      setCourseDetailLoading(false);
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
    setVideosExpanded(false);
    setNearbySpots([]);
    setNearbyStatus('idle');
    setNearbyFood([]);
    setNearbyFoodStatus('idle');
    setNearbyCourses([]);
    setNearbyCoursesStatus('idle');
    setSelectedNearby(null);
    setSelectedScenic(null);
    setSelectedCourse(null);
    setCourseDetail(null);
    setCourseDetailLoading(false);

    (async () => {
      const contentId = item.contentId;
      const contentTypeId = item.contentTypeId || '15';
      const [detailData, imageData] = await Promise.all([
        fetchTourApiFestivalDetail({ contentId, contentTypeId }),
        fetchTourApiFestivalImages({ contentId, numOfRows: 12 }),
      ]);
      if (cancelled) return;

      const introHit = detailData?.intro || pickFirst(detailData) || null;
      const commonHit = detailData?.common || null;
      const infoRows = Array.isArray(detailData?.info) ? detailData.info : [];
      const urls = collectImageUrls(imageData, seed);

      if (!detailData?.ok && !imageData?.ok) {
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
        if (selectedNearby || selectedScenic || selectedCourse) return;
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
  }, [
    lightboxOpen,
    imageUrls.length,
    onClose,
    selectedNearby,
    selectedScenic,
    selectedCourse,
  ]);

  useEffect(() => {
    if (!item?.contentId) return undefined;
    const pt = festivalLngLat(item?.mapx, item?.mapy);
    if (!pt) {
      setNearbySpots([]);
      setNearbyStatus('nocoords');
      setNearbyFood([]);
      setNearbyFoodStatus('nocoords');
      setNearbyLeports([]);
      setNearbyLeportsStatus('nocoords');
      setNearbyCulture([]);
      setNearbyCultureStatus('nocoords');
    } else {
      let cancelled = false;
      setNearbyStatus('loading');
      setNearbyFoodStatus('loading');
      setNearbyLeportsStatus('loading');
      setNearbyCultureStatus('loading');
      fetchNearbyTourAttractions({
        lat: pt.lat,
        lng: pt.lng,
        radiusKm: 8,
        limit: 8,
      }).then((res) => {
        if (cancelled) return;
        const spots = Array.isArray(res?.spots) ? res.spots : [];
        setNearbySpots(spots);
        if (res?.error) setNearbyStatus('error');
        else if (!spots.length) setNearbyStatus('empty');
        else setNearbyStatus('ok');
      });
      fetchNearbyTourRestaurants({
        lat: pt.lat,
        lng: pt.lng,
        radiusKm: 3,
        limit: 8,
      }).then((res) => {
        if (cancelled) return;
        const spots = Array.isArray(res?.spots) ? res.spots : [];
        setNearbyFood(spots);
        if (res?.error) setNearbyFoodStatus('error');
        else if (!spots.length) setNearbyFoodStatus('empty');
        else setNearbyFoodStatus('ok');
      });
      fetchNearbyTourLeports({
        lat: pt.lat,
        lng: pt.lng,
        radiusKm: 5,
        limit: 6,
      }).then((res) => {
        if (cancelled) return;
        const spots = Array.isArray(res?.spots) ? res.spots : [];
        setNearbyLeports(spots);
        if (res?.error) setNearbyLeportsStatus('error');
        else if (!spots.length) setNearbyLeportsStatus('empty');
        else setNearbyLeportsStatus('ok');
      });
      fetchNearbyTourCulture({
        lat: pt.lat,
        lng: pt.lng,
        radiusKm: 5,
        limit: 6,
      }).then((res) => {
        if (cancelled) return;
        const spots = Array.isArray(res?.spots) ? res.spots : [];
        setNearbyCulture(spots);
        if (res?.error) setNearbyCultureStatus('error');
        else if (!spots.length) setNearbyCultureStatus('empty');
        else setNearbyCultureStatus('ok');
      });

      return () => {
        cancelled = true;
      };
    }
    return undefined;
  }, [item?.contentId, item?.mapx, item?.mapy]);

  useEffect(() => {
    if (!item?.contentId) return undefined;
    if (!festivalAreaCode) {
      setNearbyCourses([]);
      setNearbyCoursesStatus('noarea');
      return undefined;
    }

    const pt = festivalLngLat(item?.mapx, item?.mapy);
    let cancelled = false;
    setNearbyCoursesStatus('loading');
    fetchNearbyTourCourses({
      lat: pt?.lat,
      lng: pt?.lng,
      areaCode: festivalAreaCode,
      radiusKm: 80,
      limit: 6,
    }).then((res) => {
      if (cancelled) return;
      const spots = Array.isArray(res?.spots) ? res.spots : [];
      setNearbyCourses(spots);
      if (res?.error) setNearbyCoursesStatus('error');
      else if (!spots.length) setNearbyCoursesStatus('empty');
      else setNearbyCoursesStatus('ok');
    });

    return () => {
      cancelled = true;
    };
  }, [item?.contentId, item?.mapx, item?.mapy, festivalAreaCode]);

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
    const searchTitle = festivalSearchQuery(item.title);

    (async () => {
      const result = await fetchFestivalVideos({
        contentId: id,
        title: searchTitle || String(item.title),
        year,
      });
      if (cancelled) return;
      setVideosLoadedFor(id);
      setVideosLoading(false);
      setVideosExpanded(false);
      if (!result.ok) {
        setVideos([]);
        setVideosError('관련 영상을 찾지 못했습니다.');
        return;
      }
      const list = Array.isArray(result.videos)
        ? result.videos.slice(0, FESTIVAL_VIDEOS_MAX)
        : [];
      setVideos(list);
      if (!list.length) {
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

  useEffect(() => {
    const el = sheetScrollRef.current;
    if (!el || !item?.contentId) {
      setShowScrollTop(false);
      return undefined;
    }
    el.scrollTo({ top: 0 });
    setShowScrollTop(false);
    const onScroll = () => setShowScrollTop(el.scrollTop > 180);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [item?.contentId]);

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

  const scrollTabsIntoView = () => {
    const sheet = sheetScrollRef.current;
    const tabs = tabListRef.current;
    if (!sheet || !tabs) return;
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      return;
    }
    const sheetRect = sheet.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();
    const nextTop = sheet.scrollTop + (tabsRect.top - sheetRect.top) - 12;
    sheet.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
  };

  const selectTab = (tab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollTabsIntoView);
    });
  };

  const visibleVideos = videosExpanded
    ? videos
    : videos.slice(0, FESTIVAL_VIDEOS_PAGE);
  const canLoadMoreVideos =
    !videosLoading &&
    !videosExpanded &&
    videos.length > FESTIVAL_VIDEOS_PAGE;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end md:items-stretch justify-center bg-stone-900/30 backdrop-blur-sm p-0 md:py-2 md:px-3 lg:px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetScrollRef}
        className="relative flex w-full max-w-lg md:max-w-6xl xl:max-w-7xl max-h-[100dvh] md:my-0 md:h-full md:max-h-none flex-col md:flex-row overflow-y-auto overscroll-contain md:overflow-hidden rounded-t-3xl md:rounded-3xl border border-stone-200 bg-white text-stone-900 shadow-2xl custom-scrollbar"
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
              className="group relative flex w-full items-center justify-center bg-stone-200/70 text-left md:min-h-0 md:flex-1 md:overflow-hidden"
              aria-label="사진 확대보기"
            >
              <img
                src={hero}
                alt=""
                className="h-auto w-full max-h-[min(52vh,28rem)] object-contain md:max-h-full md:h-full md:w-full"
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

        <div className="min-w-0 shrink-0 overflow-visible p-5 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-7 lg:p-8 space-y-4 md:space-y-5 md:custom-scrollbar">
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
              ref={tabListRef}
              className="flex gap-1.5 overflow-x-auto border-b border-stone-200 pb-2 custom-scrollbar"
              role="tablist"
              aria-label="축제 상세 구분"
            >
              <TabChip
                selected={activeTab === TAB_INFO}
                onClick={() => selectTab(TAB_INFO)}
              >
                안내
              </TabChip>
              {hasProgramTab && (
                <TabChip
                  selected={activeTab === TAB_PROGRAM}
                  onClick={() => selectTab(TAB_PROGRAM)}
                >
                  프로그램·내용
                </TabChip>
              )}
              {hasPhotoTab && (
                <TabChip
                  selected={activeTab === TAB_PHOTOS}
                  onClick={() => selectTab(TAB_PHOTOS)}
                >
                  사진
                </TabChip>
              )}
              <TabChip
                selected={activeTab === TAB_READING}
                onClick={() => selectTab(TAB_READING)}
              >
                읽을거리
              </TabChip>
            </div>
          )}

          {!detailLoading && activeTab === TAB_INFO && (
            <div className="space-y-3">
              {overview && <DetailRow label="개요">{overview}</DetailRow>}

              {(intro || scenicRegion) && (
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

              {scenicRegion && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    인근 명소
                  </p>
                  {scenicSpotsRanked.length > 0 && (
                    <ul
                      className="space-y-2"
                      aria-label={`${scenicRegion} 명소 축제장에서 가까운 순`}
                    >
                      {scenicSpotsRanked.map(({ spot, km }) => {
                        const distanceLabel = formatDistanceKm(km);
                        return (
                          <li key={spot.id || spot.contentId}>
                            <button
                              type="button"
                              onClick={() => setSelectedScenic(spot)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                                <Landmark size={18} aria-hidden="true" />
                              </div>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                    {spot.name}
                                  </span>
                                  {distanceLabel ? (
                                    <span className="shrink-0 rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-600">
                                      {distanceLabel}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 break-keep">
                                  {[spot.region, spot.blurb]
                                    .filter(Boolean)
                                    .join(' · ')}
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
                    onClick={openScenicPage}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                  >
                    {scenicRegion} 명소 더보기
                    <ExternalLink size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              {(festivalStayHref ||
                festivalTnaHref ||
                festivalCross?.packageCta?.url) && (
                <div className="space-y-3 pt-1">
                  {festivalStayHref || festivalTnaHref ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                        숙소 · 투어
                      </p>
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap">
                        {festivalStayHref ? (
                          <a
                            href={festivalStayHref}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100"
                          >
                            숙소 · {festivalCross.stay.keyword}
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : null}
                        {festivalTnaHref ? (
                          <a
                            href={festivalTnaHref}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-bold text-stone-800 hover:bg-stone-100"
                          >
                            투어 · {festivalCross.tna.keyword}
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {festivalCross?.packageCta?.url ? (
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                        패키지
                      </p>
                      <a
                        href={festivalCross.packageCta.url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                      >
                        {festivalCross.packageCta.ctaLabel || '패키지 보기'}
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    </div>
                  ) : null}
                </div>
              )}

              {nearbyCoursesStatus !== 'idle' &&
                nearbyCoursesStatus !== 'noarea' && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                      인근 여행코스
                    </p>
                    {nearbyCoursesStatus === 'loading' && (
                      <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                        인근 여행코스 불러오는 중…
                      </div>
                    )}
                    {nearbyCoursesStatus === 'error' &&
                      nearbyCourses.length === 0 && (
                        <p className="text-xs text-stone-500">
                          인근 여행코스를 불러오지 못했습니다.
                        </p>
                      )}
                    {nearbyCoursesStatus === 'empty' && (
                      <p className="text-xs text-stone-500">
                        이 시도에 등록된 여행코스가 없습니다.
                      </p>
                    )}
                    {nearbyCourses.length > 0 && (
                      <ul className="space-y-2" aria-label="축제 인근 여행코스">
                        {nearbyCourses.map((spot) => {
                          const thumb = toHttps(spot.firstImage);
                          const dist = formatDistKm(spot.distKm);
                          const place = nearbyPlaceLabel(spot);
                          return (
                            <li key={`course-${spot.contentId || spot.id}`}>
                              <button
                                type="button"
                                onClick={() => openCourseModal(spot)}
                                className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                              >
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                                    <Route size={18} aria-hidden="true" />
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                    {spot.name}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                    {[place, dist].filter(Boolean).join(' · ')}
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
                      onClick={openCoursesPage}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/90 bg-amber-50 px-3 py-2.5 text-sm font-bold text-amber-950 hover:bg-amber-100"
                    >
                      여행코스 더보기
                      <ExternalLink size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}

              {nearbyStatus !== 'idle' && nearbyStatus !== 'nocoords' && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    주변 관광지
                  </p>
                  {nearbyStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 관광지 불러오는 중…
                    </div>
                  )}
                  {nearbyStatus === 'error' && nearbySpots.length === 0 && (
                    <p className="text-xs text-stone-500">
                      주변 관광지를 불러오지 못했습니다.
                    </p>
                  )}
                  {nearbyStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 8km 안 등록된 관광지가 없습니다.
                    </p>
                  )}
                  {nearbySpots.length > 0 && (
                    <ul className="space-y-2" aria-label="축제 주변 관광지">
                      {nearbySpots.map((spot) => {
                        const thumb = toHttps(spot.firstImage);
                        const dist = formatDistKm(spot.distKm);
                        const place = nearbyPlaceLabel(spot);
                        return (
                          <li key={spot.contentId || spot.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedNearby(spot)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                                  <Landmark size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {spot.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {nearbyFoodStatus !== 'idle' && nearbyFoodStatus !== 'nocoords' && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                    주변 맛집
                  </p>
                  {nearbyFoodStatus === 'loading' && (
                    <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      주변 맛집 불러오는 중…
                    </div>
                  )}
                  {nearbyFoodStatus === 'error' && nearbyFood.length === 0 && (
                    <p className="text-xs text-stone-500">
                      주변 맛집을 불러오지 못했습니다.
                    </p>
                  )}
                  {nearbyFoodStatus === 'empty' && (
                    <p className="text-xs text-stone-500">
                      반경 3km 안 TourAPI 맛집이 없습니다.
                    </p>
                  )}
                  {nearbyFood.length > 0 && (
                    <ul className="space-y-2" aria-label="축제 주변 맛집">
                      {nearbyFood.map((spot) => {
                        const thumb = toHttps(spot.firstImage);
                        const dist = formatDistKm(spot.distKm);
                        const place = nearbyPlaceLabel(spot);
                        return (
                          <li key={`food-${spot.contentId || spot.id}`}>
                            <button
                              type="button"
                              onClick={() => setSelectedNearby(spot)}
                              className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt=""
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                />
                              ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-800">
                                  <Utensils size={18} aria-hidden="true" />
                                </div>
                              )}
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                  {spot.name}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                  {[place, dist].filter(Boolean).join(' · ')}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {nearbyLeportsStatus !== 'idle' &&
                nearbyLeportsStatus !== 'nocoords' && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                      주변 레포츠
                    </p>
                    {nearbyLeportsStatus === 'loading' && (
                      <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                        주변 레포츠 불러오는 중…
                      </div>
                    )}
                    {nearbyLeportsStatus === 'error' &&
                      nearbyLeports.length === 0 && (
                        <p className="text-xs text-stone-500">
                          주변 레포츠를 불러오지 못했습니다.
                        </p>
                      )}
                    {nearbyLeportsStatus === 'empty' && (
                      <p className="text-xs text-stone-500">
                        반경 5km 안 TourAPI 레포츠가 없습니다.
                      </p>
                    )}
                    {nearbyLeports.length > 0 && (
                      <ul className="space-y-2" aria-label="축제 주변 레포츠">
                        {nearbyLeports.map((spot) => {
                          const thumb = toHttps(spot.firstImage);
                          const dist = formatDistKm(spot.distKm);
                          const place = nearbyPlaceLabel(spot);
                          return (
                            <li key={`leports-${spot.contentId || spot.id}`}>
                              <button
                                type="button"
                                onClick={() => setSelectedNearby(spot)}
                                className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                              >
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-800">
                                    <Bike size={18} aria-hidden="true" />
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                    {spot.name}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                    {[place, dist].filter(Boolean).join(' · ')}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

              {nearbyCultureStatus !== 'idle' &&
                nearbyCultureStatus !== 'nocoords' && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] font-bold tracking-widest text-stone-400 uppercase">
                      주변 문화
                    </p>
                    {nearbyCultureStatus === 'loading' && (
                      <div className="flex items-center gap-2 text-sm text-stone-500 py-1">
                        <Loader2
                          size={16}
                          className="animate-spin"
                          aria-hidden="true"
                        />
                        주변 문화시설 불러오는 중…
                      </div>
                    )}
                    {nearbyCultureStatus === 'error' &&
                      nearbyCulture.length === 0 && (
                        <p className="text-xs text-stone-500">
                          주변 문화시설을 불러오지 못했습니다.
                        </p>
                      )}
                    {nearbyCultureStatus === 'empty' && (
                      <p className="text-xs text-stone-500">
                        반경 5km 안 TourAPI 문화시설이 없습니다.
                      </p>
                    )}
                    {nearbyCulture.length > 0 && (
                      <ul className="space-y-2" aria-label="축제 주변 문화">
                        {nearbyCulture.map((spot) => {
                          const thumb = toHttps(spot.firstImage);
                          const dist = formatDistKm(spot.distKm);
                          const place = nearbyPlaceLabel(spot);
                          return (
                            <li key={`culture-${spot.contentId || spot.id}`}>
                              <button
                                type="button"
                                onClick={() => setSelectedNearby(spot)}
                                className="flex w-full gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-300 transition-colors"
                              >
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt=""
                                    className="h-14 w-14 shrink-0 rounded-xl object-cover bg-stone-200"
                                  />
                                ) : (
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                                    <Building2 size={18} aria-hidden="true" />
                                  </div>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm font-bold text-stone-800 leading-snug line-clamp-2 break-keep">
                                    {spot.name}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] text-stone-500 tabular-nums break-keep">
                                    {[place, dist].filter(Boolean).join(' · ')}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
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
                  {naverSearchUrl(item.title) && (
                    <a
                      href={naverSearchUrl(item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      네이버 검색
                    </a>
                  )}
                  {googleSearchUrl(item.title) && (
                    <a
                      href={googleSearchUrl(item.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <ExternalLink size={12} aria-hidden="true" />
                      구글 검색
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
                  <>
                    <ul className="space-y-2">
                      {visibleVideos.map((video) => {
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
                    {canLoadMoreVideos && (
                      <button
                        type="button"
                        onClick={() => setVideosExpanded(true)}
                        className="w-full py-2.5 rounded-2xl text-sm font-bold border border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100"
                      >
                        동영상 더보기
                      </button>
                    )}
                  </>
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

      <button
        type="button"
        aria-label="맨 위로"
        onClick={(e) => {
          e.stopPropagation();
          sheetScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-3 z-[45] flex h-11 items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500 px-3.5 text-white shadow-[0_4px_18px_rgba(245,158,11,0.45)] transition-all duration-300 md:hidden ${
          showScrollTop && !lightboxOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        <ArrowUp size={18} strokeWidth={2.5} className="shrink-0" aria-hidden="true" />
        <span className="text-xs font-bold">위로</span>
      </button>

      {selectedNearby && (
        <ThemeSpotDetailModal
          spot={toNearbyModalSpot(selectedNearby)}
          eyebrow={nearbyEyebrow(selectedNearby)}
          returnTo="/korea"
          overlayZClass="z-50"
          onClose={() => setSelectedNearby(null)}
        />
      )}

      {selectedScenic && (
        <ThemeSpotDetailModal
          spot={toScenicModalSpot(selectedScenic)}
          eyebrow="인근 명소"
          returnTo="/korea"
          overlayZClass="z-50"
          onClose={() => setSelectedScenic(null)}
        />
      )}

      {selectedCourse && (
        <CourseDetailModal
          course={{
            ...selectedCourse,
            title: selectedCourse.title || selectedCourse.name,
            areaCode: selectedCourse.areaCode || festivalAreaCode,
          }}
          detail={courseDetail}
          detailLoading={courseDetailLoading}
          overlayZClass="z-50"
          onClose={() => {
            setSelectedCourse(null);
            setCourseDetail(null);
            setCourseDetailLoading(false);
          }}
        />
      )}

      {lightboxOpen && hero && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/90 p-3 md:p-8"
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
