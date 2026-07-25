/**
 * MRT TNA 쿼리 스모크 — resolveMrtTnaQuery (순수) + (옵션) 배포된 Edge 호출.
 *
 *   node scripts/smoke-mrt-tna-queries.mjs
 *   MRT_TNA_SMOKE_LIVE=1 node scripts/smoke-mrt-tna-queries.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  canShowMrtTnaStrip,
  isMrtDomesticLocation,
  resolveMrtTnaQuery,
} from '../src/utils/mrtTnaQuery.js';

function loadEnvLocal() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const CASES = [
  {
    slug: 'jeju',
    location: {
      slug: 'jeju',
      name: '제주',
      name_en: 'Jeju',
      country: '대한민국',
      country_en: 'South Korea',
    },
    expectKeyword: /제주|Jeju/,
    expectDomestic: true,
    expectLiveMin: 1,
  },
  {
    slug: 'busan',
    location: {
      slug: 'busan',
      name: '부산',
      name_en: 'Busan',
      country: '한국',
      country_en: 'Korea',
    },
    expectKeyword: /부산|Busan/,
    expectDomestic: true,
    expectLiveMin: 1,
  },
  {
    slug: 'seongsan-ilchulbong',
    location: {
      slug: 'seongsan-ilchulbong',
      name: '성산일출봉',
      name_en: 'Seongsan Ilchulbong',
      country: '대한민국',
      country_en: 'South Korea',
      parentCity: '제주',
      uiPlace: true,
    },
    expectKeyword: /제주|성산/,
    expectDomestic: true,
  },
  {
    slug: 'gyeongbokgung',
    location: {
      slug: 'gyeongbokgung',
      name: '경복궁',
      name_en: 'Gyeongbokgung',
      country: '대한민국',
      country_en: 'South Korea',
      parentCity: '서울',
      uiPlace: true,
    },
    expectKeyword: /서울|경복궁/,
    expectDomestic: true,
  },
  {
    slug: 'mungyeong-saejae',
    location: {
      slug: 'mungyeong-saejae',
      name: '문경새재',
      name_en: 'Mungyeong Saejae',
      country: '대한민국',
      country_en: 'South Korea',
      hubId: 'mungyeong',
      parentCity: '문경',
      uiPlace: true,
    },
    expectKeyword: /문경/,
    expectDomestic: true,
  },
  {
    slug: 'osaka',
    location: {
      slug: 'osaka',
      name: '오사카',
      name_en: 'Osaka',
      country: '일본',
      country_en: 'Japan',
    },
    expectDomestic: false,
    expectStrip: false,
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  let failed = 0;
  for (const c of CASES) {
    try {
      const domestic = isMrtDomesticLocation(c.location);
      assert(
        domestic === Boolean(c.expectDomestic),
        `${c.slug}: domestic=${domestic} expected=${c.expectDomestic}`,
      );
      if (c.expectStrip === false) {
        assert(!canShowMrtTnaStrip(c.location), `${c.slug}: strip should hide`);
        console.log(`OK  ${c.slug}  overseas (GYG path)`);
        continue;
      }
      assert(canShowMrtTnaStrip(c.location), `${c.slug}: strip should show`);
      const q = resolveMrtTnaQuery(c.location);
      assert(q.keyword, `${c.slug}: keyword`);
      if (c.expectKeyword) {
        const blob = [q.keyword, ...q.altKeywords].join('|');
        assert(c.expectKeyword.test(blob), `${c.slug}: keyword ladder ${blob}`);
      }
      console.log(`OK  ${c.slug}  kw=${q.keyword}  alts=${q.altKeywords.join(',')}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${c.slug}:`, err.message);
    }
  }

  if (process.env.MRT_TNA_SMOKE_LIVE === '1') {
    const url = (process.env.VITE_SUPABASE_URL || 'https://phdjnbfitvmrguqzverm.supabase.co').replace(
      /\/$/,
      '',
    );
    const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    if (!anon) {
      console.warn('LIVE skip: no anon key');
    } else {
      for (const c of CASES) {
        if (!c.expectDomestic) continue;
        const q = resolveMrtTnaQuery(c.location);
        const res = await fetch(`${url}/functions/v1/fetch-mrt-tnas`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${anon}`,
            apikey: anon,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword: q.keyword,
            altKeywords: q.altKeywords,
            size: 5,
            page: 1,
          }),
        });
        const data = await res.json().catch(() => ({}));
        const n = (data.items || []).length;
        const min = Number(c.expectLiveMin) || 0;
        const status =
          !data.ok
            ? 'LIVE_FAIL'
            : n >= min && n > 0
              ? 'LIVE_OK'
              : n === 0
                ? 'LIVE_EMPTY'
                : 'LIVE_OK';
        console.log(
          `${status} ${c.slug} http=${res.status} total=${data.totalCount ?? '-'} n=${n} used=${data.keywordUsed || q.keyword}`,
        );
        if (!data.ok || (min > 0 && n < min)) {
          failed += 1;
          console.error(`FAIL LIVE ${c.slug}:`, data.error || data.detail || `n=${n}`);
        }
      }
    }
  }

  if (failed) {
    console.error(`\n${failed} case(s) failed`);
    process.exit(1);
  }
  console.log(`\nAll ${CASES.length} query cases passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
