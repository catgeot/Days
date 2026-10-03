// DRAFT, NOT DEPLOYED. Target path: supabase/functions/gallery-moderate/index.ts
// Admin-only gallery moderation. The pattern follows update-place-toolkit
// (resolveCaller: Bearer -> auth.getUser -> admin allowlist), except that the allowlist here is
// the app_admins table (via is_app_admin, service_role only) instead of an env list.
//
// POST { action: 'remove' | 'restore' | 'dismiss', placeId, imageId, reason?, note? }
//   401  no/invalid user JWT (the anon key JWT has no user, so it gets 401)
//   403  logged in but not a gallery admin
//   400  bad input        404  place/photo/exclusion not found        200  { ok, result }
// All writes happen inside one SQL transaction (gallery_moderate_apply, service_role only):
// row lock on place_stats -> exclusion row (snapshot, original index, removed_by/at) -> array
// update -> thumbnail recompute -> reports actioned. Restore reverses it. The edge function
// itself never read-modify-writes the JSON array.
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(
  String(Deno.env.get("GALLERY_MODERATE_ALLOWED_ORIGINS") ?? "https://www.gateo.kr,https://gateo.kr")
    .split(",").map((s) => s.trim()).filter(Boolean),
);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://www.gateo.kr",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(req: Request, body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

function extractBearerToken(req: Request): string {
  const raw = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : "";
}

const ACTIONS = new Set(["remove", "restore", "dismiss"]);
const REASONS = new Set(["irrelevant", "inappropriate", "low_quality", "copyright", "other", "admin"]);
const ID_RE = /^[^\s<>"'\\\u0000-\u001f]{1,200}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { ok: false, error: "method not allowed" }, 405);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // 1) caller identity (anon-key JWTs carry no user, so they get 401)
  const token = extractBearerToken(req);
  if (!token) return json(req, { ok: false, error: "unauthorized" }, 401);
  let userId: string | null = null;
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    userId = error ? null : data?.user?.id ?? null;
  } catch (e) {
    console.warn("[gallery-moderate] auth.getUser failed:", (e as Error)?.message);
  }
  if (!userId) return json(req, { ok: false, error: "unauthorized" }, 401);

  // 2) admin allowlist (fail closed on any error)
  const { data: isAdmin, error: adminErr } = await supabaseAdmin.rpc("is_app_admin", {
    p_uid: userId,
    p_scope: "gallery",
  });
  if (adminErr) {
    console.error("[gallery-moderate] admin check failed:", adminErr.message);
    return json(req, { ok: false, error: "admin check unavailable" }, 503);
  }
  if (isAdmin !== true) return json(req, { ok: false, error: "forbidden" }, 403);

  // 3) input
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(req, { ok: false, error: "invalid json" }, 400);
  }
  const action = String(body.action ?? "");
  const placeId = String(body.placeId ?? "").trim();
  const imageId = String(body.imageId ?? "").trim();
  const reason = String(body.reason ?? "admin");
  const note = body.note == null ? null : String(body.note).slice(0, 300);
  if (!ACTIONS.has(action) || !REASONS.has(reason) || !ID_RE.test(placeId) || !ID_RE.test(imageId)) {
    return json(req, { ok: false, error: "bad input" }, 400);
  }

  // 4) single transactional write (service_role; the function re-checks the actor)
  const { data, error } = await supabaseAdmin.rpc("gallery_moderate_apply", {
    p_action: action,
    p_place_id: placeId,
    p_image_id: imageId,
    p_actor: userId,
    p_reason: reason,
    p_note: note,
  });
  if (error) {
    const code = (error as { code?: string }).code ?? "";
    const status = code === "P0002" ? 404 : code === "22023" ? 400 : code === "42501" ? 403 : 500;
    console.error("[gallery-moderate]", action, placeId, imageId, code, error.message);
    return json(req, { ok: false, error: status === 500 ? "moderation failed" : error.message }, status);
  }
  console.log("[gallery-moderate]", JSON.stringify({ action, placeId, imageId, actor: userId, result: data }));
  return json(req, { ok: true, result: data }, 200);
});
