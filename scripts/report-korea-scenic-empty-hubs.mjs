/**
 * GATEO 선정 명소 — curated=0 국내 hub 리포트.
 *
 *   npm run report:korea-scenic-empty-hubs
 *   npm run report:korea-scenic-empty-hubs -- --json
 *   npm run report:korea-scenic-empty-hubs -- --write-queue
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  buildScenicFillRounds,
  listEmptyScenicHubs,
  SCENIC_FILL_REGION_ORDER,
} from './lib/koreaScenicHubFill.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = join(__dirname, '../plans/korea-scenic-hub-fill-queue.md');

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const writeQueue = args.includes('--write-queue');

const { empty, maxOrder, curatedHubs } = listEmptyScenicHubs();
const byRegion = Object.fromEntries(SCENIC_FILL_REGION_ORDER.map((r) => [r, []]));
byRegion['미정'] = [];
for (const h of empty) {
  const key = h.region && byRegion[h.region] ? h.region : '미정';
  byRegion[key].push(h);
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        curatedHubs,
        emptyHubs: empty.length,
        maxOrder,
        byRegion: Object.fromEntries(
          Object.entries(byRegion).map(([r, list]) => [
            r,
            list.map((h) => ({
              hubId: h.hubId,
              name: h.name,
              attractions: h.attractions,
              withContentId: h.withContentId,
              priority: h.priority,
              regionSource: h.regionSource,
            })),
          ]),
        ),
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    `GATEO 선정 빈 hub: ${empty.length} · 이미 선정 hub ${curatedHubs} · maxOrder ${maxOrder}`,
  );
  console.log('우선: area 링크(P0) → 시·군(P1) · 자치구 제외\n');
  for (const region of [...SCENIC_FILL_REGION_ORDER, '미정']) {
    const list = byRegion[region] || [];
    if (!list.length) continue;
    console.log(`## ${region} (${list.length})`);
    for (const h of list.slice(0, 40)) {
      const p = h.priority === 0 ? 'P0' : 'P1';
      console.log(
        `  ${p} ${h.hubId}  ${h.name}  attractions=${h.attractions} contentId=${h.withContentId}  (${h.regionSource})`,
      );
    }
    if (list.length > 40) console.log(`  … +${list.length - 40}`);
    console.log('');
  }
  console.log('다음: npm run draft:korea-scenic-hub-batch -- --hubs=<id,id,…>');
  console.log('큐 갱신: npm run report:korea-scenic-empty-hubs -- --write-queue');
}

if (writeQueue) {
  const rounds = buildScenicFillRounds(empty, { batchSize: 10 });
  const lines = [];
  lines.push('# GATEO 선정 명소 — 권역·시군 hub 보강 큐');
  lines.push('');
  lines.push(
    '**생성**: `npm run report:korea-scenic-empty-hubs -- --write-queue` (이 파일 덮어씀)',
  );
  lines.push(
    `**스냅샷**: 빈 hub **${empty.length}** · 선정 hub **${curatedHubs}** · maxOrder **${maxOrder}**`,
  );
  lines.push('');
  lines.push('## 사용법');
  lines.push('');
  lines.push('1. 아래 **다음 미완료 라운드**의 hubId를 워커 A/B에 전달 (각 최대 5).');
  lines.push(
    '2. 초안: `npm run draft:korea-scenic-hub-batch -- --hubs=<A목록>` → overrides에 append · blurb·contentId 검수.',
  );
  lines.push(
    '3. `npm run generate:korea-scenic-spots` → `fill:korea-scenic-spot-images` → `audit`/`smoke:korea-scenic-spots`.',
  );
  lines.push('4. 완료 라운드는 표에서 ✅ · 이 파일을 `--write-queue`로 재생성하면 잔여만 남음.');
  lines.push('5. **제외**: 자치구(…구) hub · 이미 선정 있는 hub.');
  lines.push('');
  lines.push('## 라운드 (워커A 5 + 워커B 5)');
  lines.push('');
  lines.push('| R | 워커A | 워커B | 권역 | 상태 |');
  lines.push('|---|-------|-------|------|------|');
  for (const r of rounds) {
    const a = r.workerA.map((id) => `\`${id}\``).join(' · ') || '—';
    const b = r.workerB.map((id) => `\`${id}\``).join(' · ') || '—';
    const regions = r.regions.join('·') || '미정';
    lines.push(`| **${r.round}** | ${a} | ${b} | ${regions} | ⬜ |`);
  }
  lines.push('');
  lines.push(`**합계**: ${rounds.length} 라운드 · hub ${empty.length}.`);
  lines.push('');
  lines.push('## 권역별 잔여');
  lines.push('');
  for (const region of [...SCENIC_FILL_REGION_ORDER, '미정']) {
    const list = byRegion[region] || [];
    if (!list.length) continue;
    lines.push(`### ${region} (${list.length})`);
    lines.push('');
    lines.push(
      list
        .map(
          (h) =>
            `- \`${h.hubId}\` ${h.name} — attr ${h.attractions} · Tour contentId ${h.withContentId}${h.priority === 0 ? ' · **P0**' : ''}`,
        )
        .join('\n'),
    );
    lines.push('');
  }
  writeFileSync(QUEUE_PATH, `${lines.join('\n')}\n`, 'utf8');
  console.error(`[write-queue] ${QUEUE_PATH} · rounds=${rounds.length}`);
}
