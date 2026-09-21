import React, { useEffect, useState } from 'react';
import {
  clearFlightDebugLines,
  copyFlightDebugLines,
  getFlightDebugLines,
  installFlightDebugGlobalHooks,
  isFlightDebugEnabled,
  logFlightDebug,
  subscribeFlightDebug,
  captureFlightSnapshot,
} from './flightDebug';

export default function FlightDebugPanel() {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState([]);
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    const on = isFlightDebugEnabled();
    setEnabled(on);
    if (!on) return undefined;
    installFlightDebugGlobalHooks();
    setLines(getFlightDebugLines());
    return subscribeFlightDebug(() => {
      setLines(getFlightDebugLines());
    });
  }, []);

  if (!enabled) return null;

  const text = lines.length ? lines.join('\n') : '(항공 위젯 이벤트 기록 대기 중...)';

  return (
    <div
      className="pointer-events-none fixed bottom-16 left-2 z-[9990] flex max-w-[min(22rem,calc(100vw-1rem))] flex-col items-start gap-1 sm:bottom-6 sm:left-4"
      data-flight-debug-panel
    >
      {open ? (
        <div className="pointer-events-auto w-full overflow-hidden rounded-xl border border-sky-400/60 bg-black/92 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-sky-950/40 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[11px] font-bold text-sky-200">모바일 위젯 로그</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded bg-sky-800/60 px-1.5 py-0.5 text-[10px] text-sky-100 hover:bg-sky-700"
                onClick={() => {
                  captureFlightSnapshot();
                }}
              >
                스냅샷
              </button>
              <button
                type="button"
                className="rounded px-1.5 py-0.5 text-[10px] text-gray-300 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>
          </div>

          <pre
            className="max-h-[min(18rem,45vh)] overflow-y-auto whitespace-pre-wrap break-all px-2.5 py-2 font-mono text-[9px] leading-snug text-gray-100 select-text"
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {text}
          </pre>

          <div className="flex border-t border-white/10 bg-gray-950">
            <button
              type="button"
              className="flex-1 bg-sky-600 px-3 py-2 text-center text-xs font-bold text-white transition-colors hover:bg-sky-500 active:bg-sky-700"
              onClick={async () => {
                const result = await copyFlightDebugLines(lines);
                if (result.ok) {
                  setCopyState('클립보드에 복사되었습니다! 채팅에 붙여넣어 주세요.');
                  logFlightDebug('clipboard.ok', `${lines.length} lines`);
                } else {
                  setCopyState('복사 실패: 길게 눌러 텍스트를 직접 복사해 주세요.');
                  logFlightDebug('clipboard.fail', result.reason);
                }
                window.setTimeout(() => setCopyState(''), 4000);
              }}
            >
              📋 로그 복사
            </button>
            <button
              type="button"
              className="border-l border-white/10 px-3 py-2 text-[10px] text-gray-400 hover:bg-white/5"
              onClick={() => {
                clearFlightDebugLines();
                setCopyState('');
              }}
            >
              지우기
            </button>
          </div>

          {copyState ? (
            <p className="border-t border-white/10 bg-amber-950/70 px-2.5 py-1.5 text-center text-[10px] font-semibold text-amber-200">
              {copyState}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-sky-400/80 bg-sky-950/90 px-3 py-1.5 text-xs font-bold text-sky-100 shadow-xl backdrop-blur-sm active:scale-95"
          onClick={() => {
            setOpen(true);
            captureFlightSnapshot();
          }}
        >
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span>모바일 위젯 로그</span>
        </button>
      )}
    </div>
  );
}
