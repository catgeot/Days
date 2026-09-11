import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink, MapPin, Play, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  buildWorldEventSearchQuery,
  buildWorldEventYoutubeSearchQuery,
  getWorldEventHubAttractions,
  getWorldEventYoutubeVideos,
} from '../../utils/worldEventMedia';
import { fetchWorldEventVideos } from '../../utils/fetchWorldEventVideos';
import {
  googleWebSearchUrl,
  naverWebSearchUrl,
  youtubeWebSearchUrl,
} from '../../utils/worldEventOutboundLinks';

/**
 * @param {{ event: import('../../utils/worldEvents').WorldEvent, locale?: string }} props
 */
export default function EventDetailMediaSection({ event, locale = 'ko' }) {
  const { t } = useTranslation();
  const searchQuery = buildWorldEventSearchQuery(event, locale);
  const googleHref = googleWebSearchUrl(searchQuery, locale);
  const naverHref = locale === 'ko' ? naverWebSearchUrl(searchQuery) : '';
  const youtubeSearchQuery = buildWorldEventYoutubeSearchQuery(event, locale);
  const youtubeSearchHref = youtubeWebSearchUrl(youtubeSearchQuery, locale);
  const staticYoutubeVideos = useMemo(
    () => getWorldEventYoutubeVideos(event, locale),
    [event, locale],
  );
  const { hub, attractions } = getWorldEventHubAttractions(event, { locale });

  const [videos, setVideos] = useState(staticYoutubeVideos);
  const [videosLoading, setVideosLoading] = useState(false);

  useEffect(() => {
    setVideos(staticYoutubeVideos);
  }, [event.id, staticYoutubeVideos]);

  useEffect(() => {
    let cancelled = false;
    setVideosLoading(true);

    fetchWorldEventVideos(event, locale).then((result) => {
      if (cancelled) return;
      if (result.ok && result.videos.length > 0) {
        setVideos(result.videos);
      }
      setVideosLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [event, locale]);

  const hasSearch = Boolean(googleHref || naverHref);
  const hasYoutube = videos.length > 0;
  const hasAttractions = attractions.length > 0;

  if (!hasSearch && !hasYoutube && !hasAttractions) return null;

  return (
    <div className="mt-4 space-y-4">
      {hasSearch ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
            <Search size={15} className="text-amber-700" aria-hidden />
            {t('worldEventDetail.media.searchTitle')}
          </h2>
          <p className="mt-1 text-xs text-stone-500">{t('worldEventDetail.media.searchHint')}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {naverHref ? (
              <a
                href={naverHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-amber-300 hover:bg-amber-50"
              >
                {t('worldEventDetail.media.naverSearch')}
                <ExternalLink size={10} className="opacity-60" aria-hidden />
              </a>
            ) : null}
            {googleHref ? (
              <a
                href={googleHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-amber-300 hover:bg-amber-50"
              >
                {t('worldEventDetail.media.googleSearch')}
                <ExternalLink size={10} className="opacity-60" aria-hidden />
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasYoutube ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
            <Play size={15} className="text-amber-700" aria-hidden />
            {t('worldEventDetail.media.youtubeTitle')}
          </h2>
          {videosLoading && videos.length <= staticYoutubeVideos.length ? (
            <p className="mt-2 text-xs text-stone-500">{t('worldEventDetail.media.youtubeLoading')}</p>
          ) : null}
          <div className="mt-3 max-h-[min(28rem,52dvh)] overflow-y-auto overscroll-contain pr-0.5 [-ms-overflow-style:auto] [scrollbar-width:thin]">
            <div className="grid gap-3 sm:grid-cols-2">
            {videos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-xl border border-stone-100 bg-stone-50 hover:border-amber-300 hover:bg-amber-50/40"
              >
                <div className="relative aspect-video overflow-hidden bg-stone-200">
                  <img
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt=""
                    className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">
                      <Play size={16} className="ml-0.5" aria-hidden />
                    </span>
                  </span>
                </div>
                <p className="px-3 py-2 text-xs font-bold leading-snug text-stone-800">
                  {video.title}
                </p>
              </a>
            ))}
            </div>
          </div>
          {youtubeSearchHref ? (
            <div className="mt-3">
              <a
                href={youtubeSearchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-bold text-stone-800 hover:border-amber-300 hover:bg-amber-50"
              >
                {t('worldEventDetail.media.youtubeSearch')}
                <ExternalLink size={10} className="opacity-60" aria-hidden />
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      {hasAttractions ? (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-stone-900">
              <MapPin size={15} className="text-amber-700" aria-hidden />
              {t('worldEventDetail.media.attractionsTitle', { city: hub?.label || '' })}
            </h2>
            {hub?.href ? (
              <Link
                to={hub.href}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900"
              >
                {t('worldEventDetail.media.attractionsHubCta', { city: hub.label })}
                <ExternalLink size={10} aria-hidden />
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-500">{t('worldEventDetail.media.attractionsHint')}</p>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {attractions.map((attraction) => (
              <Link
                key={attraction.id}
                to={attraction.href}
                className="inline-flex min-w-[9.5rem] shrink-0 flex-col rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5 hover:border-amber-300 hover:bg-amber-50/50"
              >
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  {attraction.kindLabel}
                </span>
                <span className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-stone-900">
                  {attraction.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
