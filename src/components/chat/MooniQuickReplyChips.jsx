import React from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * MOONi bound slug — 1단·2단 주제 칩 (§2.11 S8-1)
 */
export default function MooniQuickReplyChips({
  slug,
  chips,
  onSelect,
  onDrillDown,
  onBack,
  onOpenPlanner,
  onFocusInput,
  disabled,
  prompt = '무엇부터 도와드릴까요?',
  showPrompt = true,
  dock = false,
  backLabel = '다른 주제',
  parentL1Label = null,
}) {
  const items = chips ?? [];
  if (!items.length) return null;

  const chipClass =
    'inline-flex shrink-0 items-center justify-center gap-1 min-h-[36px] rounded-full border border-cyan-500/35 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100 touch-manipulation hover:border-cyan-400/60 hover:bg-cyan-900/40 transition-colors disabled:opacity-50 disabled:pointer-events-none';

  const backLabelText = backLabel.replace(/^←\s*/, '');

  const chipRowClass = dock
    ? 'flex gap-2 flex-nowrap overflow-x-auto overscroll-x-contain touch-pan-x pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    : 'flex flex-wrap gap-2';

  return (
    <div className={dock ? 'space-y-1' : 'mt-3 space-y-2'}>
      {onBack ? (
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <button
            type="button"
            disabled={disabled}
            onClick={onBack}
            className="inline-flex shrink-0 items-center gap-0.5 min-h-[32px] rounded-full border border-gray-500/55 bg-gray-800/90 px-2.5 py-1 text-[11px] font-semibold text-gray-100 touch-manipulation hover:border-gray-400 hover:bg-gray-700/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft size={14} className="shrink-0 -ml-0.5" aria-hidden />
            {backLabelText}
          </button>
          {parentL1Label ? (
            <span className="text-[11px] text-cyan-400/75 font-medium break-keep min-w-0">
              {parentL1Label}
            </span>
          ) : null}
        </div>
      ) : null}
      {showPrompt && prompt ? (
        <p className="text-xs text-gray-400 px-0.5">{prompt}</p>
      ) : null}
      <div className={dock ? 'relative min-w-0' : undefined}>
        <div className={chipRowClass}>
          {items.map((chip) => (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (chip.action === 'planner' && slug && onOpenPlanner) {
                  onOpenPlanner(`/place/${slug}/planner`);
                  return;
                }
                if (chip.drillDown && onDrillDown) {
                  onDrillDown(chip.id);
                  return;
                }
                if (chip.action === 'focus_input' && onFocusInput) {
                  onFocusInput(chip);
                  return;
                }
                if (chip.sendText) onSelect?.(chip.sendText, chip.persona, chip);
              }}
              className={chipClass}
            >
              {chip.mobileLabel ? (
                <>
                  <span className="md:hidden">{chip.mobileLabel}</span>
                  <span className="max-md:hidden">{chip.label}</span>
                </>
              ) : (
                chip.label
              )}
            </button>
          ))}
        </div>
        {dock ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-900 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
