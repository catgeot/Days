import type { EventTravelGuideFacts } from "./eventTravelGuideSchema.ts";

export function buildEventTravelGuidePrompt(
  facts: EventTravelGuideFacts,
  locale: "ko" | "en" = "ko",
): { systemPrompt: string; userPrompt: string } {
  const factsJson = JSON.stringify(facts, null, 2);
  const title = locale === "en" && facts.title_en ? facts.title_en : facts.title;

  if (locale === "en") {
    const systemPrompt = `You are a veteran travel planner. Produce a structured JSON EventTravelGuide for travelers attending **only** this specific event.

Hard rules:
1. Use ONLY facts from the provided Tier0 JSON. Do not invent dates, venues, cities, or event names.
2. Event span may be long — recommend short stays (3–7 nights typical). Never suggest staying the entire event span unless facts.recommended_nights says so.
3. recommended_nights and each trip_preset.nights must be between 1 and 10.
4. trip_presets: 2–4 realistic windows within the event (e.g. opening weekend, mid-festival, closing).
5. sections: practical advice for this event (shows, tickets, areas, transport) — at least 2 sections.
6. booking_tips: actionable bullets grounded in facts.
7. cautions: optional — crowd, weather, booking risks tied to this event.
8. schema_version must be "0.1". event_id must match facts.event_id exactly.
9. Write in English.`;

    const userPrompt = `Event: "${title}" (${facts.event_id})
Tier0 facts (sole source of truth):
${factsJson}

Return EventTravelGuide JSON with:
- schema_version: "0.1"
- event_id: "${facts.event_id}"
- summary: 2–3 sentences
- recommended_nights: number (1–10)
- trip_presets: [{ id, label, nights, timing_hint, rationale }]
- sections: [{ id, title, content }] (markdown in content)
- booking_tips: string[]
- cautions?: string[]`;

    return { systemPrompt, userPrompt };
  }

  const systemPrompt = `당신은 베테랑 여행 플래너입니다. 아래 **이 행사만**을 위한 구조화 JSON EventTravelGuide를 작성합니다.

절대 규칙:
1. 제공된 Tier0 JSON 사실만 사용. 날짜·장소·도시·행사명을 지어내지 마세요.
2. 행사 기간이 길어도 숙박은 짧게(보통 3~7박). facts.recommended_nights가 없으면 전체 기간 숙박을 권하지 마세요.
3. recommended_nights와 trip_preset.nights는 각각 1~10.
4. trip_presets: 행사 안에서 현실적인 2~4개 윈도(개막 주말·중순·막바지 등).
5. sections: 이 행사 맞춤 실용 조언 최소 2개.
6. booking_tips: facts에 근거한 실행 팁 bullet.
7. cautions: 선택 — 혼잡·예매·날씨 등 행사 관련 주의.
8. schema_version은 "0.1", event_id는 facts.event_id와 동일.
9. 한국어로 작성.`;

  const userPrompt = `행사: "${title}" (${facts.event_id})
Tier0 사실 (유일한 근거):
${factsJson}

EventTravelGuide JSON:
- schema_version: "0.1"
- event_id: "${facts.event_id}"
- summary: 2~3문장
- recommended_nights: 숫자 (1~10)
- trip_presets: [{ id, label, nights, timing_hint, rationale }]
- sections: [{ id, title, content }] (content는 마크다운)
- booking_tips: string[]
- cautions?: string[]`;

  return { systemPrompt, userPrompt };
}
