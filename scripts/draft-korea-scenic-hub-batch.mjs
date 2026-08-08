/**
 * 빈 hub → korea-scenic-spots-overrides 초안 조각.
 *
 *   npm run draft:korea-scenic-hub-batch -- --hubs=pyeongchang,namhae
 *   npm run draft:korea-scenic-hub-batch -- --hubs=pyeongchang --per-hub=3 --json
 *
 * 출력은 stdout. overrides에 수동 append 후 generate · fill images · audit.
 * blurb은 자리표시 — 검수 시 다듬기. contentId null은 Tour 조회 후 채움.
 */
import {
  draftScenicSpotsForHubs,
  listEmptyScenicHubs,
} from './lib/koreaScenicHubFill.mjs';

function parseArgs(argv) {
  /** @type {{ hubs: string[], perHub: number, json: boolean, startOrder: number | null }} */
  const out = { hubs: [], perHub: 4, json: false, startOrder: null };
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
      out.perHub = Math.max(1, Number(v) || 4);
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
  npm run draft:korea-scenic-hub-batch -- --hubs=pyeongchang --per-hub=3 --json

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
  `[draft] ${drafts.length} spots · hubs=${opts.hubs.join(',')} · nextOrder=${nextOrder}`,
);
