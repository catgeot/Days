import React, { lazy, Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  parseLogbookPhotoIndex,
  splitLogbookPhotoPlaceholders,
} from '../utils/logbookMarkdownSnippet.js';
import { resolveLogbookDisplaySrc } from '../../../utils/logbookImageSrc.js';
import EditorialLogbookImageCredits from './EditorialLogbookImageCredits.jsx';

const LazyLogbookMarkdownChunk = lazy(() =>
  import('./LogbookMarkdownChunk.jsx').then((m) => ({ default: m.LogbookMarkdownChunk })),
);

function LogbookMarkdownFallback({ readerTypography }) {
  return (
    <div
      className={`min-h-[4.5rem] rounded-lg bg-gray-100/70 animate-pulse ${
        readerTypography ? 'mb-7' : 'mb-6'
      }`}
      aria-hidden="true"
    />
  );
}

export default function LogbookBody({
  content,
  images = [],
  imageFrameClass = 'my-10 group relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50',
  imageClass = 'w-full h-auto object-cover hover:scale-105 transition-transform duration-700 cursor-pointer',
  showImageOverlay = true,
  showEditorialImageCredits = false,
  imageMaxWidth = 1200,
  readerTypography = false,
}) {
  const { t } = useTranslation();
  const parts = useMemo(() => splitLogbookPhotoPlaceholders(content), [content]);

  const inlineImageFrameClass =
    readerTypography && imageFrameClass.includes('my-10')
      ? imageFrameClass.replace(/\bmy-10\b/, 'my-8')
      : imageFrameClass;

  if (!content?.trim()) return null;

  return (
    <div className={`logbook-body min-w-0 ${readerTypography ? 'break-keep' : ''}`}>
      {parts.map((part, index) => {
        const photoIndex = parseLogbookPhotoIndex(part);
        if (photoIndex !== null) {
          const img = images[photoIndex];
          const url = resolveLogbookDisplaySrc(img, { maxWidth: imageMaxWidth });
          if (!url) return null;
          return (
            <div key={`photo-${index}`} className={inlineImageFrameClass}>
              <img
                src={url}
                alt={t('logbook.common.attachment', { n: photoIndex + 1 })}
                className={imageClass}
                loading="lazy"
                decoding="async"
                onClick={() => window.open(url, '_blank')}
              />
              {showImageOverlay && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
              )}
              {showEditorialImageCredits ? (
                <EditorialLogbookImageCredits images={[img]} className="mt-2 px-0.5" />
              ) : null}
            </div>
          );
        }
        return (
          <Suspense
            key={`md-${index}`}
            fallback={<LogbookMarkdownFallback readerTypography={readerTypography} />}
          >
            <LazyLogbookMarkdownChunk markdown={part} readerTypography={readerTypography} />
          </Suspense>
        );
      })}
    </div>
  );
}
