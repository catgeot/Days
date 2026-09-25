import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../shared/api/supabase';
import { MapPin, Home, Compass, PenTool, ArrowLeft, User } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { reportAuthorLabel } from './utils/reportAuthor';
import LogbookBody from './components/LogbookBody';
import EditorialLogbookBadge from './components/EditorialLogbookBadge';
import EditorialLogbookImageCredits from './components/EditorialLogbookImageCredits';
import { contentHasLogbookPhotoPlaceholders } from './utils/logbookMarkdownSnippet';
import { isEditorialLogbook, isEditorialLogbookPublished } from '../../utils/logbookEditorial';
import { logbookHeroImageUrl, logbookImageUrlList } from '../../utils/logbookImageSrc';
import { formatLogbookDisplayDate } from '../../utils/logbookDisplayDate';
import LogbookArticleHead from './components/LogbookArticleHead';
import { buildEditorialLogbookJsonLd } from './lib/logbookEditorialJsonLd';
import SEO from '../../components/SEO';

const SCHEMA_TYPE = 'EditorialLogbookArticle';

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
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('');

      if (isEditorialLogbook(data)) {
        setAuthorLabel('');
        return;
      }

      let displayName = '';
      if (data.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', data.user_id)
          .maybeSingle();
        displayName = prof?.display_name || '';
      }
      setAuthorLabel(reportAuthorLabel(data.user_id, displayName));
    };
    void fetchPublicReport();
  }, [id, editorialSlug, navigate]);

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

      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 sm:top-8 sm:left-8 z-50 flex items-center justify-center w-12 h-12 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full shadow-md backdrop-blur-md transition-all hover:scale-105 border border-gray-200"
        title={t('logbook.public.backTitle')}
      >
        <ArrowLeft size={24} strokeWidth={2.5} />
      </button>

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
              <span className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                <User size={14} className="text-gray-400 shrink-0" />
                <span className="truncate max-w-[min(100%,220px)]" title={report.user_id || ''}>{authorLabel}</span>
              </span>
            )}
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
    </div>
  );
};

export default PublicViewer;
