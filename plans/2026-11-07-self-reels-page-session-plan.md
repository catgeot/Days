# 자체 공공누리 세로 피드 — 세션별 코딩 계획

- 작성: 2026-11-07 · 계획만 · 구현·머지·배포·R2 업로드·DB 쓰기·외부 서비스 설정·공개 없음
- 근거 문서: 대표님 요청으로 전달된 「사이트 릴스 페이지 실행안」(2026-11-07 02:18 KST). 그 파일은 이 저장소에 없어요.
- 상태: 기획자가 세션 실행과 피드백을 맡아요. 이 문서를 만든 실행은 코딩을 시작하지 않아요.
- 구현 브랜치: 아직 없어요. 세션 1이 짧은 feature 브랜치를 한 번만 열어요. 이 계획 PR의 브랜치는 구현에 재사용하지 않아요.

## 1. 목표

게시가 끝났고 권리·출처·영상 URL·장소 매핑이 모두 확인된 자체 mp4만, 새 세로 피드에서 재생해요. 화면에 보이는 영상 하나만 재생하고, 기본은 음소거이며 사용자가 소리를 켤 수 있어요. 모바일은 `playsinline`으로 재생해요. 재생이 실패하면 표지와 다시 시도, 그리고 다음 편이 있을 때만 건너뛰어요. 출처와 공공누리 표기는 항상 보여요. 확인된 장소만 기존 장소 상세로 이어져요.

플래그 기본값은 꺼짐이에요. 홈과 검색은 그대로예요. 일반 공개, 운영 DB 쓰기, R2 쓰기와 신규 유료 자원 생성은 별도 승인 없이 하지 않아요.

## 2. 최소 범위

| 넣어요 | 넣지 않아요 |
|---|---|
| 자격 네 가지가 모두 확인된 편만 | 칩, 필터, 좋아요, 로그인, 추천 알고리즘 |
| 세로 스크롤 피드, 가시 영상 1개만 재생 | YouTube·Shorts·Mux·새 외부 업체 |
| 기본 음소거, 사용자 조작으로만 음소거 해제 | 홈 창, 축제 허브 가로줄, 검색 결과 노출 |
| `playsinline`, 재생 실패 대안 | 임의 slug, 미확인 장소 링크, 「확인 대기」칩 |
| 출처·공공누리 문구 | 새 DB 스키마, 운영 INSERT |
| 확인된 장소 상세 버튼(기존 `/place/:slug`) | R2 업로드, 버킷 생성, 서명 URL |
| 플래그 기본 OFF, 미리보기와 390/1280 캡처 | sitemap·홈 바로가기·릴리스 노트 |

편마다 확인된 장소가 여러 곳이면 그 경로만 버튼으로 나열해요. 한 편에 확인된 장소가 4곳 이상이면 그 편은 목록에 넣지 않고 기획자에게 되돌려요. 장소가 하나도 없으면 그 편은 목록에서 빠져요.

소리 상태는 다음 편으로 넘기지 않아요. 모든 편은 다시 음소거로 시작해요.

## 3. 이 체크아웃에서 확인한 사실

명령은 2026-11-07 작업 트리(`origin/main` `211b3a6b`)에서 실행했어요.

| 확인 | 결과 |
|---|---|
| `src`의 JSX에 `<video>`, `playsInline` | 없음 |
| `src/App.jsx`, `vite.config.js`, `scripts/generate-sitemap.cjs`의 `reels` 경로 | 없음 |
| mp4·webm·m3u8 (`node_modules`·`.git` 제외) | 없음 |
| `wrangler.toml` | 없음 |
| `reels/final/posted-log.md`, `plans/*reels*` | 없음 |
| `package.json`의 kogl 테스트 스크립트 | 없음 |

있는 코드는 데이터와 플래그뿐이에요.

