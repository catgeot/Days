/**
 * Chip taps send a long instruction to the model. The user bubble shows a short label.
 * Restored threads that still store the instruction map back to the same label.
 */
const FESTIVAL_CHIP_BUBBLES = [
  {
    sendKo: '이 축제에서 볼 수 있는 것과 현장 분위기를 알려줘. 확인된 프로그램과 시간만 말하고, 데이터에 없는 붐비는 시간은 지어내지 마.',
    sendEn: 'What can I actually see and do at this festival, and what is the on-site feel? Use only confirmed programs and hours. Do not invent crowd times.',
    bubbleKo: '볼거리·분위기 알려 줘',
    bubbleEn: 'Tell me the sights and atmosphere',
  },
  {
    sendKo: '축제장 근처에서 먹을 곳과 함께 들를 곳을 알려줘. 먹을 곳은 GATEO 주변 맛집 목록만 말하고, 생활문화센터·복지·목욕·터널은 넣지 마. 없는 맛집은 지어내지 마.',
    sendEn: 'What can I eat and where else can I stop near this festival? For food, use only the nearby restaurant list on this festival page. Do not mention community centers, welfare centers, bathhouses, or tunnels. Do not invent restaurants.',
    bubbleKo: '근처 먹고 둘러볼 곳 알려 줘',
    bubbleEn: 'What to eat and where to stop nearby',
  },
  {
    sendKo: '이 축제를 넣어 하루 동선을 짜줘. 확인된 일정과 장소만 쓰고, 없는 프로그램은 지어내지 마.',
    sendEn: 'Plan a one-day route that includes this festival. Use only confirmed dates and places. Do not invent programs.',
    bubbleKo: '하루 동선 짜 줘',
    bubbleEn: 'Plan a one-day route',
  },
  {
    sendKo: '이 축제에 오려면 입국과 비자, 준비 서류를 알려줘. 확인되지 않은 면제나 금액은 단정하지 마.',
    sendEn: 'What entry, visa, and documents do I need for this festival? Do not assert exemptions or fees that are not confirmed.',
    bubbleKo: '입국·비자 알려 줘',
    bubbleEn: 'Tell me about entry and visas',
  },
  {
    sendKo: '이 축제에 오는 항공권은 GATEO 화면의 항공권 검색으로 어떻게 찾는지 알려줘. 링크 없는 외부 사이트로 보내지 마.',
    sendEn: 'How do I find flights for this festival using GATEO\'s on-screen flight search? Do not send me to an outside site without a link.',
    bubbleKo: '항공권 찾는 법 알려 줘',
    bubbleEn: 'How do I find flights',
  },
  {
    sendKo: '공항에서 이 축제장까지 가는 법을 알려줘. 확인되지 않은 셔틀은 말하지 마.',
    sendEn: 'How do I get from the airport to this festival? Use airport codes. Do not invent shuttles.',
    bubbleKo: '공항에서 축제장까지 알려 줘',
    bubbleEn: 'How do I get from the airport',
  },
];

function compact(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

/** Short label for a chip instruction. Other text is returned unchanged. */
export function mooniUserBubbleText(text) {
  const raw = compact(text);
  if (!raw) return '';
  const row = FESTIVAL_CHIP_BUBBLES.find((item) => item.sendKo === raw || item.sendEn === raw);
  if (!row) return raw;
  return row.sendEn === raw ? row.bubbleEn : row.bubbleKo;
}

/** Instruction for the model. The bubble label stays on `text`. */
export function mooniUserPromptText(message) {
  const prompt = compact(message?.mooniPromptText);
  if (prompt) return prompt;
  if (!message) return '';
  if (typeof message.text === 'object') return compact(message.text?.text);
  return compact(message.text);
}
