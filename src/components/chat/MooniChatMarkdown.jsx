import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';
import rehypeSanitize from 'rehype-sanitize';
import mooniRemarkGfm from './mooniRemarkGfm.js';
import { mooniChatMarkdownSanitizeSchema } from './mooniChatMarkdownSchema.js';
import {
  isUnsafeMooniLinkUrl,
  shouldStripMooniMarkdownLink,
} from '../../utils/mooniPlaceholderUrls.js';
import { mooniMarkdownLinkLabelText } from './mooniMarkdownLinkLabel.js';
import {
  FESTIVAL_LODGING_EVENT,
  festivalLodgingContentIdFromHref,
} from '../../shared/korea/mooniKoreaFestivalAssist.js';

function mooniChatUrlTransform(url) {
  const value = String(url).trim();
  if (isUnsafeMooniLinkUrl(value)) return '';
  if (value.startsWith('https://') || value.startsWith('http://')) return value;
  return '';
}

const headingClass =
  'text-[1.0625rem] font-bold leading-snug mt-3 mb-1.5 first:mt-0 break-keep';

function createMooniMarkdownComponents(variant) {
  const isDark = variant === 'dark';
  const linkClass = isDark
    ? 'text-blue-400 hover:text-blue-300 underline underline-offset-2 break-words'
    : 'text-blue-600 hover:text-blue-700 underline underline-offset-2 break-words';
  const hrClass = isDark ? 'my-3 border-0 border-t border-gray-600/80' : 'my-3 border-0 border-t border-cyan-200';
  const listClass = isDark ? 'text-gray-200' : 'text-slate-700';

  const Heading = ({ children }) => <p className={headingClass}>{children}</p>;

  return {
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: Heading,
    p: ({ children }) => (
      <p className="mb-2 last:mb-0 leading-relaxed break-keep">{children}</p>
    ),
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    hr: () => <hr className={hrClass} />,
    ul: ({ children }) => (
      <ul className={`list-disc pl-5 mb-2 space-y-1.5 last:mb-0 ${listClass}`}>{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className={`list-decimal pl-5 mb-2 space-y-1.5 last:mb-0 ${listClass}`}>{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed break-keep">{children}</li>,
    a: ({ href, children }) => {
      const label = mooniMarkdownLinkLabelText(children);
      if (!href || shouldStripMooniMarkdownLink(href, label)) {
        return <span className="break-keep">{children}</span>;
      }
      const lodgingId = festivalLodgingContentIdFromHref(href);
      const here = typeof window !== 'undefined' ? window.location : null;
      const sameFestival =
        lodgingId &&
        here &&
        String(here.pathname || '').replace(/\/$/, '').endsWith('/korea') &&
        new URLSearchParams(here.search || '').get('festival') === lodgingId;
      return (
        <a
          href={href}
          target={sameFestival ? undefined : '_blank'}
          rel={sameFestival ? undefined : 'noopener noreferrer'}
          className={linkClass}
          onClick={
            sameFestival
              ? (event) => {
                  event.preventDefault();
                  window.dispatchEvent(
                    new CustomEvent(FESTIVAL_LODGING_EVENT, { detail: { contentId: lodgingId } }),
                  );
                }
              : undefined
          }
        >
          {children}
        </a>
      );
    },
  };
}

/**
 * @param {{ text: string, variant?: 'dark' | 'light' }} props
 */
export default function MooniChatMarkdown({ text, variant = 'dark' }) {
  const markdown = typeof text === 'string' ? text : '';
  const components = useMemo(() => createMooniMarkdownComponents(variant), [variant]);

  if (!markdown) return null;

  return (
    <div className="mooni-chat-markdown min-w-0 break-words">
      <ReactMarkdown
        remarkPlugins={[mooniRemarkGfm, remarkCjkFriendly]}
        rehypePlugins={[[rehypeSanitize, mooniChatMarkdownSanitizeSchema]]}
        urlTransform={mooniChatUrlTransform}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
