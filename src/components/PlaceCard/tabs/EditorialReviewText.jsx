import React, { lazy, Suspense } from 'react';
import { reviewPlainTextForAccessibility } from '../../../utils/reviewPlainTextAccessibility.jsx';
import { ReviewPlainFallbackBoundary } from './ReviewPlainFallbackBoundary.jsx';

const ReviewInlineMarkdownBoundary = lazy(() =>
  import('./ReviewInlineMarkdown.jsx').then((mod) => ({
    default: mod.ReviewInlineMarkdownBoundary,
  })),
);

/** Suspense/error fallbacks use stripped plain text (not markdown source). */
export function EditorialReviewText({ text, inline = false, className = '' }) {
  const plainClass = ['whitespace-pre-wrap', className].filter(Boolean).join(' ');
  const plainText = reviewPlainTextForAccessibility(text, { inline });
  const plain = <div className={plainClass}>{plainText}</div>;
  return (
    <ReviewPlainFallbackBoundary text={plainText} className={plainClass}>
      <Suspense fallback={plain}>
        <div className={plainClass}>
          <ReviewInlineMarkdownBoundary text={text} inline={inline} />
        </div>
      </Suspense>
    </ReviewPlainFallbackBoundary>
  );
}
