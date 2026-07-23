# mapboxSettlementPlaces — 사전 배치 큐 (hubId 순서)

**상태**: 2026-07-23 · Phase 0 시드(`sokcho`/`paris`) ✅ · R01–R46 ✅ · **다음 시작 R47**
**규칙**: 라운드 = 최대 **10 hub** · 워커A **5** + 워커B **5** (마지막 R은 잔여) · tip 직렬 A→B · VERIFY 후 다음 R
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) §5.3 · 계획 [`mapbox-settlement-plan.md`](./mapbox-settlement-plan.md)

### 가드

- `place` / `city` / `locality` only · POI·명소 금지 (`cityAttractionHubs` 담당)
- **목표 3 · 최대 5 · 최소 2** · 미달(&lt;2)이면 그 hub **스킵** (억지 채우기 금지)
- hub당 **1행만** · 같은 hubId 분할 append 금지 · `mapboxId` 1차 null OK
- 큐 = tip `cityAttractionHubs` **hubId 순서**(시드 제외). hub 밖 임의 지명 금지
- 기본 **미커밋** · commit은 사람 요청 시

### 사용법

1. 아래 **다음 미완료 라운드**부터 워커 2 기동 (hubId 목록만).
2. 완료 R은 ✅ · 일지에 VERIFY·skip/partial.
3. EXISTS(이미 tip에 hub 행) → 스킵 · 순번 당김 금지.
4. 문제 시 method **§3.3** · 계획서 문제 절차.

### R00 시드 (완료 · 워커 배정 금지)

| R | hubId | 상태 |
|---|-------|------|
| **R00** | `sokcho` · `paris` | ✅ Phase 0 |

---

## 라운드 표

