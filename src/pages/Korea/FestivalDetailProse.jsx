import React, { useMemo } from 'react';
import { splitFestivalDetailParagraphs } from './festivalDetailText';

const BODY_CLASS =
  'text-[14px] md:text-[15px] leading-[1.85] tracking-[0.01em] text-stone-700 font-normal break-keep';

export default function FestivalDetailProse({ text, className = '' }) {
  const paragraphs = useMemo(() => splitFestivalDetailParagraphs(text), [text]);

  if (!paragraphs.length) return null;

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`fest-p-${index}`} className={BODY_CLASS}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
