const fs = require('fs');
const path = require('path');

/**
 * Phase 2 병합 스크립트
 *
 * 기능:
 * - Phase 1 (100개) + Phase 2 (80개) = 180개 병합
 * - ID 재할당 (101-280)
 * - 중복 검사
 * - 스키마 검증
 */

// Phase 1: `create-phase1-100cities.js` → `scripts/outputs/travelSpots-phase1.js` 필요
const phase1Path = path.join(__dirname, 'outputs', 'travelSpots-phase1.js');
if (!fs.existsSync(phase1Path)) {
  console.error('❌ 먼저: node scripts/create-phase1-100cities.js (또는 outputs에 phase1 스냅샷 배치)');
  process.exit(1);
}
const phase1Content = fs.readFileSync(phase1Path, 'utf8');

// export const TRAVEL_SPOTS = [...] 형식에서 배열 추출
const phase1Match = phase1Content.match(/export\s+const\s+TRAVEL_SPOTS\s*=\s*(\[[\s\S]*\]);/);
if (!phase1Match) {
    console.error('❌ Phase 1 데이터를 파싱할 수 없습니다.');
    process.exit(1);
}

const phase1Data = eval(phase1Match[1]);
console.log(`✅ Phase 1 로드: ${phase1Data.length}개`);

// Phase 2 JSON (2026-04: `plans/archive/legacy-2026-04-root/`로 이동)
const phase2dir = path.join(__dirname, '..', 'plans', 'archive', 'legacy-2026-04-root');
const phase2Files = [
  'phase2-paradise.json',
  'phase2-nature.json',
  'phase2-urban.json',
  'phase2-culture.json',
  'phase2-adventure.json',
].map((f) => path.join(phase2dir, f));

let phase2Data = [];
phase2Files.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        phase2Data = phase2Data.concat(data);
        console.log(`✅ ${path.basename(filePath)}: ${data.length}개`);
    } else {
        console.warn(`⚠️ ${path.basename(filePath)} 파일이 없습니다.`);
    }
});

console.log(`✅ Phase 2 로드: ${phase2Data.length}개`);
console.log('');

// ============================================
// 1. 중복 검사
// ============================================

console.log('🔍 중복 검사 시작...');

const duplicates = [];
const phase1Names = new Set(phase1Data.map(s => s.name_en.toLowerCase()));
const phase1Coords = new Set(phase1Data.map(s => `${s.lat},${s.lng}`));

phase2Data.forEach(spot => {
    if (phase1Names.has(spot.name_en.toLowerCase())) {
        duplicates.push({ type: 'name', value: spot.name_en });
    }
    const coordKey = `${spot.lat},${spot.lng}`;
    if (phase1Coords.has(coordKey)) {
        duplicates.push({ type: 'coord', value: `${spot.name} (${coordKey})` });
    }
});

if (duplicates.length > 0) {
    console.error('❌ 중복 발견:');
    duplicates.forEach(d => {
        console.error(`   - ${d.type}: ${d.value}`);
    });
    process.exit(1);
}

console.log('✅ 중복 없음');
console.log('');

// ============================================
// 2. ID 재할당 (101-280)
// ============================================

console.log('🔢 ID 재할당 중...');

// Phase 1은 그대로 (101-200)
const mergedData = phase1Data.map((spot, idx) => ({
    ...spot,
    id: 101 + idx
}));

// Phase 2는 201부터 시작
phase2Data.forEach((spot, idx) => {
    mergedData.push({
        ...spot,
        id: 201 + idx
    });
});

console.log(`✅ ID 재할당 완료: ${mergedData.length}개 (101-${100 + mergedData.length})`);
console.log('');

// ============================================
// 3. 스키마 검증
// ============================================

console.log('📋 스키마 검증 중...');

const requiredFields = ['id', 'name', 'name_en', 'country', 'lat', 'lng', 'tier', 'category'];
const invalidSpots = [];

