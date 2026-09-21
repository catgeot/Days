import React, { useMemo } from 'react';
import { splitTourApiDetailParagraphs } from './splitTourApiDetailParagraphs';

const BODY_CLASS =
  'text-[14px] md:text-[15px] leading-[1.85] tracking-[0.01em] text-stone-700 font-normal break-keep break-words';

export default function ReadableDetailProse({ text, className = '', textProps = {} }) {
  const paragraphs = useMemo(() => splitTourApiDetailParagraphs(text), [text]);

  if (!paragraphs.length) return null;

  return (
    <div className={`space-y-3 min-w-0 max-w-full ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`readable-p-${index}`} className={BODY_CLASS} {...textProps}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
