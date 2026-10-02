import React, { lazy, Suspense } from 'react';
import { ReviewPlainFallbackBoundary } from './ReviewPlainFallbackBoundary.jsx';

const ReviewInlineMarkdownBoundary = lazy(() =>
  import('./ReviewInlineMarkdown.jsx').then((mod) => ({
    default: mod.ReviewInlineMarkdownBoundary,
  })),
);

/**
 * Editorial review text. Suspense and error fallbacks use the same raw string as plain reviews.
 */
export function EditorialReviewText({ text, inline = false, className = '' }) {
  const plainClass = ['whitespace-pre-wrap', className].filter(Boolean).join(' ');
  const plain = <div className={plainClass}>{text}</div>;
  return (
    <ReviewPlainFallbackBoundary text={text} className={plainClass}>
      <Suspense fallback={plain}>
        <ReviewInlineMarkdownBoundary text={text} inline={inline} />
      </Suspense>
    </ReviewPlainFallbackBoundary>
  );
}