- 플래그 `VITE_GATEO_KOGL_REELS`는 `src/shared/gateoFeatureFlags.js`의 `readGateoEnvFlag`를 써요. 값이 `'1'`일 때만 켜지고, 기본은 꺼짐이에요. 주석은 「Globe home KOGL reels section」이에요.
- `src/pages/Home/data/koglReels.js`의 `KOGL_REELS_RAW`는 10건이에요. `sourceUrl`이 `null`인 항목은 9건이에요. 장소 경로는 `/place/jeju/`와 `/korea/theme/scenic/` 두 종류예요. 미디어 주소는 `VITE_GATEO_REELS_BASE_URL`이 있을 때만 `{base}/kogl/v1/{fileId}-720x1280.mp4` 형태로 붙여요.
- `getKoglReels`를 화면에서 import하는 파일은 없어요. 참조는 `koglReels.js`, `scripts/kogl-reels.test.mjs`, 플래그 정의뿐이에요.
- 테스트는 `node --import ./scripts/register-src-esm.mjs --test scripts/kogl-reels.test.mjs` 형태예요. `scripts/register-src-esm.mjs`가 `VITE_GATEO_KOGL_REELS`와 `VITE_GATEO_REELS_BASE_URL`을 테스트 환경으로 넣어요. 이 테스트는 10건과 `https://cdn.example.com` 예시 호스트를 기대해요. 운영 호스트가 아니에요.
- 장소 재생은 `src/components/PlaceCard/views/YouTubePlayerView.jsx`의 YouTube iframe이에요. 라우트는 `src/App.jsx`의 `place/:slug`와 `place/:slug/:tab`이에요.
- 알 수 없는 경로는 `src/App.jsx`의 `path="*"`가 `/`로 보내요.
- `vercel.json`의 `git.deploymentEnabled`는 `cursor/*`가 `false`예요. 예외로 켜진 브랜치가 따로 있어요.
- 캡처 선례는 `e2e/stay-card-image-link-iceland-live.spec.js`예요. `viewport`와 `page.screenshot({ clip })`로 390과 1280을 찍어요. `AGENTS.md`는 390 캡처의 PNG 너비를 390px로 고정해요. `deviceScaleFactor: 1`, `locator.screenshot()`은 쓰지 않아요.
- 짧은 QA 링크는 `src/shared/cloudPreview/cloudQaShareLinks.js`와 `vercel.json` `redirects`가 한 쌍이에요. 여기 있는 리다이렉트는 `main`에 들어가면 `www.gateo.kr`에 적용돼요.

홈 검색은 `src/pages/Home/lib/siteSearchOpen.js` 등이 `VITE_GATEO_SITE_SEARCH`를 봐요. 릴스 목록과는 연결되어 있지 않아요.

## 4. 확인하지 않은 것

