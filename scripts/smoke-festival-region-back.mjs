/**
 * Festival hub — parent region back control is distinct from city chips.
 *   npm run smoke:festival-region-back
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const index = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
const ko = JSON.parse(readFileSync(join(root, 'src/i18n/locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log(`OK    ${msg}`);
  else {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  }
}

assert(index.includes('function ParentRegionBackButton'), 'ParentRegionBackButton exists');
assert(index.includes('parentRegionBackButtonClass'), 'borderless row back styles');
assert(index.includes('data-festival-region-back'), 'region back data attribute for QA');
assert(
  index.includes("rowCompanionSidePanel ? ' lg:hidden' : ''"),
  'row back visible on desktop unless map split side flap',
);
assert(index.includes('role="separator"'), 'divider after row back control');
assert(index.includes("layout=\"row\""), 'row layout uses ParentRegionBackButton');
assert(!index.includes('Undo2'), 'legacy undo chip icon removed from hub');

assert(ko.korea.common.parentRegionBack === '‹ {{label}} 전체', 'KO parentRegionBack');
assert(
  ko.korea.common.parentRegionBackAria === '{{label}} 전체로 돌아가기',
  'KO parentRegionBackAria',
);
assert(/‹ All \{\{label\}\}/.test(en.korea.common.parentRegionBack), 'EN parentRegionBack');
assert(/Back to all of/.test(en.korea.common.parentRegionBackAria), 'EN parentRegionBackAria');

if (failed) process.exit(1);
console.log('\nsmoke-festival-region-back: all assertions passed');
