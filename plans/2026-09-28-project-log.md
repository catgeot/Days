# 2026-09-28 프로젝트 일지

직전: [`2026-09-27-project-log.md`](./2026-09-27-project-log.md)

## 팔경 활용 #83 — 부여10경 천정대 백제보

- **세션** `팔경 활용 #83, 부여 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `eb9fb7d9` · PR [#339](https://github.com/catgeot/Days/pull/339)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 부여10경 결손 1건. 천정대(규암면 호암리 산5·기념물 제49호·정사암)와 백제보(부여읍 북포로 451·311m·금강문화관). 공주보·세종보·부소산 낙화암과 구분. 사진은 부여군 문화관광 공식 3장.
- **VERIFY** `smoke:korea-local-scenic-lists` · `vite build` PASS. 순수 사진/개요 누락 **9**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=buyeo` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=buyeo`
- **다음** `팔경 활용 #84, 성주 결손 오버레이` — 성주참외하우스 들녘 · **오버레이 사진 ≥3장**([`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) §2.1)

## 팔경 활용 #81 — 태안8경 안흥성

- **세션** `팔경 활용 #81, 태안 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `3a97c812` · PR [#339](https://github.com/catgeot/Days/pull/339)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 태안8경 결손 1건. 안흥성(안흥진성)은 근흥면 정죽리 1155-1(1583년 축성·1655년 대수리·성벽 약 1,798m·2020년 국가사적). 화성 안흥창호·이천 안흥동·가의도와 구분. 사진은 태안군 문화관광 제2경 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `vite build` PASS. 순수 사진/개요 누락 **11**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=taean` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=taean`
## 팔경 활용 #82 — 변산8경 서해낙조

- **세션** `팔경 활용 #82, 부안 결손 오버레이` · feature `cursor/palgyeong-use-e744` · tip `2014cce4` · PR [#339](https://github.com/catgeot/Days/pull/339)
- **조치** JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 변산8경 결손 1건. 서해낙조는 월명암 옆 낙조대에서 고군산군도·위도와 서해 석양(디지털부안문화대전·부안군 문화관광 5경). 군산 선유낙조·영광 불갑사 낙조와 구분. 사진은 부안군 문화관광 변산8경 제5경 공식 사진.
- **VERIFY** `smoke:korea-local-scenic-lists` · `vite build` PASS. 순수 사진/개요 누락 **10**/876.
- **Preview** https://www.gateo.kr/qa/palgyeong-use → `/korea/theme/scenic?hub=buan` · git `https://days-git-cursor-palgyeong-use-e744-catgeots-projects.vercel.app/korea/theme/scenic?hub=buan`
- **다음** `팔경 활용 #83, 부여 결손 오버레이` — 천정대 백제보 · **오버레이 사진 ≥3장**([`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) §2.1)

## 팔경 활용 — 오버레이 사진 장수 SSOT (문서)

- **실측** `LOCAL_SCENIC_MEMBER_OVERLAYS` 314건: 평균 **2.75장**, 중앙값 **3장** (팔·구·십 계열 233건 평균 **2.90**).
- **규칙** 플랜 **§2.1** — 결손 오버레이는 **최소 3장**, 가능하면 4~6장. 오버레이가 Tour 갤러리를 대체하므로 **추가 자동 보강 없음**. #77~#82 1장 부채는 허브 재작업 시 보강.
- **#82 follow-up** tip `0c697388` · 변산8경 오버레이 5행 갤러리 3장(부안 8경 썸네일 + visitkorea/군 공식).

## 축제 페이지 #9 — 검색 버튼 시인성

- **세션** `축제 페이지 #9, 검색 버튼 시인성` · feature `cursor/festival-sheet-ui-ec8b` · tip `b635fa66` · PR [#345](https://github.com/catgeot/Days/pull/345)
- **조치** `OutboundSearchButtons` 공유 SSOT로 축제 본문·명승 상세 네이버·구글 CTA 통일(브랜드 N/G, 「상세정보 보기」 문구).
- **VERIFY** `smoke:festival-surface-search` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-ui → `/korea` 축제 카드
