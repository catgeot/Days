import React, { useMemo } from 'react';
import { splitTourApiDetailParagraphs } from './splitTourApiDetailParagraphs.js';

const VARIANT_CLASS = {
  body: 'text-[14px] md:text-[15px] leading-[1.85] tracking-[0.01em] text-stone-700 font-normal break-keep break-words',
  overview:
    'text-[15px] md:text-[16px] leading-[1.92] tracking-[0.015em] text-stone-800 font-normal break-keep break-words',
};

const VARIANT_GAP = {
  body: 'space-y-3',
  overview: 'space-y-4',
};

export default function ReadableDetailProse({
  text,
  className = '',
  textProps = {},
  variant = 'body',
}) {
  const paragraphs = useMemo(() => splitTourApiDetailParagraphs(text), [text]);
  const typeClass = VARIANT_CLASS[variant] || VARIANT_CLASS.body;
  const gapClass = VARIANT_GAP[variant] || VARIANT_GAP.body;

  if (!paragraphs.length) return null;

  return (
    <div className={`${gapClass} min-w-0 max-w-full ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`readable-p-${index}`} className={typeClass} {...textProps}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
