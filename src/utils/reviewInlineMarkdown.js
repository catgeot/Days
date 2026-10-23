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

const URL_SLOT_PREFIX = '\uE000U';
const URL_SLOT_SUFFIX = '\uE001';

/** Letters/digits including Hangul — used for intraword delimiter guard. */
function isReviewPlainAlnum(ch) {
  if (!ch) return false;
  return /[0-9A-Za-z\u3131-\u318E\uAC00-\uD7A3]/.test(ch);
}

function isIntrawordEmphasisDelimiter(text, index, markerLen) {
  const left = text[index - 1];
  const right = text[index + markerLen];
  return isReviewPlainAlnum(left) && isReviewPlainAlnum(right);
}

function protectBareUrls(text) {
  const urls = [];
  const masked = text.replace(/https?:\/\/[^\s<>\])"\]]+/g, (match) => {
    const id = urls.length;
    urls.push(match);
    return `${URL_SLOT_PREFIX}${id}${URL_SLOT_SUFFIX}`;
  });
  return { masked, urls };
}

function restoreBareUrls(text, urls) {
  if (!urls.length) return text;
  return text.replace(
    new RegExp(`${URL_SLOT_PREFIX}(\\d+)${URL_SLOT_SUFFIX}`, 'g'),
    (_, id) => urls[Number(id)] ?? '',
  );
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

function stripDelimitedEmphasis(text, marker, markerLen) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    if (text.startsWith(marker, i) && !isIntrawordEmphasisDelimiter(text, i, markerLen)) {
      let close = i + markerLen;
      let found = -1;
      while (close < text.length) {
        const idx = text.indexOf(marker, close);
        if (idx === -1) break;
        if (!isIntrawordEmphasisDelimiter(text, idx, markerLen)) {
          found = idx;
          break;
        }
        close = idx + markerLen;
      }
      if (found > i) {
        result += text.slice(i + markerLen, found);
        i = found + markerLen;
        continue;
      }
    }
    result += text[i];
    i += 1;
  }
  return result;
}

function stripReviewInlineEmphasis(text) {
  let s = stripDelimitedEmphasis(text, '**', 2);
  s = s.replace(/\*\*([^*]*)$/g, '$1');
  s = s.replace(/\*\*/g, '');
  s = stripDelimitedEmphasis(s, '__', 2);
  s = s.replace(/__([^_]*)$/g, '$1');
  s = s.replace(/__/g, '');
  s = stripDelimitedEmphasis(s, '*', 1);
  s = stripDelimitedEmphasis(s, '_', 1);
  return s;
}

/**
 * Plain text for a11y, fallbacks, and expand-toggle length (no react-markdown render).
 * @param {unknown} text
 */
export function reviewPlainTextForAccessibility(text) {
  return stripReviewInlineMarkdown(text);
}

/**
 * Strip review inline markdown for non-rendered DOM (links + emphasis with intraword guards).
 * @param {unknown} text
 */
export function stripReviewInlineMarkdown(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n');
  const linkStripped = stripReviewInlineLinks(normalized);
  const { masked, urls } = protectBareUrls(linkStripped);
  const stripped = stripReviewInlineEmphasis(masked);
  return restoreBareUrls(stripped, urls);
}
