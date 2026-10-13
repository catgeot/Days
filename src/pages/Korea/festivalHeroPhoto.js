import { createElement } from 'react';
import { FestivalPhotoFrame } from './festivalPhotoFrame';

/** Same box before load, after a successful decode, and after a late error. */
export const FESTIVAL_HERO_BOX_CLASS = 'h-[min(40vh,18rem)]';

/**
 * Hero photo that cannot grow the sheet when the request fails.
 * onError unmounts the img and shows `fallback` inside the fixed box.
 */
export function FestivalHeroPhoto({ src, onLoaded, onFailed, fallback = null }) {
  return createElement(
    'div',
    {
      'data-festival-hero': '',
      className: `relative w-full overflow-hidden bg-stone-200/70 ${FESTIVAL_HERO_BOX_CLASS} md:h-full md:min-h-[12rem]`,
    },
    createElement(FestivalPhotoFrame, {
      src,
      alt: '',
      className: 'pointer-events-none absolute inset-0 h-full w-full object-contain select-none',
      draggable: false,
      fetchPriority: 'high',
      decoding: 'async',
      loading: 'eager',
      referrerPolicy: 'no-referrer',
      onLoaded,
      onFailed,
      fallback,
    }),
  );
}
