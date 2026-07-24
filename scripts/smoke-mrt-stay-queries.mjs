/**
 * MRT 숙소 쿼리 스모크 — resolveMrtStayQuery (순수) + (옵션) 배포된 Edge 호출.
 *
 *   node scripts/smoke-mrt-stay-queries.mjs
 *   MRT_STAY_SMOKE_LIVE=1 node scripts/smoke-mrt-stay-queries.mjs
 */
import {
  canShowMrtStayStrip,
  expandMrtCountryHintAlts,
  resolveMrtStayQuery,
} from '../src/utils/mrtStayQuery.js';

const CASES = [
  {
    slug: 'hawaii',
    location: { slug: 'hawaii', name: '하와이', name_en: 'Hawaii', country: '하와이', country_en: 'Hawaii' },
    expectKeyword: /하와이|호놀룰루/,
    expectCountryAlt: /미국|USA/i,
  },
  {
    slug: 'honolulu',
    location: { slug: 'honolulu', name: '호놀룰루', name_en: 'Honolulu', country: '하와이', country_en: 'Hawaii' },
    expectKeyword: /호놀룰루/,
    expectCountryAlt: /미국|USA/i,
  },
  {
    slug: 'guam',
    location: { slug: 'guam', name: '괌', name_en: 'Guam', country: '괌', country_en: 'Guam' },
    expectKeyword: /투몬/,
  },
  {
    slug: 'bali',
    location: { slug: 'bali', name: '발리', name_en: 'Bali', country: '인도네시아', country_en: 'Indonesia' },
    expectKeyword: /덴파사르/,
  },
  {
    slug: 'saipan',
    location: {
      slug: 'saipan',
      name: '사이판',
      name_en: 'Saipan',
      country: '북마리아나 제도',
      country_en: 'Northern Mariana Islands',
    },
    expectCountryAlt: /북마리아나제도/,
  },
  {
    slug: 'la-reunion',
    location: {
      slug: 'la-reunion',
      name: '레위니옹',
      name_en: 'La Reunion',
      country: '프랑스령 레위니옹',
      country_en: 'La Reunion',
    },
    expectCountryAlt: /레위니옹|Reunion/i,
  },
  {
    slug: 'patagonia',
    location: {
      slug: 'patagonia',
      name: '파타고니아',
      name_en: 'Patagonia (Northern)',
      country: '아르헨티나',
      country_en: 'Argentina',
    },
    expectKeyword: /바릴로체|Bariloche/,
  },
  {
    slug: 'uyuni-salt-flat',
    location: {
      slug: 'uyuni-salt-flat',
      name: '우유니 소금사막',
      name_en: 'Uyuni Salt Flat',
      country: '볼리비아',
      country_en: 'Bolivia',
    },
    expectKeyword: /우유니|Uyuni/,
  },
  {
    slug: 'raja-ampat',
    location: {
      slug: 'raja-ampat',
      name: '라자 암팟',
      name_en: 'Raja Ampat',
      country: '인도네시아',
      country_en: 'Indonesia',
    },
    expectKeyword: /와이사이|Waisai|소롱/,
  },
  {
    slug: 'bermuda',
    location: {
      slug: 'bermuda',
      name: '버뮤다',
      name_en: 'Bermuda',
      country: '버뮤다',
      country_en: 'Bermuda',
    },
    expectKeyword: /패짓|Paget/,
  },
  {
    slug: 'venezuela',
    location: {
      slug: 'venezuela',
      name: '베네수엘라',
      name_en: 'Venezuela',
      country: '베네수엘라',
      country_en: 'Venezuela',
    },
    expectKeyword: /베네수엘라|Venezuela/,
  },
  {
    slug: 'hong-kong',
    location: {
      slug: 'hong-kong',
      name: '홍콩',
      name_en: 'Hong Kong',
      country: '중국',
      country_en: 'China',
    },
    expectKeyword: /홍콩|Hong Kong/,
    expectCountryAlt: /홍콩/,
  },
  {
    slug: 'macau',
    location: {
      slug: 'macau',
      name: '마카오',
      name_en: 'Macau',
      country: '중국',
      country_en: 'China',
    },
    expectKeyword: /Macau|마카오/,
  },
  {
    slug: 'bodrum',
    location: {
      slug: 'bodrum',
      name: '보드룸',
      name_en: 'Bodrum',
      country: '터키',
      country_en: 'Turkey',
    },
    expectCountryAlt: /튀르키예/,
  },
  {
    slug: 'iceland',
    location: {
      slug: 'iceland',
      name: '아이슬란드',
      name_en: 'Iceland',
      country: '아이슬란드',
      country_en: 'Iceland',
    },
    expectKeyword: /레이캬비크|Reykjavik/,
  },
  {
    slug: 'rarotonga',
    location: {
      slug: 'rarotonga',
      name: '라로통가',
      name_en: 'Rarotonga',
      country: '쿡 제도',
      country_en: 'Cook Islands',
    },
    expectKeyword: /아바루아|Avarua|아로랑기|Arorangi/,
  },
  {
    slug: 'mungyeong',
    location: {
      slug: 'mungyeong',
      name: '문경',
      name_en: 'Mungyeong',
      country: '대한민국',
      country_en: 'South Korea',
      hubId: 'mungyeong',
      uiPlace: true,
    },
    expectKeyword: /문경/,
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
  },
];

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  let failed = 0;
  for (const c of CASES) {
    try {
      assert(canShowMrtStayStrip(c.location), `${c.slug}: strip should show`);
      const q = resolveMrtStayQuery(c.location);
      assert(q.keyword, `${c.slug}: keyword`);
      if (c.expectKeyword) {
        const blob = [q.keyword, ...q.altKeywords].join('|');
        assert(c.expectKeyword.test(blob), `${c.slug}: keyword ladder ${blob}`);
      }
      const countryBlob = [q.countryHint, ...q.countryHintAlts].join('|');
      if (c.expectCountryAlt) {
        assert(c.expectCountryAlt.test(countryBlob), `${c.slug}: country alts ${countryBlob}`);
      }
      console.log(`OK  ${c.slug}  kw=${q.keyword}  country=${q.countryHint}  alts=${q.countryHintAlts.join(',')}`);
    } catch (err) {
      failed += 1;
      console.error(`FAIL ${c.slug}:`, err.message);
    }
  }

  const baliAlts = expandMrtCountryHintAlts('인도네시아', ['Indonesia']);
  assert(!baliAlts.some((a) => a === '인도'), 'bali alts must not include bare 인도');

  if (process.env.MRT_STAY_SMOKE_LIVE === '1') {
    const url = (process.env.VITE_SUPABASE_URL || 'https://phdjnbfitvmrguqzverm.supabase.co').replace(/\/$/, '');
    const anon = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
    if (!anon) {
      console.warn('LIVE skip: no anon key');
    } else {
      for (const c of CASES) {
        const q = resolveMrtStayQuery(c.location);
        const isDomestic = /한국|대한민국/i.test(c.location.country || '');
        const body = {
          keyword: q.keyword,
          isDomestic,
          countryHint: q.countryHint,
          countryHintAlts: q.countryHintAlts,
          altKeywords: q.altKeywords,
          nameEn: q.nameEn,
          size: 5,
        };
        const res = await fetch(`${url}/functions/v1/fetch-mrt-stays`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${anon}`,
            apikey: anon,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        const n = (data.items || []).length;
        const status = n > 0 ? 'LIVE_OK' : data.region ? 'LIVE_EMPTY' : 'LIVE_NO_REGION';
        console.log(`${status} ${c.slug} total=${data.totalCount} n=${n} region=${data.region?.subName || '-'}`);
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
