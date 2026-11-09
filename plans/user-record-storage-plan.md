# 사용자 기록 · 용량 관리

**역할**: 검색·방문 기록을 지키면서 브라우저 저장 용량을 다루는 다음 세션용 SSOT.  
**코드**: 로그인 세션 유지 PR [#697](https://github.com/catgeot/Days/pull/697)은 `main`에 있다. 용량이 부족할 때 캐시만 지우는 수정은 PR [#699](https://github.com/catgeot/Days/pull/699) · 브랜치 `cursor/auth-keep-history-3163` · `4b2ebfd8`. **#699 병합 전 `www.gateo.kr`은 세션 저장 실패 시 검색·방문 기록까지 지운다.**

## 이미 정해진 것

- 검색어, 방문지, 여행사 방문, 축제·팔경 즐겨찾기와 본 목록은 사용자 기록이다. 로그인 세션을 남기려고 지우지 않는다.
- 이 기록은 계정 서버에 없다. 브라우저 `localStorage`에만 있고, 사이트 주소마다 따로다. 이미 지워진 항목은 복구되지 않는다.
- `localStorage`는 한 주소당 보통 5MB다. 가득 차도 브라우저가 오래된 키를 스스로 지우지 않고 `QuotaExceededError`를 낸다.
- 기록은 이 브라우저에만 둔다. 계정 동기화는 하지 않는다.
- #699의 `src/shared/api/authSession.js`는 **세션 키를 쓸 때만** 캐시를 지운다. 먼저 아래 접두사를 비운 뒤 한 번 더 저장한다. 그래도 실패하면 `gateo:mrt-stays:` 숙소 목록만 오래된 것부터 하나씩 지우고, 지울 때마다 다시 저장한다. 숙소 목록을 한 번에 모두 지우지 않는다. 그래도 실패하면 사용자 기록은 두고 세션 저장만 실패한다.

먼저 지우는 접두사: `gateo:tourapi-proxy:` · `gateo:mrt-tnas:` · `gateo:mrt-stay-coords:` · `gateo:nearby-attractions:` · `gateo:korea-festivals:v2:` · `gateo:festival-open-detail:` · `gateo-world-event-list-photo` · `gateo.yt.unplayable` · `days_place_chat_intro:` · `days_gallery_swr_` · `Days_Score_`.

숙소 목록 `gateo:mrt-stays:` 는 그다음이다. 같은 조건의 30분 저장본이 분당 50건 숙소 API를 다시 부르지 않게 한다.

## 사용자 기록으로 둔 키

| 키 | 내용 |
|----|------|
| `gateo_recent_search_keywords` | 홈 검색어 |
| `gateo_recent_visited_destinations` | 홈 방문지 |
| `gateo_recent_keyword_visits` | 검색어별 방문지 |
| `gateo:korea-scenic:v1:recent-searches` | 팔경 검색어 |
| `gateo:travel-agencies:v1:visits` | 여행사 방문 |
| `gateo:korea-festivals:v1:favorites` · `viewed` | 축제 즐겨찾기·본 목록 |
| `gateo:korea-scenic:v1:favorites` · `viewed` | 팔경 즐겨찾기·본 목록 |
| `savedEmail` · `gateo.locale` | 이메일 · 언어 |
| `days_guest_trips` | 게스트 여행 |
| `days_gallery_hidden_` | 사용자가 숨긴 갤러리 사진 |

접두사 목록에 없는 키는 #699에서 지우지 않는다. 장소 소개 캐시(`days_place_chat_intro:`)는 다시 받을 수 있어 캐시로 두었다.

## 아직 한 곳이 아닌 용량 처리

세션 저장 밖에서는 기능마다 다르다. 다음 세션이 공통 정책으로 묶기 전에 이 차이를 유지한다.

- 대부분 캐시와 한국 여행 검색어는 용량 오류를 삼키고 새 저장만 포기한다.
- 홈 검색어·방문지·여행사 방문 저장은 용량 오류를 삼키지 않는다. 기존 목록은 남고 그 호출은 실패한다.
- 갤러리 세션 캐시는 `days_gallery_`만 지운 뒤 다시 쓴다 (`usePlaceGallery.js`).
- 숙소 목록은 옛 `gateo:mrt-stays:v22:`만 지운 뒤 다시 쓴다 (`mrtStayCache.js`).

## 다음 세션에서 다룰 판단

구현 전에 사람과 순서를 정한다. 한 세션에 아래를 한꺼번에 넣지 않는다.

1. **기록의 집.** 이 기기에만 둔다. #2에서 합의했다. 계정 동기화는 만들지 않는다.
2. **키 분류.** 위 표 밖의 `localStorage` 키를 사용자 기록 · 설정 · 다시 받을 수 있는 캐시로 나눈다. 분류 전 접두사 목록을 넓히지 않는다.
3. **공통 용량 처리.** 세션 저장만이 아니라 검색·캐시 저장이 같은 규칙을 쓰게 할지. 규칙은 캐시만 오래된 것부터 지우고, 사용자 기록은 남긴다.
4. **큰 캐시의 자리.** 숙소·투어·관광 API처럼 큰 응답을 `localStorage` 밖에 둘지. 옮기기 전에 어떤 키가 용량을 쓰는지 측정한다.

## 9. 핸드오프

| | |
|--|--|
| **상태** | **#2 숙소 저장본 순서** · tip `4b2ebfd8` · PR #699 병합 전. 다음은 **#3 기록 개수 상한** |
| **브랜치** | `cursor/auth-keep-history-3163` · PR [#699](https://github.com/catgeot/Days/pull/699) |
| **금지** | 검색·방문 기록을 용량 때문에 삭제 · 계정 동기화 선구현 · 세션마다 새 브랜치 · 숙소 저장본 일괄 삭제 |
| **남은 일** | 검색 30·방문 30·여행사 12 상한을 유지할지 사람과 정한다. 합의 전에 상한을 바꾸지 않는다 |

#699가 열려 있으면 그 브랜치에 이어서 커밋한다. 병합되어 브랜치가 없으면 `origin/main`에서 `cursor/user-record-storage-3163`을 한 번만 만든다.

**다음 제시어**

```
사용자 기록 #3, 기록 개수 상한
@plans/feature-handoff-index.md
@plans/2026-11-07-project-log.md
@plans/user-record-storage-plan.md
브랜치 cursor/auth-keep-history-3163 · PR #699
금지: 검색·방문 기록 삭제 · 계정 동기화 선구현 · 새 브랜치 · 숙소 저장본 일괄 삭제
작업: 검색 30·방문 30·여행사 12 상한을 유지할지 사람과 정하고, 합의된 경우에만 그 한 단계 구현
검증: node --test scripts/health/auth-session-persist.test.mjs
```
