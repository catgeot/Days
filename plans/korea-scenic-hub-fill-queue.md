# GATEO 선정 명소 — 권역·시군 hub 보강 큐

**생성**: `npm run report:korea-scenic-empty-hubs -- --write-queue` (이 파일 덮어씀)
**스냅샷**: 빈 hub **117** · 선정 hub **52** · maxOrder **1170**

**완료**: `#77` 양양 · `#78` 평창·남해 · `#79` 안산·강화(구 R01 앞) → 아래 표는 잔여 재번호.

## 사용법

1. 아래 **다음 미완료 라운드**의 hubId를 워커 A/B에 전달 (각 최대 5).
2. 초안: `npm run draft:korea-scenic-hub-batch -- --hubs=<A목록>` → overrides에 append · blurb·contentId 검수.
3. `npm run generate:korea-scenic-spots` → `fill:korea-scenic-spot-images` → `audit`/`smoke:korea-scenic-spots`.
4. 완료 라운드는 표에서 ✅ · 이 파일을 `--write-queue`로 재생성하면 잔여만 남음.
5. **제외**: 자치구(…구) hub · 이미 선정 있는 hub.

## 라운드 (워커A 5 + 워커B 5)

| R | 워커A | 워커B | 권역 | 상태 |
|---|-------|-------|------|------|
| **R01** | `gimpo` · `goyang` · `gwangmyeong` · `hanam` · `anseong` | `anyang` · `bucheon` · `namyangju` · `pocheon` · `siheung` | 수도권 | ⬜ |
| **R02** | `uiwang` · `yangpyeong` · `yongin` · `gunpo` · `guri` | `gwacheon` · `gwangju_gi` · `hwaseong` · `ongjin` · `osan` | 수도권 | ⬜ |
| **R03** | `uijeongbu` · `yeoju` · `yeoncheon` · `cheorwon` · `dongducheon` | `icheon` · `pyeongtaek` · `yangju` | 수도권 | ⬜ |
| **R04** | `inje` · `yeongwol` · `goseong` · `hongcheon` · `yanggu` | `jeongseon` · `taebaek` · `hoengseong` · `hwacheon` · `wonju` | 강원 | ⬜ |
| **R05** | `jincheon` · `chungju` · `jeungpyeong` · `sejong` · `seosan` | `asan` · `boeun` · `cheonan` · `cheongyang` · `dangjin` | 충청 | ⬜ |
| **R06** | `goesan` · `gyeryong` · `yeongdong` · `eumseong` · `geumsan` | `hongseong` · `nonsan` · `okcheon` · `yeongi` · `yesan` | 충청 | ⬜ |
| **R07** | `wanju` · `gokseong` · `jangsu` · `seocheon` · `gangjin` | `gochang` · `goheung` · `hwasun` · `imsil` · `jangheung` | 전라 | ⬜ |
| **R08** | `jangseong` · `jindo` · `naju` · `sinan` · `sunchang` | `yeonggwang` · `gimje` · `gwangyang` · `haenam` · `hampyeong` | 전라 | ⬜ |
| **R09** | `iksan` · `muan` · `muju` · `yeongam` | — | 전라 | ⬜ |
| **R10** | `geochang` · `ulju` · `gimhae` · `gunwi` · `sangju` | `yangsan` · `changwon` · `cheongdo` · `dalseong` · `gijang` | 경상 | ⬜ |
| **R11** | `goseongnam` · `gumi` · `haman` · `hamyang` · `miryang` | `mungyeong` · `sacheon` · `uiseong` · `uljin` · `yecheon` | 경상 | ⬜ |
| **R12** | `yeongcheon` · `yeongju` · `bonghwa` · `changnyeong` · `cheongsong` | `chilgok` · `gimcheon` · `goryeong` · `gyeongsan` · `sancheong` | 경상 | ⬜ |
| **R13** | `seongju` · `uiryeong` · `yeongdeok` · `yeongyang` | — | 경상 | ⬜ |
| **R14** | `dokdo` | — | 미정 | ⬜ |

**합계**: 14 라운드 · hub 117.

## 권역별 잔여

