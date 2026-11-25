/**
 * Fixed top-right back control on blog articles.
 * Bottom padding lets the last block scroll clear of that control (safe-area aware).
 * Inline-end padding keeps lines, including photo credits, from running under it at 390.
 */
export const LOGBOOK_ARTICLE_PAGE_PAD =
  'pb-[calc(max(6.5rem,env(safe-area-inset-bottom,0px)+5.5rem))]';

export const LOGBOOK_ARTICLE_INLINE_CLEARANCE =
  'max-md:!pr-[calc(2.75rem+max(1.25rem,env(safe-area-inset-right,0px))+0.75rem)]';
