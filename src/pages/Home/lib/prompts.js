// src/pages/Home/lib/prompts.js

import { getMooniPromptBundle, fillMooniPromptTemplate } from '../../../i18n/mooniPromptBundles.js';

export { getCurationPrompt } from './curationPrompt.js';

export const PERSONA_TYPES = {
  INSPIRER: 'INSPIRER',
  PLANNER: 'PLANNER',
  ARCHITECT: 'ARCHITECT',
  CONCIERGE: 'CONCIERGE',
  GENERAL: 'GENERAL',
};

export const PROMPT_STORAGE = {
  [PERSONA_TYPES.INSPIRER]: { temperature: 0.8 },
  [PERSONA_TYPES.PLANNER]: { temperature: 0.5 },
  [PERSONA_TYPES.ARCHITECT]: { temperature: 0.4 },
  [PERSONA_TYPES.CONCIERGE]: { temperature: 0.2 },
  [PERSONA_TYPES.GENERAL]: { temperature: 0.7 },
};

function buildPersonaSystem(personaType, bundle) {
  const personaBody = bundle.personas[personaType] ?? bundle.personas.GENERAL;
  const usesBooking = bundle.personaUsesBooking[personaType];
  return (
    bundle.baseRules +
    (usesBooking ? bundle.bookingRules : '') +
    personaBody
  );
}

export const getSystemPrompt = (personaType, locationName = '', options = {}) => {
  const bundle = getMooniPromptBundle(options.locale);
  const boundPlaceName = String(options.boundPlaceName ?? '').trim();
  const isMooni =
    options.isMooni ||
    Boolean(boundPlaceName) ||
    String(locationName ?? '').trim().toLowerCase() === 'mooni';
  const mooniContext = isMooni ? `\n${bundle.mooniDestinationRules}` : '';
  const effectiveLocation = boundPlaceName || locationName;
  const locationContext = effectiveLocation
    ? `\n${fillMooniPromptTemplate(bundle.locationContext, { location: effectiveLocation })}`
    : '';
  const boundPlaceRules = boundPlaceName
    ? `\n${fillMooniPromptTemplate(bundle.boundPlace, { name: boundPlaceName })}`
    : '';
  const ctaHint = String(options.chatCtaHint ?? '').trim();
  const chipHint = String(options.chipPromptHint ?? '').trim();
  const ctaContext = ctaHint ? `\n${ctaHint}` : '';
  const chipContext = chipHint ? `\n${chipHint}` : '';

  return (
    buildPersonaSystem(personaType, bundle) +
    mooniContext +
    locationContext +
    boundPlaceRules +
    chipContext +
    ctaContext
  );
};

/** 채팅 모달 최초 진입 시 보여줄 여행지 한줄 요약 (DB 캐시용) */
export const getPlaceChatIntroSystemPrompt = (locale) => {
  const bundle = getMooniPromptBundle(locale);
  return `${bundle.baseRules}
${bundle.introRole}
${bundle.introSystem}`;
};

export const getPracticalInfoPrompt = (locationName) => {
  return `당신은 제미나이의 강력한 웹 검색 능력을 활용하는 [${locationName}]의 베테랑 로컬 가이드입니다.
위키백과 같은 뻔한 역사나 지리적 설명은 철저히 배제하고, 당장 내일 이곳으로 여행을 떠날 시크릿 꿀팁 등 "가장 최신의 실용적이고 생생한 현지 정보"만 제공하세요.

반드시 아래 5가지 항목을 포함하여 마크다운(Markdown) 형식으로 가독성 좋고 깔끔하게 정리해주세요:

1. 🛂 필수 입국 및 비용 정보
- 한국인 기준 비자 필요 여부
- 관광세, 숙박세, 항만세 등 숨겨진 추가 비용 여부
- 한국발 직항 여부 및 대략적인 비행 시간

2. ⚠️ 실전 안전 및 치안 체크
- 현재 특별히 주의해야 할 위험성 (소매치기 다발 구역, 최근 이슈 등)
- 현지에서 절대 하면 안 되는 금기사항이나 에티켓

3. 📈 현지 최신 트렌드
- 최근 관광객보다 현지인들에게 가장 뜨고 있는 핫플 1~2곳
- 예전엔 유명했지만 현재는 쇠락했거나 과대평가되어 방문을 비추천하는 곳 1곳과 그 이유

4. 🍽️ 관광객이 모르는 찐 로컬 맛집
- 구글 리뷰용 관광 식당이 아닌, 현지인들이 줄 서서 먹는 진짜 로컬 맛집 2곳과 시그니처 메뉴

5. 💡 로컬 가이드의 시크릿 꿀팁
- 교통권 구매, 환전 팁, 혹은 특정 명소에 방문하기 가장 좋은 비밀 시간대 등 실전 꿀팁 1가지

답변은 간결하고 현실적이며, 여행자의 가슴을 뛰게 하는 세련된 매거진 톤으로 작성하세요.`;
};

