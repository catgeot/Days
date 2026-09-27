export function applyMarkdownWrap(text, start, end, prefix, suffix = prefix) {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  if (selected) {
    return {
      value: `${before}${prefix}${selected}${suffix}${after}`,
      selectionStart: start + prefix.length,
      selectionEnd: end + prefix.length,
    };
  }

  const placeholder = 'text';
  const inserted = `${prefix}${placeholder}${suffix}`;
  return {
    value: `${before}${inserted}${after}`,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + placeholder.length,
  };
}

export function insertAtCursor(text, start, end, snippet, { block = false } = {}) {
  const before = text.slice(0, start);
  const after = text.slice(end);

  let lead = '';
  let trail = '';
  if (block) {
    if (before.length > 0 && !before.endsWith('\n')) lead = before.endsWith('\n\n') ? '' : (before.endsWith('\n') ? '\n' : '\n\n');
    if (after.length > 0 && !after.startsWith('\n')) trail = after.startsWith('\n\n') ? '' : (after.startsWith('\n') ? '\n' : '\n\n');
  }

  const insert = `${lead}${snippet}${trail}`;
  const cursorAt = before.length + lead.length + snippet.length;
  return {
    value: before + insert + after,
    selectionStart: cursorAt,
    selectionEnd: cursorAt,
  };
}

export function toggleLineHeading(text, start, end, level = 2) {
  const prefix = `${'#'.repeat(level)} `;
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const nextBreak = text.indexOf('\n', end);
  const lineEnd = nextBreak === -1 ? text.length : nextBreak;
  const line = text.slice(lineStart, lineEnd);

  let newLine;
  if (line.startsWith(prefix)) {
    newLine = line.slice(prefix.length);
  } else {
    newLine = line.replace(/^#{1,6}\s+/, '');
    newLine = `${prefix}${newLine}`;
  }

  const value = text.slice(0, lineStart) + newLine + text.slice(lineEnd);
  const delta = newLine.length - line.length;
  return {
    value,
    selectionStart: Math.max(lineStart, start + delta),
    selectionEnd: Math.max(lineStart, end + delta),
  };
}

export function buildLogbookMomentPlaceholder(index) {
  return `[사진 ${index + 1}]`;
}
