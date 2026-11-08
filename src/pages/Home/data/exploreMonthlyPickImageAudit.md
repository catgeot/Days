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
| jeju | 골뱅이 (Panoramio, Commons `Artist`) | CC BY-SA 3.0 (`LicenseShortName` / Panoramio 검수 기록) | https://commons.wikimedia.org/wiki/File:Silver_Grass,_Sangumburi,_Jeju_(%EC%96%B5%EC%83%88,_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC)_-_panoramio.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Silver_Grass%2C_Sangumburi%2C_Jeju_%28%EC%96%B5%EC%83%88%2C_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC%29_-_panoramio.jpg/1280px-Silver_Grass%2C_Sangumburi%2C_Jeju_%28%EC%96%B5%EC%83%88%2C_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC%29_-_panoramio.jpg | 원본 1600×857 (`commons imageinfo`) · 렌더 1280px 썸 (`ffprobe`) | 제주 산굼부리(Sangumburi) 억새 — 파일 설명·좌표(Commons). 카드 카피는 spotTraits 가을 오름·억새. 방문 시기는 카드에 **추정** 배지 |
| dubai | Norlando Pobre | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg | 6000×4000 | 두바이 마리나(파일 설명) |
| melbourne | Jupiter Firelyte (Flickr) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Flemington_main_stand%2C_2013_Melbourne_Cup.jpg | https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flemington_main_stand,_2013_Melbourne_Cup.jpg/1280px-Flemington_main_stand,_2013_Melbourne_Cup.jpg | 1400×1050 | 2013 멜버른컵 당시 Flemington 스탠드(파일 설명) |

---

## Commons 5장 재대조 (제주 교체 외 변경 없음)

2026-11-06 `commons.wikimedia.org/w/api.php` `query` + `prop=imageinfo` + `iiprop=extmetadata|url|size` 스냅샷으로 `kyoto`·`chiang-mai`·`phu-quoc`·`dubai`·`melbourne` 파일 페이지의 `Artist`·`LicenseShortName`(또는 동등)·원본 `width`×`height`가 위 표와 일치함을 확인. 세부 JSON·명령은 검증 묶음 `explore-monthly-verify-pack.md` 참고.

## UI 표시

카드 본문은 여행지 이름, `travelSpots`의 `desc` 요약, 이달 이유만 보여 준다. 관광청 링크와 저작·파일 페이지는 카드에 넣지 않는다. 저작·라이선스 원문(제주 크롭 표시 포함)은 `EXPLORE_MONTHLY_PICK_PHOTO_CREDIT`와 이 문서에 두고, 카드 이미지 `title`로만 남긴다.

## 래스터 확대

`object-fit: cover`로 컨테이너를 채우므로, 컨테이너 짧은 변이 원본보다 크면 **확대(업스케일)** 될 수 있다. `maxHeight`·`aspect-ratio`로 컨테이너 최대 크기를 제한한다. 아티팩트 `explore-monthly-*-img-sizes.json`에 `natural` 대비 `client` 비교 기록.
