import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  MapPin,
  Loader2,
  Compass,
  Star,
  ChevronDown,
  ChevronUp,
  Globe2,
  MessageCircle,
  Lightbulb,
  CalendarDays,
  EyeOff,
  X,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../../../shared/api/supabase';
import { useCurationAI } from '../hooks/useLogbookAI';
import { useTravelData } from '../../Home/hooks/useTravelData';
import { getPlaceUrlParam } from '../../Home/lib/formatUrlName';
import {
  hydrateLocationFromCuration,
  hasValidCurationCoords,
  queueCurationHomeOpen,
  buildCurationHomeNavigateState,
} from '../../Home/lib/curationPlaceBridge';
import {
  armCurationHandoffDebugSession,
  logCurationHandoff,
} from '../../../shared/cloudPreview/curationHandoffDebug';
import { cachePlaceLocation } from '../../Home/lib/placeLocationCache';
import {
  curationEntryToPanelData,
  CURATION_TASTE_TAG_OPTIONS,
  CURATION_TASTE_DETAIL_GROUPS,
  readCurationTasteSurvey,
  writeCurationTasteSurvey,
} from '../lib/curationHistory';
import {
  destinationLabel,
  RECENT_SEARCH_KEY,
  safeLoadRecentList,
  safeLoadRecentVisited,
} from '../../Home/lib/exploreRecentHistory';
import { formatCurationTasteGroupTitle, formatCurationTasteLabel } from '../../../i18n/logbookUi';

const linkBtnClass =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

function curationPrimaryLocation(item, locale) {
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const ko = String(item?.location || '').trim();
  const en = String(item?.locationEn || '').trim();
  if (isEn) return en || ko;
  return ko || en;
}

function curationSecondaryLocation(item, locale) {
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const ko = String(item?.location || '').trim();
  const en = String(item?.locationEn || '').trim();
  if (isEn) return ko && en && ko !== en ? ko : '';
  return en && en !== ko ? en : '';
}