// LogBook 전용 프롬프트 생성 함수
export const getLogbookPrompt = (mode, date, location, content, imageCount = 0) => {
  const safeDate = date || '날짜 미상';
  const safeLocation = location || '장소 미상';
  const safeContent = content || '(내용 없음)';

  const imageInstruction = imageCount > 0
    ? `\n[중요 지시사항: 블로그 사진 배치]\n사용자가 총 ${imageCount}장의 사진을 첨부했습니다. 당신은 사진의 내용을 시각적으로 분석할 수 있습니다. 글을 작성할 때, 문맥상 사진이 들어가야 할 최적의 위치에 반드시 '[사진1]', '[사진2]' (숫자는 사진 순서) 형식으로 치환자를 정확히 삽입하세요. (예: "눈앞에 펼쳐진 에메랄드빛 바다는 경이로웠습니다. [사진1] 그곳에서 마신 칵테일은...")`
    : '';

  const baseContext = `
다음은 사용자가 흩어진 생각들을 대략적으로 기록한 파편화된 메모입니다.
- 여행 날짜: ${safeDate}
- 여행 장소: ${safeLocation}
- 사용자의 원본 메모: "${safeContent}"${imageInstruction}
`;

  if (mode === 'essay') {
    return `당신은 사람들의 마음을 움직이는 섬세하고 세련된 브런치(Brunch) 작가이자 여행 에세이스트입니다.${baseContext}
이 메모와 첨부된 사진을 바탕으로, 사람이 직접 쓴 듯 자연스럽고 감각적인 여행 에세이를 작성해주세요.

[가이드라인]
1. 자연스러운 도입부: "2014년 11월, 보라카이에서의 며칠", "오래된 필름처럼..." 등 과도하게 꾸며진 일기장식 도입부를 쓰지 마세요. 사용자의 메모에 있는 상황이나 대화, 특정 물건 등 일상적인 소재로 바로 시작하세요.
2. 팩트 우선(Fact-Check): 원본 메모에 언급된 동행인, 구체적인 날짜, 장소, 에피소드, 감정선 등을 절대 누락하거나 임의로 변경하지 마세요. 특히 '가족/친구'가 언급되었는데 '혼자만의 시간'처럼 왜곡하지 마세요.
3. 과장된 감상 금지: "시간이 멈춘 듯한", "평화롭기 그지없는", "그 자체로 또 다른 휴식", "하나의 작품처럼" 등 기계적이고 상투적인 미사여구를 철저히 배제하세요. 감정은 단어(형용사)로 직접 나열하지 말고 구체적인 행동이나 풍경 묘사를 통해 은유적으로 전달하세요.
4. 담백한 문체: 너무 폼 잡는 듯한 문어체를 버리고, 친한 친구나 독자에게 담담하게 이야기하듯 자연스럽고 편안한 독백체(~했습니다, ~더군요, ~였어요)를 사용하세요.
5. 시각 자료(사진)와의 자연스러운 연결: 첨부된 사진(들)을 단순 나열하지 마세요. 글의 흐름 속에서 자연스럽게 시선이 머무는 곳을 묘사하여 공간의 분위기(빛, 소리, 공기)를 살려주세요.
6. 출력 형식: 불필요한 서론이나 요약 없이 바로 본문만 작성하세요.`;
  }

  if (mode === 'sns') {
    return `당신은 팔로워들의 이목을 끄는 트렌디한 인스타그램/틱톡 여행 인플루언서입니다.${baseContext}
이 메모와 첨부된 사진을 바탕으로, 즉시 SNS 피드나 블로그 숏폼으로 업로드할 수 있는 매력적인 글을 작성해주세요.
- 문체는 발랄하고 톡톡 튀며, 모바일에서 읽기 편하게 짧은 문장과 줄바꿈을 적극 활용하세요.
- 시각적으로 지루하지 않게 이모지(✨, 🌴, ✈️, 📸 등)를 적절히 배치하세요.
- 글의 맨 마지막에는 장소와 분위기에 어울리는 센스 있는 해시태그 5~7개를 덧붙여주세요.
- 불필요한 인사말이나 서론 없이, 곧바로 본문만 출력하세요.`;
  }

  return "";
};

export const getReviewPrompt = (locationName, rating, content) => {
  return `당신은 사용자의 여행지 리뷰 작성을 돕는 유능하고 세련된 AI 어시스턴트입니다.
현재 장소는 '${locationName}'이며, 사용자가 부여한 별점은 ${rating}/5점입니다.
사용자가 지금까지 작성한 메모는 다음과 같습니다: "${content || '아직 작성된 내용이 없습니다.'}"

위 정보를 바탕으로 다른 여행자들에게 도움이 될 만한 매력적인 리뷰 초안을 작성해주세요.
- 별점에 맞는 톤앤매너를 유지하세요. (예: 5점이면 극찬, 3점이면 아쉬운 점 포함)
- 기존 사용자가 작성한 문장이 있다면 그 문맥을 자연스럽게 이어받아 보강하세요.
- 길이는 4~5문장 내외로 간결하게 작성하되, 가독성을 위해 문맥이 전환될 때마다 반드시 엔터(줄바꿈)를 넣어 문단을 나누어주세요.
- 이모지를 적절히 사용하여 읽기 좋게 만들어주세요.
- 불필요한 인사말이나 서론 없이 바로 본문만 출력하세요.`;
};
