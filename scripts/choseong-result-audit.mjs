import { writeFileSync } from 'node:fs';
import { buildLocalSearchSuggestions } from '../src/pages/Home/lib/searchSuggestions.js';
import {
  resolveSearchScenicMedia,
  lookupLocalScenicPhotoByContentId,
} from '../src/pages/Home/lib/koreaLocalScenicLists.js';
import { resolveExploreSearchRepresentativeThumbUrl } from '../src/pages/Home/lib/placeSeoOg.js';
import { resetExploreChoseongIndexForTests } from '../src/pages/Home/lib/exploreChoseongMatch.js';

const QUERY = 'ㅅㅇ';
const OUT = process.argv[2] || '/opt/cursor/artifacts/choseong-20-audit.md';

function iconReason(item, media) {
  const url = String(item.thumbUrl || item.imageUrl || '').trim();
  if (url) return '—';
  if (media.contentId && !lookupLocalScenicPhotoByContentId(media.contentId)) {
    return `contentId ${media.contentId} has no LOCAL_SCENIC overlay (Tour/place_stats loads async)`;
  }
  if (item.kind === 'attraction' && media.contentId) {
    return `attraction scenic unresolved; UI may load VisitKorea async for contentId ${media.contentId}`;
  }
  if (item.kind === 'city' && item.source === 'hub') {
    const rep = resolveExploreSearchRepresentativeThumbUrl(item);
    if (!rep) return 'hub has no attraction thumbnail/scenic thumb; no PLACE_SEO override/curated/spot image';
  }
  if (item.kind === 'spot' && item.source === 'ssot') {
    const rep = resolveExploreSearchRepresentativeThumbUrl(item);
    if (!rep) return 'TRAVEL_SPOTS has no non-pool image; no slug OG override or curated gallery';
  }
  if (item.kind === 'settlement') {
    return 'settlement row has no hub scenic walk or representative slug image';
  }
  return 'no static image source in SSOT/overlays';
}

function imageSource(item) {
  const url = String(item.thumbUrl || item.imageUrl || '').trim();
  if (!url) return '—';
  if (url.includes('visitkorea')) return 'VisitKorea overlay / hub scenic';
  if (url.includes('unsplash.com')) return 'PLACE_SEO_OG_IMAGE_OVERRIDES or explicit spot thumb';
  if (url.includes('wikimedia')) return 'explicit hub attraction thumbnail';
  return url.slice(0, 48);
}

resetExploreChoseongIndexForTests();
const items = buildLocalSearchSuggestions(QUERY);
const lines = [
  `# Choseong \`${QUERY}\` — ${items.length} Enter disambiguation rows (enriched)`,
  '',
  '| name | kind | source | photo | image source | icon reason |',
  '| --- | --- | --- | --- | --- | --- |',
];
let withPhoto = 0;
for (const item of items) {
  const media = resolveSearchScenicMedia(item);
  const has = Boolean(String(item.thumbUrl || item.imageUrl || '').trim());
  if (has) withPhoto += 1;
  lines.push(
    `| ${item.name} | ${item.kind} | ${item.source || '—'} | ${has ? 'yes' : 'no'} | ${imageSource(item)} | ${iconReason(item, media)} |`,
  );
}
lines.push('', `**Sync thumbs:** ${withPhoto}/${items.length} · **icon:** ${items.length - withPhoto}`);
writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));