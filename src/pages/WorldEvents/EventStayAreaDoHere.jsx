import React from 'react';

/**
 * @param {{ title: string, lines?: string[] }} props
 */
export default function EventStayAreaDoHere({ title, lines }) {
  if (!Array.isArray(lines) || lines.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold text-stone-600">{title}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11px] leading-relaxed text-stone-600">
        {lines.map((line, index) => (
          <li key={`${index}-${line.slice(0, 24)}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}