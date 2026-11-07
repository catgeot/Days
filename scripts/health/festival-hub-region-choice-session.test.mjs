import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const bootHook = readFileSync(
  new URL('../../src/pages/Korea/useFestivalLocationBoot.js', import.meta.url),
  'utf8',
);
const home = readFileSync(
  new URL('../../src/pages/Korea/index.jsx', import.meta.url),
  'utf8',
);
const sessionMod = readFileSync(
  new URL('../../src/pages/Korea/festivalHubRegionChoiceSession.js', import.meta.url),
  'utf8',
);

assert.match(sessionMod, /gateo:festival-hub-region-choice:v1/);
assert.match(bootHook, /shouldApplyBootLocation/);
assert.match(bootHook, /skipBoot/);
assert.match(bootHook, /canApply\(\)/);
assert.match(home, /userRegionExplicitRef/);
assert.match(home, /persistExplicitRegionChoice/);
assert.match(home, /skipBoot: initialRegionChoice != null/);
assert.match(
  home,
  /if \(boot\) \{[\s\S]*?userRegionExplicitRef\.current\) return false/,
);

console.log('festival-hub-region-choice-session.test: OK');
