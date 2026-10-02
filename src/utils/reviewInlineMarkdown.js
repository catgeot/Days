const DISABLED_CONSTRUCTS = [
  'headingAtx',
  'setextUnderline',
  'list',
  'blockQuote',
  'codeFenced',
  'codeIndented',
  'codeText',
  'thematicBreak',
  'htmlFlow',
  'htmlText',
  'autolink',
  'labelStartImage',
];

/** Micromark: bold, links, paragraphs, and breaks only. */
export function remarkReviewInlineOnly() {
  const data = this.data();
  const extensions = data.micromarkExtensions || (data.micromarkExtensions = []);
  extensions.push({ disable: { null: DISABLED_CONSTRUCTS } });
}

export const reviewInlineSanitizeSchema = {
  tagNames: ['p', 'strong', 'a', 'br'],
  attributes: {
    a: ['href', 'target', 'rel'],
  },
  protocols: {
    href: ['https', 'tel'],
  },
};

/**
 * https:// stays. tel:+digits after stripping spaces and hyphens. Everything else is empty.
 * @param {unknown} url
 */
export function reviewInlineUrlTransform(url) {
  const trimmed = String(url ?? '').trim();
  if (trimmed.startsWith('https://')) return trimmed;
  const tel = trimmed.replace(/[\s-]/g, '');
  if (/^tel:\+[0-9]{6,15}$/.test(tel)) return tel;
  return '';
}

const GATEO_PREFIX = 'https://www.gateo.kr/';

/**
 * @param {string} href
 * @returns {{ href: string, target?: string, rel?: string } | null}
 */
export function reviewInlineLinkProps(href) {
  if (!href) return null;
  if (href.startsWith('tel:')) return { href };
  if (href.startsWith(GATEO_PREFIX)) return { href };
  if (href.startsWith('https://')) {
    return { href, target: '_blank', rel: 'noopener noreferrer nofollow' };
  }
  return null;
}

/**
 * Keep newline characters so `whitespace-pre-wrap` matches plain reviews.
 * A blank line stays one line box (`\n` + nbsp + `\n`) instead of a new `<p>`,
 * which would drop the gap or double it next to a hard `<br>`.
 */
export function prepareReviewInlineMarkdown(text) {
  let next = String(text ?? '').replace(/\r\n/g, '\n');
  while (next.includes('\n\n')) {
    next = next.replaceAll('\n\n', '\n\u00a0\n');
  }
  return next;
}

/**
 * Visible letters used for the expand toggle (`**X**` → X, `[L](u)` → L).
 * @param {unknown} text
 */
export function stripReviewInlineMarkdown(text) {
  return String(text ?? '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]*)\*\*/g, '$1');
}
