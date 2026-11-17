#!/usr/bin/env node
/**
 * Bundle middleware.js the way Vercel Edge does, then reject what that bundler cannot ship.
 *
 * esbuild 0.27 inlines `with { type: 'json' }` and deletes the syntax, so a clean bundle
 * does not prove the edge compiler can parse the source. This script fails the build when
 * any file in the middleware graph still uses import attributes.
 *
 *   npm run verify:edge-middleware-bundle
 */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, '.cache/edge-middleware-bundle.mjs');
const esbuildBin = join(root, 'node_modules/esbuild/bin/esbuild');
const IMPORT_ATTRIBUTE = /\bwith\s*\{[^}]*\btype\s*:/;
const FORBIDDEN_INPUTS = [
  'src/utils/worldEvents.js',
  'src/pages/Home/data/worldEvents.json',
  'src/pages/Home/data/travelSpots-list.json',
  'src/pages/Home/data/travelSpots.js',
];
const SLIM_SOURCE = 'src/edge/worldEventCrawlerSources.generated.js';
const SLIM_SOURCE_MAX_BYTES = 96 * 1024;

assert.ok(existsSync(esbuildBin), 'esbuild required');

const rejectImportAttributes = {
  name: 'reject-import-attributes',
  setup(build) {
    build.onLoad({ filter: /\.[cm]?jsx?$/ }, (args) => {
      if (args.path.includes('node_modules')) return null;
      const text = readFileSync(args.path, 'utf8');
      if (!IMPORT_ATTRIBUTE.test(text)) return null;
      return {
        errors: [
          {
            text: `Vercel edge bundler cannot parse import attributes in ${args.path}`,
          },
        ],
      };
    });
  },
};

mkdirSync(dirname(outFile), { recursive: true });
rmSync(outFile, { force: true });

const result = await esbuild.build({
  absWorkingDir: root,
  entryPoints: [join(root, 'middleware.js')],
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  outfile: outFile,
  logLevel: 'warning',
  metafile: true,
  plugins: [rejectImportAttributes],
});

const source = readFileSync(outFile, 'utf8');
const bytes = Buffer.byteLength(source, 'utf8');
const inputs = Object.keys(result.metafile.inputs).map((input) => input.replaceAll('\\', '/'));

assert.ok(!IMPORT_ATTRIBUTE.test(source), 'edge bundle must not contain JSON import attributes');
assert.ok(!source.includes('cityAttractionHubs.js'), 'edge bundle must not pull cityAttractionHubs');
assert.ok(!source.includes('koreaLocalScenicLists.js'), 'edge bundle must not pull koreaLocalScenicLists');

for (const input of inputs) {
  for (const forbidden of FORBIDDEN_INPUTS) {
    assert.ok(
      !input.endsWith(forbidden),
      `edge bundle pulled ${input}`,
    );
  }
}

const slimFromMeta = Object.entries(result.metafile.inputs).find(([input]) =>
  input.replaceAll('\\', '/').endsWith(SLIM_SOURCE),
);
assert.ok(slimFromMeta, `edge bundle must include ${SLIM_SOURCE}`);
assert.ok(
  slimFromMeta[1].bytes <= SLIM_SOURCE_MAX_BYTES,
  `${SLIM_SOURCE} is ${slimFromMeta[1].bytes} bytes (max ${SLIM_SOURCE_MAX_BYTES})`,
);

const maxBytes = 4 * 1024 * 1024;
assert.ok(bytes <= maxBytes, `edge middleware bundle ${bytes} bytes exceeds ${maxBytes}`);

const attributeProbe = await esbuild
  .build({
    absWorkingDir: root,
    stdin: {
      contents: "import './src/utils/worldEvents.js';\n",
      resolveDir: root,
      sourcefile: 'edge-import-attribute-probe.js',
    },
    bundle: true,
    write: false,
    platform: 'neutral',
    format: 'esm',
    plugins: [rejectImportAttributes],
    logLevel: 'silent',
  })
  .then(() => null)
  .catch((error) => error);

assert.ok(attributeProbe instanceof Error, 'import attribute probe should fail the edge bundle');
assert.match(attributeProbe.message, /import attributes/);

console.log('verify:edge-middleware-bundle PASS');
console.log(`  bytes ${bytes}`);
console.log(`  slim-source-bytes ${slimFromMeta[1].bytes}`);
console.log('  import-attributes none');
console.log('  import-attribute-probe rejected');
console.log(`  output ${outFile}`);
