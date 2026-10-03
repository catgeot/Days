const NAMED = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
};

export function decodeHtmlEntities(input) {
  if (input == null || input === '') return '';
  const str = String(input);
  return str
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
      if (body[0] === '#') {
        const isHex = body[1] === 'x' || body[1] === 'X';
        const numStr = isHex ? body.slice(2) : body.slice(1);
        const code = parseInt(numStr, isHex ? 16 : 10);
        if (!Number.isFinite(code)) return match;
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      const lower = body.toLowerCase();
      if (Object.hasOwn(NAMED, body)) return NAMED[body];
      if (Object.hasOwn(NAMED, lower)) return NAMED[lower];
      return match;
    });
}
