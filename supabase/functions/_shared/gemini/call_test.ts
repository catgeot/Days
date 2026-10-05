import { assertEquals } from "@std/assert";
import { extractGeminiAnswer, isPlaceIntroTruncated, thinkingConfigForPlaceIntro } from "./call.ts";
import { detectMooniReplyLeak, sanitizeGeminiUserText } from "./answerSanitize.mjs";

const BOROBUDUR_LEAK =
  '1 million tourists per year". Stick to historical/visual facts.\n\n3. **Draft\n\n이곳이 어떤 곳인지부터, 가는 방법·준비·즐길거리까지 골라보셔도 좋아요. 예약은 답변 아래 버튼으로 이어질 수 있어요.';

Deno.test("sanitizeGeminiUserText strips Borobudur-style draft prefix", () => {
  const out = sanitizeGeminiUserText(BOROBUDUR_LEAK);
  assertEquals(out.startsWith("이곳이"), true);
  assertEquals(detectMooniReplyLeak(out), null);
});

Deno.test("sanitizeGeminiUserText keeps Korean numbered lists", () => {
  const ko = "1. 아침에는 사원을 둘러보고\n2. 오후에는 박물관을 방문해 보세요.";
  assertEquals(sanitizeGeminiUserText(ko), ko);
});

Deno.test("sanitizeGeminiUserText strips Thinking block before Korean", () => {
  const raw =
    "**Thinking:** Plan a warm intro about the temple.\n\n보로부두르는 이른 아침 일출 명소로도 알려져 있습니다.";
  const out = sanitizeGeminiUserText(raw);
  assertEquals(out.startsWith("보로부두르는"), true);
  assertEquals(detectMooniReplyLeak(out), null);
});

Deno.test("sanitizeGeminiUserText keeps clean Korean prose", () => {
  const ko = "보로부두르는 자바 중부에 있는 불교 사원 단지입니다. 일출을 보며 올라가는 코스가 인기 있습니다.";
  assertEquals(sanitizeGeminiUserText(ko), ko);
});

Deno.test("place_intro thinking config is model-specific and never both knobs", () => {
  assertEquals(thinkingConfigForPlaceIntro("gemini-3.5-flash"), { thinkingLevel: "low" });
  assertEquals(thinkingConfigForPlaceIntro("gemini-2.5-flash"), { thinkingBudget: 0 });
  assertEquals(thinkingConfigForPlaceIntro("gemini-3.1-flash-lite"), undefined);
  assertEquals(thinkingConfigForPlaceIntro("gemini-3.1-pro-preview"), { thinkingLevel: "low" });
  for (const model of ["gemini-3.5-flash", "gemini-2.5-flash"]) {
    const config = thinkingConfigForPlaceIntro(model);
    assertEquals(config != null && "thinkingLevel" in config && "thinkingBudget" in config, false);
  }
});

Deno.test("place_intro truncation is MAX_TOKENS or an unfinished sentence", () => {
  assertEquals(isPlaceIntroTruncated({ text: "품겨 있는 수", finishReason: "MAX_TOKENS" }), true);
  assertEquals(
    isPlaceIntroTruncated({
      text: "파리는 센 강변의 도시입니다.",
      finishReason: "MAX_TOKENS",
    }),
    true,
  );
  assertEquals(isPlaceIntroTruncated({ text: "품겨 있는 수", finishReason: "STOP" }), true);
  assertEquals(isPlaceIntroTruncated({ text: "   ", finishReason: "STOP" }), true);
  assertEquals(
    isPlaceIntroTruncated({ text: "파리는 센 강변의 도시입니다.", finishReason: "STOP" }),
    false,
  );
});

Deno.test("extractGeminiAnswer filters thought parts and sanitizes text", () => {
  const data = {
    candidates: [{
      finishReason: "STOP",
      content: {
        parts: [
          { thought: true, text: "hidden reasoning" },
          { text: BOROBUDUR_LEAK },
        ],
      },
    }],
    usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2, thoughtsTokenCount: 1 },
  };
  const answer = extractGeminiAnswer(data);
  assertEquals(answer.thoughts, 1);
  assertEquals(answer.text.startsWith("이곳이"), true);
  assertEquals(detectMooniReplyLeak(answer.text), null);
});
