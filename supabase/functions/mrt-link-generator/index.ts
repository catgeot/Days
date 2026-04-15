import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 프리플라이트 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { originalUrl } = await req.json();
    if (!originalUrl) {
      throw new Error("originalUrl is required");
    }

    const API_KEY = Deno.env.get('MYREALTRIP_API_KEY');

    // 기본적으로 원본 URL을 Fallback으로 사용
    let shortLink = originalUrl;

    // TODO: 정확한 마이리얼트립 제휴 링크 생성 API 엔드포인트 파악 후 수정
    // 현재는 API 스펙을 정확히 알 수 없으므로, 시뮬레이션 코드만 배치하고 원본 URL 반환
    if (API_KEY) {
      try {
        const response = await fetch("https://api.myrealtrip.com/partner/v1/links", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
          },
          body: JSON.stringify({ url: originalUrl })
        });

        if (response.ok) {
          const data = await response.json();
          // API 명세에 따라 실제 발급되는 단축 URL 필드명 매핑 필요
          if (data && data.url) {
            shortLink = data.url;
          } else if (data && data.shortUrl) {
            shortLink = data.shortUrl;
          }
        } else {
            console.warn(`[MRT] API 호출 실패: ${response.status} ${response.statusText} (Fallback 적용)`);
        }
      } catch (err) {
        console.error("[MRT] API 통신 중 네트워크 에러 발생, 원본 URL 폴백:", err);
      }
    } else {
        console.warn("[MRT] MYREALTRIP_API_KEY 환경변수가 없습니다. 원본 URL을 반환합니다.");
    }

    return new Response(
      JSON.stringify({ shortLink, originalUrl, success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error: any) {
    console.error("[MRT Link Generator Error]", error);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400
      }
    );
  }
});
