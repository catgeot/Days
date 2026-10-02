import { transformSync } from 'esbuild';
import { readFileSync } from 'node:fs';

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.endsWith('.jsx')) {
    const sourceText = readFileSync(new URL(url), 'utf8');
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
