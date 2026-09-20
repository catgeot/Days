import React, { useEffect, useState } from 'react';
import {
  getSeaExploreDebugLines,
  installSeaExploreDebugGlobalHooks,
  isSeaExploreDebugEnabled,
  logSeaExplore,
  subscribeSeaExploreDebug,
} from './seaExploreDebug';

export default function SeaExploreDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const on = isSeaExploreDebugEnabled();
    setEnabled(on);
    if (!on) return undefined;
    installSeaExploreDebugGlobalHooks();
    setLines(getSeaExploreDebugLines());
    return subscribeSeaExploreDebug(() => {
      setLines(getSeaExploreDebugLines());
    });
  }, []);

  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-2 z-[85] flex max-w-[min(20rem,calc(100vw-1rem))] flex-col items-start gap-1 sm:bottom-6"
      data-sea-explore-debug
    >
      {open ? (
        <div className="pointer-events-auto w-full overflow-hidden rounded-lg border border-amber-400/50 bg-black/90 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1">
            <span className="text-[10px] font-bold text-amber-200">sea debug</span>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-[9px] text-gray-300 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              숨김
            </button>
          </div>
          <pre className="max-h-[min(14rem,35vh)] overflow-y-auto whitespace-pre-wrap break-all px-2 py-1.5 font-mono text-[9px] leading-snug text-gray-200">
            {lines.length ? lines.join('\n') : '(탭 대기…)'}
          </pre>
          <button
            type="button"
            className="w-full border-t border-white/10 px-2 py-1 text-[9px] text-cyan-300 hover:bg-white/5"
            onClick={() => {
              try {
                navigator.clipboard?.writeText(lines.join('\n'));
                logSeaExplore('clipboard', `${lines.length} lines`);
              } catch {
                logSeaExplore('clipboard.fail');
              }
            }}
          >
            로그 복사
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-amber-400/60 bg-black/85 px-2 py-1 text-[10px] font-bold text-amber-200 shadow-lg"
          onClick={() => setOpen(true)}
        >
          sea log
        </button>
      )}
    </div>
  );
}
