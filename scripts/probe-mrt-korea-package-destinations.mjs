/**
 * MRT 국내 패키지 상품지 LIVE 프로브 (목록 API 공개 스펙 없음 · pkc search).
 *   node scripts/probe-mrt-korea-package-destinations.mjs
 *   MRT_PACKAGE_PROBE_STRICT=1 … curated FAIL이면 exit 1
 */
import {
  KOREA_THEME_PACKAGE_KEYS,
  MRT_PACKAGE_THEME_TARGETS,
} from '../src/pages/Home/data/mrtPackageThemeLinks.js';

const API = 'https://api3.myrealtrip.com/pkc/api/v1/products/search';
const OVERSEAS_RE =
  /일본|오사카|후쿠오카|삿포로|괌|다낭|나트랑|방콕|대만|홍콩|상해|상하이|광저우|계림|양삭|베트남|필리핀|세부|발리|싱가포르|유럽|하와이|중국|오키나와|금까기/;

const ALIASES = {
  제주: ['제주'],
  여수: ['여수'],
  울릉도: ['울릉', '독도'],
  순천: ['순천'],
  홍도: ['홍도', '흑산'],
  백령도: ['백령', '대청'],
  GANGWONDO: ['삼척', '동해', '원주', '횡성', '대관령', '평창', '강원'],
};

async function search(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  url.searchParams.set('page', '1');
  url.searchParams.set('per', '8');
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Origin: 'https://www.myrealtrip.com',
      Referer: 'https://www.myrealtrip.com/pkc/search',
      'User-Agent': 'gateo-mrt-package-probe/1.0',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

function scoreDomestic(aliasKey, products) {
  const aliases = ALIASES[aliasKey] || [aliasKey];
  const hits = [];
  for (const p of products || []) {
    const title = String(p?.title || '');
    if (!title) continue;
    const aliasHit = aliases.some((a) => title.includes(a));
    const overseas = OVERSEAS_RE.test(title);
    if (aliasHit && !overseas) hits.push(title.slice(0, 72));
  }
  return hits;
}

const curated = KOREA_THEME_PACKAGE_KEYS.map((key) => {
  const t = MRT_PACKAGE_THEME_TARGETS[key];
  if (!t || t.kind === 'home') return null;
  if (t.kind === 'search') {
    return { key, label: `q=${t.q}`, params: { q: t.q }, aliasKey: t.q, reject: false };
  }
  if (t.kind === 'regionCategory') {
    return {
      key,
      label: `region=${t.regionCategoryCode}`,
      params: { regionCategoryCode: t.regionCategoryCode },
      aliasKey: t.regionCategoryCode,
      reject: false,
    };
  }
  return null;
}).filter(Boolean);

const rejects = [
  { key: 'reject:경주', label: 'q=경주', params: { q: '경주' }, aliasKey: '경주', reject: true },
  { key: 'reject:부산', label: 'q=부산', params: { q: '부산' }, aliasKey: '부산', reject: true },
];

let failed = 0;
console.log('probe-mrt-korea-package-destinations');
for (const row of [...curated, ...rejects]) {
  const json = await search(row.params);
  const data = json?.data || {};
  const total = Number(data.totalCount || 0);
  const products = total > 0 ? data.products || [] : [];
  const domestic = scoreDomestic(row.aliasKey, products);
  const overseasN = products.filter((p) => OVERSEAS_RE.test(String(p?.title || ''))).length;

  let ok;
  if (row.reject) {
    // 부산: 국내 연안 1건이 있어도 해외·출발지 혼입이 압도 → 제외 유지
    ok = total === 0 || domestic.length === 0 || overseasN >= domestic.length;
  } else {
    ok = total > 0 && domestic.length > 0;
  }
  if (!ok) failed += 1;
  console.log(
    `${ok ? 'OK' : 'FAIL'} ${row.key} ${row.label} total=${total} domestic≈${domestic.length} overseas≈${overseasN}`,
  );
  if (domestic[0]) console.log(`   e.g. ${domestic[0]}`);
}

if (process.env.MRT_PACKAGE_PROBE_STRICT === '1' && failed) {
  console.error(`STRICT fail count=${failed}`);
  process.exit(1);
}
console.log(failed ? `done with ${failed} soft FAIL(s)` : 'done PASS');
