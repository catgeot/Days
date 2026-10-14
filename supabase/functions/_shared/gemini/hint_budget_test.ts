// deno test --allow-read --config supabase/functions/gemini-proxy/deno.json supabase/functions/_shared/gemini/hint_budget_test.ts
import { assert, assertEquals } from "@std/assert";
import { buildTask } from "./tasks.ts";
import {
  MOONI_KOREA_FESTIVAL_HINT_BUDGET,
  MOONI_KOREA_FESTIVAL_HINT_MAX,
  fitMooniKoreaFestivalHint,
} from "../../../../src/shared/korea/mooniKoreaFestivalHintBudget.js";

const saved = JSON.parse(
  Deno.readTextFileSync(
    new URL("../../../../scripts/health/fixtures/gemini-proxy-400-gukhyang-food.json", import.meta.url),
  ),
);

Deno.test("saved 국향대전 food body is 400 until the hint is trimmed", () => {
  const before = saved.params.koreaFestivalHint as string;
  assertEquals(before.length, 8166);
  assert(before.length > MOONI_KOREA_FESTIVAL_HINT_MAX);
  const raw = buildTask("mooni_chat", saved.params, null);
  assertEquals(raw.ok, false);
  if (!raw.ok) assertEquals(raw.status, 400);

  const hint = fitMooniKoreaFestivalHint(before);
  assert(hint.length <= MOONI_KOREA_FESTIVAL_HINT_BUDGET);
  assert(hint.includes("서울→광주송정 KTX 06:22 2시간 6분 42,100원 1회"));
  assert(hint.includes("7,000원"));
  assert(hint.includes("https://www.hpftf.or.kr/"));
  const trimmed = buildTask("mooni_chat", { ...saved.params, koreaFestivalHint: hint }, null);
  assertEquals(trimmed.ok, true);
  if (trimmed.ok) {
    assertEquals(trimmed.task, "mooni_chat");
    const text = String((trimmed.parts[0] as { text: string }).text);
    assert(text.includes("https://www.hpftf.or.kr/"));
    assert(text.includes("42,100원"));
  }
});
