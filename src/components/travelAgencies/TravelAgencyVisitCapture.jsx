import { useEffect } from 'react';
import { recordTravelAgencyVisit } from '../../utils/travelAgencyVisits.js';

function hrefFromAnchor(anchor) {
  if (!anchor) return '';
  const raw = anchor.getAttribute('href') || anchor.href || '';
  if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return '';
  return raw;
}

/**
 * 제휴 사이트 &lt;a&gt; 클릭을 한 곳에서 기록.
 * 프로그래밍 openPartnerExternalUrl 은 partnerNavigation에서 별도 기록.
 */
export default function TravelAgencyVisitCapture() {
  useEffect(() => {
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
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
