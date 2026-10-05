/** Test double: the suite installs a client factory before importing the function. */
// deno-lint-ignore no-explicit-any
export function createClient(..._args: unknown[]): any {
  const factory = (globalThis as Record<string, unknown>).__createSupabaseClient;
  if (typeof factory !== "function") {
    throw new Error("test supabase client not installed");
  }
  return factory();
}
