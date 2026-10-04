/**
 * STAGING ONLY. Delete this function after the XFF check in the PR plan.
 * Underscore folder: `supabase functions deploy` (all) skips it.
 * Do not deploy to production.
 *
 * Returns the raw forwarding headers and the same clientIp() fetch-place-videos uses.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { clientIp } from "../_shared/placeVideoClientIp.ts";

serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-forwarded-for, x-real-ip, cf-connecting-ip",
      },
    });
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
