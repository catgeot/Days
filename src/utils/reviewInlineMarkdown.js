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
 * Extract visible text from static markdown HTML (matches browser textContent for our inline schema).
 * @param {unknown} html
 */
export function plainTextFromReviewMarkdownHtml(html) {
  let s = String(html ?? '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/p>\s*<p/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = s
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  return s;
}

function stripReviewInlineLinks(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text[i] === '[') {
      const labelEnd = text.indexOf(']', i + 1);
      if (labelEnd > i && text[labelEnd + 1] === '(') {
        let depth = 1;
        let j = labelEnd + 2;
        while (j < text.length && depth > 0) {
          const ch = text[j];
          if (ch === '(') depth += 1;
          else if (ch === ')') depth -= 1;
          j += 1;
        }
        if (depth === 0) {
          result += text.slice(i + 1, labelEnd);
          i = j;
          continue;
        }
      }
    }
    result += text[i];
    i += 1;
  }
  return result;
}

function stripReviewInlineEmphasis(text) {
  let s = text;
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*\*([^*]*)$/g, '$1');
  s = s.replace(/\*\*/g, '');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/__([^_]*)$/g, '$1');
  s = s.replace(/__/g, '');
  s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1');
  s = s.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1');
  return s;
}

/**
 * Regex fallback when markdown cannot be rendered (expand toggle length, hub previews, etc.).
 * @param {unknown} text
 */
export function stripReviewInlineMarkdown(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n');
  return stripReviewInlineEmphasis(stripReviewInlineLinks(normalized));
}
