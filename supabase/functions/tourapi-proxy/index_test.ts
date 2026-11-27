/**
 * tourapi-proxy KorWithService2 reads. Mocked fetch. No network, no deploy.
 */
function assertEquals(actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`assertEquals failed:\n  actual: ${a}\n  expected: ${b}`);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

const KEY = "abc+def/123";
const KEY_ENCODED = encodeURIComponent(KEY);
const WITH = "https://apis.data.go.kr/B551011/KorWithService2";
const KOR = "https://apis.data.go.kr/B551011/KorService2";
const ENG = "https://apis.data.go.kr/B551011/EngService2";

type FetchCall = { url: string; init?: RequestInit };

const calls: FetchCall[] = [];
const errorLines: string[] = [];
let fetchImpl: (url: string) => Response | Promise<Response> = () => {
  throw new Error("fetch not stubbed");
};

globalThis.fetch = ((input: Request | URL | string, init?: RequestInit) => {
  const url = String(input);
  calls.push({ url, init });
  return Promise.resolve(fetchImpl(url));
}) as typeof fetch;

console.error = (...args: unknown[]) => {
  errorLines.push(args.map((part) => String(part)).join(" "));
};

function reset(impl?: (url: string) => Response | Promise<Response>) {
  calls.length = 0;
  errorLines.length = 0;
  Deno.env.set("TOUR_API_SERVICE_KEY", KEY);
  fetchImpl = impl ?? (() => envelope("0000", "OK", []));
}

function envelope(
  resultCode: string | number,
  resultMsg: string,
  item: unknown,
  status = 200,
) {
  const items = Array.isArray(item) ? item : item == null ? [] : [item];
  return new Response(JSON.stringify({
    response: {
      header: { resultCode, resultMsg },
      body: {
        items: Array.isArray(item) || item == null ? { item } : { item },
        totalCount: items.length,
      },
    },
  }), { status, headers: { "Content-Type": "application/json" } });
}

function assertNoKey(text: string, where: string) {
  assert(!text.includes(KEY), `${where} leaked the service key`);
  assert(!text.includes(KEY_ENCODED), `${where} leaked the encoded service key`);
}

await import("./index.ts");

const handle = (globalThis as Record<string, unknown>).__edgeHandler as (
  req: Request,
) => Promise<Response>;
if (typeof handle !== "function") throw new Error("tourapi-proxy handler was not captured");

