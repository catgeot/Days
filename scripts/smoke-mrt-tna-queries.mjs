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
  canShowNearbyChips,
  hasMoreNearbyExpand,
  isMrtDomesticLocation,
  nextNearbyExpandIndex,
  nextUnloadedNearbyKeyword,
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
    /** n≥4 hub · SSOT 인근 없음 → 더보기·칩 없음 */
    expectNearbyExact: [],
    expectNearbyChips: false,
    expectDomestic: true,
    expectLiveMin: 1,
    expectLiveNearbyExpanded: false,
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
    expectNearby: /안동|단양|상주/,
    /** Phase 2: 안동 보강 → 더보기 단양 → 상주 */
    expectNearbyExact: ['안동', '단양', '상주'],
    /** Phase 3: SSOT≥2 · 보강 시 칩 안동|단양|상주 */
    expectNearbyChips: true,
    expectDomestic: true,
    /** hub n≤3 → 인근 첫 키워드(안동) 보강 */
    expectLiveMin: 1,
    expectLiveUsed: /안동|단양|상주/,
    expectLiveNearbyExpanded: true,
    expectLiveMoreKeywords: ['단양', '상주'],
  },
  {
    slug: 'mungyeong-coal-museum',
    location: {
      slug: 'mungyeong-coal-museum',
      name: '문경석탄박물관',
      name_en: 'Mungyeong Coal Museum',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '문경석탄박물관',
    },
    expectKeyword: /문경/,
    expectKeywordExact: '문경',
    expectNearbyExact: ['안동', '단양', '상주'],
    expectNearbyChips: true,
    expectDomestic: true,
    expectLiveMin: 1,
    expectLiveUsed: /안동|단양|상주/,
    expectLiveNearbyExpanded: true,
  },
  {
    slug: 'yanggu-dutayeon',
    location: {
      slug: 'yanggu-dutayeon',
      name: '양구 두타연',
      name_en: 'Yanggu Dutayeon Valley',
      country: '대한민국',
      country_en: 'South Korea',
      hubId: 'yanggu',
      parentCity: '양구',
      uiPlace: true,
    },
    expectKeyword: /양구/,
    expectNearby: /춘천|인제|설악산|속초/,
    expectNearbyExact: ['춘천', '인제', '설악산', '속초'],
    expectNearbyChips: true,
    expectNoEn: /Valley|Dutayeon/i,
    expectDomestic: true,
    /** 본지 오탐 거절 후 인근 키워드로 LIVE 매칭 */
    expectLiveMin: 1,
    expectLiveUsed: /춘천|인제|설악산|속초/,
    expectLiveNearbyExpanded: true,
  },
  {
    slug: 'hoengseong',
    location: {
      slug: 'hoengseong',
      name: '횡성',
      hubId: 'hoengseong',
      parentCity: '횡성',
      country: '대한민국',
      country_en: 'South Korea',
    },
    expectKeyword: /횡성/,
    expectNearbyExact: ['홍천', '평창', '제천'],
    expectNearbyChips: true,
    expectDomestic: true,
    expectLiveMin: 1,
    expectLiveUsed: /홍천|평창|제천/,
    expectLiveNearbyExpanded: true,
  },
  {
    slug: 'yecheon',
    location: {
      slug: 'yecheon',
      name: '예천',
      hubId: 'yecheon',
      parentCity: '예천',
      country: '대한민국',
      country_en: 'South Korea',
    },
    expectKeyword: /예천/,
    expectNearbyExact: ['영주', '상주', '안동', '문경'],
    expectNearbyChips: true,
    expectDomestic: true,
    expectLiveMin: 1,
    expectLiveUsed: /영주|상주|안동|문경/,
    expectLiveNearbyExpanded: true,
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
      if (c.expectKeywordExact) {
        assert(
          q.keyword === c.expectKeywordExact,
          `${c.slug}: keywordExact got=${q.keyword}`,
        );
      }
      if (c.expectNearby) {
        const near = (q.nearbyKeywords || []).join('|');
        assert(c.expectNearby.test(near), `${c.slug}: nearby ${near}`);
      }
      if (c.expectNearbyExact) {
        const near = q.nearbyKeywords || [];
        assert(
          JSON.stringify(near) === JSON.stringify(c.expectNearbyExact),
          `${c.slug}: nearbyExact got=${JSON.stringify(near)}`,
        );
        if (near.length >= 2) {
          const after0 = nextNearbyExpandIndex(near, near[0]);
          assert(after0 === 1, `${c.slug}: next after [0] = ${after0}`);
          assert(hasMoreNearbyExpand(near, after0), `${c.slug}: more after [0]`);
          const afterLast = nextNearbyExpandIndex(near, near[near.length - 1]);
          assert(
            afterLast === near.length,
            `${c.slug}: next after last = ${afterLast}`,
          );
          assert(
            !hasMoreNearbyExpand(near, afterLast),
            `${c.slug}: exhausted after last`,
          );
          const nextAfter0 = nextUnloadedNearbyKeyword(near, [near[0]]);
          assert(
            nextAfter0 === near[1],
            `${c.slug}: nextUnloaded after [0] = ${nextAfter0}`,
          );
          const jumpLast = nextUnloadedNearbyKeyword(near, [near[0], near[near.length - 1]]);
          assert(
            jumpLast === near[1],
            `${c.slug}: chip-jump still next=${jumpLast}`,
          );
          assert(
            nextUnloadedNearbyKeyword(near, near) == null,
            `${c.slug}: all loaded → no next`,
          );
        } else {
          assert(
            !hasMoreNearbyExpand(near, 0),
            `${c.slug}: empty nearby → no more`,
          );
          assert(
            nextUnloadedNearbyKeyword(near, []) == null,
            `${c.slug}: empty nearby → no unload`,
          );
        }
      }
      if (typeof c.expectNearbyChips === 'boolean') {
        const near = q.nearbyKeywords || [];
        const chipsIfExpanded = canShowNearbyChips(near, true);
        const chipsIfNot = canShowNearbyChips(near, false);
        assert(!chipsIfNot, `${c.slug}: chips require nearbyExpanded`);
        assert(
          chipsIfExpanded === Boolean(c.expectNearbyChips),
          `${c.slug}: chipsIfExpanded=${chipsIfExpanded} expected ${c.expectNearbyChips}`,
        );
      }
      if (c.expectNoEn) {
        const blob = [q.keyword, ...q.altKeywords].join('|');
        assert(!c.expectNoEn.test(blob), `${c.slug}: must not use EN ladder ${blob}`);
      }
      console.log(
        `OK  ${c.slug}  kw=${q.keyword}  alts=${q.altKeywords.join(',')}  nearby=${(q.nearbyKeywords || []).join(',')}`,
      );
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
            nearbyKeywords: q.nearbyKeywords,
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
        const used = data.keywordUsed || q.keyword;
        console.log(
          `${status} ${c.slug} http=${res.status} total=${data.totalCount ?? '-'} n=${n} used=${used}` +
            (data.nearbyExpanded ? ` nearbyExpanded primary=${data.primaryCount}` : ''),
        );
        if (!data.ok || (min > 0 && n < min)) {
          failed += 1;
          console.error(`FAIL LIVE ${c.slug}:`, data.error || data.detail || `n=${n}`);
        }
        if (c.expectLiveUsed && data.ok && !c.expectLiveUsed.test(String(used))) {
          failed += 1;
          console.error(`FAIL LIVE ${c.slug}: used=${used} expected ${c.expectLiveUsed}`);
        }
        if (
          typeof c.expectLiveNearbyExpanded === 'boolean' &&
          data.ok &&
          Boolean(data.nearbyExpanded) !== c.expectLiveNearbyExpanded
        ) {
          failed += 1;
          console.error(
            `FAIL LIVE ${c.slug}: nearbyExpanded=${data.nearbyExpanded} expected ${c.expectLiveNearbyExpanded}`,
          );
        }
        if (
          Array.isArray(c.expectLiveMoreKeywords) &&
          c.expectLiveMoreKeywords.length > 0 &&
          data.ok &&
          data.nearbyExpanded
        ) {
          for (const moreKw of c.expectLiveMoreKeywords) {
            const moreRes = await fetch(`${url}/functions/v1/fetch-mrt-tnas`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${anon}`,
                apikey: anon,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keyword: moreKw,
                size: 5,
                page: 1,
              }),
            });
            const moreData = await moreRes.json().catch(() => ({}));
            const moreN = (moreData.items || []).length;
            console.log(
              `${moreData.ok && moreN > 0 ? 'LIVE_OK' : 'LIVE_EMPTY'} ${c.slug}+${moreKw} n=${moreN} used=${moreData.keywordUsed || moreKw}`,
            );
            if (!moreData.ok || moreN < 1) {
              failed += 1;
              console.error(`FAIL LIVE ${c.slug}+${moreKw}:`, moreData.error || `n=${moreN}`);
            }
            if (moreData.nearbyExpanded) {
              failed += 1;
              console.error(
                `FAIL LIVE ${c.slug}+${moreKw}: more-fetch must not re-expand nearby`,
              );
            }
          }
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
