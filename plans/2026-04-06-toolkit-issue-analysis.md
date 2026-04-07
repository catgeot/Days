# 스마트 툴킷 간헐적 데이터 변경 이슈 분석

**날짜**: 2026-04-06  
**보고자**: 사용자  
**이슈**: 보라카이 툴킷 탭에서 두 가지 버전의 데이터가 번갈아가며 표시됨

---

## 🔍 증상

### 버전 1
```
출발 전 필수 준비사항:
- 필리핀 eTravel (이트래블) 작성 (입국 72시간 전부터)
- 무료 (대행 사기 주의)
```

### 버전 2
```
출발 전 필수 준비사항:
- 필리핀 이트래블(eTravel) 등록 (도착 72시간 전 필수)
- 무료
- 보라카이 공인 숙소 예약 바우처 (입도 시 필수 확인)
- 숙박비에 따라 다름
```

**발생 시점**: 툴킷 탭 이동 또는 재진입 시

---

## 🔎 코드 분석 결과

### 현재 아키텍처
1. **`useWikiData`**: `place_wiki` 테이블 조회
2. **`useToolkitData`**: `place_toolkit` 테이블 조회
3. **`ToolkitTab`**: `toolkitData.essential_guide`만 사용 (✅ 올바름)

### 데이터 흐름
```
PlaceCardExpanded
  ├─ useWikiData(placeId, 'WIKI') → wikiData
  └─ useToolkitData(placeId, 'TOOLKIT') → toolkitData
       └─ place_toolkit.essential_guide 조회
            └─ ToolkitTab에 전달
```

---

## 🚨 가능한 원인

### 1. DB 중복 레코드 (가능성: 높음)
- `place_toolkit` 테이블에 `place_id='보라카이'` 레코드가 **2개 이상** 존재
- `.maybeSingle()` 사용 시 예측 불가능한 동작 발생 가능
- **확인 필요**: Supabase Dashboard에서 직접 SQL 실행
  ```sql
  SELECT * FROM place_toolkit WHERE place_id = '보라카이';
  ```

### 2. Gemini AI 비결정성 (가능성: 중간)
- Gemini API가 매번 다른 응답 생성 (확률적 모델)
- `temperature` 파라미터 미설정으로 인한 높은 무작위성
- **확인 필요**: [`update-place-toolkit/index.ts`](supabase/functions/update-place-toolkit/index.ts) 라인 112에서 `generationConfig` 확인

### 3. 자동 갱신 트리거 (가능성: 낮음)
- [`ToolkitTab.jsx:453-476`](src/components/PlaceCard/tabs/ToolkitTab.jsx:453-476)의 14일 자동 업데이트 로직은 **주석처리됨** ✅
- [`ToolkitTab.jsx:367-377`](src/components/PlaceCard/tabs/ToolkitTab.jsx:367-377)의 초기 자동 요청은 `initialDataRequested.current`로 방어됨 ✅

### 4. Race Condition (가능성: 낮음)
- Phase 8에서 이미 해결됨 (이벤트 기반 즉시 반영)
- `useRef` 사용으로 최신 상태 보장

---

## ✅ 검증 완료 사항

- [x] `ToolkitTab`은 `toolkitData`만 참조 (wikiData 미사용)
- [x] 자동 갱신 로직 비활성화됨
- [x] 이벤트 리스너 중복 등록 방지 (Phase 8 수정)
- [x] React StrictMode 중복 호출 방지 (전역 캐시)

---

## 🎯 권장 조치사항

### 즉시 조치 (우선순위 1)
1. **DB 상태 점검**
   ```sql
   -- 보라카이 레코드 개수 확인
   SELECT COUNT(*) FROM place_toolkit WHERE place_id = '보라카이';
   
   -- 전체 레코드 조회
   SELECT 
     place_id, 
     toolkit_updated_at,
     jsonb_array_length(essential_guide->'categories'->'pre_travel') as checklist_count
   FROM place_toolkit 
   WHERE place_id = '보라카이'
   ORDER BY toolkit_updated_at DESC;
   ```

2. **중복 레코드 삭제** (발견 시)
   ```sql
   -- 최신 1개만 남기고 삭제
   DELETE FROM place_toolkit
   WHERE place_id = '보라카이'
   AND toolkit_updated_at NOT IN (
     SELECT MAX(toolkit_updated_at) 
     FROM place_toolkit 
     WHERE place_id = '보라카이'
   );
   ```

### 단기 조치 (우선순위 2)
3. **AI 일관성 개선** - `update-place-toolkit/index.ts` 수정
   ```typescript
   generationConfig: {
     responseMimeType: "application/json",
     temperature: 0.3,  // 낮은 값 = 더 일관된 결과
     topP: 0.8,
     topK: 40
   }
   ```

4. **UNIQUE 제약조건 추가** (마이그레이션 후)
   ```sql
   -- place_id가 이미 UNIQUE로 선언되어 있는지 확인
   -- 없다면 추가:
   ALTER TABLE place_toolkit 
   ADD CONSTRAINT place_toolkit_place_id_unique 
   UNIQUE (place_id);
   ```

### 장기 조치 (우선순위 3)
5. **데이터 버저닝 시스템** 도입
   - 툴킷 생성 시 `version` 컬럼 추가
   - 사용자가 수동으로 버전 선택 가능

6. **AI 생성 로그 저장**
   - 각 생성 요청의 프롬프트와 응답을 별도 테이블에 저장
   - 디버깅 및 품질 관리 용이

---

## 📋 다음 단계

1. ✅ DB 상태 점검 (사용자 확인)
2. ⏳ 중복 레코드 삭제 (필요 시)
3. ⏳ AI temperature 파라미터 추가
4. ⏳ UNIQUE 제약조건 확인/추가
5. ⏳ 테스트 및 검증
6. ⏳ 프로젝트 로그 업데이트

---

**관련 파일**:
- [`useToolkitData.js`](src/components/PlaceCard/hooks/useToolkitData.js)
- [`ToolkitTab.jsx`](src/components/PlaceCard/tabs/ToolkitTab.jsx)
- [`update-place-toolkit/index.ts`](supabase/functions/update-place-toolkit/index.ts)
- [`phase8-3-toolkit-db-migration.md`](phase8-3-toolkit-db-migration.md)
