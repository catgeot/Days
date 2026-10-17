/**
 * Pure access prose glue (no Supabase / Vite). Shared by MOONi polish and festival transport card.
 */

/**
 * One unbreakable unit: fare commas, spaces inside a duration, and the range mark.
 * @param {unknown} value
 */
export function glueAccessUnit(value) {
  return String(value || '')
    .replace(/(\d),(\d)/g, '$1,\u2060$2')
    .replace(/~/g, '\u2060~\u2060')
    .replace(/–/g, '\u2060–\u2060')
    .replace(/ /g, '\u00A0');
}

/** MOONi access prose — keep fare commas and clock/fare ranges intact (not calendar 10/31~11/8). */
export function glueAccessNumbersInProse(value) {
  let out = String(value || '');
  for (let i = 0; i < 6; i += 1) {
    const next = out.replace(/(\d),(\d)/g, '$1,\u2060$2');
    if (next === out) break;
    out = next;
  }
  out = out.replace(
    /(\d{1,3}(?:,\u2060?\d{3})*원)\s*~\s*(\d{1,3}(?:,\u2060?\d{3})*원)/g,
    '$1\u2060~\u2060$2',
  );
  out = out.replace(
    /(\d{1,2}):(\d{2})\s*~\s*(\d{1,2}):(\d{2})/g,
    '$1:\u2060$2\u2060~\u2060$3:\u2060$4',
  );
  return out.replace(/(?<![/\d])(\d{1,2}):(\d{2})(?!\d)/g, '$1:\u2060$2');
}
