import { assertEquals } from "@std/assert";
import { extractGeminiAnswer } from "./call.ts";
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
