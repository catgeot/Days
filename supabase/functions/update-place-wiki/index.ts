import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseGeminiJsonText } from "../_shared/parseGeminiJson.ts";
import { magazineStorageId } from "../_shared/magazinePrompts.ts";
import { resolveCanonicalPlaceId } from "../_shared/resolveCanonicalPlaceId.ts";
import { buildWatsonSystemPrompt, buildWatsonUserPrompt } from "../_shared/watsonPrompts.ts";

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
        const {
          placeId,
          locationName,
          oldAiInfo,
          slug,
          canonicalPlaceId,
          locale = 'ko',
        } = reqBody;

        if (!placeId || !locationName) {
            throw new Error('placeId and locationName are required');
        }

        const canonicalId = resolveCanonicalPlaceId({
          slug,
          placeId,
          locationName,
          canonicalPlaceId,
        });
        const storageId = magazineStorageId(String(canonicalId), locale === 'en' ? 'en' : 'ko');
        requestedPlaceId = storageId;

        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { data: existingData } = await supabaseAdmin
            .from('place_wiki')
            .select('ai_practical_info')
            .eq('place_id', String(storageId))
            .maybeSingle();

        await supabaseAdmin
            .from('place_wiki')
            .update({ ai_practical_info: '[[LOADING]]' })
            .eq('place_id', String(storageId));

        const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY') || Deno.env.get('GEMINI_API_KEY');
        if (!geminiApiKey) {
            throw new Error('GEMINI_API_KEY is not configured on server');
        }

        const today = locale === 'en'
          ? new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

        const systemPrompt = buildWatsonSystemPrompt(locale);
        const userPrompt = buildWatsonUserPrompt(String(locationName), today, locale);

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
      parsedResult = parseGeminiJsonText(generatedText);
    } catch (e) {
      console.error('Failed to parse Gemini JSON output:', generatedText);
      throw new Error('Gemini did not return valid JSON');
    }

    const aiPracticalInfo = parsedResult.markdown || parsedResult.wiki_markdown || generatedText;

    const upsertData: any = {
      place_id: String(storageId),
      ai_practical_info: aiPracticalInfo,
      ai_info_updated_at: new Date().toISOString()
    };

    const { error: dbError } = await supabaseAdmin
      .from('place_wiki')
      .upsert(upsertData, { onConflict: 'place_id' });

    if (dbError) {
      console.error('DB Upsert Error:', dbError);
      throw new Error(`Failed to upsert place_wiki in database: ${dbError.message}`);
    }

    return new Response(JSON.stringify({
      success: true,
      placeId: storageId,
      aiResponse: aiPracticalInfo,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errObj = error as Error;
    console.error('Function Error:', errObj.message);

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
          .eq('ai_practical_info', '[[LOADING]]');
      } catch (dbRestoreErr) {
        console.error('Failed to restore DB state:', dbRestoreErr);
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: errObj.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
