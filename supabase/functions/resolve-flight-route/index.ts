import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  buildRouteAdjacency,
  DEFAULT_ORIGIN_IATA,
  findNearestScheduledAirport,
  resolveGraphFlightRouteTopN,
  type AirportRow,
} from "../_shared/flightRouteGraph.ts";
import type { AirportMeta } from "../_shared/flightRouteGeoRules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Warm-instance cache — OpenFlights graph (~37k pairs). */
let cachedAdjacency: Map<string, Set<string>> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function loadAdjacency(supabase: ReturnType<typeof createClient>) {
  const now = Date.now();
  if (cachedAdjacency && now - cachedAt < CACHE_TTL_MS) return cachedAdjacency;

  const PAGE = 1000;
  const routes: Array<{ source_iata: string; dest_iata: string }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("air_routes")
      .select("source_iata, dest_iata")
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    routes.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  cachedAdjacency = buildRouteAdjacency(routes);
  cachedAt = now;
  return cachedAdjacency;
}

async function loadScheduledAirports(supabase: ReturnType<typeof createClient>): Promise<AirportRow[]> {
  const PAGE = 1000;
  const all: AirportRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("airports")
      .select("iata_code, latitude_deg, longitude_deg")
      .eq("scheduled_service", "yes")
      .not("iata_code", "is", null)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return all;
}

async function loadAirportMetaMap(
  supabase: ReturnType<typeof createClient>,
): Promise<Map<string, AirportMeta>> {
  const PAGE = 1000;
  const map = new Map<string, AirportMeta>();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("airports")
      .select("iata_code, latitude_deg, longitude_deg, iso_country, continent, type, scheduled_service")
      .not("iata_code", "is", null)
      .range(from, from + PAGE - 1);

    if (error) throw new Error(error.message);
    if (!data?.length) break;
    for (const row of data) {
      const code = String(row.iata_code ?? "").trim().toUpperCase();
      if (code.length !== 3) continue;
      map.set(code, {
        iata_code: code,
        latitude_deg: Number(row.latitude_deg),
        longitude_deg: Number(row.longitude_deg),
        iso_country: row.iso_country ?? null,
        continent: row.continent ?? null,
        type: row.type ?? null,
        scheduled_service: row.scheduled_service ?? null,
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  return map;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const originIata = String(body.originIata ?? DEFAULT_ORIGIN_IATA).trim().toUpperCase();
    let destIata = String(body.destIata ?? "").trim().toUpperCase();
    const lat = body.lat != null ? Number(body.lat) : NaN;
    const lng = body.lng != null ? Number(body.lng) : NaN;
    const maxNearestKm = body.maxNearestKm != null ? Number(body.maxNearestKm) : 650;
    const topN = body.topN != null ? Math.max(1, Math.min(5, Number(body.topN))) : 1;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials missing on Edge runtime");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let nearestAirport: { iata: string; lat: number; lng: number; km: number } | null = null;
    if (destIata.length !== 3 && Number.isFinite(lat) && Number.isFinite(lng)) {
      const airports = await loadScheduledAirports(supabase);
      nearestAirport = findNearestScheduledAirport(lat, lng, airports, maxNearestKm);
      if (nearestAirport) destIata = nearestAirport.iata;
    }

    if (destIata.length !== 3) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "destIata or lat/lng within maxNearestKm required",
          nearestAirport,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [adjacency, airportMeta] = await Promise.all([
      loadAdjacency(supabase),
      loadAirportMetaMap(supabase),
    ]);
    const alternatives = resolveGraphFlightRouteTopN(originIata, destIata, adjacency, {
      airportMeta,
      topN,
    });
    const graph = alternatives[0] ?? null;

    return new Response(
      JSON.stringify({
        ok: true,
        originIata,
        destIata,
        nearestAirport,
        hubIatas: graph?.hubIatas ?? null,
        hops: graph?.hops ?? null,
        source: graph?.source ?? "graph-unresolved",
        path: graph?.path ?? null,
        alternatives: alternatives.map((row) => ({
          hubIatas: row.hubIatas,
          hops: row.hops,
          source: row.source,
          path: row.path,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[resolve-flight-route]", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
