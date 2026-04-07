# 브라우저 캐시 완전 삭제 가이드

## 🖥️ 데스크톱 (Chrome/Edge)

### 방법 1: 개발자 도구
1. **F12** 또는 **Ctrl+Shift+I** (개발자 도구)
2. **Application** 탭 클릭
3. 좌측 **Storage** 섹션에서:
   - ✅ Local storage 삭제
   - ✅ Session storage 삭제
   - ✅ IndexedDB 삭제
   - ✅ Cache storage 삭제
4. 하단 **Clear site data** 버튼 클릭

### 방법 2: 브라우저 설정
1. **Ctrl+Shift+Delete**
2. "전체 기간" 선택
3. 다음 항목 체크:
   - ✅ 쿠키 및 기타 사이트 데이터
   - ✅ 캐시된 이미지 및 파일
4. **데이터 삭제** 클릭

### 방법 3: Hard Refresh
- **Ctrl+Shift+R** (Windows/Linux)
- **Cmd+Shift+R** (Mac)

---

## 📱 모바일 (Chrome Android)

### 방법 1: 사이트 설정
1. Chrome 주소창 왼쪽 **🔒 자물쇠 아이콘** 터치
2. **사이트 설정** 터치
3. **저장공간** 터치
4. **데이터 삭제** 터치

### 방법 2: 브라우저 설정
1. Chrome 우측 상단 **⋮ 메뉴**
2. **설정** → **개인정보 보호 및 보안**
3. **인터넷 사용 기록 삭제**
4. "전체 기간" 선택
5. 다음 항목 체크:
   - ✅ 쿠키 및 사이트 데이터
   - ✅ 캐시된 이미지 및 파일
6. **데이터 삭제** 터치

### 방법 3: 앱 데이터 초기화 (강력)
1. 안드로이드 **설정**
2. **앱** → **Chrome**
3. **저장공간** 또는 **스토리지**
4. **캐시 삭제** 터치
5. (선택) **데이터 삭제** 터치 (모든 설정 초기화)

---

## 📱 모바일 (Safari iOS)

### 방법 1: Safari 설정
1. **설정** 앱 열기
2. **Safari** 터치
3. **고급** 터치
4. **웹사이트 데이터** 터치
5. 해당 사이트 찾아서 **삭제** 스와이프

### 방법 2: 전체 삭제
1. **설정** 앱 열기
2. **Safari** 터치
3. **방문 기록 및 웹사이트 데이터 지우기** 터치
4. 확인

---

## 🔍 캐시 문제 진단

### 현재 상황
- DB에서 `place_wiki.essential_guide` NULL 처리 완료
- 하지만 여전히 구버전 데이터 표시

### 가능한 원인
1. **Supabase 클라이언트 캐시**
   - Supabase JS SDK가 내부적으로 캐싱
   - 해결: Hard refresh 또는 완전 재시작

2. **브라우저 HTTP 캐시**
   - API 응답이 캐시됨
   - 해결: 캐시 삭제

3. **Service Worker 캐시**
   - PWA가 오래된 데이터를 캐싱
   - 해결: Application → Service Workers → Unregister

4. **React 상태 관리**
   - 컴포넌트 상태가 유지됨
   - 해결: 페이지 완전 새로고침

---

## ✅ 권장 테스트 순서

```bash
1. Hard Refresh (Ctrl+Shift+R / 모바일: 사이트 설정에서 데이터 삭제)
   ↓ 안 되면
2. 브라우저 캐시 완전 삭제 (전체 기간)
   ↓ 안 되면
3. 시크릿/프라이빗 모드로 테스트
   ↓ 안 되면
4. 다른 브라우저로 테스트
   ↓ 안 되면
5. DB 확인: SELECT * FROM place_wiki WHERE place_id = '보라카이';
   → essential_guide가 정말 NULL인지 확인
```

---

## 🚨 여전히 문제가 있다면

### Supabase Edge Function 캐시 확인
```sql
-- place_toolkit 테이블 직접 확인
SELECT 
  place_id,
  essential_guide->'categories'->'pre_travel' as current_data,
  toolkit_updated_at
FROM place_toolkit 
WHERE place_id = '보라카이';

-- place_wiki 테이블 확인 (NULL이어야 함)
SELECT 
  place_id,
  essential_guide
FROM place_wiki 
WHERE place_id = '보라카이';
```

### 코드에서 직접 로깅
[`useToolkitData.js:48`](../src/components/PlaceCard/hooks/useToolkitData.js:48-52)에 로그 추가:
```javascript
if (isSubscribed) {
  console.log('[useToolkitData] 🔍 DB에서 받은 데이터:', data);
  console.log('[useToolkitData] 🔍 pre_travel 개수:', 
    data?.essential_guide?.categories?.pre_travel?.length);
  setToolkitData(data || null);
}
```

브라우저 콘솔에서 실제로 어떤 데이터가 오는지 확인
