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
        const { placeId, locationName, oldAiInfo } = reqBody; // forceUpdate 제거됨, 항상 강제 작성
        requestedPlaceId = placeId;

        if (!placeId || !locationName) {
            throw new Error('placeId and locationName are required');
        }

        // 1. Supabase Admin Client 생성 (Service Role Key로 RLS 우회) - DB 선제 업데이트용
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 기존 데이터 조회 (에러 발생 시 롤백용)
        const { data: existingData } = await supabaseAdmin
            .from('place_wiki')
            .select('ai_practical_info')
            .eq('place_id', String(placeId))
            .single();

        // AI 작업 시작 전 DB를 '[[LOADING]]' 상태로 업데이트하여
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

        // 2. 프롬프트 구성 (메인 모델 호출)
        // [수정] 디펜서 로직(NO_CHANGES 감지) 및 기존 정보 비교 완전히 제거. 무조건 지정된 단일 소스 원칙에 맞게 새롭게 작성함.
        const systemPrompt = `당신은 제미나이의 강력한 정보 검색 능력을 활용하는 베테랑 로컬 가이드입니다. 여행자가 이곳에 대해 가진 "여긴 도대체 어떤 곳이고, 가면 뭘 할 수 있어?"라는 근본적인 궁금증을 속 시원하게 풀어주세요. 위키백과에 나오는 지루한 역사나 뻔한 소리는 철저히 배제하고, 가장 생생하고 실용적인 최신 현지 정보만 자연스러운 대화형 경어체(해요체나 하십시오체)로 제공하세요.

**[핵심: 고유명사 특수문자 표기법 - 절대 규칙]**
우리의 웹 서비스는 당신이 작성한 텍스트에서 특정 기호([@영문명@]) 안의 영문자를 정규식으로 추출하여 지도 검색이나 웹 검색 아웃링크를 동적으로 생성합니다. 작은따옴표(') 중복으로 인한 파싱 오류를 막기 위해, 장소나 고유명사를 표기할 때는 **반드시 "한글명[@영문명@]" 형식**을 사용하세요.

1. **[지도 검색/웹 검색 대상]** 명소, 유적지, 식당, 호텔, 필수 앱, 지역 교통카드 등
  - 강제 사항: 반드시 \`한글명[@영문명@]\` 표기
  - ✅ 올바른 예: "시카고 핫도그의 명가 포틸로스[@Portillo's@]에 방문해 보세요.", "교통카드는 벤틀라[@Ventra@]를 구매하세요."
  - ❌ 잘못된 예: "포틸로스('Portillo's')", "포틸로스(Portillo's)", "벤틀라['Ventra']"
2. **[절대 기호 사용 금지 대상]** 단순 영단어, 분위기 묘사, 일반 명사(Wi-Fi, BBQ 등)에는 [@ @] 기호를 절대 쓰지 마세요.

**[서식 및 스타일 규칙]**
1. 마크다운 헤딩(#, ##, ###) 절대 사용 금지: 레이아웃이 깨지므로 절대 쓰지 마세요.
2. 가독성을 위해 불릿(*, -)은 꼭 필요한 나열에만 최소한으로 허용하며, 주로 줄바꿈(Enter 두 번, \\n\\n)과 굵게(**텍스트**)를 활용해 문단을 예쁘게 분리하세요.
3. 문장 맨 앞에 'Advice:', 'Tip:' 같은 불필요한 메타 단어를 절대 쓰지 마세요.`;

        const userPrompt = `"${locationName}"에 대해 아래 조건을 만족하는 단일 JSON 형식으로 응답해 줘. JSON 파싱 에러가 없도록 이스케이프 처리에 각별히 신경 써.

{
  "status": "UPDATED",
  "markdown": "위키 본문과 툴킷 데이터가 모두 포함된 전체 마크다운 텍스트"
}

🚨 [중요: markdown 필드 작성 절대 규칙] 🚨
AI인 당신은 아래 제시된 마크다운 템플릿의 '구조', '섹션 제목', '특수 구분자(---[TOOLKIT_START]--- 등)'를 토씨 하나 빼놓지 말고 100% 동일하게 출력해야 합니다. 구조를 임의로 변경하거나 구분자를 누락하면 시스템 에러가 발생합니다.

▼▼▼ 템플릿 시작 ▼▼▼
🌟 1분 요약
(정체성과 핵심 매력을 2~3문장으로 요약. 첫 줄에 '작성 기준일: ${today}'를 짧게 표기)

🛂 입국/비용 & 이동 팁
(비자, 물가, 비행시간, 추천 이동수단. 가독성 좋게 줄바꿈 활용)

⚠️ 실전 안전 & 에티켓
(치안, 금기사항)

💡 시크릿 꿀팁 & 맛집
(현지인 추천 핫플, 환전, 실전 팁. 고유명사는 반드시 한글명[@영문명@] 표기 엄수!)

---[TOOLKIT_START]---
[visa]: 비자 정보 및 관공서 안내 (공식사이트가 있다면 끝에 | URL: https://... 추가)
[flight]: 대략적인 경유/비행 소요 시간, 항공권 예약 시기 및 직항 팁
[accommodation]: 베이스캠프 숙박 위치 추천 1~2곳 및 추천 이유
[connectivity]: 유심/eSIM 및 통신사 팁 (이름에 [@ @] 기호 금지)
[transport]: 대중교통 패스권 및 렌터카 추천
[apps]: 국가별 특화 필수 앱 (이름에 [@ @] 기호 금지)
[map_poi]: 핵심 명소/맛집 조언 (반드시 한글명[@영문명@] 표기 엄수)
[safety]: 치안 주의사항 및 긴급 연락처
---[TOOLKIT_END]---
▲▲▲ 템플릿 끝 ▲▲▲`;

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

    const aiPracticalInfo = parsedResult.markdown || parsedResult.wiki_markdown || generatedText;

    // 3. DB 테이블 업데이트
    const updateData: any = {
      ai_practical_info: aiPracticalInfo,
      ai_info_updated_at: new Date().toISOString()
    };

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
