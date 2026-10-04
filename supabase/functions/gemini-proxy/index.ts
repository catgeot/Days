import "@supabase/functions-js/edge-runtime.d.ts";
import { handleGeminiProxy } from "./router.ts";

Deno.serve((req) => handleGeminiProxy(req));
