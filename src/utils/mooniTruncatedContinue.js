const THINKING_BLOCK_RE = /<thinking>[\s\S]*?<\/thinking>/gi;
const DAY_HEADING_RE =
  /(?:^|\n)\s*(?:#{1,4}\s*)?(?:\*\*)?(\d{1,2})\s*일차(?:\*\*)?[^\n]*/gim;

export const MOONI_CONTINUE_MAX_ATTEMPTS = 2;

export function stripMooniThinkingLeak(text) {
  const raw = String(text ?? '');
  if (!raw) return '';
  return raw.replace(THINKING_BLOCK_RE, '').trim();
}

/** @param {string} text */
export function findLastItineraryDayHeading(text) {
  const raw = String(text ?? '');
  let last = null;
  for (const match of raw.matchAll(DAY_HEADING_RE)) {
    last = match[0].trim();
  }
  return last;
}

/**
 * @param {string} continuation
 * @param {string | null} lastHeading
 */
export function stripLeadingDuplicateDayHeading(continuation, lastHeading) {
  if (!lastHeading) return String(continuation ?? '').trimStart();
  let next = String(continuation ?? '').trimStart();
  const normalizedLast = lastHeading.replace(/\s+/g, ' ').trim();
  const tryStrip = () => {
    const head = next.slice(0, Math.min(next.length, normalizedLast.length + 40));
    if (head.replace(/\s+/g, ' ').includes(normalizedLast.replace(/\s+/g, ' ').slice(0, 12))) {
      const lines = next.split('\n');
      const firstLine = lines[0]?.trim() ?? '';
      if (/일차/.test(firstLine)) {
        next = lines.slice(1).join('\n').trimStart();
      }
    }
  };
  tryStrip();
  if (/^\s*(?:#{1,4}\s*)?(?:\*\*)?\d{1,2}\s*일차/.test(next)) {
    const lastNum = normalizedLast.match(/(\d{1,2})\s*일차/)?.[1];
    const firstNum = next.match(/^\s*(?:#{1,4}\s*)?(?:\*\*)?(\d{1,2})\s*일차/)?.[1];
    if (lastNum && firstNum && lastNum === firstNum) {
      next = next.replace(/^\s*(?:#{1,4}\s*)?(?:\*\*)?\d{1,2}\s*일차[^\n]*\n?/, '').trimStart();
    }
  }
  return next;
}

/**
 * @param {string} priorText
 * @param {string} continuation
 */
export function mergeMooniContinuation(priorText, continuation) {
  const prior = stripMooniThinkingLeak(priorText);
  let next = stripMooniThinkingLeak(continuation);
  const lastHeading = findLastItineraryDayHeading(prior);
  if (lastHeading && next) {
    const lastNum = lastHeading.match(/(\d{1,2})\s*일차/)?.[1];
    const lines = next.split('\n');
    const firstLine = lines[0]?.trim() ?? '';
    const firstNum = firstLine.match(/(\d{1,2})\s*일차/)?.[1];
    if (lastNum && firstNum && lastNum === firstNum) {
      const sameDayTail = firstLine
        .replace(/^\s*(?:#{1,4}\s*)?(?:\*\*)?\d{1,2}\s*일차(?:\*\*)?\s*/i, '')
        .trim();
      const tailLines = [sameDayTail, ...lines.slice(1)].filter(Boolean);
      next = tailLines.join('\n').trim();
    } else {
      next = stripLeadingDuplicateDayHeading(next, lastHeading);
    }
  }
  if (!next) return prior;
  const joiner = prior.endsWith('\n') ? '' : '\n';
  return `${prior}${joiner}${next}`;
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