function post(body: unknown): Promise<Response> {
  return handle(new Request("https://example.test/tourapi-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

function paramsOf(url: string): URLSearchParams {
  const q = url.split("?")[1] ?? "";
  return new URLSearchParams(q);
}

Deno.test("searchKeyword2 calls KorWithService2 once with the shared query shape", async () => {
  reset(() => envelope("0000", "OK", {
    contentid: "126730",
    title: "순천만습지",
    contenttypeid: "12",
  }));
  const res = await post({
    action: "searchKeyword2",
    keyword: " 순천만습지 ",
    contentTypeId: 12,
    numOfRows: 10,
    pageNo: 1,
    locale: "en",
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, true);
  assertEquals(body.action, "searchKeyword2");
  assertEquals(body.resultCode, "0000");
  assertEquals(body.rawCount, 1);
  assertEquals(body.items[0].contentId, "126730");
  assertEquals(body.items[0].title, "순천만습지");
  assertEquals(calls.length, 1);
  const url = calls[0].url;
  assert(url.startsWith(`${WITH}/searchKeyword2?`), url);
  assert(!url.includes("/KorService2/"), "searchKeyword2 must not use KorService2");
  assert(!url.includes("/EngService2/"), "locale=en must not switch KorWithService2");
  assert(url.includes(`serviceKey=${KEY}`), "serviceKey must be appended raw");
  assert(!url.includes(`serviceKey=${KEY_ENCODED}`), "serviceKey must not be re-encoded");
  const q = paramsOf(url);
  assertEquals(q.get("MobileOS"), "ETC");
  assertEquals(q.get("MobileApp"), "gateo");
  assertEquals(q.get("_type"), "json");
  assertEquals(q.get("keyword"), "순천만습지");
  assertEquals(q.get("contentTypeId"), "12");
  assertEquals(q.get("numOfRows"), "10");
  assertEquals(q.get("pageNo"), "1");
  assertEquals(errorLines.length, 0);
  assertNoKey(JSON.stringify(body), "response");
});

Deno.test("detailCommon2 and detailWithTour2 send contentId and optional contentTypeId", async () => {
  reset((url) => {
    if (url.includes("/detailWithTour2")) {
      return envelope("0000", "OK", {
        contentid: "126730",
        parking: "장애인 주차장 있음",
        wheelchair: "휠체어 대여",
        restroom: "장애인 화장실",
      });
    }
    return envelope("0000", "OK", {
      contentid: "126730",
      title: "순천만습지",
      overview: "갈대와 S자 수로",
    });
  });

  const common = await post({
    action: "detailCommon2",
    contentId: "126730",
    contentTypeId: "12",
  });
  assertEquals(common.status, 200);
  const commonBody = await common.json();
  assertEquals(commonBody.ok, true);
  assertEquals(commonBody.items[0].contentId, "126730");
  assertEquals(commonBody.items[0].overview, "갈대와 S자 수로");
  assert(calls[0].url.startsWith(`${WITH}/detailCommon2?`), calls[0].url);
  assertEquals(paramsOf(calls[0].url).get("contentId"), "126730");
  assertEquals(paramsOf(calls[0].url).get("contentTypeId"), "12");
  assertEquals(paramsOf(calls[0].url).get("MobileOS"), "ETC");
  assertEquals(paramsOf(calls[0].url).get("_type"), "json");

  const tour = await post({ action: "detailWithTour2", contentId: "126730" });
  const tourBody = await tour.json();
  assertEquals(tourBody.ok, true);
  assertEquals(tourBody.action, "detailWithTour2");
  assertEquals(tourBody.items[0].contentId, "126730");
  assertEquals(tourBody.items[0].wheelchair, "휠체어 대여");
  assertEquals(tourBody.items[0].parking, "장애인 주차장 있음");
  assertEquals(tourBody.items[0].restroom, "장애인 화장실");
  assert(calls[1].url.startsWith(`${WITH}/detailWithTour2?`), calls[1].url);
  assertEquals(paramsOf(calls[1].url).get("contentId"), "126730");
  assertEquals(paramsOf(calls[1].url).get("contentTypeId"), null);
  assertEquals(paramsOf(calls[1].url).get("numOfRows"), "10");
  assertEquals(paramsOf(calls[1].url).get("pageNo"), "1");
  assertEquals(calls.length, 2);
});

Deno.test("pageNo and numOfRows stay inside the existing bounds", async () => {
  reset(() => envelope("0000", "OK", []));
  const res = await post({
    action: "searchKeyword2",
    keyword: "순천만습지",
    numOfRows: 100,
    pageNo: 0,
  });
  assertEquals((await res.json()).ok, true);
  const q = paramsOf(calls[0].url);
  assertEquals(q.get("numOfRows"), "50");
  assertEquals(q.get("pageNo"), "1");

  const fractional = await post({
    action: "detailWithTour2",
    contentId: "126730",
    numOfRows: 2.9,
    pageNo: 2.9,
  });
  assertEquals((await fractional.json()).ok, true);
  const q2 = paramsOf(calls[1].url);
  assertEquals(q2.get("numOfRows"), "2");
  assertEquals(q2.get("pageNo"), "2");
});

Deno.test("invalid keyword, contentId, and contentTypeId never call upstream", async () => {
  reset(() => envelope("0000", "OK", []));
  const longKeyword = await post({
    action: "searchKeyword2",
    keyword: "가".repeat(81),
  });
  assertEquals(longKeyword.status, 200);
  assertEquals((await longKeyword.json()).error, "keyword too long (max 80)");

  const missingKeyword = await post({ action: "searchKeyword2", keyword: "   " });
  assertEquals((await missingKeyword.json()).error, "keyword is required");

  const badId = await post({ action: "detailWithTour2", contentId: "126730x" });
  assertEquals((await badId.json()).error, "contentId must be numeric");

  const missingId = await post({ action: "detailCommon2" });
  assertEquals((await missingId.json()).error, "contentId is required");

  const badType = await post({
    action: "detailCommon2",
    contentId: "126730",
    contentTypeId: "12a",
  });
  assertEquals((await badType.json()).error, "contentTypeId must be numeric");
  assertEquals(calls.length, 0);
});

Deno.test("only the three KorWith operations are allowlisted", async () => {
  reset(() => envelope("0000", "OK", []));
  const res = await post({ action: "detailWithTour", contentId: "126730" });
  assertEquals(res.status, 400);
  const body = await res.json();
  assertEquals(body.ok, false);
  assert(String(body.error).includes("searchKeyword2"), body.error);
  assert(String(body.error).includes("detailCommon2"), body.error);
  assert(String(body.error).includes("detailWithTour2"), body.error);
  assert(String(body.error).includes("searchKeyword"), body.error);
  assert(!String(body.error).includes("detailPetTour2"), body.error);
  assertEquals(calls.length, 0);
});

Deno.test("resultCode 30 surfaces resultCode and resultMsg and does not retry", async () => {
  reset(() => envelope(30, "SERVICE KEY IS NOT REGISTERED", { title: "hidden" }, 200));
  const res = await post({
    action: "detailWithTour2",
    contentId: "126730",
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.ok, false);
  assertEquals(body.action, "detailWithTour2");
  assertEquals(body.resultCode, "30");
  assertEquals(body.resultMsg, "SERVICE KEY IS NOT REGISTERED");
  assertEquals(body.message, "SERVICE KEY IS NOT REGISTERED");
  assertEquals(body.items, []);
  assertEquals(body.rawCount, 0);
  assertEquals(calls.length, 1);
  assertNoKey(JSON.stringify(body), "error response");
  assertNoKey(errorLines.join("\n"), "logs");
});

Deno.test("upstream failures log a redacted URL and keep the timeout contract", async () => {
  const leaked = `network down ${WITH}/searchKeyword2?serviceKey=${KEY}&MobileOS=ETC also ${KEY_ENCODED}`;
  reset(() => {
    throw new Error(leaked);
  });
  const failed = await post({ action: "searchKeyword2", keyword: "순천만습지" });
  assertEquals(failed.status, 200);
  const failedBody = await failed.json();
  assertEquals(failedBody.ok, false);
  assertEquals(failedBody.status, 502);
  assertEquals(failedBody.resultCode, null);
  assertEquals(failedBody.resultMsg, null);
  assert(String(failedBody.message).includes("[REDACTED]"), failedBody.message);
  assertNoKey(String(failedBody.message), "502 message");
  assertEquals(calls.length, 1);
  assertEquals(errorLines.length, 1);
  assert(errorLines[0].includes("[REDACTED]"), errorLines[0]);
  assertNoKey(errorLines[0], "upstream log");

  calls.length = 0;
  errorLines.length = 0;
  fetchImpl = () => {
    throw new Error(
      `The signal has been aborted ${WITH}/detailWithTour2?serviceKey=${KEY}&_type=json`,
    );
  };
  const timed = await post({ action: "detailWithTour2", contentId: "126730" });
  const timedBody = await timed.json();
  assertEquals(timedBody.ok, false);
  assertEquals(timedBody.status, 504);
  assertEquals(timedBody.message, "TourAPI upstream timeout (10000ms)");
  assertEquals(timedBody.resultCode, null);
  assertEquals(calls.length, 1);
  assertNoKey(errorLines.join("\n"), "timeout log");
  assertNoKey(JSON.stringify(timedBody), "timeout response");
});

Deno.test("existing KorService2 actions keep their host", async () => {
  reset(() => envelope("0000", "OK", { contentid: "126508", title: "경복궁" }));
  const ko = await post({ action: "searchKeyword", keyword: "경복궁" });
  assertEquals((await ko.json()).ok, true);
  assert(calls[0].url.startsWith(`${KOR}/searchKeyword2?`), calls[0].url);
  assert(!calls[0].url.includes("/KorWithService2/"), calls[0].url);

  const en = await post({ action: "searchKeyword", keyword: "Gyeongbokgung", locale: "en" });
  assertEquals((await en.json()).ok, true);
  assert(calls[1].url.startsWith(`${ENG}/searchKeyword2?`), calls[1].url);

  const detail = await post({ action: "detailCommon", contentId: "126508" });
  assertEquals((await detail.json()).items[0].contentId, "126508");
  assert(calls[2].url.startsWith(`${KOR}/detailCommon2?`), calls[2].url);
  assertEquals(paramsOf(calls[2].url).get("numOfRows"), null);
  assertEquals(calls.length, 3);
});

Deno.test("missing service key does not call upstream", async () => {
  reset();
  Deno.env.delete("TOUR_API_SERVICE_KEY");
  const res = await post({ action: "searchKeyword2", keyword: "순천만습지" });
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error, "TOUR_API_SERVICE_KEY is not configured");
  assertEquals(calls.length, 0);
  Deno.env.set("TOUR_API_SERVICE_KEY", KEY);
});

Deno.test("keyword of length 80 is accepted", async () => {
  reset(() => envelope("0000", "OK", []));
  const keyword = "가".repeat(80);
  const res = await post({ action: "searchKeyword2", keyword });
  assertEquals((await res.json()).ok, true);
  assertEquals(paramsOf(calls[0].url).get("keyword"), keyword);
  assertEquals(calls.length, 1);
});
