# 트립닷컴 숙소 도시 — 오케스트레이터 큐

**상태**: 2026-11-06 · R01–R06 ✅ (69 연결 · 라자 암팟 보류) · **다음 ⬜ R07**
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) §5.8 · 점검 [`tripcom-stay-city-audit.md`](./tripcom-stay-city-audit.md)
**브랜치**: `cursor/tripcom-stay-cities-de61` · R05–R06 PR [#672](https://github.com/catgeot/Days/pull/672) · R03–R04 PR [#665](https://github.com/catgeot/Days/pull/665) 병합 · 배치 1 PR [#664](https://github.com/catgeot/Days/pull/664) 병합됨

### 가드

- 한 세션은 **다음 ⬜ 부터 라운드 2개**만. 220곳을 한 세션에서 라이브로 보지 않는다.
- 워커 2 · 슬롯 6 · tip(`affiliate.js` city ID)은 지휘자가 직렬로만 넣는다. 워커 커밋 금지.
- PASS: `kr.trip.com/hotels/list?city=` 의 `destinationInputValue`가 비어 있지 않고, 잡힌 도시·주·나라가 그 여행지다. 관문 도시(나하·삿포로·호놀룰루형)는 그 섬·권역 안일 때만.
- 거절: 키워드 첫 행, type Province·Hotel·Markland, cityId `-1`·`0`·`10279`, 다른 나라 동명.
- **재시도 금지**: `honolulu`(757로 묶지 않음) · `raja-ampat`(와이사이는 서파푸아). sparse는 city를 새로 단정하지 않음.
- city ID를 넣으면 `[@지역@]` 없는 플래너 숙소 버튼이 트립닷컴으로 바뀐다. 일지에 적고, 맞는 곳만 넣는다.
- VERIFY: `node scripts/audit-tripcom-stay-cities.mjs`

### 보류·제외 (워커 배정 금지)

| slug | 이유 |
|---|---|
| `raja-ampat` | 와이사이 87669는 서파푸아. 라자 암팟 IntlCity 없음 |
| `honolulu` | 하와이 카드만 757. 이 slug에 같은 ID를 넣지 않음 |
| `antarctica` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `christmas-island` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `chuuk` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `diego-garcia` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `kerguelen-islands` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `midway-atoll` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `persepolis` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `pitcairn-islands` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |
| `timbuktu` | sparse. 재고 없음·오매핑이라 city를 새로 단정하지 않음 |

## 라운드

| R | 워커A | 워커B | 상태 |
|---|---|---|---|
| **R01** | `guam` · `maldives` · `seychelles` · `palawan` · `canary-islands` · `galapagos` | `mauritius` · `zanzibar` · `new-caledonia` · `saipan` · `okinawa` · `hokkaido` | ✅ 12 |
| **R02** | `phuket` · `boracay` · `cebu` · `crete` · `sicily` · `madeira` | `bahamas` · `cape-verde` · `la-reunion` · `uyuni-salt-flat` · `komodo-island` | ✅ 11 · `raja-ampat` 보류 |
| **R03** | `tokyo` · `osaka` · `singapore` · `bangkok` · `paris` · `new-york` | `sydney` · `seoul` · `jeju` · `seogwipo` | ✅ 10 |
| **R04** | `abu-simbel` · `aconcagua` · `alaska` · `alice-springs` · `amazon-rainforest` · `amsterdam` | `andaman-islands` · `angkor-thom` · `angkor-wat` · `annapurna-circuit` · `arequipa` · `athens` | ✅ 12 |
| **R05** | `auckland` · `ayutthaya` · `bagan` · `banff-national-park` · `barcelona` · `berlin` | `bodrum` · `bohol` · `borobudur` · `boston` · `brisbane` · `brunei` | ✅ 12 |
| **R06** | `brussels` · `budapest` · `buenos-aires` · `cairo` · `cancun` · `cape-town` | `cappadocia` · `carstensz-pyramid` · `chiang-mai` · `chicago` · `cinque-terre` · `copenhagen` | ✅ 12 |
| **R07** | `costa-rica` · `cusco` · `da-nang` · `delhi` · `denali` · `dolomites` | `dubai` · `dublin` · `dubrovnik` · `dunhuang` · `easter-island` · `edinburgh` | ⬜ 다음 |
| **R08** | `el-calafate` · `el-nido` · `ephesus` · `fernando-de-noronha` · `fez` · `fiordland` | `florence` · `forbidden-city` · `fukuoka` · `geneva` · `gili-meno` · `giza-pyramids` | ⬜ |
| **R09** | `gold-coast` · `grand-canyon` · `great-barrier-reef` · `great-wall` · `halong-bay` · `hamburg` | `hampi` · `hanoi` · `helsinki` · `hoi-an` · `hue` · `hvar` | ⬜ |
| **R10** | `ibiza` · `iguazu-falls` · `inca-trail` · `ishigaki` · `jaipur` · `jakarta` | `jerusalem` · `kala-patthar` · `kanazawa` · `kilimanjaro` · `kobe` · `koh-samui` | ⬜ |
| **R11** | `kota-kinabalu` · `kotor` · `krabi` · `kuala-lumpur` · `kumamoto` · `kyoto` | `la-spezia` · `lalibela` · `langkawi` · `las-vegas` · `lhasa` · `lisbon` | ⬜ |
| **R12** | `lofoten` · `london` · `los-angeles` · `luang-prabang` · `luxor` · `machu-picchu` | `madagascar` · `madrid` · `manila` · `marrakech` · `melbourne` · `meteora` | ⬜ |
| **R13** | `miami` · `milan` · `minneapolis` · `miyakojima` · `mont-blanc` · `montreal` | `mount-bromo` · `mount-fuji` · `munich` · `nagasaki` · `nairobi` · `nara` | ⬜ |
| **R14** | `nazca-lines` · `nha-trang` · `oslo` · `patagonia` · `perth` · `petra` | `phi-phi-islands` · `philadelphia` · `phu-quoc` · `plitvice-lakes` · `porto` · `prague` | ⬜ |
| **R15** | `qingdao` · `queenstown` · `reykjavik` · `rio-de-janeiro` · `rocky-mountains` · `rome` | `sabah` · `sahara-desert` · `san-diego` · `san-francisco` · `sant-joan` · `santiago-de-compostela` | ⬜ |
| **R16** | `santorini` · `sapa` · `sapporo` · `seattle` · `sequoia-national-park` · `serengeti` | `seville` · `shanghai` · `similan-islands` · `sri-jayawardenapura` · `st-helena` · `stockholm` | ⬜ |
| **R17** | `taipei` · `taj-mahal` · `terracotta-army` · `toronto` · `ubud` · `ulaanbaatar` | `ushuaia` · `vancouver` · `vang-vieng` · `varanasi` · `venice` · `victoria-falls` | ⬜ |
| **R18** | `vienna` · `vientiane` · `wadi-rum` · `warsaw` · `washington-dc` · `yellowknife` | `yokohama` · `zagreb` · `zermatt` · `zhangjiajie` · `zurich` | ⬜ |

나머지 라이브 대상 143곳 · 라운드 R07–R18. R06 관문: 밴프는 앨버타 밴프, 브루나이는 반다르세리베가완, 카파도키아는 괴레메, 카르스텐츠는 파푸아 티미카, 친퀘테레는 몬테로소알마레(라스페치아 아님).
