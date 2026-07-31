import React, { useState } from 'react';
import { GEO_PUZZLE_DEPLOY_LOG, getLatestDeployEntry } from './data/geoPuzzleDeployLog.js';

/**
 * Preview QA — tip에 반영된 수정일·요약을 게임 화면에서 바로 확인.
 */
export default function PuzzleDeployLog({ filledCount = 0, projection = '' }) {
  const [open, setOpen] = useState(false);
  const latest = getLatestDeployEntry();
  const stamp = latest?.at || '—';

  return (
    <div className="pointer-events-auto absolute right-2 top-2 z-30 max-w-[min(92vw,18rem)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-violet-400/45 bg-black/80 px-2.5 py-1.5 text-left text-[10px] leading-snug text-violet-100 backdrop-blur-md"
        aria-expanded={open}
        aria-controls="geo-puzzle-deploy-log"
      >
        <span className="block font-bold tracking-wide text-violet-200">배포 {stamp}</span>
        <span className="mt-0.5 block truncate text-white/75 break-keep">
          {latest?.summary || '로그 없음'}
        </span>
      </button>

      {open ? (
        <div
          id="geo-puzzle-deploy-log"
          className="mt-1.5 max-h-[42vh] overflow-y-auto rounded-xl border border-white/15 bg-black/90 p-2.5 text-[10px] text-white/85 shadow-lg backdrop-blur-md"
        >
          <p className="mb-1.5 text-[9px] uppercase tracking-wider text-white/40">
            최근 변경 · 필 {filledCount}
            {projection ? ` · ${projection}` : ''}
          </p>
          <ul className="space-y-2">
            {GEO_PUZZLE_DEPLOY_LOG.map((row) => (
              <li key={`${row.at}-${row.summary}`} className="border-b border-white/10 pb-1.5 last:border-0">
                <div className="font-semibold text-violet-200/95">{row.at}</div>
                <div className="mt-0.5 font-medium text-white break-keep">{row.summary}</div>
                {row.detail ? (
                  <div className="mt-0.5 text-white/55 break-keep">{row.detail}</div>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[9px] leading-snug text-white/40 break-keep">
            이 패널 시각·문구가 안 바뀌면 Preview에 새 tip이 안 올라온 것.
          </p>
        </div>
      ) : null}
    </div>
  );
}
