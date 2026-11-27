import React from 'react';
import ContentAffiliateMark from '../../../shared/affiliate/ContentAffiliateMark.jsx';
import {
  CONTENT_AFFILIATE_LINK_REL,
  resolveContentAffiliateLink,
} from '../../../utils/contentAffiliateHref.js';

export function ReviewLinkChips({ items, affiliateSubTag = '' }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2" data-review-link-chips="">
      {items.map((item) => {
        const resolved = resolveContentAffiliateLink(item.url, { subTag: affiliateSubTag });
        const tel = String(resolved.href).startsWith('tel:');
        return (
          <a
            key={`${item.kind}:${item.url}`}
            href={resolved.href}
            title={item.label}
            target={tel ? undefined : '_blank'}
            rel={tel ? undefined : resolved.affiliated ? CONTENT_AFFILIATE_LINK_REL : 'noopener noreferrer nofollow'}
            data-content-affiliate={resolved.partner || undefined}
            onClick={(event) => event.stopPropagation()}
            className="inline-flex max-w-[16rem] items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-800"
          >
            <span className="truncate">{item.label}</span>
            {resolved.affiliated ? <ContentAffiliateMark /> : null}
          </a>
        );
      })}
    </div>
  );
}
