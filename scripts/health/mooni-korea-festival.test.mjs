import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  selectMooniKoreaFestivalCandidates,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
const tasks = readFileSync(join(root, 'supabase/functions/_shared/gemini/tasks.ts'), 'utf8');

assert.match(chatModal, /koreaFestivalHint/);
assert.match(chatModal, /mergeMooniKoreaFestivalReply/);
assert.match(tasks, /koreaFestivalHint/);

const NOW = new Date(2026, 9, 5);
const { candidates } = selectMooniKoreaFestivalCandidates(
  [
    {
      contentId: '1',
      title: '고성 통일명태축제',
      eventStartDate: '20261002',
      eventEndDate: '20261005',
      addr1: '강원 고성군',
    },
    {
      contentId: '2',
      title: '설악문화제',
      eventStartDate: '20261019',
      eventEndDate: '20261026',
      addr1: '강원 속초시',
    },
  ],
  { userText: '다다음 주 속초 축제', now: NOW },
);
assert.equal(candidates.length, 1);
assert.equal(candidates[0].contentId, '2');

console.log('health/mooni-korea-festival.test.mjs: OK');
