# cityAttractionHubs — 사전 배치 큐 (해외 우선)

**상태**: ✅ 2026-07-23 · tip 기준 **630 hub** (R48–R69 ✅) · **큐 소진**  
**규칙**: 라운드 = **10 hub** · 워커A **5** + 워커B **5** · 메인 직렬 머지(A→B) · VERIFY 후 다음 라운드  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) v2.3 · 일지 [`2026-07-23-project-log.md`](./2026-07-23-project-log.md) · VERIFY PASS 커밋은 **§3.4**

### 사용법 (오케스트레이터)

1. 아래 **다음 미완료 라운드**부터 워커 2 기동 (hubId 목록만 전달).  
2. 완료 라운드는 표에서 ✅로 표시(또는 일지에 R번호 VERIFY).  
3. EXISTS/충돌 시 **같은 권역 예비**에서 1:1 대체 후 큐·일지에 1줄.  
4. **금지**: 큐 무시하고 KR 구·DE/UK 중소 임의 추가 · 워커 tip 직접 append.  
5. **문제 시**: [`orchestrator-method.md`](./orchestrator-method.md) **§3.3** (롤백·A/B 실패·중단 체크·스킵·escalate).

### hubId 표기

- 다단어: **하이픈** (`las-vegas`, `kuala-lumpur`, `st-petersburg`, `el-calafate`) — tip의 `new-york`/`hong-kong`과 동일  
- 이미 tip에 있는 ID는 큐에 **넣지 않음**  
- 지역·섬 거점도 hub 허용 (`cappadocia`, `cinque-terre`, `bora-bora` 등) — 명소 7개·좌표·동명 접두 규칙은 동일

### 큐 설계 (R62–R69)

| 티어 | 라운드 | 의도 |
|------|--------|------|
| **P0** | R62–R65 | 사이트 `travelSpots`에 이미 있거나 직결되는 **도시·섬** (검색 수요↑) |
| **P1** | R66–R69 | 아직 스팟 없거나 약한 **사전 확보** (중국 관광·중앙亞·남미·미·아프리카) |

별칭만으로 커버 가능한 slug(`maldives`→`male`, `hawaii`→`honolulu`, `malta`→`valletta`, `brunei`→`bandar-seri-begawan`)는 **이 큐에 넣지 않음** — 필요 시 별도 alias 패치.

---

## 라운드 표 (워커A 5 + 워커B 5)

### 완료 (R48–R61)

| R | 워커A (5) | 워커B (5) | 권역 | 상태 |
|---|-----------|-----------|------|------|
| **R48** | `chicago` · `miami` · `seattle` · `boston` · `las-vegas` | `honolulu` · `washington-dc` · `philadelphia` · `denver` · `atlanta` | 미국 | ✅ |
| **R49** | `dallas` · `houston` · `orlando` · `san-diego` · `portland` | `new-orleans` · `austin` · `toronto` · `montreal` · `calgary` | 미+캐나다 | ✅ |
| **R50** | `ottawa` · `quebec-city` · `mexico-city` · `cancun` · `guadalajara` | `oaxaca` · `rio-de-janeiro` · `sao-paulo` · `buenos-aires` · `lima` | 캐나다·멕시코·남미 | ✅ |
| **R51** | `santiago` · `bogota` · `medellin` · `cusco` · `cartagena` | `montevideo` · `beijing` · `shanghai` · `guangzhou` · `chengdu` | 남미·중국 | ✅ |
| **R52** | `xian` · `hangzhou` · `shenzhen` · `nanjing` · `suzhou` | `chongqing` · `macau` · `kaohsiung` · `taichung` · `tainan` | 중국·대만·마카오 | ✅ |
| **R53** | `kuala-lumpur` · `jakarta` · `manila` · `cebu` · `bali` | `penang` · `yogyakarta` · `surabaya` · `krabi` · `siem-reap` | 동남아 | ✅ |
| **R54** | `phnom-penh` · `luang-prabang` · `vientiane` · `yangon` · `kota-kinabalu` | `johor-bahru` · `delhi` · `mumbai` · `bangalore` · `jaipur` | 동남아·인도 | ✅ |
| **R55** | `kolkata` · `chennai` · `hyderabad` · `agra` · `varanasi` | `goa` · `kathmandu` · `colombo` · `male` · `abu-dhabi` | 인도·남아시아·중동 | ✅ |
| **R56** | `doha` · `riyadh` · `jeddah` · `tel-aviv` · `jerusalem` | `amman` · `cairo` · `marrakech` · `casablanca` · `luxor` | 중동·북아프리카 | ✅ |
| **R57** | `alexandria` · `tunis` · `fes` · `muscat` · `cape-town` | `johannesburg` · `nairobi` · `addis-ababa` · `zanzibar` · `brisbane` | 아프리카·오세아니아 | ✅ |
| **R58** | `perth` · `adelaide` · `gold-coast` · `cairns` · `hobart` | `wellington` · `queenstown` · `christchurch` · `rotorua` · `kobe` | 호주·NZ·일본 | ✅ |
| **R59** | `yokohama` · `sendai` · `nara` · `nikko` · `hakone` | `nagasaki` · `matsumoto` · `takayama` · `beppu` · `belgrade` | 일본·동유럽 | ✅ |
| **R60** | `bucharest` · `sofia` · `tirana` · `skopje` · `sarajevo` | `podgorica` · `valletta` · `nicosia` · `stavanger` · `trondheim` | 동유럽·지중해·노르웨이 | ✅ |
| **R61** | `montpellier` · `palermo` · `faro` · `cork` · `galway` | `belfast` · `madeira` · `lahore` · `karachi` · `bandar-seri-begawan` | 유럽·남아시아·브루나이 | ✅ |

