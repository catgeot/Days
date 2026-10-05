import remarkGfm from 'remark-gfm';
import remarkCjkFriendly from 'remark-cjk-friendly/parseOnly';

/** LogbookBody / editorial markdown — same order as MOONi chat & review inline. */
export const logbookRemarkPlugins = [remarkGfm, remarkCjkFriendly];
