/**
 * MOONi / Gemini user-visible text — strip model planning leaks (Draft, Stick to…, etc.).
 * Imported by gemini-proxy (Deno) and place_chat_intro save path (Vite).
 */

const LEAK_MARKERS = [
  /\bStick to\b/i,
  /\*\*Draft\b/,
  /\bDraft\s*:/i,
  /historical\/visual/i,
  /\bReasoning\s*:/i,
  /\*\*Thinking:\*\*/i,
  /^\s*Thinking\s*:/im,
  /chain-of-thought/i,
  /\bscratch\s*pad\b/i,
  /^\s*\d+\.\s*\*\*Draft/im,
];

export function hasMooniLeakMarkers(text) {
  if (!text || typeof text !== "string") return false;
  return LEAK_MARKERS.some((rx) => rx.test(text));
}

function findFirstHangulIndex(text) {
  const m = text.match(/[\u3131-\uD79D]/);
  return m ? m.index : -1;
}

function looksLikeEnglishPlanningPrefix(prefix) {
  const trimmed = prefix.trim();
  if (!trimmed) return false;
  if (hasMooniLeakMarkers(trimmed)) return true;
  const compact = trimmed.replace(/\s/g, "");
  if (compact.length < 16) return false;
  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  if (latin / compact.length < 0.45) return false;
  return /\b(per year|facts|outline|Draft|visual|tourists)\b/i.test(trimmed);
}

function stripLeadingLeakLines(text) {
  const lines = text.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    if (hasMooniLeakMarkers(trimmed)) {
      i += 1;
      continue;
    }
    if (/^\d+\.\s*\*\*/.test(trimmed) && /[A-Za-z]{8,}/.test(trimmed)) {
      i += 1;
      continue;
    }
    if (looksLikeEnglishPlanningPrefix(trimmed) && findFirstHangulIndex(trimmed) < 0) {
      i += 1;
      continue;
    }
    break;
  }
  return lines.slice(i).join("\n").trim();
}

/**
 * @param {string} text
 * @returns {string}
 */
export function sanitizeGeminiUserText(text) {
  if (text == null || typeof text !== "string") return "";
  let out = text;

  const koIdx = findFirstHangulIndex(out);
  if (koIdx > 0) {
    const prefix = out.slice(0, koIdx);
    if (hasMooniLeakMarkers(prefix) || looksLikeEnglishPlanningPrefix(prefix)) {
      out = out.slice(koIdx).trimStart();
    }
  }

  out = stripLeadingLeakLines(out);
  return out.trim();
}

/**
 * @param {string} text
 * @returns {string|null} reason code when leak detected
 */
export function detectMooniReplyLeak(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  for (const rx of LEAK_MARKERS) {
    if (rx.test(trimmed)) return `pattern:${rx.source}`;
  }

  const koIdx = findFirstHangulIndex(trimmed);
  if (koIdx > 0) {
    const prefix = trimmed.slice(0, koIdx);
    if (looksLikeEnglishPlanningPrefix(prefix) || hasMooniLeakMarkers(prefix)) {
      return "english_planning_prefix";
    }
  }

  return null;
}
