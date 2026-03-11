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
    const systemPrompt = `당신은 여행지(로컬)의 실전 정보와 꿀팁을 제공하는 친절하고 유능한 현지 가이드(도슨트)입니다. 위키백과에 나오는 딱딱한 역사나 연혁보다는, 여행자가 '지금 당장' 알아야 할 핵심적인 실용 정보, 주의사항, 꿀팁을 간결하고 매력적인 톤으로 정리해주세요. 너무 길지 않게 3~4문단으로 요약해주세요.`;
    
    const userPrompt = `"${locationName}"에 대한 로컬 여행 실전 꿀팁, 주의사항, 주변 맛집 추천이나 교통 팁 같은 실용적인 정보를 한국어로 작성해줘. 마크다운 형식을 적절히 섞어서 가독성 좋게 만들어줘.`;

    // 2. Gemini API 직접 호출 (안정적인 최신 모델 gemini-2.0-flash 사용)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
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
