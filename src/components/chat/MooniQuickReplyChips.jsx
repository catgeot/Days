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

  const backLabelText = backLabel.replace(/^←\s*/, '');

  return (
    <div className={dock ? 'space-y-1.5' : 'mt-3 space-y-2'}>
      {onBack ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="inline-flex items-center gap-0.5 px-0.5 py-1 text-[11px] font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={14} className="shrink-0 -mr-0.5" aria-hidden />
          {backLabelText}
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
