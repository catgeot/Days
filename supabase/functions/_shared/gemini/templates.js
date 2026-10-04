import { EN, KO } from "./mooniPromptBundleData.js";

const FLIGHT_CHIPS = new Set([
  "prep_flight",
  "access_origin",
  "from_seoul",
  "from_busan",
  "from_incheon",
  "ferry",
]);

const PROFILE_CHIPS = new Set(["prep_transport", "prep_hotel", "visa_docs"]);

const TASTE_KO = {
  sea: "바다·섬",
  nature: "산·자연",
  city: "도시·건축",
  culture: "문화·유적",
  adventure: "오지·모험",
  quiet: "조용한 휴식",
  warm: "따뜻·온화",
  cool: "선선·고지",
  tropical: "열대·습윤",
  winter: "겨울·추위",
  snow: "눈·설경",
  rainy: "우기·비·흐림",
  four_season: "사계절 뚜렷",
  midnight_sun: "백야",
  polar_night: "흑야",
  aurora: "오로라",
  slow: "느긋한 휴식",
  active: "걷기·액티비티",
  local: "로컬·일상 체험",
  photo: "풍경·사진 명소",
  secluded: "한적·거의 비어 있는",
  balanced: "적당한 활기",
  lively: "생동감 있는 거리",
  asia: "아시아",
  europe: "유럽",
  americas: "아메리카",
  oceania: "오세아니아·태평양",
  africa: "아프리카·중동",
};

const TASTE_EN = {
  sea: "Sea & islands",
  nature: "Mountains & nature",
  city: "City & architecture",
  culture: "Culture & heritage",
  adventure: "Off the beaten path",
  quiet: "Quiet retreat",
  warm: "Warm & mild",
  cool: "Cool & highland",
  tropical: "Tropical & humid",
  winter: "Cold winter",
  snow: "Snow scenery",
  rainy: "Rainy season",
  four_season: "Four distinct seasons",
  midnight_sun: "Midnight sun",
  polar_night: "Polar night",
  aurora: "Aurora",
  slow: "Slow relaxation",
  active: "Walking & activities",
  local: "Local everyday life",
  photo: "Scenic photo spots",
  secluded: "Secluded & empty",
  balanced: "Moderately lively",
  lively: "Lively streets",
  asia: "Asia",
  europe: "Europe",
  americas: "Americas",
  oceania: "Oceania & Pacific",
  africa: "Africa & Middle East",
};

export function bundleFor(locale) {
  const raw = locale?.slice?.(0, 2) ?? locale;
  return raw === "en" ? EN : KO;
}

export function fillTemplate(template, vars = {}) {
  return Object.entries(vars).reduce(
    (out, [key, value]) => out.replaceAll(`{{${key}}}`, String(value ?? "")),
    template,
  );
}

function pushFlightLines(lines, ssot, flight) {
  if (!flight) return;
  if (flight.arrivalIata) lines.push(fillTemplate(ssot.arrivalIata, { label: flight.arrivalIata }));
  if (flight.toolkitIatas) lines.push(fillTemplate(ssot.toolkitIatas, { labels: flight.toolkitIatas }));
  if (flight.flightSearch) lines.push(fillTemplate(ssot.flightSearch, { hint: flight.flightSearch }));
  if (flight.routeNote) lines.push(fillTemplate(ssot.routeNote, { note: flight.routeNote }));
  if (flight.journeyTimeline) {
    lines.push(fillTemplate(ssot.journeyTimeline, { timeline: flight.journeyTimeline }));
  }
  if (flight.flightAdvice) lines.push(fillTemplate(ssot.flightAdvice, { advice: flight.flightAdvice }));
  if (flight.departure && flight.departure.label) {
    lines.push(fillTemplate(ssot.departureKnown, {
      label: flight.departure.label,
      extra: flight.departure.extra || "",
    }));
  } else if (flight.departureDefault) {
    lines.push(ssot.departureDefault);
  }
}

function pushProfileLines(lines, ssot, profile) {
  if (!profile) return;
  if (profile.ferryRequired) lines.push(ssot.ferryRequired);
  if (profile.noCarOnIsland) lines.push(ssot.noCarOnIsland);
  if (profile.ferryStep) lines.push(fillTemplate(ssot.ferryStep, { step: profile.ferryStep }));
  if (profile.preTravel) lines.push(fillTemplate(ssot.preTravel, { titles: profile.preTravel }));
}

