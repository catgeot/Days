import { useEffect, useState } from 'react';
import { supabase } from '../../../shared/api/supabase';
import { fetchToolkitSectionMetaMap } from '../../../utils/fetchToolkitSectionMeta.js';
import { isGateoToolkitFreshnessEnabled } from '../../../shared/gateoFeatureFlags.js';

export function useToolkitSectionMeta(placeId, enabled = isGateoToolkitFreshnessEnabled()) {
  const [sectionMetaBySection, setSectionMetaBySection] = useState({});
  const [metaLoaded, setMetaLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setSectionMetaBySection({});
      setMetaLoaded(false);
      return;
    }
    const key = String(placeId || '').trim();
    if (!key) {
      setSectionMetaBySection({});
      setMetaLoaded(true);
      return;
    }

    let cancelled = false;
    setMetaLoaded(false);

    (async () => {
      const map = await fetchToolkitSectionMetaMap(supabase, key);
      if (cancelled) return;
      setSectionMetaBySection(map == null ? {} : map);
      setMetaLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [placeId, enabled]);

  return { sectionMetaBySection, metaLoaded };
}
