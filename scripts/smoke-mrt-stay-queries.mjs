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
  /**
   * GPS 평창군 대화면 대화리 — 「대화」축약이 고양/일산 대화동으로 새면 안 됨.
   * 1차 키워드·cityHints는 시·군(평창) 우선.
   */
  {
    slug: 'pyeongchang-daehwa-ri',
    location: {
      name: '대화리',
      name_ko: '대화리',
      name_en: 'Daehwa-ri',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      stayAdmin: {
        neighbourhood: '',
        district: '',
        city: '대화면',
        cityEn: 'Daehwa-myeon',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    expectKeyword: /평창/,
    rejectCityHint: /^(대화)$/,
    rejectPrimaryKeyword: /대화/,
  },
  {
    slug: 'pyeongchang-daehwa-ri-en-name',
    location: {
      name: 'Daehwa-ri',
      name_ko: '대화리',
      name_en: 'Daehwa-ri',
      country: '대한민국',
      country_en: 'South Korea',
      uiPlace: true,
      stayAdmin: {
        city: '대화면',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    rejectCityHint: /^(대화)$/,
  },
  /**
   * OSM village→city(이평리)+county(보은군) — plan §5.1 잔여.
   * 1차 키워드가 리면 MRT CITY 미매칭·동명 리스크 → 군 선두.
   */
  {
    slug: 'boeun-ipyeong-ri-city',
    location: {
      name: '보은읍',
      name_ko: '보은읍',
      name_en: 'Boeun-eup',
      country: '한국',
      country_en: 'South Korea',
      parentCity: '보은',
      uiPlace: true,
      stayAdmin: {
        city: '이평리',
        cityEn: 'Ipyeong-ri',
        county: '보은군',
        state: '충청북도',
      },
    },
    expectPrimaryKeyword: /보은/,
    expectKeyword: /보은/,
    rejectPrimaryKeyword: /이평리|^이평$/,
  },
  {
    slug: 'boseong-beolgyo-ri-city',
    location: {
      name: '벌교읍',
      name_ko: '벌교읍',
      country: '한국',
      country_en: 'South Korea',
      parentCity: '보성',
      uiPlace: true,
      stayAdmin: {
        city: '벌교리',
        county: '보성군',
        state: '전라남도',
      },
    },
    expectPrimaryKeyword: /보성/,
    rejectPrimaryKeyword: /벌교리/,
  },
  /**
   * 검색「대화리」진입 — originalQuery가 군보다 선두면 MRT가 동명(천안 등)으로 샐 수 있음.
   * stayAdmin이 평창이면 1차는 평창.
   */
  {
    slug: 'search-daehwa-ri-original-query',
    location: {
      name: '대화리',
      name_ko: '대화리',
      country: '한국',
      country_en: 'South Korea',
      uiPlace: true,
      originalQuery: '대화리',
      stayAdmin: {
        city: '대화면',
        county: '평창군',
        state: '강원특별자치도',
      },
    },
    expectPrimaryKeyword: /평창/,
    rejectPrimaryKeyword: /대화리|^대화$/,
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
      if (c.expectPrimaryKeyword) {
        assert(
          c.expectPrimaryKeyword.test(q.keyword),
          `${c.slug}: primary keyword ${q.keyword}`,
        );
      }
      if (c.rejectPrimaryKeyword) {
        assert(
          !c.rejectPrimaryKeyword.test(q.keyword),
          `${c.slug}: primary must not be ${q.keyword}`,
        );
      }
      if (c.expectKeyword) {
        const blob = [q.keyword, ...q.altKeywords].join('|');
        assert(c.expectKeyword.test(blob), `${c.slug}: keyword ladder ${blob}`);
      }
      if (c.rejectCityHint) {
        const bad = (q.cityHints || []).find((h) => c.rejectCityHint.test(String(h)));
        assert(!bad, `${c.slug}: cityHints must not include ${bad} (${q.cityHints})`);
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