export function renderChipHint(locale, chipId, facts) {
  const bundle = bundleFor(locale);
  const guide = bundle.chips?.[chipId];
  if (!guide) return "";
  const lines = [
    "",
    fillTemplate(bundle.chipTopicHeader, { title: guide.title }),
    bundle.chipPriority,
    ...guide.rules.map((rule) => `- ${rule}`),
  ];
  const ssotLines = [];
  const ssot = bundle.ssot;
  if (FLIGHT_CHIPS.has(chipId)) {
    pushFlightLines(ssotLines, ssot, facts?.flight);
    pushProfileLines(ssotLines, ssot, facts?.profile);
  } else if (PROFILE_CHIPS.has(chipId)) {
    pushProfileLines(ssotLines, ssot, facts?.profile);
    if (chipId === "prep_transport" && facts?.arrivalAirport) {
      ssotLines.push(fillTemplate(ssot.arrivalAirport, { label: facts.arrivalAirport }));
    }
  }
  if (ssotLines.length > 0) lines.push("", bundle.ssotHeader, ...ssotLines);
  return lines.join("\n");
}

export function renderCtaHint(locale, code, placeName) {
  const bundle = bundleFor(locale);
  const cta = bundle.cta;
  const place = String(placeName ?? "").trim() || cta.destinationFallback;
  const lines = ["", cta.header, cta.noTicketSearch];
  if (code === "none_transport") {
    lines.push(fillTemplate(cta.transportOnlyPlanner, { place }), cta.transportOnlyHeader);
    return lines.join("\n");
  }
  if (code === "none_quiet") {
    lines.push(cta.noBookingShow, cta.plannerHeaderOnly, cta.noPhantomButtons);
    return lines.join("\n");
  }
  const hasPrep = code.startsWith("prep_") || code.startsWith("both");
  const hasTransport = code === "transport" || code === "transport_flight" || code.startsWith("both");
  const hasTripCom = code === "transport_flight" || code === "both_flight";
  if (hasPrep) lines.push(cta.prepSection);
  if (hasTransport) {
    lines.push(cta.transportSection);
    if (hasTripCom) lines.push(fillTemplate(cta.flightPlannerScroll, { place }));
  }
  if (!hasTransport) lines.push(cta.noTransportSection);
  if (code === "prep_transfer") {
    lines.push(fillTemplate(cta.transportOnlyPlanner, { place }));
  } else if (code.startsWith("prep_") && code !== "prep_transfer") {
    const targetKey = code.slice("prep_".length);
    lines.push(fillTemplate(cta.prepPlannerScroll, {
      target: cta.prepTargets[targetKey] || cta.prepTargets.default,
    }));
  }
  lines.push(cta.fullPlanner, cta.gateoPlannerNote);
  if (hasTransport) lines.push(cta.moreOptions);
  return lines.join("\n");
}

export function renderTripSessionHint(locale, session) {
  if (!session || typeof session !== "object") return "";
  const has = Boolean(
    session.stayLabel ||
      session.nights != null ||
      session.days != null ||
      session.arrivalIata ||
      session.departureIata ||
      session.arrivalTime ||
      session.flightNumber ||
      session.condition ||
      session.companions ||
      session.currentArea ||
      (Array.isArray(session.notes) && session.notes.length > 0),
  );
  if (!has) return "";
  const block = bundleFor(locale).tripSession;
  if (!block) return "";
  const lines = [block.header, block.priority];
  if (session.stayLabel) lines.push(fillTemplate(block.stay, { label: session.stayLabel }));
  if (session.arrivalAirportLabel || session.arrivalIata) {
    lines.push(fillTemplate(block.arrivalAirport, {
      label: session.arrivalAirportLabel || session.arrivalIata,
    }));
  }
  if (session.departureAirportLabel || session.departureIata) {
    lines.push(fillTemplate(block.departureAirport, {
      label: session.departureAirportLabel || session.departureIata,
    }));
  }
  if (session.arrivalTime) lines.push(fillTemplate(block.arrivalTime, { label: session.arrivalTime }));
  if (session.flightNumber) lines.push(fillTemplate(block.flightNumber, { label: session.flightNumber }));
  if (session.condition) lines.push(fillTemplate(block.condition, { label: session.condition }));
  if (session.companions) lines.push(fillTemplate(block.companions, { label: session.companions }));
  if (session.currentArea) lines.push(fillTemplate(block.currentArea, { label: session.currentArea }));
  if (Array.isArray(session.notes) && session.notes.length > 0) {
    lines.push(fillTemplate(block.notes, {
      notes: session.notes.map((note, index) => `${index + 1}. ${note}`).join("\n"),
    }));
  }
  return `\n${lines.join("\n")}`;
}

