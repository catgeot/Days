import { useEffect, useState } from 'react';
import { fetchTourApiListSummary } from '../../../utils/fetchTourApiAttractionDetail';
import { isAddressOnlyBlurb } from '../lib/tourListSummary';

const WORKERS = 3;

/**
 * 주소만 있는 관광지 목록 행에 Tour 개요 첫 문장을 붙인다.
 * 전문·suggestion.desc·장소 카드 intro에는 넣지 않는다.
 * @param {object[]} spots
 * @param {boolean} [enabled]
 * @returns {Record<string, string>}
 */
export function useTourListSummaryByContentId(spots, enabled = true) {
  const [byId, setById] = useState({});
  const key = enabled
    ? [
        ...new Set(
          (spots || [])
            .filter((spot) => isAddressOnlyBlurb(spot?.blurb, spot?.addr1))
            .map((spot) => String(spot?.contentId || '').trim())
            .filter((id) => /^\d{1,32}$/.test(id)),
        ),
      ].join(',')
    : '';

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    const ids = key.split(',').filter((id) => id);
    (async () => {
      const next = {};
      let cursor = 0;
      const worker = async () => {
        while (cursor < ids.length) {
          const id = ids[cursor];
          cursor += 1;
          const text = await fetchTourApiListSummary(id);
          if (text) next[id] = text;
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(WORKERS, ids.length) }, () => worker()),
      );
      if (!cancelled && Object.keys(next).length) {
        setById((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  return byId;
}
