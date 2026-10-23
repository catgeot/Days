import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReviewInlineMarkdown from '../components/PlaceCard/tabs/ReviewInlineMarkdown.jsx';
import { plainTextFromReviewMarkdownHtml, stripReviewInlineMarkdown } from './reviewInlineMarkdown.js';

/**
 * Plain text for a11y / fallbacks / line-clamp sources — prefers rendered markdown textContent.
 */
export function reviewPlainTextForAccessibility(text, { inline = true } = {}) {
  const raw = String(text ?? '');
  if (!raw.trim()) return '';

  try {
    const html = renderToStaticMarkup(
      React.createElement(ReviewInlineMarkdown, { text: raw, inline }),
    );
    const fromRender = plainTextFromReviewMarkdownHtml(html);
    if (fromRender.trim()) return fromRender;
  } catch {
    // fall through to strip
  }

  return stripReviewInlineMarkdown(raw);
}
