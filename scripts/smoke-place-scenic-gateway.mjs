import { resolveScenicSpotForPlace, isDomesticKoreaLocation } from '../src/pages/Home/lib/placeScenicGateway.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
  } else {
    failed++;
    console.error('FAIL:', msg);
  }
}

// 1. 대표적인 국내 명소 exact 매칭
{
  const gyeongbok = resolveScenicSpotForPlace({
    name: '경복궁',
    slug: 'gyeongbokgung-palace',
    hubId: 'seoul',
    country: '대한민국',
  });
  assert(gyeongbok !== null, 'Gyeongbokgung should resolve');
  assert(gyeongbok?.spotId === 'gyeongbokgung', 'Gyeongbokgung spotId');
  assert(gyeongbok?.deepPath.includes('spot=gyeongbokgung'), 'Gyeongbokgung deepPath has spot');
  assert(gyeongbok?.deepPath.includes('hub=seoul'), 'Gyeongbokgung deepPath has hub');
}

// 2. 강원 속초해수욕장 매칭
{
  const sokchoBeach = resolveScenicSpotForPlace({
    name: '속초해수욕장',
    slug: 'sokcho-beach',
    hubId: 'sokcho',
    country: 'South Korea',
  });
  assert(sokchoBeach !== null, 'Sokcho beach should resolve');
  assert(sokchoBeach?.spotId === 'sokcho-beach', 'Sokcho beach spotId');
  assert(sokchoBeach?.region === '강원', 'Sokcho beach region');
}

// 3. TourAPI contentId 기반 매칭
{
  const seongsan = resolveScenicSpotForPlace({
    name: '성산일출봉',
    contentId: '126435',
  });
  assert(seongsan !== null, 'Seongsan should resolve via contentId');
  assert(seongsan?.spotId === 'seongsan-ilchulbong', 'Seongsan spotId');
}

// 4. 국가유산 명승 (koreaHeritageScenic) 매칭
{
  const heritage = resolveScenicSpotForPlace({
    name: '담양 식영정 일원',
    country: '대한민국',
  });
  assert(heritage !== null, 'Heritage scenic spot should resolve');
  assert(heritage?.type === 'heritage', 'Heritage type check');
  assert(heritage?.spotId === 'cha-1353600570000', 'Heritage spotId check');
}

// 5. 한국 도시 허브 자체 매칭
{
  const sokchoHub = resolveScenicSpotForPlace({
    name: '속초',
    slug: 'sokcho',
    country: '대한민국',
  });
  assert(sokchoHub !== null, 'Sokcho hub should resolve');
  assert(sokchoHub?.type === 'hub', 'Hub type check');
  assert(sokchoHub?.spotCount > 0, 'Hub spots count');
}

// 6. 해외 장소 배제 (false positive 방지)
{
  const eiffel = resolveScenicSpotForPlace({
    name: '에펠탑',
    slug: 'eiffel-tower',
    country: 'France',
    lat: 48.8584,
    lng: 2.2945,
  });
  assert(eiffel === null, 'Eiffel Tower should be rejected');

  const tokyo = resolveScenicSpotForPlace({
    name: '도쿄 타워',
    slug: 'tokyo-tower',
    country: 'Japan',
  });
  assert(tokyo === null, 'Tokyo Tower should be rejected');

  const nyc = resolveScenicSpotForPlace({
    name: '뉴욕',
    slug: 'new-york',
    country: 'United States',
  });
  assert(nyc === null, 'New York should be rejected');
}

// 7. returnTo 옵션 보존 및 deepPath 쿼리 전달 검증
{
  const gyeongbokWithReturn = resolveScenicSpotForPlace(
    {
      name: '경복궁',
      slug: 'gyeongbokgung-palace',
      hubId: 'seoul',
      country: '대한민국',
    },
    { returnTo: '/place/gyeongbokgung-palace/gallery' },
  );
  assert(
    gyeongbokWithReturn?.deepPath.includes('returnTo=%2Fplace%2Fgyeongbokgung-palace%2Fgallery'),
    'Gyeongbokgung deepPath preserves returnTo',
  );

  const heritageWithReturn = resolveScenicSpotForPlace(
    {
      name: '담양 식영정 일원',
      country: '대한민국',
    },
    { returnTo: '/place/damyang-sikyeongjeong/gallery' },
  );
  assert(
    heritageWithReturn?.deepPath.includes('returnTo=%2Fplace%2Fdamyang-sikyeongjeong%2Fgallery'),
    'Heritage deepPath preserves returnTo',
  );

  const hubWithReturn = resolveScenicSpotForPlace(
    {
      name: '속초',
      slug: 'sokcho',
      country: '대한민국',
    },
    { returnTo: '/place/sokcho/gallery' },
  );
  assert(
    hubWithReturn?.deepPath.includes('returnTo=%2Fplace%2Fsokcho%2Fgallery'),
    'Hub deepPath preserves returnTo',
  );
}

console.log(`Smoke test completed: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
