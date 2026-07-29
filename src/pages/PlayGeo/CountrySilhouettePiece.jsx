import React from 'react';
import { getGeoPuzzleSilhouette } from '../data/geoPuzzleSilhouettes.js';

/**
 * @param {{
 *   countryId: string,
 *   labelKo?: string,
 *   active?: boolean,
 *   size?: 'tray' | 'drag',
 *   className?: string,
 * }} props
 */
export default function CountrySilhouettePiece({
  countryId,
  labelKo = '',
  active = false,
  size = 'tray',
  className = '',
}) {
  const sil = getGeoPuzzleSilhouette(countryId);
  const isDrag = size === 'drag';
  const box = isDrag ? 'h-20 w-20' : 'h-14 w-14';

  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${className}`}
      aria-label={labelKo || countryId}
    >
      <div
        className={`${box} flex items-center justify-center rounded-xl border ${
          active
            ? 'border-cyan-300 bg-cyan-400/25 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
            : 'border-white/25 bg-white/10'
        }`}
      >
        {sil ? (
          <svg
            viewBox={sil.viewBox}
            className={isDrag ? 'h-16 w-16' : 'h-11 w-11'}
            aria-hidden
          >
            <path
              d={sil.d}
              fill={active ? 'rgba(34,211,238,0.85)' : 'rgba(165,243,252,0.78)'}
              stroke={active ? '#fbbf24' : 'rgba(255,255,255,0.55)'}
              strokeWidth={1.2}
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span className="px-1 text-center text-[10px] font-bold text-cyan-100 break-keep">
            {labelKo || countryId}
          </span>
        )}
      </div>
      {!isDrag ? (
        <span className="max-w-[4.5rem] truncate text-center text-[10px] font-semibold text-white/85">
          {labelKo || countryId}
        </span>
      ) : null}
    </div>
  );
}
