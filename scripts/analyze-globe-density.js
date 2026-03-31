// scripts/analyze-globe-density.js
// 지구본 좌표 기반 밀집도 분석 스크립트

const fs = require('fs');
const path = require('path');

// travelSpots.js에서 데이터 로드
const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const content = fs.readFileSync(travelSpotsPath, 'utf8');

// TRAVEL_SPOTS 배열 추출 (간단한 파싱)
const match = content.match(/export const TRAVEL_SPOTS = \[([\s\S]*?)\];/);
if (!match) {
  console.error('❌ TRAVEL_SPOTS 배열을 찾을 수 없습니다.');
  process.exit(1);
}

const TRAVEL_SPOTS = JSON.parse('[' + match[1] + ']');

console.log('\n📊 지구본 마커 밀집도 분석\n');
console.log('='.repeat(80));

// 1. 기본 통계
console.log('\n1️⃣  기본 통계');
console.log('-'.repeat(80));
const total = TRAVEL_SPOTS.length;
const visible = TRAVEL_SPOTS.filter(s => s.showOnGlobe !== false).length;
const hidden = total - visible;

console.log(`총 여행지:        ${total}개`);
console.log(`지구본 표시:      ${visible}개 (${((visible/total)*100).toFixed(1)}%)`);
console.log(`숨김:             ${hidden}개 (${((hidden/total)*100).toFixed(1)}%)`);

// 2. 좌표 기반 겹침 분석
console.log('\n2️⃣  좌표 기반 겹침 분석');
console.log('-'.repeat(80));

const visibleSpots = TRAVEL_SPOTS.filter(s => s.showOnGlobe !== false);

// 거리 계산 함수 (Haversine formula - 대략적)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => deg * (Math.PI / 180);
  const R = 6371; // 지구 반경 (km)

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 겹침 임계값 (지구본에서 시각적으로 겹치는 거리)
const THRESHOLDS = {
  critical: 50,   // 50km 이내: 완전히 겹침
  warning: 150,   // 150km 이내: 가까움
  close: 300      // 300km 이내: 인접
};

const overlaps = {
  critical: [],
  warning: [],
  close: []
};

// 모든 쌍 비교
for (let i = 0; i < visibleSpots.length; i++) {
  for (let j = i + 1; j < visibleSpots.length; j++) {
    const spot1 = visibleSpots[i];
    const spot2 = visibleSpots[j];

    const distance = calculateDistance(
      spot1.lat, spot1.lng,
      spot2.lat, spot2.lng
    );

    if (distance < THRESHOLDS.critical) {
      overlaps.critical.push({ spot1, spot2, distance: distance.toFixed(1) });
    } else if (distance < THRESHOLDS.warning) {
      overlaps.warning.push({ spot1, spot2, distance: distance.toFixed(1) });
    } else if (distance < THRESHOLDS.close) {
      overlaps.close.push({ spot1, spot2, distance: distance.toFixed(1) });
    }
  }
}

console.log(`\n🔴 치명적 겹침 (50km 이내):  ${overlaps.critical.length}쌍`);
if (overlaps.critical.length > 0) {
  overlaps.critical.slice(0, 5).forEach(({ spot1, spot2, distance }) => {
    console.log(`   - ${spot1.name} ↔ ${spot2.name}: ${distance}km`);
  });
  if (overlaps.critical.length > 5) {
    console.log(`   ... 외 ${overlaps.critical.length - 5}쌍 더`);
  }
}

console.log(`\n🟡 경고 (50-150km):         ${overlaps.warning.length}쌍`);
if (overlaps.warning.length > 0) {
  console.log(`   (샘플) ${overlaps.warning.slice(0, 3).map(o =>
    `${o.spot1.name}-${o.spot2.name}`).join(', ')}`);
}

console.log(`\n🟢 인접 (150-300km):        ${overlaps.close.length}쌍`);

// 3. 지역별 밀집도
console.log('\n3️⃣  지역별 밀집도 (Tier 1 우선)');
console.log('-'.repeat(80));

const regions = {};
visibleSpots.forEach(spot => {
  const region = spot.denseRegion || 'global';
  if (!regions[region]) {
    regions[region] = { spots: [], tier1: 0, tier2: 0, tier3: 0 };
  }
  regions[region].spots.push(spot);
  if (spot.tier === 1) regions[region].tier1++;
  else if (spot.tier === 2) regions[region].tier2++;
  else regions[region].tier3++;
});

const sortedRegions = Object.entries(regions)
  .sort((a, b) => b[1].spots.length - a[1].spots.length);

