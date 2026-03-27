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
    let reqBody: any = null;

    try {
        reqBody = await req.json();
        const { placeId, locationName, oldAiInfo, forceUpdate } = reqBody;
        requestedPlaceId = placeId;

        if (!placeId || !locationName) {
            throw new Error('placeId and locationName are required');
        }

        // 1. Supabase Admin Client 생성 (Service Role Key로 RLS 우회) - DB 선제 업데이트용
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 기존 데이터 조회 (Defensor 판단용)
        const { data: existingData } = await supabaseAdmin
            .from('place_wiki')
            .select('ai_practical_info, essential_guide')
            .eq('place_id', String(placeId))
            .single();

        // [추가] AI 작업 시작 전 DB를 '[[LOADING]]' 상태로 업데이트하여
        // 사용자가 창을 닫거나 다른 페이지로 가더라도 상태가 유지되도록 함
        await supabaseAdmin
            .from('place_wiki')
            .update({ ai_practical_info: '[[LOADING]]' })
            .eq('place_id', String(placeId));

        // 서버의 환경변수에서 제미나이 키를 읽어옴.
        const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not configured on server');
        }

        const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

        // 기존 정보 복원 로직: 프론트엔드가 이미 '[[LOADING]]'으로 덮어씌웠으므로 oldAiInfo를 우선 사용
        const infoToAnalyze = oldAiInfo || (existingData?.ai_practical_info !== '[[LOADING]]' ? existingData?.ai_practical_info : null);
        const hasEssentialGuide = existingData?.essential_guide != null;

        // --- Defensor Model (gemini-3.1-flash-lite-preview) 판단 로직 폐기 ---
        // 기존의 디펜서 로직을 제거하고, 아래 메인 모델(Pro)에서 NO_CHANGES 여부를 함께 판단하도록 통합함.

        // 2. 프롬프트 구성 (메인 모델 호출)
        const systemPrompt = `당신은 제미나이의 강력한 정보 검색 능력을 활용하는 베테랑 로컬 가이드입니다. 여행자가 이곳에 대해 가진 "여긴 도대체 어떤 곳이고, 가면 뭘 할 수 있어?"라는 근본적인 궁금증을 속 시원하게 풀어주세요. 위키백과에 나오는 지루한 역사나 뻔한 소리는 철저히 배제하고, 가장 생생하고 실용적인 최신 현지 정보만 제공하세요.

**[핵심: 한글명('영문명') 표기법의 당위성과 규칙]**
우리의 웹 서비스(프론트엔드)는 당신이 작성한 텍스트에서 작은따옴표('') 안의 영문자를 정규식으로 추출하여, 즉각적으로 구글 맵스(Google Maps)나 웹 검색 아웃링크(스마트 링크) 버튼을 동적으로 생성하는 아주 중요한 시스템을 가지고 있습니다.
따라서 여행자가 실제로 지도로 찾아가야 할 장소나 검색해 보아야 할 대상을 언급할 때는 **반드시 이 파싱 시스템이 인식할 수 있도록 "한글명('현지 영문명')" 형식을 취해야 합니다.**

**[링크 파싱 기준 세분화 - 반드시 지킬 것]**
1. **[지도 검색 대상 (POI)]** 명소, 유적지, 식당, 호텔, 역/공항, 시장 등
  - 강제 사항: 반드시 \`한글명('영문명')\` 표기 (이 데이터는 구글 맵스 링크 생성에 쓰임)
  - ✅ 올바른 예: "시카고 핫도그의 명가 포틸로스('Portillo's')에 방문해 보세요."
  - ❌ 잘못된 예: "Portillo's에 방문해 보세요." (파싱 실패)
2. **[웹 검색 대상 (추상적 대상)]** 필수 앱(Uber, Ferryhopper 등), 지역 교통카드, 통신사 이름, 특정 투어 프로그램 등
  - 강제 사항: 반드시 \`한글명('영문명')\` 표기 (이 데이터는 구글 일반/SGE 웹 검색 링크 생성에 쓰임)
  - ✅ 올바른 예: "교통카드는 벤틀라('Ventra')를 구매하세요."
3. **[절대 따옴표 금지 대상]** 단순 영단어, 분위기 묘사, 일반 명사(Wi-Fi, BBQ, 팁 문화 등)
  - 강제 사항: 정규식이 엉뚱한 링크를 만들지 않도록 철저히 따옴표를 배제.

**[서식 및 스타일 규칙 - 절대 엄수]**
1. **마크다운 헤딩(#, ##, ###) 절대 사용 금지**: 글씨가 지나치게 커지거나 레이아웃이 깨지므로 절대 사용하지 마세요.
2. **리스트 형식 강제**: 가독성을 극대화하기 위해 각 항목은 반드시 불릿 포인트('*')를 사용해 깔끔하게 나열하세요. 줄글로 길게 늘여 쓰지 마세요.
3. **여백 및 줄바꿈**:
   - 각 카테고리(예: 🌟 1분 요약, 🛂 입국/비용 & 이동 팁 등) 사이에는 반드시 줄바꿈(Enter)을 두 번씩(\n\n) 넣어 넉넉한 여백을 만드세요.
   - 불릿 포인트('*')로 나열되는 각 항목들 사이에도 가독성을 위해 반드시 줄바꿈(\n\n)을 한 번씩 더 넣어 시각적으로 분리되게 만드세요.

또한 '여행자 생존 키트' 페르소나를 가지고 8가지 필수 정보를 JSON 형태로 함께 제공해야 합니다.
수익화가 불가능한 항목(비자, 일반 앱, 지도)은 공식 정보만을, 수익화가 가능한 항목(숙박 위치, 유심, 교통 패스)은 실질적 조언(Advice)을 중심으로 작성하세요.

--- [중요: 정보 갱신 검증 규칙] ---
만약 사용자가 아래에 '기존 정보'를 제공했다면, 오늘 날짜(${today}) 기준으로 해당 지역에 국가 부도, 전쟁, 전염병, 심각한 자연재해 등 '치명적이고 여행에 즉각적인 영향을 미치는 중대 변동 사항'이 새로 발생했는지 스스로 판단하세요. (단순 환율 변동, 일반 식당 폐업, 날씨 등은 무시)
만약 치명적인 변동이 전혀 없다면 기존 정보를 그대로 유지해야 하므로, 절대로 다른 내용을 쓰지 말고 오직 다음 JSON만 응답하세요:
{ "status": "NO_CHANGES" }

변동이 있거나 기존 정보가 아예 없다면, 원래 지시대로 유효한 가이드 데이터를 아래 JSON 규격에 맞춰 응답하세요.`;

        const userPrompt = `"${locationName}"에 대해 아래 두 가지 데이터를 포함하여 JSON 형식으로 응답해줘. JSON 파싱 에러가 발생하지 않도록 이스케이프 처리에 각별히 신경 써.

1. wiki_markdown: 마크다운(Markdown) 형식으로 가독성 좋고 깔끔하게 정리된 현지 가이드 (작성 기준일: ${today} - 답변 서두에 짧게 언급)
- 🌟 1분 요약: 정체성과 핵심 매력을 2~3문장으로 요약
- 🛂 입국/비용 & 이동 팁: 비자, 물가, 비행시간, 추천 이동수단 (반드시 '*' 불릿 포인트 리스트로 작성하고 각 항목마다 줄바꿈 추가)
- ⚠️ 실전 안전 & 에티켓: 치안, 금기사항 (반드시 '*' 불릿 포인트 리스트로 작성하고 각 항목마다 줄바꿈 추가)
- 💡 시크릿 꿀팁 & 맛집: 현지인 추천 핫플, 환전, 교통권 실전 팁 (반드시 '*' 불릿 포인트 리스트로 작성하고 각 항목마다 줄바꿈 추가, 고유명사는 '한글명('영문명')' 표기 엄수)

2. essential_guide: 8가지 핵심 카테고리를 포함하는 JSON 객체
- map_poi: { advice: "필수 명소/맛집 조언 (고유명사는 반드시 한글명('영문명') 표기 후 영문명만 작은따옴표로 감쌀 것)" }
- visa: { advice: "비자 정보 및 관공서 안내", official_url: "공식 비자/K-ETA/입국신고서 사이트 URL (없으면 null)" }
- transport: { advice: "교통 패스/렌터카 추천" }
- apps: { advice: "국가별 특화 필수 앱 (앱 이름에는 절대 작은따옴표를 쓰지 말 것)" }
- connectivity: { advice: "유심/eSIM/공항 픽업 조언 (통신사 이름에 절대 작은따옴표를 쓰지 말 것)" }
- flight: { advice: "항공권 예약 시기/직항 팁" }
- accommodation: { advice: "최적의 숙박 위치 및 동네 추천" }
- safety: { advice: "치안 주의사항 및 긴급 연락처", official_url: "영사콜센터 등 공식 안전 정보 URL (없으면 null)" }

--- 기존 정보 (참고 및 변동 감지용) ---
${infoToAnalyze ? infoToAnalyze : '기존 정보 없음'}
------------------------------------

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
      // 마크다운 JSON 코드 블록 제거 및 클린업
      let cleanText = generatedText.trim();
      if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();

      parsedResult = JSON.parse(cleanText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', generatedText);
      throw new Error('Gemini did not return valid JSON');
    }

    // [New] NO_CHANGES 감지 로직
    if ((parsedResult?.status === "NO_CHANGES" || parsedResult === "NO_CHANGES") && infoToAnalyze) {
        console.log(`[Pro Model] No critical changes detected for ${locationName}. Reusing existing data.`);

        // 갱신 시간만 최신으로 업데이트하고 기존 정보 복구
        await supabaseAdmin
            .from('place_wiki')
            .update({
                ai_practical_info: infoToAnalyze,
                ai_info_updated_at: new Date().toISOString()
            })
            .eq('place_id', String(placeId));

        return new Response(JSON.stringify({
            success: true,
            noChanges: true,
            aiResponse: infoToAnalyze,
            essentialGuide: existingData?.essential_guide
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
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
        const resetValue = reqBody?.oldAiInfo || null;
        await supabaseAdmin
          .from('place_wiki')
          .update({ ai_practical_info: resetValue })
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