function buildPersonaSystem(personaType, bundle) {
  const personaBody = bundle.personas[personaType] ?? bundle.personas.GENERAL;
  const usesBooking = bundle.personaUsesBooking[personaType];
  return bundle.baseRules + (usesBooking ? bundle.bookingRules : "") + personaBody;
}

/**
 * @param {{
 *   locale?: unknown,
 *   persona?: string,
 *   locationName?: string,
 *   boundPlaceName?: string,
 *   isMooni?: boolean,
 *   tripSession?: Record<string, unknown> | null,
 *   chipId?: string | null,
 *   chipFacts?: {
 *     flight?: Record<string, unknown> | null,
 *     profile?: Record<string, unknown> | null,
 *     arrivalAirport?: string | null,
 *   } | null,
 *   cta?: string | null,
 *   ctaPlace?: string,
 * }} input
 */
export function renderMooniSystem({
  locale,
  persona,
  locationName = "",
  boundPlaceName = "",
  isMooni = false,
  tripSession = null,
  chipId = null,
  chipFacts = null,
  cta = null,
  ctaPlace = "",
}) {
  const bundle = bundleFor(locale);
  const bound = String(boundPlaceName ?? "").trim();
  const mooni =
    Boolean(isMooni) ||
    Boolean(bound) ||
    String(locationName ?? "").trim().toLowerCase() === "mooni";
  const effectiveLocation = bound || locationName;
  const mooniContext = mooni ? `\n${bundle.mooniDestinationRules}` : "";
  const locationContext = effectiveLocation
    ? `\n${fillTemplate(bundle.locationContext, { location: effectiveLocation })}`
    : "";
  const boundPlaceRules = bound
    ? `\n${fillTemplate(bundle.boundPlace, { name: bound })}`
    : "";
  const tripHint = String(renderTripSessionHint(locale, tripSession) ?? "").trim();
  const chipHint = String(chipId ? renderChipHint(locale, chipId, chipFacts) : "").trim();
  const ctaHint = String(cta ? renderCtaHint(locale, cta, ctaPlace) : "").trim();
  return (
    buildPersonaSystem(persona, bundle) +
    mooniContext +
    locationContext +
    boundPlaceRules +
    (tripHint ? `\n${tripHint}` : "") +
    (chipHint ? `\n${chipHint}` : "") +
    (ctaHint ? `\n${ctaHint}` : "")
  );
}

export function renderIntro(locale, placeName) {
  const bundle = bundleFor(locale);
  const system = `${bundle.baseRules}\n${bundle.introRole}\n${bundle.introSystem}`;
  const userText = fillTemplate(bundle.introUser, { name: placeName });
  return { system, userText };
}

export const SEARCH_INTENT_SYSTEM =
  "당신은 감정 기반 여행지 매칭 전문가입니다. 실재 지명만 사용하고 오직 유효한 JSON만 출력해야 합니다.";

