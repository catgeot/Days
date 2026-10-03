import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

function clampMaxResults(n: unknown, opts?: { raiseCap?: boolean }): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 5;
  const cap = opts?.raiseCap ? 20 : 10;
  return Math.min(cap, Math.floor(v));
}

function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body[0] === '#') {
      const isHex = body[1] === 'x' || body[1] === 'X';
      const numStr = isHex ? body.slice(2) : body.slice(1);
      const code = parseInt(numStr, isHex ? 16 : 10);
      if (!Number.isFinite(code)) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      '#39': "'",
    };
    const lower = body.toLowerCase();
    if (Object.hasOwn(named, body)) return named[body];
    if (Object.hasOwn(named, lower)) return named[lower];
    return match;
  });
}

serve(async (req) => {
  // CORS 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query, fallbackQuery, placeId } = body;
    const mode = body.mode === 'festival' ? 'festival' : 'place';
    const pageToken =
      typeof body.pageToken === 'string' && body.pageToken.trim()
        ? body.pageToken.trim()
        : '';
    const skipUpsert = Boolean(pageToken) || body.skipUpsert === true;
    const maxResults = clampMaxResults(body.maxResults, {
      raiseCap: skipUpsert && !pageToken,
    });
    const relevanceLanguage =
      typeof body.relevanceLanguage === 'string' && body.relevanceLanguage.trim()
        ? body.relevanceLanguage.trim()
        : 'ko';
    const regionCode =
      typeof body.regionCode === 'string' && body.regionCode.trim()
        ? body.regionCode.trim()
        : relevanceLanguage === 'en'
          ? 'US'
          : 'KR';

    if (!query || !placeId) {
      throw new Error('query and placeId are required');
    }

    // 서버의 환경변수에서 YOUTUBE API 키를 읽어옴.
    const youtubeApiKey = Deno.env.get('VITE_YOUTUBE_API_KEY') || Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      throw new Error('YOUTUBE_API_KEY is not configured on server');
    }

    const primaryQ = mode === 'festival'
      ? String(query).trim()
      : `${query} 여행 브이로그`;

    // 1차 검색
    let params = new URLSearchParams({
      part: 'snippet',
      q: primaryQ,
      maxResults: String(maxResults),
      type: 'video',
      relevanceLanguage,
      regionCode,
      videoEmbeddable: 'true',
      videoSyndicated: 'true',
      key: youtubeApiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);

    let youtubeResponse = await fetch(`${BASE_URL}/search?${params.toString()}`);

    if (!youtubeResponse.ok) {
      const errorData = await youtubeResponse.json().catch(() => ({}));
      throw new Error(`YouTube API Error: ${youtubeResponse.status} - ${errorData.error?.message || 'Unknown Error'}`);
    }

    let data = await youtubeResponse.json();

    // 결과가 없거나 적을 경우 2차 일반 검색 (pageToken 없을 때만)
    if ((!data.items || data.items.length === 0) && !pageToken) {
      const secondQuery = fallbackQuery
        ? fallbackQuery
        : (mode === 'festival' ? String(query).trim() : `${query} travel vlog`);
      params = new URLSearchParams({
        part: 'snippet',
        q: secondQuery,
        maxResults: String(maxResults),
        type: 'video',
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        key: youtubeApiKey,
      });

      youtubeResponse = await fetch(`${BASE_URL}/search?${params.toString()}`);
      if (!youtubeResponse.ok) {
        const errorData = await youtubeResponse.json().catch(() => ({}));
        throw new Error(`YouTube API Error (Fallback): ${youtubeResponse.status} - ${errorData.error?.message || 'Unknown Error'}`);
      }
      data = await youtubeResponse.json();
    }

    const tagBase = mode === 'festival' ? ['#축제', '#festival'] : ['#여행', '#vlog'];

    const excludeSet = new Set<string>();
    if (Array.isArray(body.excludeVideoIds)) {
      for (const rawId of body.excludeVideoIds) {
        if (typeof rawId === 'string' && rawId.trim()) excludeSet.add(rawId.trim());
      }
    }

    const mapSnippetItems = (items: any[]) =>
      (items || []).map((item: any) => ({
        id: item.id.videoId,
        title: decodeHtmlEntities(item.snippet.title || ''),
        location_keyword: query,
        channelTitle: item.snippet.channelTitle || null,
        publishedAt: item.snippet.publishedAt || null,
        ai_context: {
          summary: item.snippet.description || '영상 설명이 없습니다.',
          tags: [`#${query}`, ...tagBase],
          best_moment: { time: '00:00', desc: '자동 생성된 영상' },
          timeline: []
        },
      }));

    let collected = mapSnippetItems(data.items);
    if (excludeSet.size > 0) {
      collected = collected.filter((v) => v.id && !excludeSet.has(v.id));
    }

    let nextPageToken =
      typeof data.nextPageToken === 'string' && data.nextPageToken
        ? data.nextPageToken
        : null;

    const mayFollowPages = skipUpsert && excludeSet.size > 0 && !pageToken;
    let pagesFetched = 1;
    const maxFollowPages = 4;

    while (
      mayFollowPages &&
      collected.length < maxResults &&
      nextPageToken &&
      pagesFetched < maxFollowPages
    ) {
      pagesFetched += 1;
      const followParams = new URLSearchParams({
        part: 'snippet',
        q: primaryQ,
        maxResults: String(maxResults),
        type: 'video',
        relevanceLanguage,
        regionCode,
        videoEmbeddable: 'true',
        videoSyndicated: 'true',
        key: youtubeApiKey,
        pageToken: nextPageToken,
      });

      youtubeResponse = await fetch(`${BASE_URL}/search?${followParams.toString()}`);
      if (!youtubeResponse.ok) break;

      data = await youtubeResponse.json();
      const batch = mapSnippetItems(data.items).filter(
        (v) => v.id && !excludeSet.has(v.id),
      );
      for (const v of batch) {
        if (!collected.some((c) => c.id === v.id)) collected.push(v);
      }
      nextPageToken =
        typeof data.nextPageToken === 'string' && data.nextPageToken
          ? data.nextPageToken
          : null;
    }

    const videosToCache = collected.slice(0, maxResults);

    if (!skipUpsert) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

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
    }

    return new Response(JSON.stringify({
      success: true,
      videos: videosToCache,
      nextPageToken,
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
