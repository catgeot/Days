import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.endsWith('.jsx')) {
    const sourceText = readFileSync(new URL(url), 'utf8');
    let { code } = transformSync(sourceText, {
      loader: 'jsx',
      format: 'esm',
      jsx: 'automatic',
      sourcefile: url,
    });
    if (code.includes('import.meta.env')) {
      code = code.replaceAll('import.meta.env', 'globalThis.__VITE_ENV__');
    }
    return { format: 'module', source: code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
