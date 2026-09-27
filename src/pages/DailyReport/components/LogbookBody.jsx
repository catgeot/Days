import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { useTranslation } from 'react-i18next';
import {
  parseLogbookPhotoIndex,
  splitLogbookPhotoPlaceholders,
} from '../utils/logbookMarkdownSnippet.js';
import { resolveLogbookDisplaySrc } from '../../../utils/logbookImageSrc.js';
import EditorialLogbookImageCredits from './EditorialLogbookImageCredits.jsx';

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
    img: [...(defaultSchema.attributes?.img || []), 'loading', 'decoding'],
  },
};

function createMarkdownComponents(readerTypography) {
  if (readerTypography) {
    return {
      h1: ({ children }) => (
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mt-12 mb-4 tracking-tight break-keep">
          {children}
        </h2>
      ),
      h2: ({ children }) => (
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mt-11 mb-3 tracking-tight break-keep">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mt-9 mb-2.5 break-keep">{children}</h3>
      ),
      p: ({ children }) => (
        <p className="text-base sm:text-[17px] leading-[1.8] text-gray-800 font-normal mb-7 last:mb-0 break-keep">
          {children}
        </p>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-700 break-words"
        >
          {children}
        </a>
      ),
      strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
      hr: () => <hr className="my-10 border-0 border-t border-gray-100" />,
      ul: ({ children }) => (
        <ul className="list-disc pl-5 mb-7 space-y-2.5 text-base sm:text-[17px] text-gray-800 leading-[1.75] break-keep">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="list-decimal pl-5 mb-7 space-y-2.5 text-base sm:text-[17px] text-gray-800 leading-[1.75] break-keep">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-[1.75]">{children}</li>,
      blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-gray-200 pl-4 my-8 text-gray-600 italic">{children}</blockquote>
      ),
      img: ({ src, alt }) => (
        <span className="block my-8">
          <img
            src={src}
            alt={alt || ''}
            loading="lazy"
            decoding="async"
            className="w-full h-auto rounded-xl border border-gray-100"
          />
        </span>
      ),
      code: ({ className, children }) => {
        const isBlock = className?.includes('language-');
        if (isBlock) {
          return (
            <pre className="my-6 p-4 rounded-xl bg-gray-50 border border-gray-100 overflow-x-auto text-sm">
              <code>{children}</code>
            </pre>
          );
        }
        return (
          <code className="px-1.5 py-0.5 rounded bg-gray-100 text-sm font-mono text-gray-800">{children}</code>
        );
      },
    };
  }

  return {
    h1: ({ children }) => (
      <h2 className="text-3xl font-bold text-gray-900 mt-10 mb-5 tracking-tight">{children}</h2>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 tracking-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-lg leading-[1.8] text-gray-800 font-medium mb-6 last:mb-0">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline underline-offset-2 hover:text-blue-700 break-words"
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className="my-8 border-0 border-t border-gray-200" />,
    ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-lg text-gray-800">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-lg text-gray-800">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-200 pl-4 my-6 text-gray-600 italic bg-slate-50/80 py-3 pr-3 rounded-r-lg">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }) => (
      <span className="block my-10">
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          className="w-full h-auto rounded-2xl border border-gray-200 shadow-sm"
        />
      </span>
    ),
    code: ({ className, children }) => {
      const isBlock = className?.includes('language-');
      if (isBlock) {
        return (
          <pre className="my-6 p-4 rounded-xl bg-gray-100 border border-gray-200 overflow-x-auto text-sm">
            <code>{children}</code>
          </pre>
        );
      }
      return (
        <code className="px-1.5 py-0.5 rounded bg-gray-100 text-sm font-mono text-gray-800">{children}</code>
      );
    },
  };
}

function LogbookMarkdownChunk({ markdown, readerTypography = false }) {
  const trimmed = markdown?.trim();
  if (!trimmed) return null;

  const components = useMemo(
    () => createMarkdownComponents(readerTypography),
    [readerTypography],
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
      components={components}
    >
      {trimmed}
    </ReactMarkdown>
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
          <LogbookMarkdownChunk
            key={`md-${index}`}
            markdown={part}
            readerTypography={readerTypography}
          />
        );
      })}
    </div>
  );
}

export { LogbookMarkdownChunk };
