/**
 * STAGING ONLY. Delete after the XFF check.
 * Deploy: `supabase functions deploy staging-ip-echo --project-ref "$STAGING_REF"`
 * Delete: `supabase functions delete staging-ip-echo --project-ref "$STAGING_REF"`
 * verify_jwt stays true (see config.toml). No CORS header: browsers cannot read this body.
 *
 * Returns the raw forwarding headers and the same clientIp() fetch-place-videos uses.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { clientIp } from "../_shared/placeVideoClientIp.ts";

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204 });
  }
  const body = {
    deleteAfterUse: true,
    stagingOnly: true,
    "x-forwarded-for": req.headers.get("x-forwarded-for"),
    "x-real-ip": req.headers.get("x-real-ip"),
    "cf-connecting-ip": req.headers.get("cf-connecting-ip"),
    forwarded: req.headers.get("forwarded"),
    "x-envoy-external-address": req.headers.get("x-envoy-external-address"),
    clientIp: clientIp(req),
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
