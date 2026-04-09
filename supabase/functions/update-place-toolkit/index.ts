import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let requestedPlaceId: string | null = null;
  let reqBody: any = null;

  try {
    reqBody = await req.json();
    const { placeId, locationName } = reqBody;
    requestedPlaceId = placeId;

    if (!placeId || !locationName) {
        throw new Error('placeId and locationName are required');
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not configured on server');
    }

    const systemPrompt = `당신은 제미나이의 강력한 정보 검색 능력을 활용하는 베테랑 여행 플래너 및 로컬 예약 에이전트입니다. 여행자가 "${locationName}"에 가기 위해 필요한 모든 실용적인 예약 정보, 교통편, 비자, 그리고 도착까지의 상세 타임라인을 구조화된 JSON 데이터로 제공해야 합니다.

**[핵심 분석: 복잡도 평가]**
1. 이 장소가 인천(한국)에서 출발했을 때, 직항이 없고 배를 타야 하거나, 다단계 교통수단(비행기->버스->페리 등)을 거쳐야 한다면 "is_complex": true로 설정하세요. (예: 길리 메노, 보라카이 등)
2. 사전에 E-비자를 발급받아야 하거나, 관광세 등을 미리 온라인으로 납부해야 한다면 복잡도가 올라갑니다.

**[구조 및 내용 지침]**
1. "is_complex" (boolean): 다단계 이동이나 필수 사전 준비가 많은가?
2. "complexity_score" (number 0-100): 높을수록 복잡함. 70 이상이면 고난도.
3. "journey_timeline" (array): 인천에서 최종 목적지(숙소/메인 지역)까지의 예상 경로. step(순서), title(행동), duration(소요시간/대기시간) 포함.
4. "categories" (object):
   - "pre_travel" (array): 출발 전 챙겨야 할 온라인 비자, 관광세 납부, 허가증 등. (각 객체에 title, url, cost 필수). 해당 없으면 빈 배열 [].
   - "airport_transfer" (object): 공항에서 메인 거점/항구까지의 추천 이동수단(예약 링크 필수). 해당 없으면 null.
   - "ferry_booking" (object): 페리 등 해상 교통이 필수일 경우 추천 업체와 예약 링크. 해당 없으면 null.
   - 기타 아래 항목들의 "advice"는 짧은 서술형을 피하고 **실용적이고 구체적인 마크다운 체크리스트 및 꿀팁 형태**로 작성하세요. 사용자가 읽고 즉시 예약/행동할 수 있어야 합니다.
     - 🚨 **스마트 링크 필수 규칙**: 사용자가 검색하거나 예약해야 할 핵심 명소명, 업체명, 교통수단, 필수 앱 이름 등은 반드시 \`[@이름@]\` 형태로 감싸서 작성하세요. 프론트엔드에서 이를 감지하여 구글 검색 및 예약 버튼으로 자동 변환합니다. (예: \`- [@Eka Jaya@] 쾌속선을 이용하세요\`, \`- 핵심 명소: [@우붓 몽키 포레스트@]\`)
     - "visa" (object): 비자 규정 요약
     - "flight" (object): 직항 여부, 소요 시간, 주요 취항사 목록, 최적의 예약 시기 및 비용 절감 팁
     - "accommodation" (object): 타겟별 지역 추천 (예: '휴양/호캉스: A지역', '관광/이동편의: B지역', '가성비: C지역')
     - "connectivity" (object): 현지 eSIM 사용 가능 여부, 대표 통신사 추천
     - "transport" (object): 공항에서 시내 진입 시 선택 가능한 옵션(버스 vs 택시/픽업) 요금 및 소요시간 비교표 제공, 필수 교통 패스 안내
     - "apps" (object): 현지에서 유용한 필수 앱 (Uber, Grab 등)
     - "map_poi" (object): 핵심 지역/맛집
     - "safety" (object): 치안 상황 및 여행자 대상 주요 범죄 패턴, 긴급 연락처

URL이 있다면 반드시 해당 공식 사이트의 유효한 예약 링크나 정보 링크를 제공하세요.`;

    const userPrompt = `"${locationName}"에 대한 상세 툴킷 정보를 JSON 형식으로 제공해주세요.

응답 형식 예시:
{
  "is_complex": true,
  "complexity_score": 85,
  "journey_timeline": [
    { "step": 1, "title": "인천 출발 ✈️", "duration": "7시간" },
    { "step": 2, "title": "발리 공항 도착 & 휴식 🏨", "duration": "6시간" },
    { "step": 3, "title": "빠당 바이 항구 이동 🚕", "duration": "1.5시간" },
    { "step": 4, "title": "페리 탑승 ⛴️", "duration": "2시간" },
    { "step": 5, "title": "길리 메노 도착 🏝️", "duration": "도착" }
  ],
  "categories": {
    "pre_travel": [
      { "title": "인도네시아 E-비자 신청", "url": "https://molina.imigrasi.go.id/", "cost": "$35" }
    ],
    "airport_transfer": { "advice": "[@Eka Jaya@] 공항 픽업 포함 추천", "url": "https://ekajayafastboat.com/" },
    "ferry_booking": { "advice": "[@BlueWater Express@]", "url": "https://www.bluewaterexpress.com/" },
    "visa": { "advice": "**필수 준비물**\\n- 6개월 이상 남은 여권\\n- 도착 비자 발급 비용($35)", "url": null },
    "flight": { "advice": "**항공권 예약 팁**\\n- 직항 여부: X\\n- 소요 시간: 7시간\\n- 추천 항공사: [@대한항공@]...", "url": null },
    "accommodation": { "advice": "**타겟별 숙박 지역 추천**\\n- 휴양/호캉스: [@누사두아@]\\n- 관광/이동편의: [@스미냑@]...", "url": null },
    "connectivity": { "advice": "**통신 꿀팁**\\n- 현지 eSIM ([@Telkomsel@]) 추천...", "url": null },
    "transport": { "advice": "**시내 교통**\\n- [@Grab@], [@Gojek@] 필수...", "url": null },
    "apps": { "advice": "- [@Grab@]: 택시 및 배달\\n- [@Gojek@]: 현지 특화...", "url": null },
    "map_poi": { "advice": "**핵심 명소**\\n- [@우붓 몽키 포레스트@]...", "url": null },
    "safety": { "advice": "**치안 및 주의사항**\\n- 소매치기 주의...", "url": null }
  }
}`;

    // 🆕 [Phase 8 Fix] Gemini 모델 폴백 로직 추가 (3.1 Pro → 2.5 Pro)
    const modelsToTry = [
      'gemini-3.1-pro-preview',  // 최우선 시도
      'gemini-2.5-pro'            // 폴백 모델
    ];

    let response: Response | null = null;
    let lastError: string = '';
    let usedModel: string = '';

    for (const model of modelsToTry) {
      try {
        console.log(`[update-place-toolkit] Trying model: ${model}`);

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            generationConfig: {
              responseMimeType: "application/json"
            },
            contents: [
              { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ]
          })
        });

        if (response.ok) {
          usedModel = model;
          console.log(`[update-place-toolkit] Success with model: ${model}`);
          break; // 성공하면 루프 종료
        }

        const errText = await response.text();
        lastError = `${response.status}: ${errText}`;

        // 429 (Too Many Requests) 또는 RESOURCE_EXHAUSTED 에러면 다음 모델 시도
        if (response.status === 429 || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('quota')) {
          console.log(`[update-place-toolkit] Model ${model} quota exceeded, trying fallback...`);
          continue; // 다음 모델로
        }

        // 다른 에러는 즉시 중단
        console.error(`[update-place-toolkit] Fatal error with ${model}:`, errText);
        throw new Error(`Gemini API 호출 실패 (${model}): ${lastError}`);

      } catch (fetchError) {
        const err = fetchError as Error;
        lastError = err.message;
        console.error(`[update-place-toolkit] Error with ${model}:`, err);

        // 마지막 모델이었으면 에러 throw
        if (model === modelsToTry[modelsToTry.length - 1]) {
          throw new Error(`모든 Gemini 모델 시도 실패: ${lastError}`);
        }
        // 아니면 다음 모델 시도
        continue;
      }
    }

    // 모든 모델이 실패했으면
    if (!response || !response.ok) {
      throw new Error(`Gemini API 호출 실패 - 모든 모델 시도 완료: ${lastError}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    let essentialGuideJson;
    try {
      essentialGuideJson = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', generatedText);
      throw new Error('Gemini did not return valid JSON');
    }

    // Upsert essential_guide into place_toolkit table
    const { error: dbError } = await supabaseAdmin
      .from('place_toolkit')
      .upsert({
        place_id: String(placeId),
        essential_guide: essentialGuideJson,
        toolkit_updated_at: new Date().toISOString()
      }, { onConflict: 'place_id' });

    if (dbError) {
      console.error('DB Update Error:', dbError);
      throw new Error(`Failed to update essential_guide in database: ${dbError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      essentialGuide: essentialGuideJson,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errObj = error as Error;
    console.error('Function Error:', errObj.message);

    return new Response(JSON.stringify({
      success: false,
      error: errObj.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
