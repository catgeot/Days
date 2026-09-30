import { useEffect, useState } from 'react';
import { fetchTourApiOverview } from '../../../utils/fetchTourApiAttractionDetail';

const WORKERS = 3;

/**
 * 목록에 개요가 없는 contentId만 Tour detailCommon overview를 붙인다.
 * 반환 맵은 표시용. suggestion.desc·장소 카드 intro에는 넣지 않는다.
 * @param {object[]} spots
 * @param {boolean} [enabled]
 * @returns {Record<string, string>}
 */
export function useTourOverviewByContentId(spots, enabled = true) {
  const [byId, setById] = useState({});
  const key = enabled
    ? [
        ...new Set(
          (spots || [])
            .map((spot) => String(spot?.contentId || '').trim())
            .filter((id) => /^\d{1,32}$/.test(id)),
        ),
      ].join(',')
    : '';

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    const ids = key.split(',');

    (async () => {
      const next = {};
      let cursor = 0;
      const worker = async () => {
        while (cursor < ids.length) {
          const id = ids[cursor];
          cursor += 1;
          const text = await fetchTourApiOverview(id);
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
