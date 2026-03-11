import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, placeId } = await req.json();

    if (!query || !placeId) {
      throw new Error('query and placeId are required');
    }

    // 서버의 환경변수에서 YOUTUBE API 키를 읽어옴.
    const youtubeApiKey = Deno.env.get('VITE_YOUTUBE_API_KEY') || Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on server');
    }

    // 1. YouTube API 호출
    const params = new URLSearchParams({
      part: 'snippet',
      q: `${query} 여행 브이로그 travel vlog`,
      maxResults: '5',
      type: 'video',
      videoCaption: 'closedCaption',
      relevanceLanguage: 'ko',
      regionCode: 'KR',
      key: youtubeApiKey,
    });

    const youtubeResponse = await fetch(`${BASE_URL}/search?${params.toString()}`);

    if (!youtubeResponse.ok) {
      const errorData = await youtubeResponse.json().catch(() => ({}));
      throw new Error(`YouTube API Error: ${youtubeResponse.status} - ${errorData.error?.message || 'Unknown Error'}`);
    }

    const data = await youtubeResponse.json();

    // API 응답 데이터를 프로젝트 표준 규격(TRAVEL_VIDEOS)으로 변환
    const videosToCache = data.items?.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      location_keyword: query,
      ai_context: {
        summary: item.snippet.description || '영상 설명이 없습니다.',
        tags: [`#${query}`, '#여행', '#vlog'],
        best_moment: { time: '00:00', desc: '자동 생성된 영상' },
        timeline: []
      },
    })) || [];

    // 2. Supabase Admin Client 생성 (Service Role Key로 RLS 우회하여 DB 저장)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. DB 테이블 Upsert (Cache 업데이트)
    const { error: dbError } = await supabaseAdmin
      .from('place_videos')
      .upsert({
        place_id: String(placeId),
        videos: videosToCache,
        last_updated: new Date().toISOString()
      });

    if (dbError) {
      console.error('DB Upsert Error:', dbError);
      throw new Error('Failed to upsert place_videos in database');
    }

    // 4. 성공 결과 반환
    return new Response(JSON.stringify({ 
      success: true, 
      videos: videosToCache 
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