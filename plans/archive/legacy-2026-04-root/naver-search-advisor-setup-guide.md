# 네이버 서치어드바이저 설정 완료 가이드

## ✅ 완료된 작업

### 1. 사이트 소유 확인 (완료)
- [`index.html`](../index.html) 파일에 네이버 인증 메타 태그 추가 완료
```html
<meta name="naver-site-verification" content="a7b237018315e289b9fc72a47f62817ce20f3fd2" />
```

### 2. Sitemap & RSS 생성 (완료)
- **Sitemap 파일**: [`public/sitemap.xml`](../public/sitemap.xml) - 277개 URL 포함
- **RSS 피드**: [`public/rss.xml`](../public/rss.xml) - 최근 50개 여행지 포함
- **자동 생성 스크립트**: [`scripts/generate-sitemap.cjs`](../scripts/generate-sitemap.cjs)

### 3. Robots.txt 최적화 (완료)
- [`public/robots.txt`](../public/robots.txt) 파일에 네이버 봇(Yeti) 설정 추가
- Sitemap 및 RSS 경로 포함

---

## 📋 네이버 서치어드바이저 제출 방법

### 1단계: 사이트 소유 확인
1. 네이버 서치어드바이저(https://searchadvisor.naver.com/) 접속
2. 로그인 후 사이트 등록 (https://www.gateo.kr)
3. 소유 확인 방법: **HTML 태그** 선택
4. 확인 완료 (이미 index.html에 메타 태그 추가됨)

### 2단계: Sitemap 제출
1. 등록된 사이트 클릭
2. 왼쪽 메뉴에서 **[요청]** → **[사이트맵 제출]** 클릭
3. 사이트맵 URL 입력:
   ```
   https://www.gateo.kr/sitemap.xml
   ```
4. **[확인]** 버튼 클릭

### 3단계: RSS 제출
1. 왼쪽 메뉴에서 **[요청]** → **[RSS 제출]** 클릭
2. RSS URL 입력:
   ```
   https://www.gateo.kr/rss.xml
   ```
3. **[확인]** 버튼 클릭

### 4단계: Robots.txt 확인
1. 왼쪽 메뉴에서 **[검증]** → **[robots.txt]** 클릭
2. 자동으로 사이트의 robots.txt 파일을 읽어옵니다
3. 오류가 없는지 확인

---

## 🔄 사이트 업데이트 시 재생성

여행지 데이터가 업데이트되면 sitemap과 RSS를 다시 생성해야 합니다:

```bash
node scripts/generate-sitemap.cjs
```

이 명령어를 실행하면:
- `public/sitemap.xml` 자동 업데이트
- `public/rss.xml` 자동 업데이트
- 새로운 여행지가 포함된 최신 파일 생성

---

## 📊 생성된 파일 정보

### Sitemap.xml
- **총 URL 수**: 277개
- **포함 내용**:
  - 메인 페이지 (/)
  - 탐색 페이지 (/explore)
  - 로그북 페이지 (/logbook)
  - 200개 여행지 페이지 (/place/{slug})
  - 30개 카테고리별 탐색 페이지 (/explore/{continent}/{category})
- **우선순위 설정**:
  - Tier 1 도시: priority 0.9
  - Tier 2 명소: priority 0.8
  - Tier 3 숨은 명소: priority 0.7

### RSS.xml
- **피드 항목**: 최근 50개 여행지
- **업데이트 주기**: 수동 (여행지 추가 시마다 재생성)
- **포함 정보**: 여행지명, 설명, 카테고리, 링크

### Robots.txt
- **네이버 봇(Yeti)**: 모든 페이지 크롤링 허용
- **구글 봇(Googlebot)**: 모든 페이지 크롤링 허용
- **차단 경로**: /auth/ (인증 관련 페이지만)
- **Sitemap 참조**: sitemap.xml 및 rss.xml 포함

---

## ⏰ 예상 색인 시간

- **네이버**: 소유 확인 후 통상 1~2주 소요
- **구글**: 비교적 빠름 (며칠 내)
- **수집 가속화**: Sitemap 및 RSS 제출로 더 빠른 색인 가능

---

## 🎯 추가 최적화 권장사항

### 1. 메타 태그 최적화
각 여행지 페이지에 동적으로 메타 태그 설정:
- `<title>`: 여행지명 + 국가 + 키워드
- `<meta name="description">`: 여행지 설명
- Open Graph 태그: SNS 공유 최적화

### 2. 구조화된 데이터 (Schema.org)
여행지 페이지에 JSON-LD 형식의 구조화된 데이터 추가:
- TouristAttraction
- Place
- Review

### 3. 정기적인 콘텐츠 업데이트
- 여행지 정보 업데이트
- 새로운 여행지 추가
- 사용자 리뷰 및 여행 로그 활성화

### 4. 성능 모니터링
- 네이버 서치어드바이저에서 수집 현황 정기적으로 확인
- 검색 유입 키워드 분석
- 오류 페이지 모니터링 및 수정

---

## 📝 체크리스트

- [x] index.html에 네이버 인증 메타 태그 추가
- [x] sitemap.xml 생성 (277개 URL)
- [x] rss.xml 생성 (50개 항목)
- [x] robots.txt 네이버 봇 최적화
- [ ] 네이버 서치어드바이저에 사이트맵 제출
- [ ] 네이버 서치어드바이저에 RSS 제출
- [ ] robots.txt 검증
- [ ] 1~2주 후 색인 현황 확인

---

## 🔗 유용한 링크

- [네이버 서치어드바이저](https://searchadvisor.naver.com/)
- [네이버 웹마스터 가이드](https://searchadvisor.naver.com/guide)
- [Sitemap 프로토콜](https://www.sitemaps.org/)
- [RSS 2.0 규격](https://www.rssboard.org/rss-specification)

---

**마지막 업데이트**: 2026-04-23
