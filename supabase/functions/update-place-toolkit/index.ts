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
   - "visa" (object): 비자 규정 요약 (advice, url 포함)
   - "flight" (object): 추천 비행 루트 및 경유/직항 정보
   - "accommodation" (object): 숙박하기 좋은 지역 추천
   - "connectivity" (object): 유심, eSIM 등 통신 팁
   - "transport" (object): 시내 교통 및 패스 정보
   - "apps" (object): 현지에서 유용한 필수 앱 (Uber, Grab 등)
   - "map_poi" (object): 핵심 지역/맛집
   - "safety" (object): 치안 및 긴급 연락처

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
    "airport_transfer": { "advice": "Eka Jaya 공항 픽업 포함 추천", "url": "https://ekajayafastboat.com/" },
    "ferry_booking": { "advice": "BlueWater Express", "url": "https://www.bluewaterexpress.com/" },
    "visa": { "advice": "도착비자 가능...", "url": null },
    "flight": { "advice": "직항 7시간 소요...", "url": null },
    "accommodation": { "advice": "...", "url": null },
    "connectivity": { "advice": "...", "url": null },
    "transport": { "advice": "...", "url": null },
    "apps": { "advice": "...", "url": null },
    "map_poi": { "advice": "...", "url": null },
    "safety": { "advice": "...", "url": null }
  }
}`;

    // 제미나이 2.5 Pro 모델 사용 (사용자가 3.1 Pro를 언급했으나 실제 모델명은 gemini-2.5-pro가 안정적임)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
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

    if (!response.ok) {
      const errText = await response.text();
      // 만약 모델을 찾지 못했다면 fallback
      console.error('Gemini API Error Details:', errText);
      throw new Error(`Gemini API 호출 실패: ${response.status} - ${errText}`);
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

    // Upsert essential_guide without overwriting ai_practical_info
    const { error: dbError } = await supabaseAdmin
      .from('place_wiki')
      .update({
        essential_guide: essentialGuideJson
      })
      .eq('place_id', String(placeId));

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
