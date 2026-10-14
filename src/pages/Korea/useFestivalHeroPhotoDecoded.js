import { useLayoutEffect, useState } from 'react';
import { isFestivalPhotoDecoded } from './festivalPhotoFrame.js';

export const FESTIVAL_HERO_IMG_SELECTOR = '[data-festival-hero] img[data-festival-photo]';

/**
 * @param {ParentNode} [root]
 */
export function queryFestivalHeroImg(root = document) {
  return root.querySelector(FESTIVAL_HERO_IMG_SELECTOR);
}

/**
 * DOM truth for hero credit / Expand — do not rely on img onLoad alone (WebKit cache + locale).
 * @param {string} heroSrc
 * @param {string} [locale]
 */
export function useFestivalHeroPhotoDecoded(heroSrc, locale = 'ko') {
  const [decoded, setDecoded] = useState(false);

  useLayoutEffect(() => {
    if (!heroSrc) {
      setDecoded(false);
      return undefined;
    }

    let cancelled = false;
    let rafId = 0;
    let img = null;

    const sync = () => {
      if (cancelled) return;
      img = queryFestivalHeroImg();
      if (isFestivalPhotoDecoded(img)) {
        setDecoded(true);
        return;
      }
      if (img?.complete && img.naturalWidth === 0) {
        setDecoded(false);
        return;
      }
      rafId = requestAnimationFrame(sync);
    };

    const onImgEvent = () => {
      sync();
    };

    setDecoded(false);
    sync();

    const attach = () => {
      const next = queryFestivalHeroImg();
      if (next === img) return;
      img?.removeEventListener('load', onImgEvent);
      img?.removeEventListener('error', onImgEvent);
      img = next;
      img?.addEventListener('load', onImgEvent);
      img?.addEventListener('error', onImgEvent);
    };

    attach();
    const attachTimer = window.setInterval(attach, 200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.clearInterval(attachTimer);
      img?.removeEventListener('load', onImgEvent);
      img?.removeEventListener('error', onImgEvent);
    };
  }, [heroSrc, locale]);

  return decoded;
}
