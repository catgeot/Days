# Explore 「11월의 여행지」 이미지 출처 감사

**코드 SSOT(직접 URL)**: `exploreMonthlyPickHeroUrls.js` 내 `EXPLORE_MONTHLY_PICK_VERIFIED_HERO_URLS`  
**유입 경로**: `exploreMonthlyPicks.js` → `resolveExploreMonthlyPickHeroUrl()` → `resolveListImageUrl(url, { role: 'list', width: 640 })` — Wikimedia·VisitKorea 호스트는 URL 변형 없이 유지, Unsplash만 `w` 파라미터 적용.

---

## 교체·제보 대응 (이전 출처)

| 제보·항목 | 해당 슬롯(레이아웃 순) | 이전 이미지 출처·도입 | 내용·판단 |
|------------|------------------------|----------------------|-----------|
| 교토 「단풍」과 장면 불일치 | 첫 카드 `kyoto` | Unsplash `photo-1493976040374` (`exploreMonthlyPickHeroUrls.js` main 브랜치) → `resolveExploreMonthlyPickHeroUrl` | 강변 바위 위주 풍경으로 단풍 절정 문구와 맞지 않음 → 교체 |
| 둘째 줄 오른쪽 바다·원형 다리·섬·시계탑 의심 | 구 레이아웃 B에서 `phu-quoc`(index 2, 우열 우측) | Unsplash `photo-1693294603830` (`exploreMonthlyPickHeroUrls.js` main) | 실제 푸꾸옥 여부 미검증·AI/합성 여부 **미확정** — Commons 해변 실사로 교체. 원본이 합성이었다고 단정하지 않음(미확정) |

---

## 현재 카드별 (검증 가능한 메타)

Commons 작가·라이선스·원문 설명은 2026-11-07 `commons.wikimedia.org/w/api.php` `imageinfo` + `extmetadata` 스냅샷. 원본 픽셀은 동일 API `width`/`height`. 렌더용 1280px 썸은 `ffprobe`로 확인.

| slug | 저작자(Commons Artist) | 라이선스(표기) | 파일 페이지 URL | 코드·렌더 직접 URL | 원본 W×H | 장소·시즌 근거(원문 설명 요지) |
|------|-------------------------|----------------|-------------------|---------------------|----------|--------------------------------|
| kyoto | Luka Peternel (User:Path-x21) | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Tofukuji-maple-autumn-2017-Luka-Peternel.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Tofukuji-maple-autumn-2017-Luka-Peternel.jpg/1280px-Tofukuji-maple-autumn-2017-Luka-Peternel.jpg | 5472×3648 | 도후쿠지 츠텐교·가을 단숲(파일 설명) |
| chiang-mai | Nik Cyclist (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg/1280px-Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg | 2000×1334 | 치앙마이 이펭 랜턴(파일 설명) |
| phu-quoc | dronepicr (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg/1280px-Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg | 5313×3542 | 푸꾸옥 해변(파일 제목·설명) |
| jeju | (매체 출처 VisitJeju — 저작자 표기는 [제주관광공사 매체·저작권 안내](https://www.visitjeju.net/kr/yy/kr/dcyc.ynych?menuId=DOM00000090164000100)에서 확인) | 이용약관·매체 정채(별도 확인 필요) | 카드 정책 출처: https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500309 | https://tong.visitkorea.or.kr/cms2/website/26/1921326.jpg | 1280×853 (`ffprobe`) | 제주 오름·가을(카드 문구는 spotTraits·추정 배지) |
| dubai | Norlando Pobre | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg | 6000×4000 | 두바이 마리나(파일 설명) |
| melbourne | Jupiter Firelyte (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Flemington_main_stand%2C_2013_Melbourne_Cup.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flemington_main_stand,_2013_Melbourne_Cup.jpg/1280px-Flemington_main_stand,_2013_Melbourne_Cup.jpg | 1400×1050 | 2013 멜버른컵 당시 Flemington 스탠드(파일 설명) |

---

## UI 표시

카드 하단에 **저작·라이선스 한 줄**과 **파일/정책 페이지 링크**를 렌더한다 (`ExploreMonthlyPickItem.jsx`, `EXPLORE_MONTHLY_PICK_PHOTO_CREDIT`). 카피·링크는 한/영 UI에 맞게 전환한다.

## 래스터 확대

`object-fit: cover`로 컨테이너를 채우므로, 컨테이너 짧은 변이 원본보다 크면 **확대(업스케일)** 될 수 있다. `maxHeight`·`aspect-ratio`로 컨테이너 최대 크기를 제한한다. 아티팩트 `explore-monthly-*-img-sizes.json`에 `natural` 대비 `client` 비교 기록.
