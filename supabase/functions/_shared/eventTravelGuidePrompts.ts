import type { EventTravelGuideFacts } from "./eventTravelGuideSchema.ts";

export function buildEventTravelGuidePrompt(
  facts: EventTravelGuideFacts,
  locale: "ko" | "en" = "ko",
): { systemPrompt: string; userPrompt: string } {
  const factsJson = JSON.stringify(facts, null, 2);
  const title = locale === "en" && facts.title_en ? facts.title_en : facts.title;

  if (locale === "en") {
    const systemPrompt = `You are a veteran travel planner. Produce a structured JSON EventTravelGuide v0.2 for travelers attending **only** this specific event.

Hard rules:
1. Use ONLY facts from the provided Tier0 JSON. Do not invent dates, venues, cities, or event names.
2. **Do NOT output summary or recommended_nights** — those live in static Tier0~0.5 on the page already.
3. Event span may be long — trip_preset.nights must stay 1–10 and reflect short visit windows, not the full event span.
4. trip_presets: 2–4 realistic windows within the event (e.g. opening weekend, mid-festival, closing).
5. sections: event-specific practical advice only (shows, tickets, timing, etiquette) — at least 2 sections. Do not repeat static overview/highlights/stayAreas verbatim.
6. booking_tips: supplementary bullets NOT already stated in facts.booking_hints or facts.detail_overview.
7. cautions: optional — crowd, weather, booking risks tied to this event.
8. schema_version must be "0.2". event_id must match facts.event_id exactly.
9. Write in English.`;

    const userPrompt = `Event: "${title}" (${facts.event_id})
Tier0 facts (sole source of truth):
${factsJson}

Return EventTravelGuide v0.2 JSON with:
- schema_version: "0.2"
- event_id: "${facts.event_id}"
- trip_presets: [{ id, label, nights, timing_hint, rationale }]
- sections: [{ id, title, content }] (markdown in content)
- booking_tips: string[] (supplementary only)
- cautions?: string[]

Forbidden fields: summary, recommended_nights`;

    return { systemPrompt, userPrompt };
  }

  const systemPrompt = `당신은 베테랑 여행 플래너입니다. 아래 **이 행사만**을 위한 EventTravelGuide v0.2 JSON을 작성합니다.

절대 규칙:
1. 제공된 Tier0 JSON 사실만 사용. 날짜·장소·도시·행사명을 지어내지 마세요.
2. **summary·recommended_nights 필드 금지** — 페이지 정적 Tier0~0.5에 이미 있습니다.
3. 행사 기간이 길어도 trip_preset.nights는 1~10 · 짧은 방문 윈도만.
4. trip_presets: 행사 안에서 현실적인 2~4개 윈도(개막 주말·중순·막바지 등).
5. sections: 행사 맞춤 실용 조언 최소 2개 — overview·highlights·stayAreas 문장 반복 금지.
6. booking_tips: facts.booking_hints·detail_overview에 없는 **추가** 팁만.
7. cautions: 선택 — 혼잡·예매·날씨 등 행사 관련 주의.
8. schema_version은 "0.2", event_id는 facts.event_id와 동일.
9. 한국어로 작성.`;

  const userPrompt = `행사: "${title}" (${facts.event_id})
Tier0 사실 (유일한 근거):
${factsJson}

EventTravelGuide v0.2 JSON:
- schema_version: "0.2"
- event_id: "${facts.event_id}"
- trip_presets: [{ id, label, nights, timing_hint, rationale }]
- sections: [{ id, title, content }] (content는 마크다운)
- booking_tips: string[] (추가 팁만)
- cautions?: string[]

금지 필드: summary, recommended_nights`;

  return { systemPrompt, userPrompt };
}