function CurationRichBlocks({ data }) {
  const { t, i18n } = useTranslation();
  const tips = Array.isArray(data?.tips) ? data.tips.filter(Boolean) : [];
  const hasRich = Boolean(data?.whyHidden || data?.bestSeason || tips.length);
  if (!hasRich) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      {data.whyHidden ? (
        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 mb-1">
            <EyeOff size={12} /> {t('logbook.curationHub.whyHidden')}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed break-keep font-light">{data.whyHidden}</p>
        </div>
      ) : null}
      {data.bestSeason ? (
        <div className="rounded-2xl bg-sky-50/70 border border-sky-100 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-sky-700 mb-1">
            <CalendarDays size={12} /> {t('logbook.curationHub.bestSeason')}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed break-keep font-light">{data.bestSeason}</p>
        </div>
      ) : null}
      {tips.length > 0 ? (
        <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 mb-2">
            <Lightbulb size={12} /> {t('logbook.curationHub.tips')}
          </p>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={`${i}-${tip.slice(0, 12)}`} className="text-sm text-gray-700 leading-relaxed break-keep font-light flex gap-2">
                <span className="text-indigo-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CurationResultPanel({
  data,
  compact = false,
  onResetTaste,
  user,
  savedTrips,
  saveCurationData,
  onNeedLogin,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const hydratedPlace = useMemo(
    () => (data ? hydrateLocationFromCuration(data) : null),
    [data],
  );
  const canOpenMap = Boolean(hydratedPlace && hasValidCurationCoords(hydratedPlace));
  const placeParam = hydratedPlace ? getPlaceUrlParam(hydratedPlace) : '';

  useEffect(() => {
    setImageFailed(false);
    setIsTextExpanded(false);
  }, [data?.imageUrl, data?.location]);

  useEffect(() => {
    if (!data?.location) {
      setIsSaved(false);
      return;
    }
    const isAlreadySaved = (savedTrips || []).some(
      (trip) => trip.destination === data.location && trip.is_bookmarked && !trip.is_hidden,
    );
    setIsSaved(isAlreadySaved);
  }, [data?.location, savedTrips]);

  if (!data) return null;

  const handleSaveCuration = async (e) => {
    e.stopPropagation();
    if (isSaving || isSaved || !data) return;
    if (!user) {
      onNeedLogin?.();
      return;
    }
    if (!saveCurationData) return;

    setIsSaving(true);
    try {
      const payload = hydratedPlace
        ? {
            ...data,
            lat: hydratedPlace.lat,
            lng: hydratedPlace.lng,
            slug: hydratedPlace.slug || data.slug,
            country: hydratedPlace.country || data.country,
            country_en: hydratedPlace.country_en || data.country_en,
          }
        : data;

      const savedTrip = await saveCurationData(payload, user);
      if (savedTrip) setIsSaved(true);
    } catch (error) {
      console.error('저장 실패:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const openOnGlobe = ({ openMooni = false } = {}) => {
    if (!hydratedPlace || !canOpenMap) {
      alert(t('logbook.curationHub.coordsMissing'));
      return;
    }
    armCurationHandoffDebugSession();
    logCurationHandoff('cta.click', {
      openMooni,
      location: hydratedPlace.name,
      lat: hydratedPlace.lat,
      lng: hydratedPlace.lng,
    });
    try {
      cachePlaceLocation(hydratedPlace);
    } catch {
      /* ignore */
    }
    const queued = queueCurationHomeOpen(hydratedPlace, { openMooni });
    logCurationHandoff('cta.queue', { ok: queued, openMooni });
    if (!queued) {
      alert(t('logbook.curationHub.homeLinkFail'));
      return;
    }
    try {
      sessionStorage.setItem('gateo_reset_viewport', '1');
    } catch {
      /* private mode */
    }
    window.scrollTo(0, 0);
    const navState = buildCurationHomeNavigateState(hydratedPlace, { openMooni });
    logCurationHandoff('cta.navigate', { path: '/', hasHandoff: Boolean(navState.curationHandoff) });
    navigate('/', { state: navState });
  };

  const openPlaceCard = () => {
    if (!hydratedPlace || !placeParam) {
      alert(t('logbook.curationHub.placeCardInsufficient'));
      return;
    }
    try {
      cachePlaceLocation(hydratedPlace);
    } catch {
      /* ignore */
    }
    navigate(`/place/${placeParam}`, { state: { fromCuration: true } });
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row min-h-[280px] md:min-h-[340px] relative overflow-hidden group animate-in fade-in zoom-in-95 duration-500">
      <div className="w-full md:w-5/12 h-44 md:min-h-[340px] relative overflow-hidden">
        {data.imageUrl && !imageFailed ? (
          <img
            src={data.imageUrl}
            alt={data.location}
            onError={() => setImageFailed(true)}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 flex flex-col items-center justify-center gap-2 text-blue-500/80">
            <Compass size={36} strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-wide">{t('logbook.curationHub.imagePreparing')}</span>
          </div>
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('logbook.curationHub.closeBody')}
            title={t('logbook.curationHub.closeBody')}
            className="absolute top-3 right-3 z-20 inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 hover:bg-black/70 text-white border border-white/40 shadow-md backdrop-blur-[2px] transition-colors"
          >
            <X size={18} strokeWidth={2.25} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="w-full md:w-7/12 py-4 pr-4 pl-6 md:py-5 md:pr-5 md:pl-8 flex flex-col relative z-10">
        <div className="flex items-start justify-between mb-3 gap-2">
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <p className="flex items-center gap-1 text-gray-800 text-sm font-bold min-w-0">
              <MapPin size={12} className="flex-shrink-0 text-blue-500" />
              <span className="truncate">{curationPrimaryLocation(data, i18n.language)}</span>
            </p>
            {curationSecondaryLocation(data, i18n.language) ? (
              <p className="text-gray-500 text-[15px] ml-4 font-mono truncate mt-0.5 select-all">
                {curationSecondaryLocation(data, i18n.language)}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleSaveCuration}
            disabled={isSaving}
            aria-label={isSaved ? t('logbook.curationHub.favoriteSaved') : t('logbook.curationHub.favorite')}
            aria-pressed={isSaved}
            className={`p-2.5 rounded-full transition-all border shadow-sm disabled:opacity-60 flex-shrink-0 ${
              isSaved
                ? 'bg-amber-50 text-amber-500 border-amber-200 shadow-amber-500/10'
                : 'bg-gray-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-200 border-gray-200'
            }`}
            title={isSaved ? t('logbook.curationHub.favoriteSaved') : t('logbook.curationHub.favorite')}
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Star
                size={16}
                className={isSaved ? 'fill-amber-400 text-amber-500' : ''}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-3 tracking-tight line-clamp-2 mt-1">
          {data.title}
        </h2>

        <div className="mb-2 flex-1">
          <p
            className={`text-sm text-gray-600 leading-relaxed font-light transition-all duration-300 break-keep ${
              isTextExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {data.description}
          </p>
          {data.description?.length > 80 && (
            <button
              type="button"
              onClick={() => setIsTextExpanded(!isTextExpanded)}
              className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors z-20 relative"
            >
              {isTextExpanded ? (
                <>
                  <ChevronUp size={14} /> {t('logbook.curationHub.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown size={14} /> {t('logbook.curationHub.showMore')}
                </>
              )}
            </button>
          )}

          {!compact ? <CurationRichBlocks data={data} /> : null}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-200 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => openOnGlobe()}
              disabled={!canOpenMap}
              className={`${linkBtnClass} bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100`}
            >
              <Globe2 size={13} /> {t('logbook.curationHub.viewOnGlobe')}
            </button>
            <button
              type="button"
              onClick={openPlaceCard}
              disabled={!placeParam}
              className={`${linkBtnClass} bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100`}
            >
              <MapPin size={13} /> {t('logbook.curationHub.placeCard')}
            </button>
            <button
              type="button"
              onClick={() => openOnGlobe({ openMooni: true })}
              disabled={!canOpenMap}
              className={`${linkBtnClass} bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100`}
            >
              <MessageCircle size={13} /> {t('logbook.curationHub.askMooni')}
            </button>
          </div>

          {onResetTaste ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-gray-400 font-mono tracking-wide uppercase">Gateo Intelligence v5.0</span>
              <button
                type="button"
                onClick={onResetTaste}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors z-20 relative shadow-sm"
              >
                <SlidersHorizontal size={13} aria-hidden="true" />
                {t('logbook.curationHub.resetTaste')}
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-400 font-mono tracking-wide uppercase">Gateo Intelligence v5.0</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryList({
  history,
  mainLocation,
  openStack,
  onToggle,
  onDismiss,
  onResetTaste,
  user,
  savedTrips,
  saveCurationData,
  onNeedLogin,
}) {
  const { t, i18n } = useTranslation();
  if (!history?.length) return null;

  return (
    <ul className="space-y-3">
      {history.map((item) => {
        const isMain = item.location === mainLocation;
        const isOpen = openStack.some((entry) => entry.location === item.location);
        const panelData = curationEntryToPanelData(item);

        return (
          <li key={`${item.location}-${item.savedAt || ''}`} className="space-y-2">
            <div
              className={`flex items-stretch gap-1.5 rounded-2xl border ${
                isOpen || isMain
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white/70 border-gray-200'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(item)}
                aria-expanded={isOpen}
                disabled={isMain}
                className={`flex-1 min-w-0 text-left px-3 py-2.5 transition-colors rounded-2xl ${
                  isMain ? 'cursor-default' : 'hover:bg-blue-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {curationPrimaryLocation(item, i18n.language)}
                    </p>
                    {item.title ? (
                      <p className="text-xs text-gray-500 truncate mt-0.5 font-light">{item.title}</p>
                    ) : curationSecondaryLocation(item, i18n.language) ? (
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                        {curationSecondaryLocation(item, i18n.language)}
                      </p>
                    ) : null}
                    {isMain ? (
                      <p className="text-[10px] text-blue-500 font-medium mt-1">{t('logbook.curationHub.viewingMain')}</p>
                    ) : null}
                  </div>
                  {!isMain ? (
                    <span className="flex-shrink-0 text-gray-400 mt-0.5" aria-hidden="true">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  ) : null}
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss?.(item);
                }}
                aria-label={t('logbook.curationHub.dismissAria', {
                  location: curationPrimaryLocation(item, i18n.language),
                })}
                title={t('logbook.curationHub.dismissTitle')}
                className="flex-shrink-0 self-center mr-2 p-2 rounded-full border border-gray-200/90 bg-white/80 text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>

            {isOpen && panelData ? (
              <CurationResultPanel
                data={panelData}
                onResetTaste={onResetTaste}
                user={user}
                savedTrips={savedTrips}
                saveCurationData={saveCurationData}
                onNeedLogin={onNeedLogin}
                onClose={() => onToggle(item)}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function TasteChip({ opt, on, onToggle }) {
  const { t, i18n } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => onToggle(opt.id)}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
        on
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-200'
      }`}
    >
      {formatCurationTasteLabel(t, opt)}
    </button>
  );
}

function TasteSurveyModal({ open, mode = 'first', selected, onToggleTag, onSkip, onConfirm }) {
  const { t, i18n } = useTranslation();
  if (!open) return null;
  const isReset = mode === 'reset';
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="presentation"
      onClick={onSkip}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="curation-taste-survey-title"
        className={`w-full rounded-3xl border border-gray-200 bg-white p-6 shadow-xl ${
          isReset ? 'max-w-lg max-h-[85vh] overflow-y-auto' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="curation-taste-survey-title" className="text-base font-bold text-gray-900 mb-1">
          {isReset ? t('logbook.curationHub.surveyResetTitle') : t('logbook.curationHub.surveyFirstTitle')}
        </h3>
        <p className="text-sm text-gray-500 font-light break-keep mb-4">
          {isReset ? t('logbook.curationHub.surveyResetBody') : t('logbook.curationHub.surveyFirstBody')}
        </p>
        {isReset ? (
          <div className="space-y-5 mb-6">
            {CURATION_TASTE_DETAIL_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-[11px] font-bold text-gray-700 mb-2">{formatCurationTasteGroupTitle(t, group)}</p>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((opt) => (
                    <TasteChip
                      key={opt.id}
                      opt={opt}
                      on={selected.includes(opt.id)}
                      onToggle={onToggleTag}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-6">
            {CURATION_TASTE_TAG_OPTIONS.map((opt) => (
              <TasteChip
                key={opt.id}
                opt={opt}
                on={selected.includes(opt.id)}
                onToggle={onToggleTag}
              />
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!selected.length}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40"
          >
            {isReset ? t('logbook.curationHub.surveyConfirmReset') : t('logbook.curationHub.surveyConfirmFirst')}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {isReset ? t('logbook.curationHub.surveySkipReset') : t('logbook.curationHub.surveySkipFirst')}
          </button>
        </div>
      </div>
    </div>
  );
}

const CurationHub = ({ compact = false } = {}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { status, curationData, history, generateCuration, dismissFromHistory } = useCurationAI();

  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  const { saveCurationData, savedTrips } = useTravelData(user);

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [loadingText, setLoadingText] = useState(() => t('logbook.curationHub.loadingDefault'));
  /** 목록에서 연 본문 — 클릭할수록 아래로 쌓임(토글) · 메인 교체 없음 */
  const [openStack, setOpenStack] = useState([]);
  const [showTasteSurvey, setShowTasteSurvey] = useState(false);
  const [surveyMode, setSurveyMode] = useState('first');
  const [surveyTags, setSurveyTags] = useState(() => readCurationTasteSurvey()?.tags || []);
  const mainStageRef = useRef(null);

  const focusMainStage = () => {
    const el = mainStageRef.current;
    if (!el || typeof el.scrollIntoView !== 'function') return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  useEffect(() => {
    if (status !== 'loading') return;
    focusMainStage();
  }, [status]);

  useEffect(() => {
    if (status !== 'loading') return;
    const texts = [
      t('logbook.curationHub.loadingScan'),
      t('logbook.curationHub.loadingTaste'),
      t('logbook.curationHub.loadingCoords'),
      t('logbook.curationHub.loadingRender'),
    ];
    let i = 0;
    const timer = setInterval(() => {
      setLoadingText(texts[i % texts.length]);
      i++;
    }, 2000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    const main = curationData?.location;
    const locs = new Set((history || []).map((h) => h.location));
    setOpenStack((prev) =>
      prev.filter((entry) => locs.has(entry.location) && entry.location !== main),
    );
  }, [history, curationData?.location]);

  const fetchTasteSources = async () => {
    let reports = [];
    let saved = [];
    if (user?.id) {
      const [reportsRes, savedRes] = await Promise.all([
        supabase.from('reports').select('location').eq('user_id', user.id).eq('is_deleted', false).limit(10),
        supabase
          .from('saved_trips')
          .select('destination')
          .eq('user_id', user.id)
          .eq('is_bookmarked', true)
          .eq('is_hidden', false)
          .limit(10),
      ]);
      reports = reportsRes.data || [];
      saved = savedRes.data || [];
    }
    return { reports, saved };
  };

  const runCuration = async (tasteTags) => {
    setOpenStack([]);
    setShowTasteSurvey(false);
    const { reports, saved } = await fetchTasteSources();
    await generateCuration(reports, saved, { tasteTags });
  };

  const handleCuration = async () => {
    const { reports, saved } = await fetchTasteSources();
    const hasDbTaste = reports.length > 0 || saved.length > 0;
    const hasExploreTaste =
      safeLoadRecentList(RECENT_SEARCH_KEY).length > 0 ||
      safeLoadRecentVisited().some((item) => Boolean(destinationLabel(item)));
    const storedSurvey = readCurationTasteSurvey();
    if (!hasDbTaste && !hasExploreTaste && !storedSurvey?.tags?.length) {
      setSurveyMode('first');
      setSurveyTags([]);
      setShowTasteSurvey(true);
      return;
    }
    setOpenStack([]);
    await generateCuration(reports, saved, { tasteTags: storedSurvey?.tags });
  };

  const openResetTasteSurvey = () => {
    const stored = readCurationTasteSurvey();
    setSurveyMode('reset');
    setSurveyTags(stored?.tags || []);
    setShowTasteSurvey(true);
  };

  const closeTasteSurvey = () => {
    setShowTasteSurvey(false);
    setSurveyMode('first');
  };

  const handleTasteSurveySkip = () => {
    if (surveyMode === 'reset') {
      closeTasteSurvey();
      return;
    }
    void runCuration([]);
  };

  const handleTasteSurveyConfirm = () => {
    writeCurationTasteSurvey({ tags: surveyTags, updatedAt: Date.now() });
    void runCuration(surveyTags);
  };

  const handleDismiss = (item) => {
    const location = item?.location;
    if (!location) return;
    const ok = window.confirm(t('logbook.curationHub.dismissConfirm', { location }));
    if (!ok) return;
    dismissFromHistory(item);
    setOpenStack((prev) => prev.filter((entry) => entry.location !== location));
  };

  const toggleStackItem = (item) => {
    const location = item?.location;
    if (!location) return;
    // 상단 메인과 동일 건은 목록에 본문을 중복으로 쌓지 않음
    if (location === curationData?.location) return;
    setOpenStack((prev) => {
      if (prev.some((entry) => entry.location === location)) {
        return prev.filter((entry) => entry.location !== location);
      }
      const panel = curationEntryToPanelData(item);
      if (!panel) return prev;
      return [...prev, panel];
    });
  };

  const loginPrompt = showLoginPrompt ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      role="presentation"
      onClick={() => setShowLoginPrompt(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="curation-login-prompt-title"
        className="w-full max-w-sm rounded-3xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-100">
            <Star size={22} className="fill-amber-400 text-amber-500" aria-hidden="true" />
          </div>
        </div>
        <h3
          id="curation-login-prompt-title"
          className="text-center text-base font-bold text-gray-900 mb-2"
        >
          {t('logbook.curationHub.loginTitle')}
        </h3>
        <p className="text-center text-sm text-gray-500 font-light leading-relaxed break-keep mb-6">
          {t('logbook.curationHub.loginBody')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              setShowLoginPrompt(false);
              navigate('/auth/login', { state: { from: '/blog/curation' } });
            }}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            {t('logbook.curationHub.loginCta')}
          </button>
          <button
            type="button"
            onClick={() => setShowLoginPrompt(false)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {t('logbook.common.confirm')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const idleOrLoading = (status === 'idle' || status === 'loading') && (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm flex flex-col min-h-[280px] relative overflow-hidden">
      {status === 'idle' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <div className="w-14 h-14 bg-blue-50/80 rounded-full flex items-center justify-center mb-5 border border-blue-100">
            <Compass size={24} className="text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('logbook.curationHub.idleTitle')}</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm font-light break-keep">
            {t('logbook.curationHub.idleBody')}
          </p>
          <button
            type="button"
            onClick={handleCuration}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Sparkles size={16} /> {t('logbook.curationHub.startExplore')}
          </button>
        </div>
      )}
      {status === 'loading' && (
        <div className="p-8 flex flex-col items-center justify-center w-full text-center z-10">
          <Loader2 size={32} className="text-blue-500 animate-spin mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1 animate-pulse">{loadingText}</h3>
          <p className="text-xs text-gray-500">{t('logbook.curationHub.loadingSub')}</p>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <>
        <div className="h-full min-h-[340px]">
          {status === 'result' && curationData ? (
            <CurationResultPanel
              data={curationData}
              compact
              onResetTaste={openResetTasteSurvey}
              user={user}
              savedTrips={savedTrips}
              saveCurationData={saveCurationData}
              onNeedLogin={() => setShowLoginPrompt(true)}
            />
          ) : (
            idleOrLoading
          )}
        </div>
        {loginPrompt}
        <TasteSurveyModal
          open={showTasteSurvey}
          mode={surveyMode}
          selected={surveyTags}
          onToggleTag={(id) =>
            setSurveyTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
          }
          onSkip={handleTasteSurveySkip}
          onConfirm={handleTasteSurveyConfirm}
        />
      </>
    );
  }

  const hasHistory = Boolean(history?.length);
  const showResultBody = status === 'result' && Boolean(curationData);
  const showExecutionMain = !showResultBody && (status === 'idle' || status === 'loading');

  return (
    <>
      <div className="space-y-6">
        <div ref={mainStageRef} className="scroll-mt-6 space-y-4" tabIndex={-1}>
          {showResultBody ? (
            <>
              <CurationResultPanel
                data={curationData}
                onResetTaste={openResetTasteSurvey}
                user={user}
                savedTrips={savedTrips}
                saveCurationData={saveCurationData}
                onNeedLogin={() => setShowLoginPrompt(true)}
              />
              <p className="text-[11px] text-gray-400 font-light break-keep px-1">
                {t('logbook.curationHub.hint')}
              </p>
            </>
          ) : null}

          {showExecutionMain ? idleOrLoading : null}
        </div>

        {hasHistory ? (
          <section className="bg-white/60 backdrop-blur-xl rounded-3xl border border-gray-200 shadow-sm">
            <div className="sticky max-md:top-[env(safe-area-inset-top,0px)] md:top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-t-3xl border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">{t('logbook.curationHub.myCuration')}</h3>
                <span className="text-[10px] font-mono text-gray-400">{history.length}</span>
              </div>
              <button
                type="button"
                onClick={handleCuration}
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Sparkles size={14} /> {t('logbook.curationHub.findNew')}
              </button>
            </div>
            <div className="p-5 pt-4">
              <HistoryList
                history={history}
                mainLocation={curationData?.location}
                openStack={openStack}
                onToggle={toggleStackItem}
                onDismiss={handleDismiss}
                onResetTaste={openResetTasteSurvey}
                user={user}
                savedTrips={savedTrips}
                saveCurationData={saveCurationData}
                onNeedLogin={() => setShowLoginPrompt(true)}
              />
            </div>
          </section>
        ) : null}
      </div>
      {loginPrompt}
      <TasteSurveyModal
        open={showTasteSurvey}
        mode={surveyMode}
        selected={surveyTags}
        onToggleTag={(id) =>
          setSurveyTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
        }
        onSkip={handleTasteSurveySkip}
        onConfirm={handleTasteSurveyConfirm}
      />
    </>
  );
};

export default CurationHub;
