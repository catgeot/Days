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
  backLabel = '← 주제 바꾸기',
}) {
  const items = chips ?? [];
  if (!items.length) return null;

  const chipClass =
    'inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/40 transition-colors disabled:opacity-50 disabled:pointer-events-none';

  return (
    <div className={dock ? 'space-y-1.5' : 'mt-3 space-y-2'}>
      {onBack ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-full border border-cyan-500/45 bg-cyan-950/55 px-3 py-1.5 text-xs font-semibold text-cyan-100 shadow-sm hover:border-cyan-400/70 hover:bg-cyan-900/50 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={15} className="shrink-0" />
          {backLabel}
        </button>
      ) : null}
      {showPrompt && prompt ? (
        <p className="text-xs text-gray-400 px-0.5">{prompt}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
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
              if (chip.sendText) onSelect?.(chip.sendText, chip.persona);
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
    </div>
  );
}