export function renderSearchIntentUser(mode, query) {
  if (mode === "mood") {
    return `사용자가 여행 검색창에 "${query}"라고 입력했습니다.
입력값은 오타일 수도 있고, 감정(예: 번아웃, 설렘, 흥분, 화남, 그리움), 분위기, 사물, 문장일 수도 있습니다.

당신은 사용자의 마음을 여행 계획으로 연결하는 감성 여행 큐레이터입니다.
다음 규칙을 반드시 지키세요.
1) 실제로 존재하는 여행지 3곳을 제안합니다.
2) 지명/국가/좌표가 실제로 일치해야 합니다. 추측 지명, 가상 지명, 별칭, 신조어는 금지합니다.
3) 오타로 보이면 가장 가능성 높은 실제 지명으로 교정합니다.
4) 감정/사물/상황 입력이면 그 감정을 환기하거나 확장하기 좋은 실제 여행지를 매칭합니다.
5) 좌표는 해당 지명의 중심 좌표를 사용하세요.

응답은 반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요.
{
  "intent_type": "mood",
  "candidates": [
    {
      "name": "정확한 지명(한국어)",
      "name_en": "정확한 지명(영어)",
      "country": "소속 국가(한국어)",
      "country_en": "소속 국가(영어)",
      "lat": 위도(숫자),
      "lng": 경도(숫자),
      "reason": "이 목적지가 현재 입력 감정을 어떻게 다음 계획으로 연결하는지 1문장 (한국어, 40자 내외)"
    }
  ]
}`;
  }
  if (mode === "facility") {
    return `사용자가 여행 검색창에 "${query}"라고 입력했습니다.
이는 휴게소·역·공원·댐 등 **세부 장소·시설** 검색입니다.
규칙을 지키세요.
1) 입력한 시설·명소 자체를 찾으세요. 시·군·구 등 상위 행정구역으로 축소·교정하지 마세요.
2) 예: "홍천 휴게소" → 홍천(고속)휴게소 좌표. "홍천군"으로 바꾸지 마세요.
3) 실제로 존재하는 장소여야 하며, 좌표는 해당 시설 위치여야 합니다.
응답은 반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요.
{
  "intent_type": "typo",
  "name": "시설·명소의 정확한 이름(한국어)",
  "name_en": "정확한 이름(영어)",
  "country": "소속 국가(한국어)",
  "country_en": "소속 국가(영어)",
  "lat": 위도(숫자),
  "lng": 경도(숫자),
  "reason": "이 시설을 찾은 이유 1문장 (한국어, 30자 내외)"
}`;
  }
  return `사용자가 여행 검색창에 "${query}"라고 입력했습니다.
입력값은 오타일 가능성이 높습니다. 가장 가능성 높은 실제 지명 1곳으로 교정하세요.
세부 시설(휴게소·역 등)이 아니면 행정구역으로 넓히지 마세요.
응답은 반드시 다른 설명 없이 아래 JSON 형식으로만 응답하세요.
{
  "intent_type": "typo",
  "name": "정확한 지명(한국어)",
  "name_en": "정확한 지명(영어)",
  "country": "소속 국가(한국어)",
  "country_en": "소속 국가(영어)",
  "lat": 위도(숫자),
  "lng": 경도(숫자),
  "reason": "교정 이유 1문장 (한국어, 30자 내외)"
}`;
}

export function renderSearchIntent(mode, query) {
  return { system: SEARCH_INTENT_SYSTEM, userText: renderSearchIntentUser(mode, query) };
}

export const REVIEW_SYSTEM =
  "사용자의 입력을 바탕으로 자연스럽고 매력적인 리뷰 초안을 작성하세요. 팩트를 왜곡하지 않습니다.";

export function renderReviewUser(placeName, rating, draft) {
  return `당신은 사용자의 여행지 리뷰 작성을 돕는 유능하고 세련된 AI 어시스턴트입니다.
현재 장소는 '${placeName}'이며, 사용자가 부여한 별점은 ${rating}/5점입니다.
사용자가 지금까지 작성한 메모는 다음과 같습니다: "${draft || "아직 작성된 내용이 없습니다."}"

위 정보를 바탕으로 다른 여행자들에게 도움이 될 만한 매력적인 리뷰 초안을 작성해주세요.
- 별점에 맞는 톤앤매너를 유지하세요. (예: 5점이면 극찬, 3점이면 아쉬운 점 포함)
- 기존 사용자가 작성한 문장이 있다면 그 문맥을 자연스럽게 이어받아 보강하세요.
- 길이는 4~5문장 내외로 간결하게 작성하되, 가독성을 위해 문맥이 전환될 때마다 반드시 엔터(줄바꿈)를 넣어 문단을 나누어주세요.
- 이모지를 적절히 사용하여 읽기 좋게 만들어주세요.
- 불필요한 인사말이나 서론 없이 바로 본문만 출력하세요.`;
}

