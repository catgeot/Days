import React, { useEffect, useState } from 'react';
import { ChevronDown, ClipboardList, X } from 'lucide-react';
import {
  cloudPreviewProject,
  cloudPreviewSessionLabel,
  cloudPreviewWorkLog,
} from './cloudPreviewWorkLog';
import { isCloudPreviewSurface } from './isCloudPreviewSurface';

export default function CloudPreviewWorkLog() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    setVisible(
      isCloudPreviewSurface() &&
        cloudPreviewProject.active &&
        cloudPreviewWorkLog.length > 0,
    );
  }, []);

  if (!visible) return null;

  const sessionLabel = cloudPreviewSessionLabel();

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-3 z-[80] flex flex-col items-end gap-2 sm:bottom-6 sm:right-4"
      data-cloud-preview-work-log
    >
      {open && (
        <div className="pointer-events-auto w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500">
                작업 로그
              </p>
              <p className="truncate text-sm font-medium text-slate-900">
                {sessionLabel}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                QA {cloudPreviewProject.previewPath}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label="작업 로그 닫기"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ul className="max-h-[min(22rem,50vh)] overflow-y-auto py-1">
            {cloudPreviewWorkLog.map((entry) => {
              const expanded = expandedId === entry.id;
              return (
                <li key={entry.id} className="border-b border-slate-50 last:border-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : entry.id)
                    }
                    className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
                  >
                    <ChevronDown
                      className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                        expanded ? 'rotate-0' : '-rotate-90'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">
                        {entry.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                        {entry.session}
                        {entry.at ? ` · ${entry.at}` : ''}
                      </span>
                      {expanded && (
                        <span className="mt-1.5 block text-xs leading-relaxed text-slate-600">
                          {entry.detail}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md hover:bg-white"
        aria-expanded={open}
        aria-controls="cloud-preview-work-log-panel"
      >
        <ClipboardList className="h-3.5 w-3.5 text-slate-600" />
        작업 로그
      </button>
    </div>
  );
}
