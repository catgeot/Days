import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { MapPin, Home, Compass, PenTool, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { publicProfilePhotos } from '../../shared/Auth/profileAvatar';
import ProfilePhotoLightbox from '../../shared/Auth/ProfilePhotoLightbox';
import { fetchAuthorProfiles, reportAuthorLabel } from './utils/reportAuthor';
import LogbookBody from './components/LogbookBody';
import EditorialLogbookBadge from './components/EditorialLogbookBadge';
import EditorialLogbookImageCredits from './components/EditorialLogbookImageCredits';
import { contentHasLogbookPhotoPlaceholders } from './utils/logbookMarkdownSnippet';
import { isEditorialLogbook, isEditorialLogbookPublished, publicLogbookDetailPath } from '../../utils/logbookEditorial';
import { logbookHeroImageUrl, logbookImageUrlList } from '../../utils/logbookImageSrc';
import { formatLogbookDisplayDate } from '../../utils/logbookDisplayDate';
import { claimLogbookViewSession, readLogbookViewCount, releaseLogbookViewSession } from '../../utils/logbookViewCount';
import { fetchSamePlaceCount, logbookPlaceKey, logbookReadingMinutes } from '../../utils/logbookReadingMeta';
import { logbookCommentsHref, readLogbookCommentCount, readLogbookLikeCount } from '../../utils/logbookReactions';
import LogbookReadFacts from './components/LogbookReadFacts';
import LogbookReactionSlot from './components/LogbookReactionSlot';
import LogbookComments from './components/LogbookComments';
import { useLogbookLikes } from './hooks/useLogbookLikes';
import LogbookArticleHead from './components/LogbookArticleHead';
import { buildEditorialLogbookJsonLd } from './lib/logbookEditorialJsonLd';
import SEO from '../../components/SEO';
import { navigateAppBack } from '../../shared/navigation/navigateAppBack';
import AppOutlineBackButton from '../../shared/navigation/AppOutlineBackButton';

const SCHEMA_TYPE = 'EditorialLogbookArticle';

function recordPublicRead(reportId, onCount) {
  if (typeof sessionStorage === 'undefined') return;
  if (!claimLogbookViewSession(reportId, sessionStorage)) return;
  void supabase.rpc('increment_report_view', { report_id_param: String(reportId) }).then(({ data, error }) => {
    if (error) {
      releaseLogbookViewSession(reportId, sessionStorage);
      console.warn('[logbook] view count', error.message);
      return;
    }
    const n = typeof data === 'number' ? data : typeof data === 'string' && data.trim() !== '' ? Number(data) : NaN;
    if (Number.isFinite(n) && onCount) onCount(Math.floor(n));
  });
}

function upsertEditorialJsonLd(schema) {
  const selector = `script[data-schema-type="${SCHEMA_TYPE}"]`;
  document.querySelector(selector)?.remove();
  if (!schema) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-schema-type', SCHEMA_TYPE);
  script.textContent = JSON.stringify(schema, null, 2);
  document.head.appendChild(script);
}

const PublicViewer = () => {
  const { t } = useTranslation();
  const { id, editorialSlug } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [authorLabel, setAuthorLabel] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [authorPhotos, setAuthorPhotos] = useState([]);
  const [authorPhotoOpen, setAuthorPhotoOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [seenCount, setSeenCount] = useState(null);
  const [placeCount, setPlaceCount] = useState(null);
  const [commentCount, setCommentCount] = useState(null);
  const reactionEnabled = Boolean(report) && readLogbookLikeCount(report) != null;
  const { resolveLike, toggleLike } = useLogbookLikes(report ? [report] : [], reactionEnabled);

  const handleBack = useCallback(() => {
    navigateAppBack(navigate, { fallback: '/blog' });
  }, [navigate]);

  useEffect(() => {
    const fetchPublicReport = async () => {
      if (!id && !editorialSlug) {
        navigate('/', { replace: true });
        return;
      }

      let query = supabase.from('reports').select('*').neq('is_deleted', true);

      if (editorialSlug) {
        query = query
          .eq('is_editorial', true)
          .eq('slug', editorialSlug)
          .eq('status', 'published');
      } else {
        query = query.eq('id', id).eq('is_public', true);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.warn('[Safe Path] 비공개되었거나 존재하지 않는 기록 접근 차단');
        setErrorMsg(t('logbook.public.notFound'));
        setAuthorLabel('');
        setReport(null);
        return;
      }

      if (isEditorialLogbook(data) && !isEditorialLogbookPublished(data)) {
        setErrorMsg(t('logbook.public.notFound'));
        setReport(null);
        return;
      }

      setReport(data);
      setSeenCount(null);
      setPlaceCount(null);
      setCommentCount(readLogbookCommentCount(data));
      setErrorMsg('');
      recordPublicRead(data.id, setSeenCount);

      if (isEditorialLogbook(data)) {
        setAuthorLabel('');
        setAuthorAvatar('');
        setAuthorPhotos([]);
        return;
      }

      let displayName = '';
      let photos = [];
      if (data.user_id) {
        const profiles = await fetchAuthorProfiles([data.user_id]);
        const prof = profiles.get(data.user_id);
        displayName = prof?.display_name || '';
        photos = publicProfilePhotos(prof);
      }
      setAuthorLabel(reportAuthorLabel(data.user_id, displayName));
      setAuthorPhotos(photos);
      setAuthorAvatar(photos[0] || '');
    };
    void fetchPublicReport();
  }, [id, editorialSlug, navigate]);

  useEffect(() => {
    if (!report?.location) return undefined;
    let cancelled = false;
    void fetchSamePlaceCount(supabase, { location: report.location }).then((count) => {
      if (!cancelled) setPlaceCount(count);
    });
    return () => {
      cancelled = true;
    };
  }, [report]);

  const pageUrl = useMemo(() => {
    if (!report) return '';
    if (isEditorialLogbook(report) && report.slug) {
      return `https://www.gateo.kr/blog/e/${report.slug}`;
    }
    return `${window.location.origin}/p/${report.id}`;
  }, [report]);

  const editorialJsonLd = useMemo(
    () => (report && isEditorialLogbook(report) ? buildEditorialLogbookJsonLd(report, pageUrl) : null),
    [report, pageUrl],
  );

  useEffect(() => {
    upsertEditorialJsonLd(editorialJsonLd);
    return () => {
      document.querySelector(`script[data-schema-type="${SCHEMA_TYPE}"]`)?.remove();
    };
  }, [editorialJsonLd]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center text-gray-500">
        <Compass size={48} className="mb-4 text-gray-400" />
        <p className="text-xl font-bold mb-6 text-gray-800">{errorMsg}</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors border border-blue-200 bg-blue-50 px-6 py-2 rounded-full">
          <Home size={16} /> {t('logbook.public.goHome')}
        </button>
      </div>
    );
  }

  if (!report) return <div className="min-h-screen bg-white flex justify-center items-center text-gray-400 animate-pulse">{t('logbook.common.loadingFragments')}</div>;

  const editorial = isEditorialLogbook(report);
  const imageUrls = logbookImageUrlList(report.images);
  const heroImageUrl = logbookHeroImageUrl(report.images, { thumbnail: true });
  const hasPlaceholders = contentHasLogbookPhotoPlaceholders(report.content);
  const displayDate = formatLogbookDisplayDate(report);
  const showDecorativeHeroBlur = Boolean(heroImageUrl && !editorial);
  const readingMinutes = logbookReadingMinutes(report.content);
  const viewCount = seenCount ?? readLogbookViewCount(report);
  const placeKey = logbookPlaceKey(report.location);
  const placeHref = placeKey ? `/blog?tab=public&location=${encodeURIComponent(placeKey)}` : '';
  const likeState = resolveLike(report);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-hidden pb-20 font-sans">
      {editorial ? (
        <SEO
          title={report.title}
          description={report.disclosure_badge || undefined}
          url={report.slug ? `/blog/e/${report.slug}` : `/p/${report.id}`}
          image={heroImageUrl}
          type="article"
        />
      ) : (
        <Helmet>
          <link rel="canonical" href={pageUrl} />
        </Helmet>
      )}

      <AppOutlineBackButton
        onClick={handleBack}
        ariaLabel={t('logbook.public.backTitle')}
        title={t('logbook.public.backTitle')}
      />

      {showDecorativeHeroBlur && (
        <div className="absolute inset-0 z-0 opacity-10 transition-opacity duration-700 pointer-events-none hidden md:block" aria-hidden>
          <img
            src={heroImageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover blur-3xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/80 to-white"></div>
        </div>
      )}

      <div
        className={`relative z-10 max-w-3xl mx-auto ${
          editorial ? 'pt-6 sm:pt-12 px-5 sm:px-6' : 'pt-12 px-4 sm:px-6'
        }`}
      >
        <div
          className={
            editorial
              ? 'bg-white sm:bg-white/60 sm:backdrop-blur-xl border-0 sm:border sm:border-gray-200/90 p-0 sm:p-10 rounded-none sm:rounded-3xl shadow-none sm:shadow-sm mt-0 sm:mt-8'
              : 'bg-white/60 backdrop-blur-xl border border-gray-200 p-6 sm:p-10 rounded-3xl shadow-sm mt-8'
          }
        >
          {editorial ? (
            <div className="mb-3">
              <EditorialLogbookBadge report={report} variant="detail" />
            </div>
          ) : null}

          <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 ${editorial ? 'mb-4 sm:mb-6' : 'mb-6'}`}>
            <span
              className={
                editorial
                  ? 'text-[11px] text-gray-500 font-medium tracking-wide'
                  : 'text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full uppercase tracking-wider'
              }
            >
              {displayDate}
            </span>
            <span className="text-gray-500 text-sm flex items-center gap-1 font-medium">
              <MapPin size={14} className="text-gray-400" /> {report.location}
            </span>
            {!editorial && authorLabel && (
              authorAvatar ? (
                <button
                  type="button"
                  onClick={() => setAuthorPhotoOpen(true)}
                  className="text-gray-500 text-sm flex items-center gap-1.5 font-medium min-w-0"
                  aria-label={t('authPage.account.viewPhoto', { name: authorLabel })}
                >
                  <img src={authorAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  <span className="truncate max-w-[min(100%,220px)]" title={report.user_id || ''}>{authorLabel}</span>
                </button>
              ) : (
                <span className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                  <User size={14} className="text-gray-400 shrink-0" />
                  <span className="truncate max-w-[min(100%,220px)]" title={report.user_id || ''}>{authorLabel}</span>
                </span>
              )
            )}
            <LogbookReadFacts
              tone="article"
              minutes={readingMinutes}
              placeCount={placeCount}
              viewCount={viewCount}
              placeHref={placeHref}
            />
            <LogbookReactionSlot
              tone="article"
              likeCount={likeState.likeCount}
              commentCount={commentCount}
              liked={likeState.liked}
              pending={likeState.pending}
              commentHref={logbookCommentsHref(publicLogbookDetailPath(report))}
              onToggleLike={() => toggleLike(report)}
            />
          </div>

          <LogbookArticleHead report={report} readerDek={editorial} />

          {!hasPlaceholders && imageUrls.length > 0 && (
            <div
              className={`mb-8 sm:mb-10 grid gap-3 sm:gap-4 ${
                editorial ? 'rounded-xl overflow-hidden' : 'rounded-2xl overflow-hidden'
              } ${imageUrls.length === 1 ? 'grid-cols-1' : ''} ${imageUrls.length === 2 ? 'grid-cols-2' : ''} ${imageUrls.length === 3 ? 'grid-cols-3' : ''} ${imageUrls.length >= 4 ? 'grid-cols-2' : ''}`}
            >
              {imageUrls.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className={`${editorial ? 'flex flex-col gap-1.5' : 'relative group'} ${
                    imageUrls.length === 1 ? (editorial ? '' : 'aspect-video') : editorial ? '' : 'aspect-square'
                  }`}
                >
                  <div
                    className={
                      editorial
                        ? `overflow-hidden rounded-xl border border-gray-100 ${
                            imageUrls.length === 1 ? 'aspect-video' : 'aspect-square'
                          }`
                        : 'relative w-full h-full'
                    }
                  >
                    <img
                      src={imgUrl}
                      alt={t('logbook.common.attachment', { n: idx + 1 })}
                      loading="lazy"
                      decoding="async"
                      className={`w-full h-full object-cover ${editorial ? '' : 'border border-gray-200'}`}
                    />
                  </div>
                  {editorial && report.images?.[idx] ? (
                    <EditorialLogbookImageCredits images={[report.images[idx]]} className="px-0.5" />
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className={editorial ? 'mt-2 sm:mt-8' : 'mt-8'}>
            <LogbookBody
              content={report.content}
              images={report.images || []}
              imageFrameClass={
                editorial
                  ? 'my-8 group relative rounded-xl overflow-hidden border border-gray-100'
                  : 'my-10 group relative rounded-2xl overflow-hidden shadow-sm border border-gray-200'
              }
              imageClass="w-full h-auto object-cover rounded-xl"
              imageMaxWidth={1200}
              showImageOverlay={false}
              showEditorialImageCredits={editorial}
              readerTypography={editorial}
            />
          </div>

          {editorial && !hasPlaceholders && report.images?.length ? (
            <EditorialLogbookImageCredits images={report.images} className="mt-6 border-t border-gray-100 pt-4" />
          ) : null}

          <LogbookComments report={report} onCountChange={setCommentCount} />

          <div className="mt-16 pt-8 border-t border-gray-200 text-center flex flex-col items-center">
            <p className="text-gray-500 text-sm font-medium mb-6">{t('logbook.public.ctaBody')}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/blog')}
                className="inline-flex items-center justify-center gap-2 text-sm font-bold text-white transition-all bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-full shadow-md hover:shadow-lg"
              >
                <PenTool size={16} /> {t('logbook.public.writeCta')}
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 px-6 py-2.5 rounded-full border border-gray-300 shadow-sm"
              >
                <Compass size={16} /> {t('logbook.public.exploreCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
      {authorPhotoOpen && authorAvatar ? (
        <ProfilePhotoLightbox
          src={authorAvatar}
          photos={authorPhotos}
          name={authorLabel}
          onClose={() => setAuthorPhotoOpen(false)}
        />
      ) : null}
    </div>
  );
};

export default PublicViewer;
