# Direct Ferries URL 테스트 목록

**작성일**: 2026-04-21  
**목적**: 구현 전 동적 URL 파라미터 조합 검증

---

## 🧪 테스트 URL 목록

각 URL을 브라우저에서 열어 다음을 확인해주세요:
1. iframe이 정상 로드되는지
2. 출발지/도착지가 사전 선택되어 있는지
3. 검색 기능이 정상 작동하는지

---

### 1. 크로아티아 - 두브로브니크→스플리트 (구체적 노선)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Dubrovnik&rprt=Split&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**iframe 테스트 코드**:
```html
<iframe 
  src="https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Dubrovnik&rprt=Split&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0"
  width="100%" 
  height="285" 
  frameborder="0">
</iframe>
```

**확인 사항**:
- [ ] iframe 로딩 성공
- [ ] 출발지: Dubrovnik 선택됨
- [ ] 도착지: Split 선택됨
- [ ] 날짜 선택 및 검색 가능

---

### 2. 크로아티아 - 스플리트→흐바르 (구체적 노선)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Split&rprt=Hvar&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**:
- [ ] 출발지: Split 선택됨
- [ ] 도착지: Hvar 선택됨

---

### 3. 그리스 - 산토리니→피레우스 (구체적 노선)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Santorini&rprt=Piraeus&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**:
- [ ] 출발지: Santorini 선택됨
- [ ] 도착지: Piraeus (아테네) 선택됨

---

### 4. 그리스 - 미코노스→피레우스 (구체적 노선)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Mykonos&rprt=Piraeus&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**:
- [ ] 출발지: Mykonos 선택됨
- [ ] 도착지: Piraeus 선택됨

---

### 5. 일본 - 부산→후쿠오카 (이미 확인됨) ✅

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&oprt=Busan&rprt=Hakata(Fukuoka)&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**: ✅ 사용자가 이미 테스트 완료

---

### 6. 그리스 - 국가 필터만 (ctry)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&ctry=Greece&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**:
- [ ] 그리스 출발 노선만 필터링되는지
- [ ] 사용자가 직접 출발/도착지 선택 가능한지

---

### 7. 크로아티아 - 국가 필터만 (ctry) - 이미 확인됨 ✅

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&ctry=Croatia&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**: ✅ 사용자가 이미 테스트 완료

---

### 8. 기본 URL (파라미터 없음)

**테스트 URL**:
```
https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0
```

**확인 사항**:
- [ ] 전체 노선 검색 가능
- [ ] 사용자가 자유롭게 출발/도착지 선택

---

## 🔍 추가 검증 필요 사항

### 항구명 표기 검증

Direct Ferries가 인식하는 정확한 항구명을 확인해야 합니다:

| 우리가 사용할 이름 | Direct Ferries 실제 이름 | 확인 필요 |
|------------------|------------------------|----------|
| `Dubrovnik` | ? | ⏳ |
| `Split` | ? | ⏳ |
| `Hvar` | ? | ⏳ |
| `Santorini` | ? | ⏳ |
| `Piraeus` | ? | ⏳ |
| `Mykonos` | ? | ⏳ |
| `Busan` | ✅ 확인됨 | ✅ |
| `Hakata(Fukuoka)` | ✅ 확인됨 | ✅ |

### 대안 항구명 테스트

만약 위 URL이 작동하지 않으면 다음 대안을 테스트:

1. **산토리니 대안**:
   - `Santorini` → `Thira` (섬의 공식명)
   
2. **피레우스 대안**:
   - `Piraeus` → `Athens` (도시명)

3. **흐바르 대안**:
   - `Hvar` → 철자 확인

---

## ✅ 테스트 결과 기록

### 테스트 1: Dubrovnik→Split
- **상태**: ⏳ 테스트 대기
- **결과**: 
- **비고**: 

### 테스트 2: Split→Hvar
- **상태**: ⏳ 테스트 대기
- **결과**: 
- **비고**: 

### 테스트 3: Santorini→Piraeus
- **상태**: ⏳ 테스트 대기
- **결과**: 
- **비고**: 

### 테스트 4: Mykonos→Piraeus
- **상태**: ⏳ 테스트 대기
- **결과**: 
- **비고**: 

### 테스트 5: Busan→Hakata(Fukuoka)
- **상태**: ✅ 확인 완료
- **결과**: 정상 작동
- **비고**: 사용자 테스트 완료

### 테스트 6: ctry=Greece
- **상태**: ⏳ 테스트 대기
- **결과**: 
- **비고**: 

### 테스트 7: ctry=Croatia
- **상태**: ✅ 확인 완료
- **결과**: 정상 작동 (크로아티아 출발 노선만 필터링)
- **비고**: 사용자 테스트 완료

---

## 🎯 다음 단계

테스트 완료 후:

1. **성공한 노선**: `constants.js`에 정확한 항구명으로 등록
2. **실패한 노선**: 
   - Direct Ferries 파트너 센터에서 항구명 확인
   - 대안 항구명 테스트
   - 또는 `ctry`(국가 필터)로 폴백

3. **구현 우선순위**:
   - 1순위: 확인된 노선 (부산→후쿠오카, 크로아티아)
   - 2순위: 테스트 통과한 노선
   - 3순위: 실패한 노선은 국가 필터로 대체

---

**작성자**: Roo (Architect Mode)  
**테스트 담당**: 사용자 (브라우저에서 직접 확인)
