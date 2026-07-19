/**
 * Gemini generateContent 텍스트 → JSON.
 * responseMimeType=application/json 이어도 fence·앞뒤 잡문·문자열 내 raw 줄바꿈이 붙는 경우가 있음.
 */

/** JSON 문자열 리터럴 안의 raw 제어문자를 이스케이프 */
function escapeRawControlsInJsonStrings(text: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      result += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\" && inString) {
      result += ch;
      escaped = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
      // 기타 제어문자
      const code = ch.charCodeAt(0);
      if (code < 0x20) {
        result += `\\u${code.toString(16).padStart(4, "0")}`;
        continue;
      }
    }

    result += ch;
  }

  return result;
}

function stripTrailingCommas(text: string): string {
  return text.replace(/,\s*([\]}])/g, "$1");
}

function stripCodeFences(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^\uFEFF/, "").replace(/[\u200B-\u200D\uFEFF]/g, "");

  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) {
    return fenced[1].trim();
  }

  if (text.startsWith("```json")) text = text.slice(7);
  else if (text.startsWith("```")) text = text.slice(3);
  if (text.endsWith("```")) text = text.slice(0, -3);
  return text.trim();
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function trySliceParse(text: string, start: number, end: number): unknown | null {
  if (start < 0 || end <= start) return null;
  return tryParseJson(text.slice(start, end + 1));
}

/**
 * 최외곽 array/object 슬라이스 후 파싱.
 * 매거진처럼 `[`로 시작하는 응답은 배열을 우선한다.
 */
function parseOuterJson(text: string): unknown | null {
  const direct = tryParseJson(text);
  if (direct !== null) return direct;

  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  const arrStart = text.indexOf("[");
  const arrEnd = text.lastIndexOf("]");

  const preferArray =
    arrStart >= 0 && (objStart < 0 || arrStart <= objStart);

  if (preferArray) {
    const asArr = trySliceParse(text, arrStart, arrEnd);
    if (asArr !== null) return asArr;
    const asObj = trySliceParse(text, objStart, objEnd);
    if (asObj !== null) return asObj;
  } else {
    const asObj = trySliceParse(text, objStart, objEnd);
    if (asObj !== null) return asObj;
    const asArr = trySliceParse(text, arrStart, arrEnd);
    if (asArr !== null) return asArr;
  }

  return null;
}

export function parseGeminiJsonText(raw: unknown): unknown {
  let text = stripCodeFences(String(raw ?? ""));
  if (!text) {
    throw new Error("Empty Gemini JSON text");
  }

  // 1차: 원문
  let parsed = parseOuterJson(text);
  if (parsed !== null) return parsed;

  // 2차: trailing comma 제거
  parsed = parseOuterJson(stripTrailingCommas(text));
  if (parsed !== null) return parsed;

  // 3차: 문자열 안 raw 줄바꿈/제어문자 이스케이프 (장문 매거진에서 흔함)
  const repaired = escapeRawControlsInJsonStrings(text);
  parsed = parseOuterJson(repaired);
  if (parsed !== null) return parsed;

  parsed = parseOuterJson(stripTrailingCommas(repaired));
  if (parsed !== null) return parsed;

  throw new Error("Gemini did not return valid JSON");
}
