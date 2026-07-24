import React, { useMemo } from 'react';
import { splitOverviewParagraphs } from './placeOverviewText';

const VARIANT_CLASS = {
  /** 확장 카드 우측 PLACE_OVERVIEW 본문 */
  body: 'text-[15px] md:text-[15px] leading-[1.85] tracking-[0.01em] text-gray-200/95 font-normal break-keep',
  /** 큐레이션(보라) 박스 안 */
  curation:
    'text-[14px] md:text-[14px] leading-[1.8] tracking-[0.01em] text-violet-50/95 font-normal break-keep',
  /** 모바일 갤러리 상단 overview 카드 */
  mobile:
    'text-[14px] leading-[1.8] tracking-[0.01em] text-gray-100/95 font-normal break-keep',
  /** 매거진 생성 전 intro placeholder — 대제목급 시인성 */
  lede: 'text-[18px] md:text-[22px] leading-[1.7] tracking-[-0.01em] text-amber-50/95 font-semibold break-keep',
};

/**
 * 장소 써머리 — 문장 단위 문단 + 한글 break-keep·자간·행간.
 */
export default function PlaceOverviewProse({
  text,
  variant = 'body',
  className = '',
  fallback = null,
}) {
  const paragraphs = useMemo(() => splitOverviewParagraphs(text), [text]);
  const typeClass = VARIANT_CLASS[variant] || VARIANT_CLASS.body;

  if (!paragraphs.length) {
    if (!fallback) return null;
    return (
      <p className={`${typeClass} ${className}`.trim()}>{fallback}</p>
    );
  }

  const gapClass = variant === 'lede' ? 'space-y-4' : 'space-y-3.5';

  return (
    <div className={`${gapClass} ${className}`.trim()}>
      {paragraphs.map((paragraph, index) => (
        <p key={`ov-p-${index}`} className={typeClass}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
