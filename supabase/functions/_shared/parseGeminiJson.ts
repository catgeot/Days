/**
 * Gemini generateContent 텍스트 → JSON.
 * responseMimeType=application/json 이어도 fence·앞뒤 잡문이 붙는 경우가 있음.
 */
export function parseGeminiJsonText(raw: unknown): unknown {
  let text = String(raw ?? '').trim();
  if (!text) {
    throw new Error('Empty Gemini JSON text');
  }

  // BOM·zero-width
  text = text.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) {
    text = fenced[1].trim();
  } else {
    if (text.startsWith('```json')) text = text.slice(7);
    else if (text.startsWith('```')) text = text.slice(3);
    if (text.endsWith('```')) text = text.slice(0, -3);
    text = text.trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    // 앞뒤 설명문 제거 — 최외곽 object/array
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    const arrStart = text.indexOf('[');
    const arrEnd = text.lastIndexOf(']');

    const trySlice = (start: number, end: number) => {
      if (start < 0 || end <= start) return null;
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    };

    const asObj = trySlice(objStart, objEnd);
    if (asObj !== null) return asObj;

    const asArr = trySlice(arrStart, arrEnd);
    if (asArr !== null) return asArr;

    throw new Error('Gemini did not return valid JSON');
  }
}
