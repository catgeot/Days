import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let requestedPlaceId: string | null = null;

  try {
    const { placeId, locationName } = await req.json();
    requestedPlaceId = placeId;

    if (!placeId || !locationName) {
      throw new Error('placeId and locationName are required');
    }

    // 1. Supabase Admin Client 생성 (Service Role Key로 RLS 우회) - DB 선제 업데이트용
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // [추가] AI 작업 시작 전 DB를 '[[LOADING]]' 상태로 업데이트하여
    // 사용자가 창을 닫거나 다른 페이지로 가더라도 상태가 유지되도록 함
    await supabaseAdmin
      .from('place_wiki')
      .update({ ai_practical_info: '[[LOADING]]' })
      .eq('place_id', String(placeId));

    // 서버의 환경변수에서 제미나이 키를 읽어옴. 프론트엔드 환경변수 이름과 동일하게 구성할 수 있음.
    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured on server');
    }

    // 2. 프롬프트 구성
    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    const systemPrompt = `당신은 제미나이의 강력한 정보 검색 능력을 활용하는 베테랑 로컬 가이드입니다. 여행자가 이곳에 대해 가진 "여긴 도대체 어떤 곳이고, 가면 뭘 할 수 있어?"라는 근본적인 궁금증을 속 시원하게 풀어주세요. 위키백과에 나오는 지루한 역사나 뻔한 소리는 철저히 배제하고, 가장 생생하고 실용적인 최신 현지 정보만 제공하세요.
특히 현지 명소(POI), 맛집, 필수 앱 등 고유명사를 언급할 때는 반드시 구글 맵이나 스토어 복사 검색 편의성을 위해 **작은따옴표(' ')로 감싸고**, 그 옆에 괄호로 **(영문명)**을 병기하세요. (예: 'Bæjarins Beztu Pylsur' (Baejarins Beztu Pylsur), 'Hello Aurora')
또한 '여행자 생존 키트' 페르소나를 가지고 8가지 필수 정보를 JSON 형태로 함께 제공해야 합니다.
수익화가 불가능한 항목(비자, 일반 앱, 지도)은 공식 정보만을, 수익화가 가능한 항목(숙박 위치, 유심, 교통 패스)은 실질적 조언(Advice)을 중심으로 작성하세요.`;

    const userPrompt = `"${locationName}"에 대해 아래 두 가지 데이터를 포함하여 JSON 형식으로 응답해줘.

1. wiki_markdown: 마크다운(Markdown) 형식으로 가독성 좋고 깔끔하게 정리된 현지 가이드 (작성 기준일: ${today} - 답변 서두에 짧게 언급)
- 🌟 1분 요약: 정체성과 핵심 매력을 2~3문장으로 요약
- 🛂 입국/비용 & 이동 팁: 비자, 물가, 비행시간, 추천 이동수단
- ⚠️ 실전 안전 & 에티켓: 치안, 금기사항
- 💡 시크릿 꿀팁 & 맛집: 현지인 추천 핫플, 환전, 교통권 실전 팁 (고유명사는 작은따옴표 및 영문명 병기)

2. essential_guide: 8가지 핵심 카테고리를 포함하는 JSON 객체
- map_poi: { advice: "필수 명소/맛집 조언 (고유명사는 반드시 작은따옴표로 감싸고 영문명 병기)" }
- visa: { advice: "비자 정보 및 관공서 안내", official_url: "공식 비자/K-ETA/입국신고서 사이트 URL (없으면 null)" }
- transport: { advice: "교통 패스/렌터카 추천" }
- apps: { advice: "국가별 특화 필수 앱 (고유명사는 반드시 작은따옴표로 감싸고 영문명 병기)" }
- connectivity: { advice: "유심/eSIM/공항 픽업 조언" }
- flight: { advice: "항공권 예약 시기/직항 팁" }
- accommodation: { advice: "최적의 숙박 위치 및 동네 추천" }
- safety: { advice: "치안 주의사항 및 긴급 연락처", official_url: "영사콜센터 등 공식 안전 정보 URL (없으면 null)" }

반드시 유효한 JSON 문자열로만 응답해.`;

    // 2. Gemini API 직접 호출 (안정적인 최상위 모델 gemini-2.5-pro 사용 - 높은 신뢰도 및 최신정보 반영)
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
      console.error('Gemini API Error Details:', errText);
      throw new Error(`Gemini API 호출 실패: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated from Gemini');
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(generatedText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', generatedText);
      throw new Error('Gemini did not return valid JSON');
    }

    const aiPracticalInfo = parsedResult.wiki_markdown || generatedText;
    const essentialGuide = parsedResult.essential_guide || null;

    // 3. DB 테이블 업데이트
    const updateData: any = {
      ai_practical_info: aiPracticalInfo,
      ai_info_updated_at: new Date().toISOString()
    };

    if (essentialGuide) {
      updateData.essential_guide = essentialGuide;
    }

    const { error: dbError } = await supabaseAdmin
      .from('place_wiki')
      .update(updateData)
      .eq('place_id', String(placeId));

    if (dbError) {
      console.error('DB Update Error:', dbError);
      throw new Error('Failed to update place_wiki in database');
    }

    // 5. 성공 결과 및 생성된 텍스트 반환
    return new Response(JSON.stringify({
      success: true,
      aiResponse: aiPracticalInfo,
      essentialGuide: essentialGuide
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errObj = error as Error;
    console.error('Function Error:', errObj.message);

    // 에러 발생 시 원래 상태(또는 null)로 복구하여 로딩 무한 루프 방지
    if (requestedPlaceId) {
      try {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );
        await supabaseAdmin
          .from('place_wiki')
          .update({ ai_practical_info: null })
          .eq('place_id', String(requestedPlaceId))
          .eq('ai_practical_info', '[[LOADING]]'); // 로딩 상태일 때만 리셋
      } catch (dbRestoreErr) {
        console.error('Failed to restore DB state:', dbRestoreErr);
      }
    }

    // 프론트엔드에서 파싱 가능하도록 HTTP 상태는 200으로 내리고 응답 바디에 error를 담음
    return new Response(JSON.stringify({
      success: false,
      error: errObj.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