mergedData.forEach(spot => {
    const missing = requiredFields.filter(field => spot[field] === undefined || spot[field] === null);
    if (missing.length > 0) {
        invalidSpots.push({
            spot: spot.name || spot.name_en || 'Unknown',
            missing
        });
    }

    // 좌표 범위 검증
    if (spot.lat < -90 || spot.lat > 90) {
        invalidSpots.push({
            spot: spot.name,
            error: `Invalid latitude: ${spot.lat}`
        });
    }
    if (spot.lng < -180 || spot.lng > 180) {
        invalidSpots.push({
            spot: spot.name,
            error: `Invalid longitude: ${spot.lng}`
        });
    }
});

if (invalidSpots.length > 0) {
    console.error('❌ 스키마 검증 실패:');
    invalidSpots.forEach(s => {
        console.error(`   - ${s.spot}: ${s.missing ? `Missing: ${s.missing.join(', ')}` : s.error}`);
    });
    process.exit(1);
}

console.log('✅ 스키마 검증 통과');
console.log('');

// ============================================
// 4. 통계 출력
// ============================================

console.log('📊 최종 통계:');
console.log('━'.repeat(50));

const stats = {
    total: mergedData.length,
    phase1: phase1Data.length,
    phase2: phase2Data.length,
    byCategory: {},
    byTier: {},
    withShowOnGlobe: mergedData.filter(s => s.showOnGlobe !== false).length,
    hiddenOnGlobe: mergedData.filter(s => s.showOnGlobe === false).length
};

mergedData.forEach(spot => {
    stats.byCategory[spot.category] = (stats.byCategory[spot.category] || 0) + 1;
    stats.byTier[spot.tier] = (stats.byTier[spot.tier] || 0) + 1;
});

console.log(`총 여행지: ${stats.total}개 (Phase 1: ${stats.phase1} + Phase 2: ${stats.phase2})`);
console.log(`ID 범위: 101-${100 + stats.total}`);
console.log('');

console.log('카테고리별:');
Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}개`);
});
console.log('');

console.log('Tier별:');
Object.entries(stats.byTier).sort((a, b) => a[0] - b[0]).forEach(([tier, count]) => {
    console.log(`  Tier ${tier}: ${count}개`);
});
console.log('');

console.log('지구본 표시:');
console.log(`  표시: ${stats.withShowOnGlobe}개 (${Math.round(stats.withShowOnGlobe / stats.total * 100)}%)`);
console.log(`  숨김: ${stats.hiddenOnGlobe}개 (${Math.round(stats.hiddenOnGlobe / stats.total * 100)}%)`);
console.log('');

// ============================================
// 5. 파일 저장
// ============================================

const scriptOutputs = path.join(__dirname, 'outputs');
fs.mkdirSync(scriptOutputs, { recursive: true });
const outputPath = path.join(scriptOutputs, 'travelSpots-phase2-merged.js');
const outputContent = `/**
 * Travel Spots Data - Phase 2 Merged
 *
 * Phase 1: ${phase1Data.length}개 (ID 101-${100 + phase1Data.length})
 * Phase 2: ${phase2Data.length}개 (ID ${101 + phase1Data.length}-${100 + mergedData.length})
 * Total: ${mergedData.length}개
 *
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const TRAVEL_SPOTS = ${JSON.stringify(mergedData, null, 2)};
`;

fs.writeFileSync(outputPath, outputContent, 'utf8');

console.log(`✅ 병합 파일 생성 완료: ${outputPath}`);
console.log('');

// ============================================
// 6. 검증 체크리스트
// ============================================

console.log('✅ 병합 완료 체크리스트:');
console.log('━'.repeat(50));
console.log(`[✓] 총 개수: ${stats.total}개`);
console.log(`[✓] ID 중복 없음`);
console.log(`[✓] 좌표 범위 검증 통과`);
console.log(`[✓] 필수 필드 검증 통과`);
console.log(`[✓] 출력 파일: travelSpots-phase2-merged.js`);
console.log('');

console.log('🎯 다음 단계:');
console.log('1. node scripts/analyze-density-phase2.cjs (밀집도 분석 및 showOnGlobe 최적화)');
console.log('2. 개발 서버 테스트: npm run dev');
console.log('3. 최종 배포');
console.log('');
