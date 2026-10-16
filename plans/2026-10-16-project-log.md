# 2026-10-16 프로젝트 일지

이전: [`2026-10-14-project-log.md`](./2026-10-14-project-log.md)

## 축제 탭 닫기 #1, 안내로 복귀

- **세션** 일회 · branch `cursor/festival-tab-close-0cf9` · tip `2cd06f24` · draft PR [#480](https://github.com/catgeot/Days/pull/480) · **병합 금지**
- 축제 상세 프로그램·사진·읽을거리 하단 «닫기»는 시트를 닫지 않고 안내 탭 맨 위로 돌아간다. 우측 상단 X와 안내 탭 하단 닫기는 축제를 닫는다. 탭은 쿼리에 없고 `festival=` 은 유지된다.
- **검증:** `lint:ci` · `test:health` 397 pass · `build` · Chromium·WebKit 390 `docs/qa/tab-close/` (강릉커피 825295 · 제주 3554702 · 서울 2862358)

## 주변 볼거리 교통 #1, 터미널·역·관공서

- **세션** 일회 · branch `cursor/nearby-transport-189d` · tip `ca377b57` · draft PR [#479](https://github.com/catgeot/Days/pull/479) · **병합 금지**
- 강릉커피축제 825295 «주변 볼거리»에서 강릉항여객터미널을 뺐다. 국향 638576·마산가고파 637693 목록은 그대로다. 역사문화공원·화랑대역·구 서울역·사찰은 남긴다. TourAPI `A02020800`은 유람선과 겹쳐 cat3 제외에 넣지 않았다.
- **검증:** `lint:ci` · `test:health` 395 pass · `vite build` · Chromium·WebKit 390 before/after `docs/qa/nearby-transport/`