### 수도권 (28)

- `gimpo` 김포 — attr 7 · Tour contentId 0
- `goyang` 고양 — attr 7 · Tour contentId 0
- `gwangmyeong` 광명 — attr 7 · Tour contentId 0
- `hanam` 하남 — attr 7 · Tour contentId 0
- `anseong` 안성 — attr 6 · Tour contentId 0
- `anyang` 안양 — attr 6 · Tour contentId 0
- `bucheon` 부천 — attr 6 · Tour contentId 0
- `namyangju` 남양주 — attr 6 · Tour contentId 0
- `pocheon` 포천 — attr 6 · Tour contentId 0
- `siheung` 시흥 — attr 6 · Tour contentId 0
- `uiwang` 의왕 — attr 6 · Tour contentId 0
- `yangpyeong` 양평 — attr 6 · Tour contentId 0
- `yongin` 용인 — attr 6 · Tour contentId 0
- `gunpo` 군포 — attr 5 · Tour contentId 0
- `guri` 구리 — attr 5 · Tour contentId 0
- `gwacheon` 과천 — attr 5 · Tour contentId 0
- `gwangju_gi` 경기 광주 — attr 5 · Tour contentId 0
- `hwaseong` 화성 — attr 5 · Tour contentId 0
- `ongjin` 옹진 — attr 5 · Tour contentId 0
- `osan` 오산 — attr 5 · Tour contentId 0
- `uijeongbu` 의정부 — attr 5 · Tour contentId 0
- `yeoju` 여주 — attr 5 · Tour contentId 0
- `yeoncheon` 연천 — attr 5 · Tour contentId 0
- `cheorwon` 철원 — attr 4 · Tour contentId 0
- `dongducheon` 동두천 — attr 4 · Tour contentId 0
- `icheon` 이천 — attr 4 · Tour contentId 0
- `pyeongtaek` 평택 — attr 4 · Tour contentId 0
- `yangju` 양주 — attr 4 · Tour contentId 0

### 강원 (10)

- `inje` 인제 — attr 7 · Tour contentId 0
- `yeongwol` 영월 — attr 7 · Tour contentId 0
- `goseong` 고성 — attr 6 · Tour contentId 0
- `hongcheon` 홍천 — attr 6 · Tour contentId 0
- `yanggu` 양구 — attr 6 · Tour contentId 0
- `jeongseon` 정선 — attr 5 · Tour contentId 0
- `taebaek` 태백 — attr 5 · Tour contentId 0
- `hoengseong` 횡성 — attr 4 · Tour contentId 0
- `hwacheon` 화천 — attr 4 · Tour contentId 0
- `wonju` 원주 — attr 4 · Tour contentId 0

### 충청 (20)

- `jincheon` 진천 — attr 7 · Tour contentId 0
- `chungju` 충주 — attr 6 · Tour contentId 0
- `jeungpyeong` 증평 — attr 6 · Tour contentId 0
- `sejong` 세종 — attr 6 · Tour contentId 0
- `seosan` 서산 — attr 6 · Tour contentId 0
- `asan` 아산 — attr 5 · Tour contentId 0
- `boeun` 보은 — attr 5 · Tour contentId 0
- `cheonan` 천안 — attr 5 · Tour contentId 0
- `cheongyang` 청양 — attr 5 · Tour contentId 0
- `dangjin` 당진 — attr 5 · Tour contentId 0
- `goesan` 괴산 — attr 5 · Tour contentId 0
- `gyeryong` 계룡 — attr 5 · Tour contentId 0
- `yeongdong` 영동 — attr 5 · Tour contentId 0
- `eumseong` 음성 — attr 4 · Tour contentId 0
- `geumsan` 금산 — attr 4 · Tour contentId 0
- `hongseong` 홍성 — attr 4 · Tour contentId 0
- `nonsan` 논산 — attr 4 · Tour contentId 0
- `okcheon` 옥천 — attr 4 · Tour contentId 0
- `yeongi` 연기 — attr 4 · Tour contentId 0
- `yesan` 예산 — attr 4 · Tour contentId 0