| R | 워커A | 워커B | 상태 |
|---|-------|-------|------|
| **R01** | `seoul` · `busan` · `jeju` · `seogwipo` · `incheon` | `daegu` · `gwangju` · `daejeon` · `ulsan` · `yeosu` | ✅ |
| **R02** | `gyeongju` · `gangneung` · `jeonju` · `tongyeong` · `tokyo` | `osaka` · `kyoto` · `bangkok` · `taipei` · `singapore` | ✅ |
| **R03** | `hong-kong` · `rome` · `london` · `new-york` · `fukuoka` | `hanoi` · `okinawa` · `ho-chi-minh` · `pohang` · `chuncheon` | ✅ |
| **R04** | `sydney` · `dubai` · `pyeongchang` · `yangyang` · `namhae` | `andong` · `boryeong` · `suncheon` · `melbourne` · `auckland` | ✅ |
| **R05** | `istanbul` · `danang` · `mokpo` · `jinju` · `geoje` | `gunsan` · `damyang` · `suwon` · `barcelona` · `vancouver` | ✅ |
| **R06** | `phuket` · `chiang-mai` · `cheongju` · `taean` · `ulleung` | `ganghwa` · `gapyeong` · `gongju` · `prague` · `amsterdam` | ✅ |
| **R07** | `los-angeles` · `san-francisco` · `chiang-rai` · `paju` · `buyeo` | `goseong` · `inje` · `boseong` · `madrid` · `berlin` | ✅ |
| **R08** | `florence` · `vienna` · `munich` · `hadong` · `jecheon` | `mungyeong` · `danyang` · `yeongwol` · `lisbon` · `budapest` | ✅ |
| **R09** | `athens` · `zurich` · `edinburgh` · `namwon` · `geochang` | `wando` · `jindo` · `yeongju` · `seville` · `porto` | ✅ |
| **R10** | `brussels` · `copenhagen` · `dublin` · `hamyang` · `sancheong` | `goheung` · `jangheung` · `gurye` · `stockholm` · `helsinki` | ✅ |
| **R11** | `oslo` · `warsaw` · `hapcheon` · `gokseong` · `yeonggwang` | `milan` · `buan` · `gochang` · `reykjavik` · `geneva` | ✅ |
| **R12** | `krakow` · `venice` · `nice` · `muju` · `jinan` | `imsil` · `sunchang` · `jangsu` · `cologne` · `naples` | ✅ |
| **R13** | `valencia` · `marseille` · `lyon` · `jeongeup` · `gimje` | `iksan` · `wanju` · `haenam` · `hamburg` · `bratislava` | ✅ |
| **R14** | `zagreb` · `salzburg` · `bordeaux` · `muan` · `yeongam` | `gangjin` · `jangseong` · `hampyeong` · `glasgow` · `antwerp` | ✅ |
| **R15** | `rotterdam` · `bilbao` · `innsbruck` · `sinan` · `naju` | `hwasun` · `gwangyang` · `wonju` · `frankfurt` · `turin` | ✅ |
| **R16** | `ghent` · `dubrovnik` · `sapporo` · `chungju` · `cheonan` | `samcheok` · `yangpyeong` · `gimhae` · `manchester` · `toulouse` | ✅ |
| **R17** | `granada` · `hiroshima` · `tallinn` · `taebaek` · `donghae` | `asan` · `seosan` · `changwon` · `liverpool` · `malaga` | ✅ |
| **R18** | `nuremberg` · `kanazawa` · `ljubljana` · `hongcheon` · `jeongseon` | `uljin` · `icheon` · `miryang` · `birmingham` · `genoa` | ✅ |
| **R19** | `bologna` · `bergen` · `vilnius` · `hoengseong` · `yeoju` | `yangsan` · `sacheon` · `pocheon` · `cardiff` · `strasbourg` | ✅ |
| **R20** | `verona` · `nagoya` · `riga` · `boeun` · `okcheon` | `yeongdeok` · `cheongsong` · `yanggu` · `leeds` · `padua` | ✅ |
| **R21** | `split` · `luxembourg` · `gothenburg` · `hwacheon` · `cheorwon` | `yeongyang` · `bonghwa` · `uiseong` · `newcastle` · `bari` | ✅ |
| **R22** | `zadar` · `bruges` · `malmo` · `goesan` · `jincheon` | `eumseong` · `yecheon` · `sangju` · `sheffield` · `trier` | ✅ |
| **R23** | `pula` · `aarhus` · `linz` · `yeoncheon` · `anseong` | `pyeongtaek` · `osan` · `guri` · `bristol` · `aachen` | ✅ |
| **R24** | `sibenik` · `odense` · `graz` · `namyangju` · `hanam` | `uijeongbu` · `anyang` · `gunpo` · `nottingham` · `wroclaw` | ✅ |
| **R25** | `rovinj` · `tampere` · `klagenfurt` · `bucheon` · `gwacheon` | `siheung` · `gimpo` · `goyang` · `brighton` · `gdansk` | ✅ |
| **R26** | `porec` · `turku` · `villach` · `yangju` · `dongducheon` | `gwangmyeong` · `uiwang` · `ansan` · `swansea` · `poznan` | ✅ |
| **R27** | `oulu` · `bregenz` · `leipzig` · `seongnam` · `yongin` | `hwaseong` · `gimcheon` · `dangjin` · `exeter` · `lodz` | ✅ |
| **R28** | `kuopio` · `dresden` · `rijeka` · `nonsan` · `gyeryong` | `seocheon` · `hongseong` · `gumi` · `plymouth` · `katowice` | ✅ |
| **R29** | `jyvaskyla` · `bremen` · `osijek` · `yesan` · `cheongyang` | `yeongdong` · `chilgok` · `gyeongsan` · `southampton` · `bydgoszcz` | ✅ |
| **R30** | `lahti` · `hannover` · `varazdin` · `geumsan` · `goryeong` | `seongju` · `gunwi` · `uiryeong` · `portsmouth` · `lublin` | ✅ |
| **R31** | `joensuu` · `kiel` · `karlovac` · `yeongi` · `changnyeong` | `haman` · `yeongcheon` · `cheongdo` · `bath` · `szczecin` | ✅ |
| **R32** | `pori` · `lubeck` · `opatija` · `sejong` · `jeungpyeong` | `goseongnam` · `ongjin` · `gwangju_gi` · `york` · `canterbury` | ✅ |
| **R33** | `chester` · `rostock` · `gdynia` · `gijang` · `ulju` | `dalseong` · `yuseong` · `yeonsu` · `cambridge` · `oxford` | ✅ |
| **R34** | `sopot` · `stralsund` · `wismar` · `suseong` · `dalseo` | `haeundae` · `gangnam` · `seocho` · `durham` · `winchester` | ✅ |
| **R35** | `salisbury` · `greifswald` · `schwerin` · `mapo` · `yongsan` | `songpa` · `suyeong` · `gwanak` · `norwich` · `potsdam` | ✅ |
| **R36** | `weimar` · `bamberg` · `regensburg` · `jongno` · `seodaemun` | `dongjak` · `yeongdeungpo` · `gangdong` · `ipswich` · `colchester` | ✅ |
| **R37** | `cheltenham` · `heidelberg` · `passau` · `gangseo` · `guro` | `geumcheon` · `nowon` · `dobong` · `leicester` · `coventry` | ✅ |
| **R38** | `reading` · `freiburg` · `augsburg` · `yangcheon` · `eunpyeong` | `seongbuk` · `seongdong` · `gwangjin` · `derby` · `mannheim` | ✅ |
| **R39** | `karlsruhe` · `ulm` · `erfurt` · `jungnang` · `dongdaemun` | `junggu` · `gangbuk` · `bupyeong` · `stuttgart` · `bonn` | ✅ |
| **R40** | `wiesbaden` · `mainz` · `magdeburg` · `busanjin` · `namdong` | `gyeyang` · `michuhol` · `dongnae` · `chemnitz` · `saarbrucken` | ✅ |
| **R41** | `kassel` · `dortmund` · `wuerzburg` · `geumjeong` · `yeonje` | `saha` · `sasang` · `daedeok` · `chicago` · `miami` | ✅ |
| **R42** | `seattle` · `boston` · `las-vegas` · `honolulu` · `washington-dc` | `philadelphia` · `denver` · `atlanta` · `dallas` · `houston` | ✅ |
| **R43** | `orlando` · `san-diego` · `portland` · `new-orleans` · `austin` | `toronto` · `montreal` · `calgary` · `ottawa` · `quebec-city` | ✅ |
| **R44** | `mexico-city` · `cancun` · `guadalajara` · `oaxaca` · `rio-de-janeiro` | `sao-paulo` · `buenos-aires` · `lima` · `santiago` · `bogota` | ✅ |
| **R45** | `medellin` · `cusco` · `cartagena` · `montevideo` · `beijing` | `shanghai` · `guangzhou` · `chengdu` · `xian` · `hangzhou` | ✅ |
| **R46** | `shenzhen` · `nanjing` · `suzhou` · `chongqing` · `macau` | `kaohsiung` · `taichung` · `tainan` · `kuala-lumpur` · `jakarta` | ✅ |
| **R47** | `manila` · `cebu` · `bali` · `penang` · `yogyakarta` | `surabaya` · `krabi` · `siem-reap` · `phnom-penh` · `luang-prabang` | ⬜ |
| **R48** | `vientiane` · `yangon` · `kota-kinabalu` · `johor-bahru` · `delhi` | `mumbai` · `bangalore` · `jaipur` · `kolkata` · `chennai` | ⬜ |
| **R49** | `hyderabad` · `agra` · `varanasi` · `goa` · `kathmandu` | `colombo` · `male` · `abu-dhabi` · `doha` · `riyadh` | ⬜ |
| **R50** | `jeddah` · `tel-aviv` · `jerusalem` · `amman` · `cairo` | `marrakech` · `casablanca` · `luxor` · `alexandria` · `tunis` | ⬜ |
| **R51** | `fes` · `muscat` · `cape-town` · `johannesburg` · `nairobi` | `addis-ababa` · `zanzibar` · `brisbane` · `perth` · `adelaide` | ⬜ |
| **R52** | `gold-coast` · `cairns` · `hobart` · `wellington` · `queenstown` | `christchurch` · `rotorua` · `kobe` · `yokohama` · `sendai` | ⬜ |
| **R53** | `nara` · `nikko` · `hakone` · `nagasaki` · `matsumoto` | `takayama` · `beppu` · `belgrade` · `bucharest` · `sofia` | ⬜ |
| **R54** | `tirana` · `skopje` · `sarajevo` · `podgorica` · `valletta` | `nicosia` · `stavanger` · `trondheim` · `montpellier` · `palermo` | ⬜ |
| **R55** | `faro` · `cork` · `galway` · `belfast` · `madeira` | `lahore` · `karachi` · `bandar-seri-begawan` · `hoi-an` · `hue` | ⬜ |
| **R56** | `nha-trang` · `phu-quoc` · `sapa` · `boracay` · `palawan` | `el-nido` · `bohol` · `lombok` · `koh-samui` · `langkawi` | ⬜ |
| **R57** | `ayutthaya` · `vang-vieng` · `bagan` · `kumamoto` · `hakodate` | `ishigaki` · `miyakojima` · `tsushima` · `guam` · `saipan` | ⬜ |
| **R58** | `santorini` · `cappadocia` · `kotor` · `bled` · `ibiza` | `crete` · `havana` · `ulaanbaatar` · `moscow` · `st-petersburg` | ⬜ |
| **R59** | `fiji` · `mauritius` · `tahiti` · `bora-bora` · `zermatt` | `cinque-terre` · `bodrum` · `antalya` · `qingdao` · `sanya` | ⬜ |
| **R60** | `xiamen` · `zhangjiajie` · `guilin` · `lijiang` · `lhasa` | `harbin` · `kunming` · `dalian` · `tbilisi` · `yerevan` | ⬜ |
| **R61** | `baku` · `almaty` · `tashkent` · `samarkand` · `tehran` | `shiraz` · `isfahan` · `pokhara` · `arequipa` · `ushuaia` | ⬜ |
| **R62** | `el-calafate` · `quito` · `la-paz` · `panama-city` · `minneapolis` | `tampa` · `maui` · `anchorage` · `charleston` · `savannah` | ⬜ |
| **R63** | `kampala` · `dar-es-salaam` · `livingstone` · `dhaka` · `islamabad` | `thimphu` · `wuhan` · `dunhuang` | ⬜ |

**합계**: R01–R63 · **628 hub** (시드 2 제외 · tip 630 기준)

### 진행 체크

```text
다음 시작: **R47**
tip: 462 hub / 1384 settlements · audit issues 0 · 미커밋
제시어: 오케스트레이터 + 맵박스정착지 + @plans/mapbox-settlement-queue.md
```