export function renderReview(placeName, rating, draft) {
  return { system: REVIEW_SYSTEM, userText: renderReviewUser(placeName, rating, draft) };
}

export const LOGBOOK_SYSTEM =
  "사용자의 메모와 사진을 분석하여 블로그 형식으로 변환하세요. 팩트를 왜곡하지 않는 세련된 에세이를 지향합니다.";

export function renderLogbookUser(mode, date, location, content, imageCount = 0) {
  const safeDate = date || "날짜 미상";
  const safeLocation = location || "장소 미상";
  const safeContent = content || "(내용 없음)";
  const imageInstruction = imageCount > 0
    ? `\n[중요 지시사항: 블로그 사진 배치]\n사용자가 총 ${imageCount}장의 사진을 첨부했습니다. 당신은 사진의 내용을 시각적으로 분석할 수 있습니다. 글을 작성할 때, 문맥상 사진이 들어가야 할 최적의 위치에 반드시 '[사진1]', '[사진2]' (숫자는 사진 순서) 형식으로 치환자를 정확히 삽입하세요. (예: "눈앞에 펼쳐진 에메랄드빛 바다는 경이로웠습니다. [사진1] 그곳에서 마신 칵테일은...")`
    : "";
  const baseContext = `
다음은 사용자가 흩어진 생각들을 대략적으로 기록한 파편화된 메모입니다.
- 여행 날짜: ${safeDate}
- 여행 장소: ${safeLocation}
- 사용자의 원본 메모: "${safeContent}"${imageInstruction}
`;
  if (mode === "essay") {
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
  if (mode === "sns") {
    return `당신은 팔로워들의 이목을 끄는 트렌디한 인스타그램/틱톡 여행 인플루언서입니다.${baseContext}
이 메모와 첨부된 사진을 바탕으로, 즉시 SNS 피드나 블로그 숏폼으로 업로드할 수 있는 매력적인 글을 작성해주세요.
- 문체는 발랄하고 톡톡 튀며, 모바일에서 읽기 편하게 짧은 문장과 줄바꿈을 적극 활용하세요.
- 시각적으로 지루하지 않게 이모지(✨, 🌴, ✈️, 📸 등)를 적절히 배치하세요.
- 글의 맨 마지막에는 장소와 분위기에 어울리는 센스 있는 해시태그 5~7개를 덧붙여주세요.
- 불필요한 인사말이나 서론 없이, 곧바로 본문만 출력하세요.`;
  }
  return "";
}

export function renderLogbook(mode, date, location, content, imageCount = 0) {
  return {
    system: LOGBOOK_SYSTEM,
    userText: renderLogbookUser(mode, date, location, content, imageCount),
  };
}

function tasteLabel(id, isEn) {
  const key = String(id ?? "").trim();
  if (!key) return "";
  if (!isEn) return TASTE_KO[key] || key;
  return TASTE_EN[key] || TASTE_KO[key] || key;
}

function dashLines(values, limit = Infinity) {
  return (values || [])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((value) => `- ${value}`);
}

/**
 * @param {{
 *   locale?: unknown,
 *   reports?: string[],
 *   saved?: string[],
 *   exclude?: string[],
 *   rejected?: string[],
 *   recentSearches?: string[],
 *   recentVisited?: string[],
 *   tasteTags?: string[],
 * }} [input]
 */
export function renderCuration({
  locale = "ko",
  reports = [],
  saved = [],
  exclude = [],
  rejected = [],
  recentSearches = [],
  recentVisited = [],
  tasteTags = [],
} = {}) {
  const isEn = String(locale || "").toLowerCase().startsWith("en");
  const reportLines = dashLines(reports);
  const savedLines = dashLines(saved);
  const searchLines = dashLines(recentSearches, 10);
  const visitedLines = dashLines(recentVisited, 10);
  const surveyLabels = (tasteTags || [])
    .map((id) => tasteLabel(id, isEn))
    .filter(Boolean);
  const hasSurvey = surveyLabels.length > 0;
  const hasExploreTaste = searchLines.length > 0 || visitedLines.length > 0;
  const hasTasteData = reportLines.length > 0 || savedLines.length > 0 || hasSurvey || hasExploreTaste;
  const excludeNames = (exclude || []).map((item) => String(item || "").trim()).filter(Boolean);
  const rejectedNames = (rejected || []).map((item) => String(item || "").trim()).filter(Boolean);
  const noneLabel = isEn ? "(none)" : "(없음)";
  let userDataText;
  if (hasTasteData) {
    const parts = [];
    if (reportLines.length || savedLines.length) {
      parts.push(
        isEn
          ? `[Past logbook entries] ${reportLines.length ? reportLines.join(", ") : noneLabel}`
          : `[사용자의 과거 기록] ${reportLines.length ? reportLines.join(", ") : noneLabel}`,
      );
      parts.push(
        isEn
          ? `[Saved trips] ${savedLines.length ? savedLines.join(", ") : noneLabel}`
          : `[사용자의 북마크] ${savedLines.length ? savedLines.join(", ") : noneLabel}`,
      );
    }
    if (searchLines.length) {
      parts.push(
        isEn ? `[Recent searches] ${searchLines.join(", ")}` : `[최근 검색어] ${searchLines.join(", ")}`,
      );
    }
    if (visitedLines.length) {
      parts.push(
        isEn
          ? `[Recently visited] ${visitedLines.join(", ")}`
          : `[최근 방문 목적지] ${visitedLines.join(", ")}`,
      );
    }
    if (hasSurvey) {
      parts.push(
        isEn
          ? `[Taste survey] Preferred vibes: ${surveyLabels.join(", ")}`
          : `[취향 설문] 선호 분위기: ${surveyLabels.join(", ")}`,
      );
    }
    userDataText = `\n    ${parts.join("\n    ")}\n  `;
  } else {
    userDataText = isEn
      ? `
    [Taste data] None (logged out / no history). Do not tailor to a specific user — freely recommend one lesser-known hidden gem for a broad audience.
  `
      : `
    [취향 데이터] 없음 (비로그인·기록 없음). 특정 사용자 이력에 맞추지 말고, 대중에게 덜 알려진 숨겨진 낙원 1곳을 자유롭게 추천하세요.
  `;
  }
  const excludeText = excludeNames.length > 0
    ? isEn
      ? `\n🚨 [Must exclude]: ${excludeNames.join(", ")} (already recommended — do not suggest again).`
      : `\n🚨 [강제 제외 장소]: ${excludeNames.join(", ")} (이미 추천한 곳이므로 다시 추천하지 마세요.)`
    : "";
  const rejectedText = rejectedNames.length > 0
    ? isEn
      ? `\n🚫 [Rejected picks]: ${rejectedNames.join(", ")} — the user dismissed these. Avoid similar vibe, type, or region; pick a different hidden gem.`
      : `\n🚫 [취향 불일치·삭제된 추천]: ${rejectedNames.join(", ")} — 사용자가 맞지 않다고 지운 장소입니다. 이 장소와 비슷한 분위기·유형·지역 성격도 피하고, 다른 취향의 숨은 낙원을 추천하세요.`
    : "";
  if (isEn) {
    return `You are GATEO's lead travel curator who knows hidden gems worldwide.
Recommend exactly one lesser-known paradise${hasTasteData ? " that fits the user's taste" : ""}.

[User taste signals]
${userDataText}${excludeText}${rejectedText}

🚨 [Language & data rules]
1. "location": accurate Korean place name for catalog matching (e.g. 아이투타키).
2. "locationEn": accurate English place name (City, Country) (e.g. Aitutaki, Cook Islands).
3. "title": English only. Short, evocative headline (max ~60 characters).
4. "description": English only. Rich sensory storytelling (~300 characters), not a dry summary.
5. "searchKeyword": English only for Unsplash. Include place name plus visual keywords (nature, landscape, beach, etc.).
6. "whyHidden": English. 1–2 sentences on why it is lesser known (single line, no line breaks).
7. "bestSeason": English. Short best-time-to-visit phrase.
8. "tips": English string array, 2–4 practical tips, one line each.
9. Never put real line breaks or tabs inside JSON string values — use spaces only.
10. Do not mention or compare the user's past trips or taste data in the output. Focus only on the recommended place.

Output JSON only:
{
  "location": "Korean place name (e.g. 아이투타키)",
  "locationEn": "English place name (e.g. Aitutaki, Cook Islands)",
  "title": "English headline",
  "description": "English storytelling (single line)",
  "searchKeyword": "English image search keywords",
  "whyHidden": "Why it is hidden (English, one line)",
  "bestSeason": "Best season (English, short)",
  "tips": ["tip1", "tip2", "tip3"]
}`;
  }
  return `당신은 세계 곳곳의 숨겨진 명소를 잘 아는 GATEO의 수석 여행 큐레이터입니다.
대중에게 덜 알려졌으나${hasTasteData ? ", 사용자의 취향에 완벽히 맞는" : ""} 숨겨진 낙원 딱 1곳을 추천하세요.

[사용자 취향 데이터]
${userDataText}${excludeText}${rejectedText}

🚨 [언어 및 데이터 정합성 엄수 규칙]
1. "location": 구글 검색이 가능한 정확한 '한국어 지명' (예: 아이투타키).
2. "locationEn": 정확한 '영문 고유 지명 (City, Country 형식)' (예: Aitutaki, Cook Islands).
3. "title": 반드시 '한국어'로 작성. 공백 포함 15자 이내의 짧고 매혹적인 제목.
4. "description": 반드시 '한국어'로 작성. 단순 요약이 아닌, 공간의 분위기와 감각이 느껴지는 300자 내외의 풍부하고 깊이 있는 스토리텔링.
5. "searchKeyword": 🚨 반드시 '영어(English)'로만 작성. Unsplash API 이미지 검색용입니다. 특정 지명만 넣으면 사진이 안 나올 수 있으므로, 지명과 함께 그 장소의 시각적 특징을 나타내는 풍경 키워드(예: nature, landscape, city, beach 등)를 반드시 포함하세요. (예: "Aitutaki tropical island pristine beach clear water landscape").
6. "whyHidden": 반드시 '한국어'. 왜 대중에게 덜 알려졌는지 1~2문장 (줄바꿈 없이).
7. "bestSeason": 반드시 '한국어'. 가기 좋은 시기·계절을 짧게 (예: "5~9월 건기").
8. "tips": 반드시 한국어 문자열 배열 2~4개. 실용·덜 알려진 팁. 각 항목은 한 줄.
9. [치명적 시스템 에러 방지]: 응답을 생성할 때, JSON 문자열 내부에 절대로 실제 줄바꿈(Enter)이나 탭(Tab) 키를 치지 마세요. 문장이 길어도 반드시 띄어쓰기(Space)로만 구분하며 한 줄로 쭉 작성하세요.
10. [침묵 규칙]: 사용자의 과거 방문지나 취향 데이터를 결과물에 절대 직접 언급하거나 비교하지 마세요. (예: "~를 다녀오신 당신에게" 같은 표현 엄금). 오직 새롭게 추천하는 장소 자체의 매력과 풍경 묘사에만 100% 집중하세요.

응답은 반드시 아래 JSON 형식으로만 출력하세요:
{
  "location": "한국어 지명 (예: 아이투타키)",
  "locationEn": "영문 고유 지명 (예: Aitutaki, Cook Islands)",
  "title": "한국어 제목 (15자 이내)",
  "description": "한국어 스토리텔링 설명 (줄바꿈 없이 한 줄로 작성)",
  "searchKeyword": "영문 확장 키워드",
  "whyHidden": "덜 알려진 이유 (한국어 한 줄)",
  "bestSeason": "가기 좋은 시기 (한국어 짧은 문구)",
  "tips": ["실용 팁1", "실용 팁2", "숨은 팁3"]
}`;
}

export function wrapUserTurn(system, history, userText) {
  const turns = (Array.isArray(history) ? history : []).map((turn) => ({
    role: turn?.role,
    text: turn?.text,
  }));
  return `${system}\n\n[이전 대화 내역]\n${JSON.stringify(turns)}\n\n사용자 질문: ${userText ?? ""}`;
}