### 전라 (24)

- `wanju` 완주 — attr 7 · Tour contentId 0
- `gokseong` 곡성 — attr 6 · Tour contentId 0
- `jangsu` 장수 — attr 6 · Tour contentId 0
- `seocheon` 서천 — attr 6 · Tour contentId 0
- `gangjin` 강진 — attr 5 · Tour contentId 0
- `gochang` 고창 — attr 5 · Tour contentId 0
- `goheung` 고흥 — attr 5 · Tour contentId 0
- `hwasun` 화순 — attr 5 · Tour contentId 0
- `imsil` 임실 — attr 5 · Tour contentId 0
- `jangheung` 장흥 — attr 5 · Tour contentId 0
- `jangseong` 장성 — attr 5 · Tour contentId 0
- `jindo` 진도 — attr 5 · Tour contentId 0
- `naju` 나주 — attr 5 · Tour contentId 0
- `sinan` 신안 — attr 5 · Tour contentId 0
- `sunchang` 순창 — attr 5 · Tour contentId 0
- `yeonggwang` 영광 — attr 5 · Tour contentId 0
- `gimje` 김제 — attr 4 · Tour contentId 0
- `gwangyang` 광양 — attr 4 · Tour contentId 0
- `haenam` 해남 — attr 4 · Tour contentId 0
- `hampyeong` 함평 — attr 4 · Tour contentId 0
- `iksan` 익산 — attr 4 · Tour contentId 0
- `muan` 무안 — attr 4 · Tour contentId 0
- `muju` 무주 — attr 4 · Tour contentId 0
- `yeongam` 영암 — attr 4 · Tour contentId 0

### 경상 (34)

- `geochang` 거창 — attr 7 · Tour contentId 0
- `ulju` 울주 — attr 7 · Tour contentId 0
- `gimhae` 김해 — attr 6 · Tour contentId 0
- `gunwi` 군위 — attr 6 · Tour contentId 0
- `sangju` 상주 — attr 6 · Tour contentId 0
- `yangsan` 양산 — attr 6 · Tour contentId 0
- `changwon` 창원 — attr 5 · Tour contentId 0
- `cheongdo` 청도 — attr 5 · Tour contentId 0
- `dalseong` 달성 — attr 5 · Tour contentId 0
- `gijang` 기장 — attr 5 · Tour contentId 0
- `goseongnam` 경남 고성 — attr 5 · Tour contentId 0
- `gumi` 구미 — attr 5 · Tour contentId 0
- `haman` 함안 — attr 5 · Tour contentId 0
- `hamyang` 함양 — attr 5 · Tour contentId 0
- `miryang` 밀양 — attr 5 · Tour contentId 0
- `mungyeong` 문경 — attr 5 · Tour contentId 0
- `sacheon` 사천 — attr 5 · Tour contentId 0
- `uiseong` 의성 — attr 5 · Tour contentId 0
- `uljin` 울진 — attr 5 · Tour contentId 0
- `yecheon` 예천 — attr 5 · Tour contentId 0
- `yeongcheon` 영천 — attr 5 · Tour contentId 0
- `yeongju` 영주 — attr 5 · Tour contentId 0
- `bonghwa` 봉화 — attr 4 · Tour contentId 0
- `changnyeong` 창녕 — attr 4 · Tour contentId 0
- `cheongsong` 청송 — attr 4 · Tour contentId 0
- `chilgok` 칠곡 — attr 4 · Tour contentId 0
- `gimcheon` 김천 — attr 4 · Tour contentId 0
- `goryeong` 고령 — attr 4 · Tour contentId 0
- `gyeongsan` 경산 — attr 4 · Tour contentId 0
- `sancheong` 산청 — attr 4 · Tour contentId 0
- `seongju` 성주 — attr 4 · Tour contentId 0
- `uiryeong` 의령 — attr 4 · Tour contentId 0
- `yeongdeok` 영덕 — attr 4 · Tour contentId 0
- `yeongyang` 영양 — attr 4 · Tour contentId 0

### 미정 (1)

- `dokdo` 독도 — attr 4 · Tour contentId 0

