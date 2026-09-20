import React, { useMemo } from 'react';

/**
 * @param {string} text
 * @param {Array<{ id: string, displayTerm: string }>} terms
 * @param {Set<string>} [linkedTermIds]
 */
function buildGlossarySegments(text, terms, linkedTermIds) {
  const source = String(text || '');
  if (!source || !terms?.length) {
    return source ? [{ type: 'text', value: source }] : [];
  }

  const matchers = [...terms]
    .filter((term) => term.displayTerm)
    .sort((a, b) => b.displayTerm.length - a.displayTerm.length);

  /** @type {Array<{ type: 'text' | 'term', value: string, termId?: string }>} */
  const segments = [];
  const linked = linkedTermIds ?? new Set();
  let buffer = '';
  let index = 0;

  const flushText = () => {
    if (buffer) {
      segments.push({ type: 'text', value: buffer });
      buffer = '';
    }
  };

  while (index < source.length) {
    let match = null;
    for (const candidate of matchers) {
      if (source.slice(index, index + candidate.displayTerm.length) === candidate.displayTerm) {
        if (!match || candidate.displayTerm.length > match.displayTerm.length) {
          match = candidate;
        }
      }
    }

    if (match) {
      if (linked.has(match.id)) {
        buffer += match.displayTerm;
        index += match.displayTerm.length;
        continue;
      }
      flushText();
      linked.add(match.id);
      segments.push({ type: 'term', value: match.displayTerm, termId: match.id });
      index += match.displayTerm.length;
      continue;
    }

    buffer += source[index];
    index += 1;
  }

  flushText();
  return segments;
}

/**
 * @param {{
 *   text: string,
 *   terms?: Array<{ id: string, displayTerm: string }>,
 *   onTermClick?: (termId: string) => void,
 *   className?: string,
 *   linkedTermIds?: Set<string>,
 * }} props
 */
export default function EventRichText({
  text,
  terms = [],
  onTermClick,
  className = '',
  linkedTermIds,
}) {
  const segments = useMemo(
    () => buildGlossarySegments(text, terms, linkedTermIds),
    [text, terms, linkedTermIds],
  );

  if (!segments.length) return null;

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.type === 'term' && segment.termId && onTermClick) {
          return (
            <button
              key={`${segment.termId}-${index}`}
              type="button"
              onClick={() => onTermClick(segment.termId)}
              className="mx-0.5 inline rounded-md border border-amber-200 bg-amber-50 px-1 py-0.5 text-[inherit] font-bold text-amber-900 underline decoration-amber-400/70 underline-offset-2 hover:border-amber-300 hover:bg-amber-100"
            >
              {segment.value}
            </button>
          );
        }
        return <React.Fragment key={`text-${index}`}>{segment.value}</React.Fragment>;
      })}
    </span>
  );
}