sortedRegions.forEach(([region, data]) => {
  const total = data.spots.length;
  const tier1Pct = ((data.tier1 / total) * 100).toFixed(0);
  console.log(`${region.padEnd(20)} ${total}개  (Tier1: ${data.tier1}개 ${tier1Pct}%)`);
});

// 4. 밀집 지역 상세 분석
console.log('\n4️⃣  밀집 지역 상세 분석');
console.log('-'.repeat(80));

const denseRegions = sortedRegions
  .filter(([region]) => region !== 'global' && region !== null)
  .slice(0, 5);

denseRegions.forEach(([region, data]) => {
  console.log(`\n📍 ${region}:`);
  console.log(`   총 ${data.spots.length}개 표시`);
  console.log(`   Tier 분포: T1 ${data.tier1}개, T2 ${data.tier2}개, T3 ${data.tier3}개`);

  // 이 지역 내 겹침 확인
  const regionOverlaps = overlaps.critical.filter(o =>
    o.spot1.denseRegion === region && o.spot2.denseRegion === region
  );

  if (regionOverlaps.length > 0) {
    console.log(`   ⚠️  지역 내 겹침: ${regionOverlaps.length}쌍`);
    regionOverlaps.forEach(({ spot1, spot2, distance }) => {
      console.log(`      - ${spot1.name} ↔ ${spot2.name}: ${distance}km`);
    });
  } else {
    console.log(`   ✅ 지역 내 겹침 없음`);
  }
});

// 5. 권장 사항
console.log('\n5️⃣  권장 조치');
console.log('='.repeat(80));

const totalOverlaps = overlaps.critical.length + overlaps.warning.length;

if (overlaps.critical.length === 0) {
  console.log('✅ 치명적 겹침 없음 - 현재 분포 양호');
} else if (overlaps.critical.length < 5) {
  console.log('⚠️  치명적 겹침 소수 존재 - 개별 조정 가능');
  console.log('\n   조치 방법:');
  overlaps.critical.forEach(({ spot1, spot2 }) => {
    const lower = spot1.tier > spot2.tier ? spot1 : spot2;
    console.log(`   - "${lower.name}" (Tier ${lower.tier})를 showOnGlobe: false로 변경`);
  });
} else {
  console.log('🔴 치명적 겹침 다수 - 전체 재조정 필요');
}

// 6. Phase 2 확장 시뮬레이션
console.log('\n6️⃣  Phase 2 (200개) 확장 시뮬레이션');
console.log('-'.repeat(80));

console.log('\n📊 예상 시나리오:');
console.log(`현재 표시:        ${visible}개`);
console.log(`Phase 2 추가:     100개`);
console.log(`Phase 2 후 숨김:  ~100개 (50% 비율 유지)`);
console.log(`Phase 2 후 표시:  ~100개`);

console.log('\n💡 권장 전략:');
if (overlaps.critical.length === 0) {
  console.log('✅ 전략 A: 현재 분포 유지 → Phase 2 추가 후 일괄 조정');
  console.log('   이유: 현재 겹침이 없으므로 200개 확보 후 전체 최적화가 효율적');
} else if (overlaps.critical.length < 10) {
  console.log('⚠️  전략 B: 현재 겹침 해소 → Phase 2 진행 → 최종 조정');
  console.log('   이유: 소수 겹침을 먼저 해결하면 Phase 2 작업이 깔끔');
} else {
  console.log('🔴 전략 C: Phase 2 먼저 완료 → 200개 기준 전체 재설계');
  console.log('   이유: 현재 겹침이 많아 중간 조정은 비효율적');
}

// 7. 출력 파일 생성
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total,
    visible,
    hidden,
    criticalOverlaps: overlaps.critical.length,
    warningOverlaps: overlaps.warning.length,
    closeOverlaps: overlaps.close.length
  },
  overlaps: {
    critical: overlaps.critical.map(o => ({
      spot1: { name: o.spot1.name, tier: o.spot1.tier },
      spot2: { name: o.spot2.name, tier: o.spot2.tier },
      distance: o.distance
    })),
    warning: overlaps.warning.length,
    close: overlaps.close.length
  },
  regions: sortedRegions.map(([name, data]) => ({
    name,
    count: data.spots.length,
    tier1: data.tier1,
    tier2: data.tier2,
    tier3: data.tier3
  }))
};

fs.writeFileSync(
  path.join(__dirname, '../plans/globe-density-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n📄 상세 리포트 저장: plans/globe-density-report.json');
console.log('='.repeat(80));
console.log('\n');
