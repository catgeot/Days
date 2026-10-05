const mockUrl = new URL('./youtube-session-supabase-mock.mjs', import.meta.url).href;

function isSupabaseSpecifier(specifier) {
  return specifier === '../../../shared/api/supabase'
    || specifier.endsWith('/shared/api/supabase');
}

export async function resolve(specifier, context, nextResolve) {
  if (isSupabaseSpecifier(specifier)) {
    return { url: mockUrl, shortCircuit: true };
  }
  if (specifier.startsWith('.') && !/\.(js|mjs|cjs|json|jsx|node)$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch (err) {
      try {
        return await nextResolve(`${specifier}.jsx`, context);
      } catch {
        throw err;
      }
    }
  }
  return nextResolve(specifier, context);
}
