const THINKING_BLOCK_RE = /<thinking>[\s\S]*?<\/thinking>/gi;
const DAY_HEADING_LINE_RE =
  /^\s*(?:#{1,4}\s*)?(?:\*\*)?(\d{1,2})\s*일차(?:\*\*)?\s*(.*)$/i;
const DAY_HEADING_INLINE_RE = /(?:\*\*)?(\d{1,2})\s*일차(?:\*\*)?/gi;

export const MOONI_CONTINUE_MAX_ATTEMPTS = 2;

export function stripMooniThinkingLeak(text) {
  const raw = String(text ?? '');
  if (!raw) return '';
  return raw.replace(THINKING_BLOCK_RE, '').trimEnd();
}

/** @param {string} text */
export function ensureItineraryMarkdownLineBreaks(text) {
  let s = String(text ?? '');
  if (!s) return s;
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/([^\n])(\n)?(\*\*\d{1,2}일차\*\*)/g, '$1\n\n$3');
  s = s.replace(/\n{3,}/g, '\n\n');
  if (/\*\*\d{1,2}일차\*\*/.test(s)) {
    s = s.replace(/([^\n])\n(?!\n)/g, '$1  \n');
  }
  return s;
}

/** @param {string} text */
export function dedupeItineraryDayLines(text) {
  const lines = String(text ?? '').split('\n');
  const seenDays = new Set();
  /** @type {string[]} */
  const out = [];
  for (const line of lines) {
    const m = DAY_HEADING_LINE_RE.exec(line);
    if (m) {
      const day = m[1];
      if (seenDays.has(day)) continue;
      seenDays.add(day);
    }
    out.push(line);
  }
  return out.join('\n');
}

function stripRepeatedIntro(prior, continuation) {
  const introLine = prior.split('\n').find((l) => l.trim())?.trim() ?? '';
  if (!introLine || introLine.length < 8) return continuation;
  let next = String(continuation ?? '').trimStart();
  if (next.startsWith(introLine)) {
    next = next.slice(introLine.length).trimStart();
  }
  if (/^미야코지마\s*3박\s*4일\s*일정/i.test(next) && /\(mock\)/i.test(prior)) {
    next = next.replace(/^미야코지마\s*3박\s*4일\s*일정[^\n]*\n?/i, '').trimStart();
  }
  return next;
}

function firstContinuationWord(text) {
  const t = String(text ?? '').trimStart();
  const m = t.match(/^(\S+)/);
  return m ? m[1] : '';
}

function shouldGlueMidWordContinuation(prior, next) {
  const word = firstContinuationWord(next);
  if (!word || word.length >= 3) return false;
  const priorLast = prior.trimEnd().slice(-1);
  return /[가-힣]$/.test(priorLast) && /^[가-힣]/.test(word);
}

function joinAtCutPoint(prior, next) {
  if (!next) return prior;
  if (!prior) return next;
  if (prior.endsWith('\n') || next.startsWith('\n')) {
    return `${prior}${next}`;
  }
  const priorEndsMidSentence = /[^\n.!?…]\s*$/.test(prior) && !/\*\*\d{1,2}일차\*\*\s*$/.test(prior.trimEnd());
  if (priorEndsMidSentence && !/^\s*(?:\*\*)?\d{1,2}\s*일차/.test(next)) {
    if (shouldGlueMidWordContinuation(prior, next)) {
      return `${prior}${next}`;
    }
    const word = firstContinuationWord(next);
    if (word.length >= 3 && /[\p{L}\p{N}]$/u.test(prior.trimEnd())) {
      return `${prior.trimEnd()} ${next.trimStart()}`;
    }
    return `${prior}${next}`;
  }
  return `${prior}\n${next}`;
}

