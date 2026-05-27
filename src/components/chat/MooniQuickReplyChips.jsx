import React from 'react';

/**
 * MOONi bound slug — 첫 방문·턴 후 주제 선택 칩 (§2.9 S8)
 */
export default function MooniQuickReplyChips({
  slug,
  chips,
  onSelect,
  onOpenPlanner,
  disabled,
  prompt = '무엇부터 도와드릴까요?',
  compact = false,
}) {
  const items = chips ?? [];
  if (!items.length) return null;

  return (
    <div className={compact ? 'space-y-2' : 'mt-3 space-y-2'}>
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
              if (chip.sendText) onSelect?.(chip.sendText);
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
