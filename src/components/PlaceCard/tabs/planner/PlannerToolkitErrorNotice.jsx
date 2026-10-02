import React from 'react';

export function PlannerToolkitErrorNotice({
  message,
  safetyHref,
  safetyLabel,
  mapHref,
  mapLabel,
}) {
  if (!message) return null;
  return (
    <div className="mt-3 w-full max-w-sm text-left" role="alert" data-planner-toolkit-error="">
      <p className="text-sm font-medium text-stone-800 break-keep">{message}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {safetyHref ? (
          <a
            href={safetyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-800 underline underline-offset-2"
          >
            {safetyLabel}
          </a>
        ) : null}
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-800 underline underline-offset-2"
          >
            {mapLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}
