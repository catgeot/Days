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
  compact = false,
  backLabel = '← 주제 바꾸기',
}) {
  const items = chips ?? [];
  if (!items.length) return null;

  return (
    <div className={compact ? 'space-y-2' : 'mt-3 space-y-2'}>
      {onBack ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-cyan-200 transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={14} className="shrink-0" />
          {backLabel}
        </button>
      ) : null}
      {prompt ? (
        <p className={`text-gray-400 px-0.5 ${compact ? 'text-[11px]' : 'text-xs'}`}>{prompt}</p>
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
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-900/40 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
