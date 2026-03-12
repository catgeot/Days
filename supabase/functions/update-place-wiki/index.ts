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

  try {
    const { placeId, locationName } = await req.json();

    if (!placeId || !locationName) {
      throw new Error('placeId and locationName are required');
    }

    // 서버의 환경변수에서 제미나이 키를 읽어옴. 프론트엔드 환경변수 이름과 동일하게 구성할 수 있음.
    const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured on server');
    }

    // 1. 프롬프트 구성
    const systemPrompt = `당신은 제미나이의 강력한 정보 검색 능력을 활용하는 베테랑 로컬 가이드입니다. 여행자가 이곳에 대해 가진 "여긴 도대체 어떤 곳이고, 가면 뭘 할 수 있어?"라는 근본적인 궁금증을 속 시원하게 풀어주세요. 위키백과에 나오는 지루한 역사나 뻔한 소리는 철저히 배제하고, 가장 생생하고 실용적인 최신 현지 정보만 제공하세요.`;
    
    const userPrompt = `"${locationName}"에 대해 아래 4가지 항목을 포함하여 마크다운(Markdown) 형식으로 가독성 좋고 깔끔하게 정리해줘.

1. 🌟 1분 요약: 이곳은 어떤 곳인가요?
- 이곳의 정체성과 핵심 매력을 2~3문장으로 아주 쉽고 직관적으로 요약. ("아하! 이런 곳이구나!" 하고 바로 감이 오도록)
- 이곳에서 여행자가 얻을 수 있는 최고의 경험이 무엇인지 명확히 짚어줄 것.

2. 🛂 입국/비용 & 최적의 이동 팁
- 한국인 기준 비자 및 물가 수준 (숨겨진 관광세 등)
- 한국발 직항 여부 및 비행 시간, 현지에서의 추천 이동 수단

3. ⚠️ 실전 안전 & 로컬 에티켓
- 현지에서 특별히 주의해야 할 위험성 (치안, 소매치기 등)
- 절대 하면 안 되는 금기사항이나 문화적 에티켓

4. 💡 로컬 가이드의 시크릿 꿀팁 & 맛집
- 관광객은 잘 모르는 진짜 현지인 추천 핫플이나 맛집 1~2곳 (상호명 포함 가능하면 포함)
- 환전 팁, 교통권, 방문하기 가장 좋은 비밀 시간대 등 실전 팁

답변은 간결하고 현실적이며, 여행자의 가슴을 뛰게 하면서도 실질적인 "아하!"를 주는 세련된 가이드 톤으로 작성해줘.`;

    // 2. Gemini API 직접 호출 (안정적인 최상위 모델 gemini-2.5-pro 사용 - 높은 신뢰도 및 최신정보 반영)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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

    // 3. Supabase Admin Client 생성 (Service Role Key로 RLS 우회)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. DB 테이블 업데이트
    const { error: dbError } = await supabaseAdmin
      .from('place_wiki')
      .update({
        ai_practical_info: generatedText,
        ai_info_updated_at: new Date().toISOString()
      })
      .eq('place_id', String(placeId));

    if (dbError) {
      console.error('DB Update Error:', dbError);
      throw new Error('Failed to update place_wiki in database');
    }

    // 5. 성공 결과 및 생성된 텍스트 반환
    return new Response(JSON.stringify({ 
      success: true, 
      aiResponse: generatedText 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errObj = error as Error;
    console.error('Function Error:', errObj.message);
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
