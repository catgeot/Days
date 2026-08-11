/**
 * 빈 hub → korea-scenic-spots-overrides 초안 조각.
 *
 *   npm run draft:korea-scenic-hub-batch -- --hubs=pyeongchang,namhae
 *   npm run draft:korea-scenic-hub-batch -- --hubs=ansan --json
 *   npm run draft:korea-scenic-hub-batch -- --hubs=ansan --per-hub=3   # 의도적 상한만
 *
 * 기본: hub attractions **전수**(개수 상한 없음). 이미 선정된 hub는 미등재만.
 * 출력은 stdout. scenic overrides에 수동 append 후 generate · fill images · audit.
 * **시도 색인**: hubId가 `korea-area-code-overrides.mjs`에 없으면 areas에 append →
 *   `npm run generate:korea-area-codes` (중·소분류 칩용 · 생략 금지).
 * blurb은 자리표시 — 검수 시 다듬기. contentId null은 Tour 조회 후 채움.
 */
import {
  draftScenicSpotsForHubs,
  listEmptyScenicHubs,
} from './lib/koreaScenicHubFill.mjs';

function parseArgs(argv) {
  /** @type {{ hubs: string[], perHub: number | null, json: boolean, startOrder: number | null, help?: boolean }} */
  const out = { hubs: [], perHub: null, json: false, startOrder: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--hubs' || a.startsWith('--hubs=')) {
      const v = a.includes('=') ? a.split('=').slice(1).join('=') : argv[++i];
      out.hubs = String(v || '')
        .split(/[,|\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (a === '--per-hub' || a.startsWith('--per-hub=')) {
      const v = a.includes('=') ? a.split('=')[1] : argv[++i];
      const n = Number(v);
      out.perHub = Number.isFinite(n) && n > 0 ? Math.max(1, n) : null;
    } else if (a === '--start-order' || a.startsWith('--start-order=')) {
      const v = a.includes('=') ? a.split('=')[1] : argv[++i];
      out.startOrder = Number(v);
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    }
  }
  return out;
}

const opts = parseArgs(process.argv.slice(2));
if (opts.help || opts.hubs.length === 0) {
  console.log(`Usage:
  npm run draft:korea-scenic-hub-batch -- --hubs=pyeongchang,namhae
  npm run draft:korea-scenic-hub-batch -- --hubs=ansan --json
  npm run draft:korea-scenic-hub-batch -- --hubs=ansan --per-hub=3

기본: hub attractions 전수(개수 상한 없음). --per-hub는 의도적 상한일 때만.
이미 선정된 hub는 미등재 명소만 초안.
hub 보강 후: korea-area-code-overrides에 hubId 색인 → generate:korea-area-codes.

Empty hub snapshot: npm run report:korea-scenic-empty-hubs`);
  if (opts.hubs.length === 0 && !opts.help) {
    const { empty } = listEmptyScenicHubs();
    console.error(
      `\n[hint] 빈 hub ${empty.length} · 예: --hubs=${empty
        .slice(0, 5)
        .map((h) => h.hubId)
        .join(',')}`,
    );
    process.exit(opts.help ? 0 : 1);
  }
  process.exit(0);
}

const { drafts, skipped, nextOrder } = draftScenicSpotsForHubs(opts.hubs, {
  perHub: opts.perHub,
  startOrder: Number.isInteger(opts.startOrder) ? opts.startOrder : undefined,
});

if (opts.json) {
  console.log(JSON.stringify({ drafts, skipped, nextOrder }, null, 2));
  process.exit(drafts.length ? 0 : 1);
}

if (skipped.length) {
  console.error('[skipped]');
  for (const s of skipped) console.error(`  ${s.hubId}: ${s.reason}`);
}

if (!drafts.length) {
  console.error('[draft] no spots — nothing to append');
  process.exit(1);
}

console.log('// --- paste into scripts/data/korea-scenic-spots-overrides.mjs spots[] ---');
console.log(`// nextOrder after batch: ${nextOrder}`);
console.log('// review blurb + contentId before generate');
console.log(
  drafts
    .map((d) => {
      const cid =
        d.contentId == null ? 'null' : `'${d.contentId}'`;
      const warn = d._meta?.needsContentId ? ' // TODO contentId' : '';
      return `    {
      order: ${d.order},
      id: '${d.id}',
      name: '${d.name.replace(/'/g, "\\'")}',
      blurb: '${String(d.blurb).replace(/'/g, "\\'")}',
      region: '${d.region}',
      hubId: '${d.hubId}',
      attractionName: '${d.attractionName.replace(/'/g, "\\'")}',
      contentId: ${cid},
    },${warn}`;
    })
    .join('\n'),
);
console.error(
  `[draft] ${drafts.length} spots · hubs=${opts.hubs.join(',')} · nextOrder=${nextOrder}${
    opts.perHub != null ? ` · perHub=${opts.perHub}` : ' · perHub=all'
  }`,
);
