import React from 'react';

export function ReviewLinkChips({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2" data-review-link-chips="">
      {items.map((item) => {
        const tel = String(item.url).startsWith('tel:');
        return (
          <a
            key={`${item.kind}:${item.url}`}
            href={item.url}
            title={item.label}
            target={tel ? undefined : '_blank'}
            rel={tel ? undefined : 'noopener noreferrer nofollow'}
            onClick={(event) => event.stopPropagation()}
            className="inline-block max-w-[16rem] truncate rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-800"
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