### 대기 — P0 사이트 정렬 (R62–R65)

| R | 워커A (5) | 워커B (5) | 권역 | 상태 |
|---|-----------|-----------|------|------|
| **R62** | `hoi-an` · `hue` · `nha-trang` · `phu-quoc` · `sapa` | `boracay` · `palawan` · `el-nido` · `bohol` · `lombok` | 베트남·필리핀·롬복 | ✅ |
| **R63** | `koh-samui` · `langkawi` · `ayutthaya` · `vang-vieng` · `bagan` | `kumamoto` · `hakodate` · `ishigaki` · `miyakojima` · `tsushima` | 동남아·일본 | ✅ |
| **R64** | `guam` · `saipan` · `santorini` · `cappadocia` · `kotor` | `bled` · `ibiza` · `crete` · `havana` · `ulaanbaatar` | 미령·지중해·기타 | ✅ |
| **R65** | `moscow` · `st-petersburg` · `fiji` · `mauritius` · `tahiti` | `bora-bora` · `zermatt` · `cinque-terre` · `bodrum` · `antalya` | 러시아·태평양·알프스·튀르키예 | ✅ |

### 완료 — P1 사전 확보 (R66–R69)

| R | 워커A (5) | 워커B (5) | 권역 | 상태 |
|---|-----------|-----------|------|------|
| **R66** | `qingdao` · `sanya` · `xiamen` · `zhangjiajie` · `guilin` | `lijiang` · `lhasa` · `harbin` · `kunming` · `dalian` | 중국 관광 | ✅ |
| **R67** | `tbilisi` · `yerevan` · `baku` · `almaty` · `tashkent` | `samarkand` · `tehran` · `shiraz` · `isfahan` · `pokhara` | 코카서스·중앙亞·이란·네팔 | ✅ |
| **R68** | `arequipa` · `ushuaia` · `el-calafate` · `quito` · `la-paz` | `panama-city` · `minneapolis` · `tampa` · `maui` · `anchorage` | 남미·미국 | ✅ |
| **R69** | `charleston` · `savannah` · `kampala` · `dar-es-salaam` · `livingstone` | `dhaka` · `islamabad` · `thimphu` · `wuhan` · `dunhuang` | 미·아프리카·남아시아·중국 | ✅ |

**합계**: R48–R69 **220 hub** ✅ (해외만) · **큐 소진**.

### 예비 (EXISTS·스킵 시 1:1 대체)

동남아: `vung-tau` · `ipoh` · `malacca` · `da-lat` · `can-tho` · `sihanoukville` · `pai` · `chiang-rai` EXISTS 시 `hua-hin`  
일본: `naha` EXISTS(`okinawa`) → `beppu` EXISTS · `matsuyama` · `kagoshima` · `nagasaki` EXISTS · `otoineppu` 금지 · `kanazawa` EXISTS → `toyama` · `niigata`  
중국: `zhuhai` · `hualien` · `kenting` · `yangshuo` · `huangshan` · `suzhou` EXISTS → `wuxi` · `ningbo`  
미·캐: `detroit` · `salt-lake-city` · `kansas-city` · `memphis` · `nashville` · `raleigh` · `banff` · `victoria-bc`  
중동·아프리카: `sharjah` · `manama` · `kuwait-city` · `beirut` · `petra` · `aswan` · `essaouira` · `accra` · `lagos`  
기타: `reykjavik` EXISTS → `akureyri` · `tromso` · `bergen` · `innsbruck` · `lucerne` · `interlaken`

### 한 세션 권장

| 컨텍스트 | 라운드 수 | hub |
|----------|-----------|-----|
| 짧게 | R 1개 (워커2) | 10 |
| 기본 세대 | R **2개** 연속 | 20 |
| 여유 시 상한 | R **3~4개** 후 이관 | 30~40 |

이관서에는 **다음에 할 R번호 2개**(또는 표의 다음 ⬜ 두 줄)만 적으면 됨.

### 진행 체크 (에이전트용)

```text
다음 시작: **없음** (R48–R69 큐 소진)
tip: **630 hub / 4390 명소** · audit issues 0 · 미커밋
추가 후임 Task 불필요 · 새 큐 확장 시에만 재개
```

### 다음 세션 제시어

큐 소진. 신규 라운드가 필요하면 `city-attraction-hub-queue.md`에 R70+ 표를 추가한 뒤 `오케스트레이터` + `명소` 로 재개.