첨부 실행안의 게시 7편, 편별 slug, R2 버킷 생성, 공개 URL, CORS, 로컬 mp4 경로, 대기 순서(#663 다음의 무니·투어 카드)는 이 저장소에서 다시 보지 않았어요. 사실로 적지 않아요. 그 표의 slug와 편 수를 코드·문서·테스트에 만들지 않아요.

첨부 실행안이 가리키는 `2026-10-19-globe-home-reels-window-experiment.md`, `drafts/gateo-reels-channel-proposal-2026-10-07.md`, `reels/final/posted-log.md`, `STORAGE-POLICY.md`도 이 체크아웃에 없어요. 없는 문서에 참조 줄을 추가하지 않아요.

영상 파일이 R2에 있는지는 몰라요. 이 계획은 R2를 나중에 검토할 호스팅 후보로만 적어요. 업로드, 버킷 생성, 도메인·CORS·과금 설정은 어떤 세션에도 없어요.

## 5. 설계 결정

세션이 같은 결정을 반복하지 않도록 여기 고정해요.

1. 새 플래그 이름은 `VITE_GATEO_SELF_REELS`예요. `'1'`만 켜요. 기존 `VITE_GATEO_KOGL_REELS`와 `VITE_GATEO_REELS_BASE_URL`은 그대로 두어요. 그 플래그는 연결되지 않은 10건 목록용이고, 장소 경로도 이번 자격 조건과 달라요.
2. 픽스처 플래그는 `VITE_GATEO_SELF_REELS_FIXTURE`예요. 본 플래그가 켜져 있을 때만 의미가 있어요. 공유 미리보기 빌드에는 넣지 않아요. 단위 테스트·로컬 캡처에서만 켜요.
3. 경로는 `/reels` 하나예요. `/reels/:reelId`는 이번 범위 밖이에요.
4. 플래그가 꺼지면 라우트를 등록하지 않아요. 그러면 기존 `*`가 `/`로 보내요. 홈 번들에 페이지를 넣지 않아요.
5. 운영 목록의 시작값은 빈 배열이에요. 자격 함수는 권리 확인, 공공누리가 들어간 출처 문장, 서명·만료 쿼리가 없는 `https` 영상 URL, 장소 경로 1~3개를 모두 요구해요. 하나라도 없으면 그 항목은 빠져요. `KOGL_REELS_RAW`는 import하지 않아요.
6. 테스트 픽스처와 운영 목록은 파일이 달라요. 픽스처 id는 `fixture-`로 시작해요. 첨부 표의 지명·slug·편 번호를 픽스처에 쓰지 않아요. 픽스처 영상은 테스트가 응답으로 넣는 최소 mp4예요. 서명 URL과 운영 호스트를 소스에 적지 않아요.
7. 플레이어는 새 페이지 컴포넌트의 `<video muted playsInline>`이에요. `YouTubePlayerView.jsx`는 수정하지 않아요.
8. 장소 버튼은 기존 장소 라우트로 가는 링크예요. 새 장소 데이터는 만들지 않아요. 테스트는 `href`만 확인해요. 장소 페이지의 데이터 로드는 통과 조건이 아니에요.
9. 페이지에는 `noindex`를 넣어요. `vite.config.js`의 `koreaRoutes`, `scripts/generate-sitemap.cjs`의 허브 목록, 홈 바로가기, 검색 색인에는 `/reels`를 넣지 않아요.
10. `www.gateo.kr/qa/...` 단축 링크는 공개 검토가 끝난 뒤의 별도 합의예요. 세션 1~6에서 `vercel.json` 리다이렉트와 `cloudQaShareLinks.js`를 바꾸지 않아요. 그 파일은 프로덕션 라우팅이에요.
11. 기존 `koglReels.js`와 `scripts/kogl-reels.test.mjs`는 삭제하거나 10건 계약을 바꾸지 않아요.

## 6. 세션을 나눈 이유와 소요

첨부 실행안은 PR 둘, 약 3~4.5일(추정)이었어요. 그 추정은 게시 7편과 영상 URL이 이미 확인됐다는 전제예요. 이 저장소에서는 그 전제가 확인되지 않았고, 재생 UI도 없어요. 달력 일수로 다시 적지 않아요.

지금 착수할 수 있는 코딩은 5세션이에요. 세션 6은 확인 패키지가 생기기 전에는 일정을 두지 않아요. 한 세션은 구현 1턴과 기획자 검수예요. 구현 모델은 사용자 기본 상위 모델이고, 점검 명령과 캡처만 Composer 서브에이전트가 해요. 이 계획 실행에서는 둘 다 돌리지 않아요.

| 세션 | 채팅명 | 추정 | 근거 |
|---|---|---|---|
| 1 | 자체 릴스 #1, 플래그 라우트 | 구현 1턴 | 플래그·조건부 라우트 선례가 `gateoFeatureFlags.js`와 `App.jsx`에 있어요 |
| 2 | 자체 릴스 #2, 목록 계약 | 구현 1턴 | 순수 함수와 `node:test`. 영상 조사가 없어요 |
| 3 | 자체 릴스 #3, 세로 재생 | 구현 1턴. 같은 자동재생 실패가 두 번째면 중단 | JSX에 `<video>` 선례가 없어요 |
| 4 | 자체 릴스 #4, 실패와 장소 | 구현 1턴 | 세션 3 상태에 실패·출처·링크를 더해요. 장소 라우트는 있어요 |
| 5 | 자체 릴스 #5, 미리보기 캡처 | 구현 1턴과 캡처 | `cursor/*` 미리보기가 꺼져 있어요. 캡처 규격은 e2e에 있어요 |
| 6 | 자체 릴스 #6, 확인편 연결 | 확인 패키지가 있을 때만 구현 1턴 | 권리·출처·안정 URL·장소가 리포에 없어요 |

## 7. 세션마다 기획자에게 넘기는 것

매 세션 끝에 아래 다섯 가지를 채팅과 일지에 남겨요. 없는 항목은 「없음」이라고 적고, 추측으로 채우지 않아요.

1. 변경 요약: 파일 목록, 플래그 기본값, 홈·검색·sitemap을 건드렸는지.
2. 테스트 로그: 실행한 명령, 마지막 PASS/FAIL 줄, 건너뛴 검사와 이유.
3. 미리보기: 세션 5 이전에는 「공유 URL 없음」. 세션 5 이후에는 실제 git Preview URL. 배포 해시 URL은 적지 않아요.
4. 캡처: 세션 5·6만. 파일 경로, 가로 픽셀, 픽스처인지 운영 목록인지.
5. 미확인: 다음 세션을 막는지 여부.

Composer 서브에이전트는 이 다섯 가지를 모으는 점검만 해요. 기획자 검수를 통과로 바꾸지 않아요. 브라우저는 기획자가 명시하기 전에는 `computerUse`로 누르지 않아요.

공통 중단: 같은 실패를 두 번 고친 뒤에도 그대로면 패치를 멈추고 원인·시도·선택지를 보고해요. 칩·필터·좋아요·로그인·추천, R2 쓰기, 서명 URL, 운영 DB 쓰기, 첨부 표의 slug 생성, 홈·검색 동작 변경이 필요해 보이면 그 세션을 멈춰요.

공통 되돌리기: 그 세션 커밋을 feature 브랜치에서 `git revert`해요. `main`에는 올리지 않아요. 플래그 기본 OFF라서, 실수로 코드만 들어가도 환경값 `'1'`이 없으면 페이지는 열리지 않아요. 그래도 머지는 기획자 장부 확인 전으로 두지 않아요.

## 8. 세션 1 — 플래그 라우트

채팅명: `자체 릴스 #1, 플래그 라우트`

범위: 플래그가 꺼지면 `/reels`가 홈으로 가고, 켜지면 빈 껍질만 보여요. 재생·목록·장소 버튼은 없어요. 껍질에는 `noindex`와, 운영 목록이 비어 있다는 문장만 있어요.

수정 후보:

- `src/shared/gateoFeatureFlags.js`
- `scripts/register-src-esm.mjs`
- `scripts/gateo-feature-flags.test.mjs` 또는 새 `scripts/self-reels-flag.test.mjs`
- `package.json`의 `test:self-reels` 스크립트
- `src/App.jsx`
- `src/pages/SelfReels/SelfReelsPage.jsx`
- `src/pages/SelfReels/isSelfReelsRouteEnabled.js`

의존성: 이 계획 문서가 `main`에 반영된 뒤, 기획자가 이 세션을 열어요. 코드 의존은 없어요.

완료 기준:

- 환경값이 없거나 `'1'`이 아니면 라우트가 등록되지 않아요.
- `'1'`이면 `/reels` 껍질이 있고, 홈·`/explore`·`/place/:slug` 트리는 그대로예요.
- `vercel.json`, sitemap, `koreaRoutes`, 검색 파일을 수정하지 않아요.
- 기존 kogl 테스트의 10건 기대가 유지돼요.

점검:

```bash
npm run test:self-reels
node --import ./scripts/register-src-esm.mjs --test scripts/kogl-reels.test.mjs
npm run build
```

`test:self-reels`는 플래그 기본 OFF, `'1'`일 때만 ON, 픽스처 플래그가 본 플래그 없이 켜지지 않음을 봐요. `npm run build`는 라우트 추가가 번들을 깨지 않는지 봐요.

예상 소요: 구현 1턴.

중단/되돌리기: 홈 청크에 SelfReels를 넣게 되거나, kogl 10건 테스트가 깨지면 멈추고 그 커밋을 revert해요.

기획자 결과물: 변경 요약, 위 세 명령 로그, 미리보기 없음, 캡처 없음, 미확인(호스팅·실편 목록).

## 9. 세션 2 — 목록 계약

채팅명: `자체 릴스 #2, 목록 계약`

범위: 운영 목록과 픽스처 목록을 나누고, 자격 함수만 추가해요. 운영 목록은 `[]`예요. 화면은 세션 1 껍질을 유지해요.

수정 후보:

- `src/pages/SelfReels/selfReelsCatalog.js`
- `src/pages/SelfReels/selfReelsFixture.js` (테스트와 픽스처 플래그만 import)
- `scripts/self-reels-catalog.test.mjs`
- `package.json`의 `test:self-reels`에 위 파일을 추가

자격에 필요해요.

- `rightsConfirmed === true`
- 출처 문장에 `공공누리`가 있음
- 영상 URL이 `https://`로 시작하고, 쿼리에 서명·만료 토큰이 없음
- `placePaths`가 1~3개이고, 각 값이 `/place/`로 시작하는 내부 경로

하나라도 실패하면 그 항목은 결과에서 빠져요. 빈 입력은 빈 배열이에요. 픽스처 모듈의 id는 `fixture-`로 시작해요. 운영 목록 파일은 픽스처를 import하지 않아요.

의존성: 세션 1이 기획자 검수를 통과한 같은 feature 브랜치. main 머지는 포함하지 않아요.

완료 기준: 위의 탈락 경우를 테스트가 각각 통과해요. 운영 목록 길이는 0이에요. 첨부 실행안의 지명·slug·편 수가 소스에 없어요. 서명 URL 문자열이 없어요.

점검: `npm run test:self-reels`

예상 소요: 구현 1턴.

중단/되돌리기: 실편처럼 보이는 id나 장소 경로를 넣어야 테스트가 통과하는 상황이면 데이터를 만들지 말고 멈추어요. 세션 2 커밋을 revert해요.

기획자 결과물: 자격 규칙과 테스트 이름 목록, 테스트 로그, 미리보기 없음, 캡처 없음, 미확인(실제 편은 여전히 없음).

## 10. 세션 3 — 세로 재생

채팅명: `자체 릴스 #3, 세로 재생`

범위: 픽스처 플래그가 켜진 테스트에서만 세로 피드가 재생돼요. 가시 항목 하나만 `play`하고 나머지는 `pause`해요. 기본 `muted`, 소리 버튼으로만 해제해요. `playsInline`이 있어요. 운영 목록이 비어 있고 픽스처 플래그가 꺼지면 세션 1의 빈 문장만 보여요.

수정 후보:

- `src/pages/SelfReels/selfReelsPlayback.js` (가시 비율로 재생 인덱스 하나를 고르는 순수 함수)
- `src/pages/SelfReels/SelfReelsFeed.jsx`
- `src/pages/SelfReels/SelfReelsPage.jsx`
- `scripts/self-reels-playback.test.mjs`
- `e2e/self-reels-feed.spec.js`
- 이 세션용 Playwright 설정 파일 하나 (기존 `playwright.config.*.js` 선례)

의존성: 세션 2의 픽스처 목록. 픽스처 영상 바이트는 테스트 응답으로 넣어요. 운영 호스트로 요청하지 않아요.

완료 기준:

- 순수 함수는 가시 후보가 둘이면 하나만 돌려요.
- 피드의 비활성 `<video>`는 일시정지예요.
- 초기 `muted`는 참이에요. 소리 버튼을 누르기 전에는 음소거가 유지돼요.
- `playsInline`이 참이에요.
- 픽스처가 꺼진 빌드에는 픽스처 제목과 픽스처 영상이 없어요.

점검:

```bash
npm run test:self-reels
npx playwright test --config=playwright.config.self-reels.js
```

설정 파일 이름은 세션에서 기존 설정과 겹치지 않게 정해요. 웹 서버는 두 플래그를 `'1'`로 켠 로컬 Vite예요. 프로덕션 환경 변수는 바꾸지 않아요.

예상 소요: 구현 1턴. 브라우저 자동재생이 막혀 같은 실패가 두 번째면 2턴째를 열지 않아요.

중단/되돌리기: 자동재생 정책을 우회하는 음소거 해제, 두 영상 동시 재생, YouTube 컴포넌트 수정이 필요하면 멈추고 세션 3 커밋을 revert해요. 순수 함수 테스트만 통과한 상태로 기획자에게 남겨도 돼요.

기획자 결과물: 재생 규칙 요약, 단위·Playwright 로그, 공유 미리보기 없음, 캡처 없음(세션 5), 자동재생에서 확인하지 못한 브라우저.

## 11. 세션 4 — 실패와 장소

채팅명: `자체 릴스 #4, 실패와 장소`

범위: 재생 오류면 표지(없으면 빈 프레임)와 「다시 시도」를 보여요. 같은 항목이 다시 실패하고 다음 편이 있으면 다음 편으로 가요. 마지막 편이면 그 실패 화면에 남아요. 출처 문장은 활성 카드에 항상 보여요. 장소 버튼은 그 항목의 `placePaths`와 같은 `href`예요.

수정 후보:

- `src/pages/SelfReels/selfReelsPlayback.js`
- `src/pages/SelfReels/SelfReelsFeed.jsx`
- `scripts/self-reels-playback.test.mjs`
- `e2e/self-reels-feed.spec.js`

의존성: 세션 3 피드. 장소 페이지 구현에는 의존하지 않아요.

완료 기준:

- 오류 한 번은 다시 시도 상태예요.
- 같은 항목의 두 번째 오류는 다음 인덱스로 가요. 다음이 없으면 인덱스가 유지돼요.
- 출처가 없는 항목은 세션 2 자격에서 이미 빠져요. 피드 테스트의 보이는 카드에는 출처 문장이 있어요.
- 버튼 이름과 `href`가 목록과 같아요. 장소 네트워크 성공은 요구하지 않아요.
- 픽스처 버튼 문구는 테스트 장소임이 드러나요.

점검: 세션 3과 같은 두 명령.

예상 소요: 구현 1턴.

중단/되돌리기: 실패를 숨기려고 다른 영상 URL을 만들거나, 확인되지 않은 장소 경로를 넣으면 멈추고 세션 4 커밋을 revert해요.

기획자 결과물: 실패 전이와 버튼 `href` 요약, 테스트 로그, 공유 미리보기 없음, 캡처 없음, 미확인(실편 장소).

## 12. 세션 5 — 미리보기 캡처

채팅명: `자체 릴스 #5, 미리보기 캡처`

범위: 플래그를 켠 빌드의 빈 운영 목록과, 로컬 픽스처 피드의 재생 화면을 390과 1280으로 찍어요. 공유 git Preview는 기획자가 그 브랜치의 미리보기를 허용한 뒤에만 켜요.

수정 후보:

- `e2e/self-reels-capture.spec.js`
- `vercel.json`의 `git.deploymentEnabled`에 구현 브랜치 한 줄 (기획자가 허용한 경우만)
- 미리보기에서 플래그를 켜는 기존 환경 방식. 저장소에 비밀값을 커밋하지 않아요.
- `src/shared/cloudPreview/cloudPreviewWorkLog.js`에 이 세션 로그 한 줄 (feature 브랜치 코드. 프로덕션 기본 UI가 아니에요)

넣지 않아요: `cloudQaShareLinks.js`, `vercel.json` `redirects`, sitemap, 홈 링크, R2.

의존성: 세션 4 검수 통과. 미리보기 URL은 `vercel.json`에서 `cursor/*`가 꺼져 있어서, 구현 브랜치를 예외로 켜야 생겨요. 그 한 줄은 배포를 허용하는 변경이라 기획자 확인이 먼저예요. 확인 전에는 로컬 캡처만 하고 URL은 「미발급」으로 적어요.

완료 기준:

- 빈 운영 목록 캡처 2장: 가로 390, 가로 1280. 390 파일의 너비는 390px예요.
- 픽스처 캡처 2장: 같은 너비. 파일 이름에 `fixture`가 있어요. 공유 미리보기 빌드에는 픽스처 플래그가 없어요.
- 캡처 스펙은 `deviceScaleFactor: 1`, `page.screenshot({ clip })`예요.
- 플래그를 끈 빌드에서 `/reels`는 `/`로 가요.
- 홈과 검색 스펙을 새로 깨지 않아요. 이 세션은 홈 화면을 수정하지 않아요.

점검:

```bash
npm run test:self-reels
npx playwright test --config=playwright.config.self-reels.js
npm run build
```

캡처 명령은 스펙 안에 두고, 출력 경로를 일지에 적어요. 가로 픽셀은 `file` 또는 이미지 헤더로 확인해요.

예상 소요: 구현 1턴과 캡처. 미리보기 허용이 없으면 URL 없이 캡처만으로 세션을 닫아요.

중단/되돌리기: 캡처 너비가 390이 아니거나, 픽스처 영상이 공유 미리보기에 보이면 배포 허용을 유지하지 않아요. `deploymentEnabled`를 다시 `false`로 되돌리고 세션 5의 화면 커밋을 revert해요.

기획자 결과물: 변경 요약, 테스트·빌드 로그, git Preview URL 또는 「미발급」, 캡처 4장의 경로와 가로 픽셀, 미확인(실편·호스팅). 이 캡처는 공개 검토 자료이고, 공개 승인이 아니에요.

## 13. 세션 6 — 확인편 연결

채팅명: `자체 릴스 #6, 확인편 연결`

범위: 사람이 만든 확인 패키지에 있는 편만 운영 목록에 넣어요. 패키지가 없으면 파일을 만들지 않고 세션을 열지 않아요.

확인 패키지 위치는 `plans/self-reels-confirmed.md`예요. 세션 6이 그 파일을 코드로 옮기기 전에 기획자가 각 행에 아래를 적어요.

- id
- 출처 문장(공공누리 포함)
- 권리 확인
- 안정 `https` 영상 URL (서명·만료 쿼리 없음)
- 장소 경로 1~3개
- 그 경로를 장소 상세로 연 기록

이 계획 실행은 그 파일을 만들지 않아요. 행이 0이면 세션 6은 착수하지 않아요.

수정 후보:

- `src/pages/SelfReels/selfReelsCatalog.js` (패키지와 같은 행만)
- `scripts/self-reels-catalog.test.mjs`
- 세션 5 캡처 스펙의 운영 목록 케이스
- `plans/self-reels-confirmed.md`는 문서 PR로만 갱신

의존성: 세션 5 검수. 확인 패키지. 영상 URL의 호스트가 실제로 응답하는지는 업로드가 아니라 읽기 확인이에요. 읽기조차 승인 전이면 URL을 코드에 넣지 않아요. R2 설정 변경은 이 세션에 없어요. 호스팅이 서명 URL뿐이면 그 편은 제외해요.

완료 기준:

- 코드의 운영 목록 길이가 패키지의 통과 행 수와 같아요.
- 탈락 행은 코드에 없고, 일지의 미확인에 이유가 있어요.
- 통과 편이 1개 이상이면, 그 편만 담은 390·1280 캡처와 장소 버튼 `href`가 있어요.
- 통과 편이 0이면 캡처는 세션 5의 빈 목록과 같고, 공개 검토용 실편 자료는 「없음」이에요.
- 픽스처와 운영 목록 테스트가 서로 import하지 않아요.

점검: `npm run test:self-reels`, 캡처 스펙, `npm run build`. 실서버 영상 요청은 기획자가 읽기를 허용한 URL만, 테스트 기본 경로 밖에서 해요. CI 기본 명령은 실영상을 호출하지 않아요.

예상 소요: 패키지가 확정된 뒤에 구현 1턴. 패키지·호스팅이 없으면 소요를 적지 않아요.

중단/되돌리기: 패키지와 다른 행, 서명 URL, 장소 4곳 이상, 권리 문장이 없는 행이 들어가면 목록 커밋을 revert해요. 호스팅 작업으로 세션을 확장하지 않아요.

기획자 결과물: 패키지 행 수와 코드 행 수, 탈락 이유, 테스트 로그, 미리보기 URL, 실편 캡처 또는 「없음」, 아직 확인되지 않은 호스팅 항목.

## 14. 모델과 검수

| 역할 | 누가 | 이번 계획 실행 |
|---|---|---|
| 구현 | 사용자 기본 상위 모델의 cloud coding agent | 하지 않아요 |
| 테스트·캡처 수집 | Composer 서브에이전트 | 하지 않아요 |
| 세션 통과·피드백 | 사이트 기획 담당 | 문서를 본 뒤 세션 1부터 열어요 |
| 공개 플래그 ON | 대표님, 사이트 관리 채팅에서 1회 | 이 계획의 세션이 아니에요 |

구현 세션은 점검이 PASS여도 기획자 결과물 없이 다음 세션으로 넘어가지 않아요. Composer 결과를 머지 승인으로 쓰지 않아요.

## 15. 머지와 장부

머지 금지 시간은 한국 시간 17:00–19:00, 01:30–04:30이에요. 이 문서를 만든 시점은 01:30–04:30 안이므로 머지하지 않아요. 금지 시간 밖이어도 이 실행은 머지하지 않아요.

이 계획 PR과 이후 구현 PR은 다른 사이트 관리 PR과 같은 시각에 머지하지 않아요. 첨부 실행안의 대기 순서(#663, 무니 표, 무니 목적지, 투어 카드)는 이 체크아웃에서 다시 확인하지 않았어요. 머지 전에 기획자가 열린 PR 장부를 보고 순서를 정해요.

`feature-handoff-index.md`는 여러 주제가 같이 고치는 파일이에요. 구현 브랜치가 생기기 전에는 수정하지 않아요. 세션 1을 열 때 기획자가 행을 추가해요.

코드의 `origin/main` 반영은 구현 PR 머지 또는 사람 요청만이에요. 플래그를 프로덕션 환경에서 켜는 일은 대표님 공개 결정 다음이에요.

## 16. 핸드오프

세션 1 제시어는 기획자가 이 계획에 동의한 뒤에만 써요.

```
자체 릴스 #1, 플래그 라우트
@plans/feature-handoff-index.md
@plans/2026-11-07-project-log.md
@plans/2026-11-07-self-reels-page-session-plan.md
브랜치: 세션 1이 짧은 feature를 한 번 연다. 계획 PR 브랜치는 재사용하지 않는다.
금지: 재생 구현 · KOGL_REELS_RAW 연결 · R2·DB·서명 URL · 홈/검색/sitemap 수정 · 머지
```

다음 세션 채팅명은 위 표의 한 줄만 써요.

## 17. 공개 검토 조건

공개를 논의하려면 세션 5의 플래그 ON 미리보기(또는 미리보기를 아직 허용하지 않았다면 그 사실)와, 너비가 맞는 390·1280 캡처가 있어야 해요. 실편을 공개 검토에 쓰려면 세션 6의 확인 편 캡처가 더 있어야 해요. 픽스처 캡처만으로 공개를 제안하지 않아요. 릴리스 노트는 공개가 확정된 새 기능일 때 따로 초안을 내요. 이 계획 단계에서는 초안을 쓰지 않아요.
