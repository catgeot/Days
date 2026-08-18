import { useEffect, useState } from 'react';
import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import {
  pickGlobeBannerFestivals,
  pickGlobeBannerScenicItems,
} from '../lib/globeBannerContent.js';

/**
 * 레인별 배너. 축제·명소는 UI에서 섞지 않음.
 * @param {'festival' | 'scenic'} [lane]
 * @returns {{ items: object[], ready: boolean }}
 */
export function useGlobeHomeBanner(lane = 'festival') {
  const [items, setItems] = useState(() => (
    lane === 'scenic' ? pickGlobeBannerScenicItems({ limit: 3 }) : []
  ));
  const [ready, setReady] = useState(lane === 'scenic');

  useEffect(() => {
    if (lane === 'scenic') {
      setItems(pickGlobeBannerScenicItems({ limit: 3 }));
      setReady(true);
      return undefined;
    }

    let cancelled = false;

    fetchKoreaFestivalsRolling12()
      .then((data) => {
        if (cancelled) return;
        const festivals = data?.ok && Array.isArray(data.items)
          ? pickGlobeBannerFestivals(data.items, { limit: 3 })
          : [];
        setItems(festivals);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [lane]);

  return { items, ready };
}
