import { createElement, useCallback, useLayoutEffect, useState } from 'react';
import { FestivalDetailPhotoFallback } from './festivalListThumbBox.jsx';
import { FestivalPhotoFrame } from './festivalPhotoFrame';

/** Strip opens only after two photos decode. URL count never opens it. */
export function festivalHeroStripMode(loadedCount, detailLoading, urlCount) {
  if (loadedCount > 1) return 'open';
  if (detailLoading && urlCount <= 1) return 'reserve';
  return 'collapsed';
}

export function useFestivalHeroThumbs(urls) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const key = list.join('\n');
  const [state, setState] = useState(() => ({
    key,
    loaded: new Set(),
    failed: new Set(),
  }));

  if (state.key !== key) {
    setState({ key, loaded: new Set(), failed: new Set() });
  }

  const current = state.key === key ? state : { key, loaded: new Set(), failed: new Set() };

  const markLoaded = useCallback((url) => {
    setState((prev) => {
      if (prev.loaded.has(url) && !prev.failed.has(url)) return prev;
      const loaded = new Set(prev.loaded);
      loaded.add(url);
      const failed = new Set(prev.failed);
      failed.delete(url);
      return { ...prev, loaded, failed };
    });
  }, []);

  const markFailed = useCallback((url) => {
    setState((prev) => {
      if (prev.failed.has(url) && !prev.loaded.has(url)) return prev;
      const failed = new Set(prev.failed);
      failed.add(url);
      const loaded = new Set(prev.loaded);
      loaded.delete(url);
      return { ...prev, loaded, failed };
    });
  }, []);

  const loadedUrls = list.filter((url) => current.loaded.has(url) && !current.failed.has(url));
  const pendingUrls = list.filter((url) => !current.loaded.has(url) && !current.failed.has(url));

  return {
    loadedUrls,
    pendingUrls,
    loadedCount: loadedUrls.length,
    markLoaded,
    markFailed,
  };
}

/**
 * Hidden eager probes settle each URL. Failed URLs drop out; the row renders
 * only photos that decoded, and only when at least two did.
 */
export function FestivalHeroThumbStrip({
  urls,
  detailLoading = false,
  activeIndex = 0,
  onSelect,
  onOpen,
  resolveSrc = (url) => url,
  photosAria = '',
  onStripChange,
}) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const { loadedUrls, pendingUrls, loadedCount, markLoaded, markFailed } = useFestivalHeroThumbs(list);
  const mode = festivalHeroStripMode(loadedCount, detailLoading, list.length);
  const signature = `${mode}\n${loadedUrls.join('\n')}`;

  useLayoutEffect(() => {
    if (onStripChange) onStripChange({ mode, loadedCount, loadedUrls });
  }, [signature]);

  return createElement(
    'div',
    {
      className: 'contents',
      'data-festival-hero-thumbs': '',
      'data-festival-photo-strip': mode,
    },
    pendingUrls.length
      ? createElement(
          'div',
          {
            'data-festival-photo-probes': '',
            className: 'pointer-events-none absolute h-px w-px overflow-hidden opacity-0',
            'aria-hidden': 'true',
          },
          pendingUrls.map((url) =>
            createElement(FestivalPhotoFrame, {
              key: url,
              src: resolveSrc(url),
              alt: '',
              loading: 'eager',
              decoding: 'async',
              className: 'h-px w-px',
              onLoaded: () => markLoaded(url),
              onFailed: () => markFailed(url),
            }),
          ),
        )
      : null,
    mode === 'open'
      ? createElement(
          'div',
          {
            className:
              'flex gap-2 overflow-x-auto px-4 md:px-4 py-2.5 md:py-3 border-b border-stone-100 md:border-b-0 md:border-t md:border-stone-200/80 bg-white md:bg-stone-50 custom-scrollbar',
            role: 'listbox',
            'aria-label': photosAria,
          },
          loadedUrls.map((url) => {
            const index = list.indexOf(url);
            const selected = index === activeIndex;
            return createElement(
              'button',
              {
                key: url,
                type: 'button',
                role: 'option',
                'aria-selected': selected ? 'true' : 'false',
                onClick: () => onSelect?.(index),
                onDoubleClick: () => {
                  onSelect?.(index);
                  onOpen?.(index);
                },
                className: [
                  'relative h-14 w-14 md:h-16 md:w-16 shrink-0 overflow-hidden rounded-xl border bg-stone-200 transition-colors',
                  selected
                    ? 'border-amber-500 ring-2 ring-amber-200'
                    : 'border-stone-200 opacity-85 hover:opacity-100',
                ].join(' '),
              },
              createElement(FestivalPhotoFrame, {
                src: resolveSrc(url),
                alt: '',
                className: 'absolute inset-0 h-full w-full object-cover',
                fallback: createElement(FestivalDetailPhotoFallback, { size: 'sm' }),
                onFailed: () => markFailed(url),
              }),
            );
          }),
        )
      : null,
  );
}
