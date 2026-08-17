import React, { useEffect, useState } from 'react';
import {
  clearCurationHandoffDebugLines,
  copyCurationHandoffDebugLines,
  getCurationHandoffDebugLines,
  installCurationHandoffDebugGlobalHooks,
  isCurationHandoffDebugEnabled,
  logCurationHandoff,
  subscribeCurationHandoffDebug,
} from './curationHandoffDebug';

export default function CurationHandoffDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(true);
  const [lines, setLines] = useState([]);
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    const on = isCurationHandoffDebugEnabled();
    setEnabled(on);
    if (!on) return undefined;
    installCurationHandoffDebugGlobalHooks();
    setLines(getCurationHandoffDebugLines());
    return subscribeCurationHandoffDebug(() => {
      setLines(getCurationHandoffDebugLines());
    });
  }, []);

  if (!enabled) return null;

  const text = lines.length ? lines.join('\n') : '(큐레이션 CTA 또는 홈 핸드오프 대기…)';

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-2 z-[90] flex max-w-[min(22rem,calc(100vw-1rem))] flex-col items-end gap-1 sm:bottom-6"
      data-curation-handoff-debug
    >
      {open ? (
        <div className="pointer-events-auto w-full overflow-hidden rounded-lg border border-violet-400/55 bg-black/92 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-2 py-1">
            <span className="text-[10px] font-bold text-violet-200">curation debug</span>
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-[9px] text-gray-300 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              숨김
            </button>
          </div>
          <pre
            className="max-h-[min(16rem,40vh)] overflow-y-auto whitespace-pre-wrap break-all px-2 py-1.5 font-mono text-[9px] leading-snug text-gray-200 select-text"
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {text}
          </pre>
          <div className="flex border-t border-white/10">
            <button
              type="button"
              className="flex-1 px-2 py-1.5 text-[9px] text-cyan-300 hover:bg-white/5"
              onClick={async () => {
                const result = await copyCurationHandoffDebugLines(lines);
                if (result.ok) {
                  setCopyState(`복사됨 (${result.method})`);
                  logCurationHandoff('clipboard.ok', `${lines.length} lines`);
                } else {
                  setCopyState('길게 눌러 선택 후 복사');
                  logCurationHandoff('clipboard.fail', result.reason);
                }
                window.setTimeout(() => setCopyState(''), 2500);
              }}
            >
              로그 복사
            </button>
            <button
              type="button"
              className="flex-1 border-l border-white/10 px-2 py-1.5 text-[9px] text-gray-400 hover:bg-white/5"
              onClick={() => {
                clearCurationHandoffDebugLines();
                setCopyState('');
              }}
            >
              지우기
            </button>
          </div>
          {copyState ? (
            <p className="border-t border-white/10 px-2 py-1 text-[9px] text-amber-200">{copyState}</p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto rounded-full border border-violet-400/60 bg-black/85 px-2 py-1 text-[10px] font-bold text-violet-200 shadow-lg"
          onClick={() => setOpen(true)}
        >
          curation log
        </button>
      )}
    </div>
  );
}
