/**
 * Fixed top-right back control on blog articles.
 * Bottom padding lets the last block scroll clear of that control.
 * The article column stays symmetrically padded. A one-sided padding-right
 * on the card (PR #910) shoved every line left at 390.
 * Only the credit line and the centered end block shrink below md, so their
 * boxes still clear the control.
 */
export const LOGBOOK_ARTICLE_PAGE_PAD =
  'pb-[calc(max(6.5rem,env(safe-area-inset-bottom,0px)+5.5rem))]';

export const LOGBOOK_ARTICLE_CREDIT_CLEARANCE =
  'max-md:mr-[calc(2.75rem+max(0.75rem,env(safe-area-inset-right,0px)))]';

export const LOGBOOK_ARTICLE_END_CLEARANCE =
  'max-md:mx-[calc(2.75rem+max(0.75rem,env(safe-area-inset-right,0px)))]';
