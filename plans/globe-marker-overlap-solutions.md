# 지구본 마커 겹침 문제 해결 방안

## 📊 현재 상황

- **총 마커**: 150개 (200개 중 showOnGlobe=true)
- **겹침 발생 지역**: 유럽, 동남아시아, 미국 동부 등
- **기존 로직**: 0.05도 threshold로 중복 체크 (savedTrips, tempPins만)

## 🎯 해결 방안 (우선순위순)

### ✅ 방안 1: 거리 기반 스마트 Culling (추천)

**개념**: 가까운 마커들 중 Tier 우선순위에 따라 선별적으로 표시

**장점**:
- 성능 최적화 (렌더링 마커 수 감소)
- Tier 시스템 활용
- 코드 수정 최소화

**구현**:
```javascript
// HomeGlobe.jsx의 allMarkers 생성 시
const OVERLAP_THRESHOLD = {
  minDistance: 2.5,  // 최소 간격 (도 단위)
  tier1Weight: 1.0,  // Tier 1 우선순위
  tier2Weight: 0.7,  // Tier 2 우선순위
  tier3Weight: 1.2   // Tier 3 최우선
};

const filterOverlappingMarkers = (markers) => {
  const sorted = markers.sort((a, b) => {
    const tierA = a.tier || 2;
    const tierB = b.tier || 2;
    const weightA = OVERLAP_THRESHOLD[`tier${tierA}Weight`];
    const weightB = OVERLAP_THRESHOLD[`tier${tierB}Weight`];
    return weightB - weightA; // 우선순위 높은 것부터
  });

  const result = [];
  sorted.forEach(marker => {
    const tooClose = result.some(existing => {
      const distance = Math.sqrt(
        Math.pow(existing.lat - marker.lat, 2) +
        Math.pow((existing.lng - marker.lng) * Math.cos(marker.lat * Math.PI / 180), 2)
      );
      return distance < OVERLAP_THRESHOLD.minDistance;
    });
    
    if (!tooClose) {
      result.push(marker);
    }
  });
  
  return result;
};
```

**결과**: 150개 → 약 100-110개 (자동 최적화)

---

### 방안 2: Zoom-based Progressive Display

**개념**: 줌 레벨에 따라 단계적으로 마커 표시

**구현**:
```javascript
// 줌 레벨별 표시 규칙
const getVisibleMarkersByZoom = (altitude) => {
  if (altitude > 3.0) {
    // 멀리서: Tier 1, 3만 (주요 도시 + 희귀한 곳)
    return markers.filter(m => m.tier === 1 || m.tier === 3);
  } else if (altitude > 2.0) {
    // 중간: Tier 1, 2, 3 모두 (밀집 지역만 제외)
    return markers.filter(m => !m.denseRegion || m.tier === 3);
  } else {
    // 가까이: 모든 마커 표시
    return markers;
  }
};
```

**장점**: 
- 자연스러운 UX (Google Maps 스타일)
- 멀리서는 깔끔, 가까이서는 상세

---

### 방안 3: 클러스터링 + 숫자 표시

**개념**: 가까운 마커들을 그룹화하여 숫자로 표시

**예시**:
```
[3] ← 3개 마커가 있는 클러스터
```

**구현**:
```javascript
const clusterMarkers = (markers, zoomLevel) => {
  const clusters = [];
  const clusterRadius = 5; // 도 단위
  
  markers.forEach(marker => {
    const nearbyCluster = clusters.find(c => 
      Math.abs(c.lat - marker.lat) < clusterRadius &&
      Math.abs(c.lng - marker.lng) < clusterRadius
    );
    
    if (nearbyCluster) {
      nearbyCluster.markers.push(marker);
      nearbyCluster.count++;
    } else {
      clusters.push({
        lat: marker.lat,
        lng: marker.lng,
        markers: [marker],
        count: 1,
        type: 'cluster'
      });
    }
  });
  
  return clusters;
};
```

**단점**: 클릭 시 확장 UI 필요 (복잡도 증가)

---

### 방안 4: 오프셋 분산 (Spread Algorithm)

**개념**: 겹치는 마커들을 꽃잎 모양으로 분산

**구현**:
```javascript
const spreadOverlappingMarkers = (markers) => {
  const groups = {};
  
  markers.forEach(marker => {
    const key = `${Math.round(marker.lat * 2)}_${Math.round(marker.lng * 2)}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(marker);
  });
  
  Object.values(groups).forEach(group => {
    if (group.length > 1) {
      const radius = 0.5; // 분산 반경
      group.forEach((marker, i) => {
        const angle = (2 * Math.PI * i) / group.length;
        marker._offsetLat = Math.sin(angle) * radius;
        marker._offsetLng = Math.cos(angle) * radius;
      });
    }
  });
  
  return markers;
};
```

**시각 효과**:
```
    •
  •   •  ← 3개가 겹쳤을 때 분산
    •
```

---

## 🎨 UX 개선 추가 아이디어

### 1. 호버 시 주변 마커 확장
```javascript
onMarkerHover: (marker) => {
  // 주변 마커들 약간 밀어내기
  const nearby = markers.filter(m => distance(m, marker) < 3);
  nearby.forEach(m => m.scale = 0.8); // 작게
  marker.scale = 1.5; // 호버된 것만 크게
}
```

### 2. 밀집 지역 표시 경고
```javascript
// 특정 지역에 너무 많은 마커가 있으면 경고
const denseRegions = detectDenseRegions(markers);
console.warn('밀집 지역:', denseRegions); // 유럽, 동남아 등
```

### 3. 카테고리별 레이어 토글
```javascript
// 사용자가 카테고리를 껐다 켰다 할 수 있게
showParadise: true,
showNature: true,
showAdventure: false // ← 일시적으로 숨김
```

---

## 💡 권장 조합

### 즉시 적용 (Phase 1)
1. **거리 기반 Culling** (방안 1)
   - 150개 → 100개로 자동 감소
   - Tier 3 우선 보호

2. **Zoom 기반 필터링** (방안 2)
   - 멀리서: 50-60개만 표시
   - 가까이: 100개 표시

### 향후 고려 (Phase 2)
3. **클러스터링** (방안 3)
   - 밀집 지역 사용자 경험 개선
   - 클릭 시 확장 UI

---

## 📝 구현 우선순위

### 🔥 High Priority (지금 바로)
- [x] 방안 1: 거리 기반 Culling
- [x] 방안 2: Zoom 기반 필터링

### 📅 Medium Priority (다음 세션)
- [ ] 방안 4: 오프셋 분산 (시각적 개선)
- [ ] 호버 시 확장 애니메이션

### 🔮 Low Priority (필요시)
- [ ] 방안 3: 클러스터링
- [ ] 카테고리별 레이어 토글

---

## 🎯 예상 효과

**Before (현재)**:
```
유럽: ••••••••• (15개 겹침)
동남아: ••••• (8개 겹침)
```

**After (방안 1+2 적용)**:
```
유럽: • • • (3-4개만, 우선순위 기반)
동남아: • • (2-3개만, Tier 3 우선)
```

**성능**:
- 렌더링 마커: 150개 → 80-100개
- FPS: 향상 예상
- 클릭 편의성: 크게 개선

---

**다음 단계**: 방안 1 또는 방안 2 구현 시작
