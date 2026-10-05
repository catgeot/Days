import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';

function needsExtension(specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return false;
  const path = specifier.split('?')[0];
  return !/\.[a-zA-Z0-9]+$/.test(path);
}

export async function resolve(specifier, context, nextResolve) {
  if (needsExtension(specifier)) {
    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch {
      return nextResolve(`${specifier}.jsx`, context);
    }
  }
  return nextResolve(specifier, context);
}

function rewriteViteEnv(source) {
  return source.includes('import.meta.env')
    ? source.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__')
    : source;
}

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && /\.(png|jpe?g|gif|webp|svg|css|woff2?)($|\?)/.test(url)) {
    return { format: 'module', source: 'export default "";', shortCircuit: true };
  }
  if (url.startsWith('file:') && url.includes('/src/') && url.endsWith('.js')) {
    const source = rewriteViteEnv(readFileSync(new URL(url), 'utf8'));
    if (source.includes('globalThis.__VITE_ENV__')) {
      return { format: 'module', source, shortCircuit: true };
    }
  }
  if (url.startsWith('file:') && url.endsWith('.json')) {
    return {
      format: 'json',
      source: readFileSync(new URL(url), 'utf8'),
      shortCircuit: true,
    };
  }
  if (url.startsWith('file:') && url.endsWith('.jsx')) {
    const sourceText = rewriteViteEnv(readFileSync(new URL(url), 'utf8'));
    const { code } = transformSync(sourceText, {
      loader: 'jsx',
      format: 'esm',
      jsx: 'automatic',
      sourcefile: url,
    });
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
