/**
 * 겹치는 여행지 분석 스크립트
 * 3도 이내에 있는 여행지들을 그룹화하고, 각 그룹에서 더 특별한 여행지를 추천
 */

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';

const DISTANCE_THRESHOLD = 3.0; // 3도 이내를 겹침으로 판단

// 거리 계산 함수
const getDistance = (spot1, spot2) => {
  const dlat = spot1.lat - spot2.lat;
  const dlng = spot1.lng - spot2.lng;
  return Math.sqrt(dlat * dlat + dlng * dlng);
};

// 그룹 생성: 거리 기반 클러스터링
const findOverlappingGroups = (spots) => {
  const groups = [];
  const processed = new Set();

  spots.forEach((spot, idx) => {
    if (processed.has(idx)) return;

    const group = [spot];
    processed.add(idx);

    // 이 마커와 가까운 다른 마커들 찾기
    for (let i = idx + 1; i < spots.length; i++) {
      if (processed.has(i)) continue;

      // 그룹 내 어느 마커와든 가까우면 같은 그룹
      const isNear = group.some(gm => getDistance(gm, spots[i]) < DISTANCE_THRESHOLD);
      if (isNear) {
        group.push(spots[i]);
        processed.add(i);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  });

  return groups;
};

// 그룹 내에서 제거할 여행지 결정 (평범한 것)
const selectToRemove = (group) => {
  // tier 2 > tier 1 > tier 3 (특별한 곳 우선)
  // 같은 tier면 popularity가 낮은 것 제거

  const sorted = [...group].sort((a, b) => {
    // tier 2가 가장 특별함 (paradise, hidden gems 등)
    const tierScore = (t) => t.tier === 2 ? 3 : t.tier === 3 ? 2 : 1;
    const scoreA = tierScore(a);
    const scoreB = tierScore(b);

    if (scoreA !== scoreB) return scoreB - scoreA;
    return (b.popularity || 0) - (a.popularity || 0);
  });

  // 가장 특별한 것을 제외한 나머지
  return sorted.slice(1);
};

// 메인 분석
const analyzeOverlapping = () => {
  const activeSpots = TRAVEL_SPOTS.filter(s => s.showOnGlobe !== false);
  const categories = ['paradise', 'nature', 'urban', 'culture', 'adventure'];

  console.log(`\n🔍 카테고리별 겹침 분석\n`);

  let totalGroups = 0;

  const allToHide = [];

  categories.forEach(category => {
    const categorySpots = activeSpots.filter(s => s.category === category || s.categories?.includes(category));
    const groups = findOverlappingGroups(categorySpots);

    if (groups.length === 0) return;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📂 카테고리: ${category.toUpperCase()} (${categorySpots.length}개 여행지)`);
    console.log(`   겹침 그룹: ${groups.length}개\n`);

    groups.forEach((group, idx) => {
      console.log(`\n  📍 그룹 ${idx + 1} (${group.length}개):`);
      group.forEach(spot => {
        console.log(`     - ${spot.name} (${spot.name_en}) [Tier ${spot.tier}, Pop ${spot.popularity}]`);
      });

      const remove = selectToRemove(group);
      console.log(`\n     ✅ 유지: ${group[0].name} (${group[0].name_en})`);
      remove.forEach(spot => {
        console.log(`     ❌ 숨김: ${spot.name} (${spot.name_en})`);
        allToHide.push(spot);
      });
    });

    totalGroups += groups.length;
  });

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 전체 요약:`);
  console.log(`  - 총 겹침 그룹: ${totalGroups}개`);
  console.log(`  - 숨길 여행지: ${allToHide.length}개`);
  console.log(`  - 최종 표시: ${activeSpots.length - allToHide.length}개`);

  console.log(`\n\n🔧 travelSpots.js 수정 필요:\n`);
  allToHide.forEach(spot => {
    console.log(`  "${spot.name_en}": showOnGlobe: false,  // ${spot.name} - ${spot.category}`);
  });
};

analyzeOverlapping();
