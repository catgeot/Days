import { useEffect } from 'react';
import {
  recordTravelAgencyEmbedVisit,
  recordTravelAgencyVisit,
} from '../../utils/travelAgencyVisits.js';

function hrefFromAnchor(anchor) {
  if (!anchor) return '';
  const raw = anchor.getAttribute('href') || anchor.href || '';
  if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return '';
  return raw;
}

function embedFromIframe(iframe) {
  if (!(iframe instanceof HTMLIFrameElement)) return null;
  const root = iframe.closest('[data-gyg-href], [data-gyg-widget]');
  return {
    src: iframe.getAttribute('src') || iframe.src || '',
    embedHref: root?.getAttribute('data-gyg-href') || '',
    query: root?.getAttribute('data-gyg-q') || '',
  };
}

/**
 * 제휴 사이트 &lt;a&gt; 클릭을 한 곳에서 기록.
 * 프로그래밍 openPartnerExternalUrl 은 partnerNavigation에서 별도 기록.
 * GYG 위젯은 iframe이라 document click이 안 올라옴 — 포커스·pointerdown으로 기록.
 */
export default function TravelAgencyVisitCapture() {
  useEffect(() => {
    let lastEmbedKey = '';
    let lastEmbedAt = 0;

    const recordEmbed = (iframe) => {
      const input = embedFromIframe(iframe);
      if (!input) return;
      const key = `${input.src}|${input.embedHref}|${input.query}`;
      const now = Date.now();
      if (key === lastEmbedKey && now - lastEmbedAt < 1000) return;
      lastEmbedKey = key;
      lastEmbedAt = now;
      recordTravelAgencyEmbedVisit(input);
    };

    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!anchor) return;
      const href = hrefFromAnchor(anchor);
      if (!href) return;
      const placeLabel = anchor.getAttribute('data-gateo-place') || '';
      recordTravelAgencyVisit({ href, placeLabel });
    };

    const onPointerDown = (event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement) recordEmbed(target);
    };

    const onFocusIn = (event) => {
      const target = event.target;
      if (target instanceof HTMLIFrameElement) recordEmbed(target);
    };

    const onWindowBlur = () => {
      window.setTimeout(() => {
        const el = document.activeElement;
        if (el instanceof HTMLIFrameElement) recordEmbed(el);
      }, 0);
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, []);

  return null;
}
