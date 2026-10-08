/**
 * ChatModal 헤더 「📋 플래너 보기」와 동일 조건 — catalog place slug 있을 때만 true.
 * @param {string | null | undefined} catalogPlaceSlug
 */
export function mooniChatShowsPlannerHeaderButton(catalogPlaceSlug) {
  return Boolean(String(catalogPlaceSlug ?? '').trim());
}

const KO_HEADER_PHANTOM_RULE =
  '플래너·예약 안내는 답변 아래 UI 버튼과 채팅 헤더 「플래너 보기」로 연결된다.';
const KO_HEADER_NO_BUTTON_RULE =
  '플래너·예약 안내는 답변 아래 UI 버튼으로만 연결한다. 이 채팅 헤더에는 플래너 버튼이 없으므로 헤더 플래너를 언급하지 않는다.';

const EN_HEADER_PHANTOM_RULE =
  'Planner/booking help is via UI buttons below and the header "Open planner".';
const EN_HEADER_NO_BUTTON_RULE =
  'Planner/booking help is via UI buttons below only. This chat header has no planner button — do not mention a header planner.';

/**
 * @param {string} rules
 * @param {boolean} showPlannerHeader
 */
export function applyMooniDestinationRulesPlannerVisibility(rules, showPlannerHeader) {
  if (showPlannerHeader || !rules) return rules;
  return rules
    .replace(KO_HEADER_PHANTOM_RULE, KO_HEADER_NO_BUTTON_RULE)
    .replace(EN_HEADER_PHANTOM_RULE, EN_HEADER_NO_BUTTON_RULE);
}

const CHIP_RULE_HEADER_RE =
  /\ud5e4\ub354\s*「?\s*(?:\ud83d\udccb\s*)?\ud50c\ub798\ub108\s*\ubcf4\uae30|header\s*["「]?\s*(?:\ud83d\udccb\s*)?Open planner/iu;

/**
 * @param {string[]} rules
 * @param {boolean} showPlannerHeader
 */
export function filterMooniChipRulesForPlannerHeader(rules, showPlannerHeader) {
  if (showPlannerHeader || !Array.isArray(rules)) return rules;
  return rules.filter((rule) => !CHIP_RULE_HEADER_RE.test(String(rule)));
}

const CTA_HEADER_KEYS = new Set([
  'plannerHeaderOnly',
  'transportOnlyHeader',
  'fullPlanner',
]);

const GATEO_PLANNER_NOTE_KO_WITH_HEADER =
  '- 「GATEO 플래너」는 위 플래너 버튼·헤더를 가리킨다. 본문에 가짜 [버튼] 문구를 쓰지 않는다.';
const GATEO_PLANNER_NOTE_KO_NO_HEADER =
  '- 「GATEO 플래너」는 답변 아래 플래너·예약 UI를 가리킨다. 본문에 가짜 [버튼] 문구를 쓰지 않는다.';

const GATEO_PLANNER_NOTE_EN_WITH_HEADER =
  '- "GATEO planner" means the planner buttons and header above. Do not use fake [button] text in the body.';
const GATEO_PLANNER_NOTE_EN_NO_HEADER =
  '- "GATEO planner" means planner/booking UI below the reply. Do not use fake [button] text in the body.';

/**
 * @param {string} note
 * @param {boolean} showPlannerHeader
 * @param {'ko'|'en'} locale
 */
export function applyMooniGateoPlannerNoteVisibility(note, showPlannerHeader, locale = 'ko') {
  if (showPlannerHeader) return note;
  const isEn = locale === 'en';
  if (isEn) {
    if (note === GATEO_PLANNER_NOTE_EN_WITH_HEADER) return GATEO_PLANNER_NOTE_EN_NO_HEADER;
    return note.replace(/planner buttons and header above/i, 'planner/booking UI below the reply');
  }
  if (note === GATEO_PLANNER_NOTE_KO_WITH_HEADER) return GATEO_PLANNER_NOTE_KO_NO_HEADER;
  return note.replace(/플래너 버튼·헤더를/g, '답변 아래 플래너·예약 UI를');
}

/**
 * @param {Record<string, string>} cta
 * @param {boolean} showPlannerHeader
 */
export function shouldIncludeMooniCtaPlannerHeaderLine(key, showPlannerHeader) {
  if (showPlannerHeader) return true;
  return !CTA_HEADER_KEYS.has(key);
}

/** Tests: planner-button guidance markers in assembled system prompt */
export const MOONI_PLANNER_HEADER_GUIDANCE_MARKERS = [
  '플래너 보기',
  'Open planner',
  'Planner header',
];

/**
 * @param {string} text
 */
export function countMooniPlannerHeaderGuidance(text) {
  const hay = String(text ?? '');
  let n = 0;
  for (const marker of MOONI_PLANNER_HEADER_GUIDANCE_MARKERS) {
    let idx = 0;
    while ((idx = hay.indexOf(marker, idx)) !== -1) {
      n += 1;
      idx += marker.length;
    }
  }
  return n;
}
