import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../shared/api/supabase';

async function loadAdminLists() {
  const [queueRes, exclusionRes] = await Promise.all([
    supabase.rpc('gallery_report_queue', {
      p_min_reports: 3,
      p_status: 'open',
      p_limit: 100,
    }),
    supabase.rpc('gallery_exclusion_list', {
      p_active_only: true,
      p_limit: 100,
    }),
  ]);
  return {
    queue: Array.isArray(queueRes.data) ? queueRes.data : [],
    exclusions: Array.isArray(exclusionRes.data) ? exclusionRes.data : [],
    error: queueRes.error || exclusionRes.error || null,
  };
}

export default function GalleryAdminPage() {
  const [phase, setPhase] = useState('check');
  const [queue, setQueue] = useState([]);
  const [exclusions, setExclusions] = useState([]);
  const [busyKey, setBusyKey] = useState('');

  const reload = useCallback(async () => {
    const next = await loadAdminLists();
    if (next.error) return;
    setQueue(next.queue);
    setExclusions(next.exclusions);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        if (!cancel) setPhase('no');
        return;
      }
      const { data, error } = await supabase.rpc('am_i_app_admin', { p_scope: 'gallery' });
      if (cancel) return;
      if (error || data !== true) {
        setPhase('no');
        return;
      }
      setPhase('yes');
      const next = await loadAdminLists();
      if (cancel || next.error) return;
      setQueue(next.queue);
      setExclusions(next.exclusions);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const moderate = async (action, placeId, imageId) => {
    const key = `${action}:${placeId}:${imageId}`;
    setBusyKey(key);
    const { data, error } = await supabase.functions.invoke('gallery-moderate', {
      body: { action, placeId, imageId },
    });
    setBusyKey('');
    if (error || data?.ok === false) return;
    await reload();
  };

  if (phase !== 'yes') {
    return <main className="min-h-screen bg-[#0a0a0a]" />;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 text-white">
      <h1 className="text-lg font-semibold">갤러리 신고</h1>
      <ul className="mt-4 flex flex-col gap-3">
        {queue.map((row) => {
          const key = `${row.place_id}:${row.image_id}`;
          return (
            <li key={key} className="rounded-xl border border-white/10 p-3">
              <p className="text-sm">
                {row.place_id} · {row.image_id} · {row.report_count}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={Boolean(busyKey)}
                  onClick={() => moderate('remove', row.place_id, row.image_id)}
                  className="h-10 rounded-full bg-red-500/90 px-4 text-sm font-semibold"
                >
                  제거
                </button>
                <button
                  type="button"
                  disabled={Boolean(busyKey)}
                  onClick={() => moderate('dismiss', row.place_id, row.image_id)}
                  className="h-10 rounded-full border border-white/20 px-4 text-sm font-semibold"
                >
                  기각
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <h2 className="mt-8 text-base font-semibold">제외 목록</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {exclusions.map((row) => (
          <li key={row.id || `${row.place_id}:${row.image_id}`} className="rounded-xl border border-white/10 p-3">
            <p className="text-sm">
              {row.place_id} · {row.image_id}
            </p>
            <button
              type="button"
              disabled={Boolean(busyKey)}
              onClick={() => moderate('restore', row.place_id, row.image_id)}
              className="mt-2 h-10 rounded-full border border-white/20 px-4 text-sm font-semibold"
            >
              복원
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