function mergeSameDayContinuation(prior, continuation) {
  const priorLines = prior.split('\n');
  const lastLine = priorLines[priorLines.length - 1] ?? '';
  const lastDay = lastLine.match(/(\d{1,2})\s*일차/)?.[1];
  const contLines = continuation.split('\n');
  const firstLine = contLines[0]?.trim() ?? '';
  const firstDay = firstLine.match(/(\d{1,2})\s*일차/)?.[1];
  if (!lastDay || !firstDay || lastDay !== firstDay) {
    return joinAtCutPoint(prior, continuation);
  }
  const tailOnFirst = firstLine
    .replace(/^\s*(?:#{1,4}\s*)?(?:\*\*)?\d{1,2}\s*일차(?:\*\*)?\s*/i, '')
    .trim();
  const rest = contLines.slice(1).join('\n');
  const mergedLast =
    tailOnFirst ? `${lastLine.trimEnd()} ${tailOnFirst}`.trimEnd() : lastLine;
  const rebuilt = [...priorLines.slice(0, -1), mergedLast];
  if (rest) rebuilt.push(rest);
  return rebuilt.join('\n');
}

/**
 * @param {string} priorText
 * @param {string} continuation
 */
export function mergeMooniContinuation(priorText, continuation) {
  const prior = stripMooniThinkingLeak(priorText);
  let next = stripMooniThinkingLeak(continuation);
  next = stripRepeatedIntro(prior, next);
  let merged = mergeSameDayContinuation(prior, next);
  merged = dedupeItineraryDayLines(merged);
  merged = ensureItineraryMarkdownLineBreaks(merged);
  return merged.trimEnd();
}

/** @param {string} text */
export function listItineraryDayHeadingNumbers(text) {
  /** @type {number[]} */
  const days = [];
  for (const line of String(text).split('\n')) {
    const m = DAY_HEADING_LINE_RE.exec(line);
    if (m) days.push(Number(m[1]));
  }
  return days;
}

/** @param {string} text */
export function assertItineraryDaysOneThroughFour(text) {
  const days = listItineraryDayHeadingNumbers(text);
  const expected = [1, 2, 3, 4];
  assertDaysMatch(days, expected);
  const introCount = (String(text).match(/미야코지마\s*3박\s*4일\s*일정\s*\(mock\)/gi) || []).length;
  if (introCount > 1) {
    throw new Error(`intro duplicated: ${introCount}`);
  }
}

function assertDaysMatch(days, expected) {
  if (days.length !== expected.length) {
    throw new Error(`expected days ${expected.join(',')}, got ${days.join(',')}`);
  }
  for (let i = 0; i < expected.length; i += 1) {
    if (days[i] !== expected[i]) {
      throw new Error(`day order mismatch at ${i}: ${days[i]} vs ${expected[i]}`);
    }
  }
}

/** @param {Array<{ provider?: string, type?: string }>} actions */
export function bookingActionsFingerprint(actions) {
  return JSON.stringify(
    (actions ?? []).map((a) => ({ provider: a.provider, type: a.type })),
  );
}

/** @param {'ko' | 'en' | string} [locale] */
export function buildMooniContinueUserText(locale) {
  const lng = String(locale ?? 'ko').slice(0, 2);
  if (lng === 'en') {
    return [
      'Continue the previous assistant answer only.',
      'Do not repeat what was already written.',
      'Resume exactly where it was cut off.',
      'Do not restart from day 1 or repeat day headings already covered.',
    ].join(' ');
  }
  return [
    '앞 답변을 반복하지 말고 끊긴 지점부터 이어서 작성해 주세요.',
    '이미 쓴 날짜·일차 제목을 다시 시작하지 마세요.',
  ].join(' ');
}

/**
 * @param {{ truncated?: boolean, finishReason?: string, continueAttempts?: number }} meta
 */
export function canShowMooniContinueButton(meta) {
  const attempts = meta?.continueAttempts ?? 0;
  if (attempts >= MOONI_CONTINUE_MAX_ATTEMPTS) return false;
  if (meta?.truncated) return true;
  const reason = String(meta?.finishReason ?? '').toUpperCase();
  return reason === 'MAX_TOKENS';
}
