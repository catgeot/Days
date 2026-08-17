import { useEffect, useState } from 'react';
import { fetchKoreaFestivalsRolling12 } from '../../Korea/fetchKoreaFestivalsWindow.js';
import {
  mixGlobeBannerItems,
  pickGlobeBannerFestivals,
  pickGlobeBannerScenicItems,
} from '../lib/globeBannerContent.js';

/**
 * @returns {{ items: object[], ready: boolean }}
 */
export function useGlobeHomeBanner() {
  const [items, setItems] = useState(() => {
    const scenic = pickGlobeBannerScenicItems({ limit: 3 });
    return mixGlobeBannerItems([], scenic);
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const scenic = pickGlobeBannerScenicItems({ limit: 3 });

    fetchKoreaFestivalsRolling12()
      .then((data) => {
        if (cancelled) return;
        const festivals = data?.ok && Array.isArray(data.items)
          ? pickGlobeBannerFestivals(data.items, { limit: 3 })
          : [];
        setItems(mixGlobeBannerItems(festivals, scenic));
      })
      .catch(() => {
        if (cancelled) return;
        setItems(mixGlobeBannerItems([], scenic));
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { items, ready };
}
