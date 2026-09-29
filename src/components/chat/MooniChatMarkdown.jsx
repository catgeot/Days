import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { mooniChatMarkdownSanitizeSchema } from './mooniChatMarkdownSchema.js';

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
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {children}
      </a>
    ),
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
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, mooniChatMarkdownSanitizeSchema]]}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
