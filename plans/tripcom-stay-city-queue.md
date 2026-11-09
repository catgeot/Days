# 트립닷컴 숙소 도시 — 오케스트레이터 큐

**상태**: 2026-11-07 · **#11 큐 종료** · R01–R18 ✅ · 미연결 16 = 보류·sparse · **다음 ⬜ 없음 · 재개 금지**
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) §5.8 · 점검 [`tripcom-stay-city-audit.md`](./tripcom-stay-city-audit.md)
**브랜치**: `cursor/tripcom-stay-cities-de61` · R17–R18 PR [#692](https://github.com/catgeot/Days/pull/692) 병합 `36f9733e` · R15–R16 PR [#690](https://github.com/catgeot/Days/pull/690) 병합 · R13–R14 PR [#688](https://github.com/catgeot/Days/pull/688) 병합 · R11–R12 PR [#686](https://github.com/catgeot/Days/pull/686) 병합 · R09–R10 PR [#677](https://github.com/catgeot/Days/pull/677) 병합 · R05–R08 PR [#672](https://github.com/catgeot/Days/pull/672) 병합 · R03–R04 PR [#665](https://github.com/catgeot/Days/pull/665) 병합 · 배치 1 PR [#664](https://github.com/catgeot/Days/pull/664) 병합됨

### 가드

- 큐는 #11에서 종료했다. ⬜가 없다. 새 라운드·워커 배정 금지. 220곳을 한 세션에서 라이브로 보지 않는다.
- 워커 2 · 슬롯 6 · tip(`affiliate.js` city ID)은 지휘자가 직렬로만 넣는다. 워커 커밋 금지.
- PASS: `https://kr.trip.com/hotels/w/list?city=` 의 `destinationInputValue`가 비어 있지 않고, 잡힌 도시·주·나라가 그 여행지다. `/hotels/list`는 404. 키워드는 `POST /restapi/soa2/16709/json/gaHotelSearchEngine`. 관문 도시(나하·삿포로·호놀룰루형)는 그 섬·권역 안일 때만.
- 거절: 키워드 첫 행, type Province·Hotel·Markland, cityId `-1`·`0`·`10279`, 다른 나라 동명.
- **재시도 금지**: `honolulu`(757로 묶지 않음) · `raja-ampat`(와이사이는 서파푸아) · `rocky-mountains` · `sequoia-national-park` · `similan-islands` · `st-helena` · `ubud`(723은 발리). sparse는 city를 새로 단정하지 않음. 라운드 R01–R18은 끝났다. 새 R을 만들지 않는다.
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
| `rocky-mountains` | 미국 로키 IntlCity·허용 Zone 없음. 밴프 7725·덴버로 바꾸지 않음 |
| `sequoia-national-park` | 공원·스리리버스가 Markland. IntlCity 없음. 요세미티 346626로 바꾸지 않음 |
| `similan-islands` | 시미란·카오락 IntlCity 없음. 푸켓 725로 바꾸지 않음 |
| `st-helena` | 영국령 IntlCity 없음. 다른 나라 세인트헬레나로 바꾸지 않음 |
| `ubud` | 우붓 IntlCity 없음. 발리 723·덴파사르·쿠타로 바꾸지 않음 |

## 라운드

| R | 워커A | 워커B | 상태 |
|---|---|---|---|
| **R01** | `guam` · `maldives` · `seychelles` · `palawan` · `canary-islands` · `galapagos` | `mauritius` · `zanzibar` · `new-caledonia` · `saipan` · `okinawa` · `hokkaido` | ✅ 12 |
| **R02** | `phuket` · `boracay` · `cebu` · `crete` · `sicily` · `madeira` | `bahamas` · `cape-verde` · `la-reunion` · `uyuni-salt-flat` · `komodo-island` | ✅ 11 · `raja-ampat` 보류 |
| **R03** | `tokyo` · `osaka` · `singapore` · `bangkok` · `paris` · `new-york` | `sydney` · `seoul` · `jeju` · `seogwipo` | ✅ 10 |
| **R04** | `abu-simbel` · `aconcagua` · `alaska` · `alice-springs` · `amazon-rainforest` · `amsterdam` | `andaman-islands` · `angkor-thom` · `angkor-wat` · `annapurna-circuit` · `arequipa` · `athens` | ✅ 12 |
| **R05** | `auckland` · `ayutthaya` · `bagan` · `banff-national-park` · `barcelona` · `berlin` | `bodrum` · `bohol` · `borobudur` · `boston` · `brisbane` · `brunei` | ✅ 12 |
| **R06** | `brussels` · `budapest` · `buenos-aires` · `cairo` · `cancun` · `cape-town` | `cappadocia` · `carstensz-pyramid` · `chiang-mai` · `chicago` · `cinque-terre` · `copenhagen` | ✅ 12 |
| **R07** | `costa-rica` · `cusco` · `da-nang` · `delhi` · `denali` · `dolomites` | `dubai` · `dublin` · `dubrovnik` · `dunhuang` · `easter-island` · `edinburgh` | ✅ 12 |
| **R08** | `el-calafate` · `el-nido` · `ephesus` · `fernando-de-noronha` · `fez` · `fiordland` | `florence` · `forbidden-city` · `fukuoka` · `geneva` · `gili-meno` · `giza-pyramids` | ✅ 12 |
| **R09** | `gold-coast` · `grand-canyon` · `great-barrier-reef` · `great-wall` · `halong-bay` · `hamburg` | `hampi` · `hanoi` · `helsinki` · `hoi-an` · `hue` · `hvar` | ✅ 12 |
| **R10** | `ibiza` · `iguazu-falls` · `inca-trail` · `ishigaki` · `jaipur` · `jakarta` | `jerusalem` · `kala-patthar` · `kanazawa` · `kilimanjaro` · `kobe` · `koh-samui` | ✅ 12 |
| **R11** | `kota-kinabalu` · `kotor` · `krabi` · `kuala-lumpur` · `kumamoto` · `kyoto` | `la-spezia` · `lalibela` · `langkawi` · `las-vegas` · `lhasa` · `lisbon` | ✅ 12 |
| **R12** | `lofoten` · `london` · `los-angeles` · `luang-prabang` · `luxor` · `machu-picchu` | `madagascar` · `madrid` · `manila` · `marrakech` · `melbourne` · `meteora` | ✅ 12 |
| **R13** | `miami` · `milan` · `minneapolis` · `miyakojima` · `mont-blanc` · `montreal` | `mount-bromo` · `mount-fuji` · `munich` · `nagasaki` · `nairobi` · `nara` | ✅ 12 |
| **R14** | `nazca-lines` · `nha-trang` · `oslo` · `patagonia` · `perth` · `petra` | `phi-phi-islands` · `philadelphia` · `phu-quoc` · `plitvice-lakes` · `porto` · `prague` | ✅ 12 |
| **R15** | `qingdao` · `queenstown` · `reykjavik` · `rio-de-janeiro` · `rocky-mountains` · `rome` | `sabah` · `sahara-desert` · `san-diego` · `san-francisco` · `sant-joan` · `santiago-de-compostela` | ✅ 11 · `rocky-mountains` 보류 |
| **R16** | `santorini` · `sapa` · `sapporo` · `seattle` · `sequoia-national-park` · `serengeti` | `seville` · `shanghai` · `similan-islands` · `sri-jayawardenapura` · `st-helena` · `stockholm` | ✅ 9 · `sequoia-national-park` · `similan-islands` · `st-helena` 보류 |
| **R17** | `taipei` · `taj-mahal` · `terracotta-army` · `toronto` · `ubud` · `ulaanbaatar` | `ushuaia` · `vancouver` · `vang-vieng` · `varanasi` · `venice` · `victoria-falls` | ✅ 11 · `ubud` 보류 |
| **R18** | `vienna` · `vientiane` · `wadi-rum` · `warsaw` · `washington-dc` · `yellowknife` | `yokohama` · `zagreb` · `zermatt` · `zhangjiajie` · `zurich` | ✅ 11 |

라이브 라운드는 R18에서 끝. 남은 미연결은 보류·sparse뿐. R17 관문: 타이베이는 617(목록 도시는 타이베이, 나라는 중국·HMT), 타지마할은 아그라 3318, 병마용은 시안 10, 빅토리아 폭포는 리빙스턴 7388(짐바브웨 아님). 우붓은 보류. R18 관문: 빈은 비엔나 651, 비엔티안은 비엔티엔 486, 와디 럼은 와디럼 42662(페트라 19741 아님), 장가계는 장자제 27, 요코하마는 271(도쿄 아님). R15 관문: 레이캬비크는 아이슬란드와 831, 사바는 코타키나발루 1393, 사하라는 메르주가 36267(마라케시 1360 아님). 로키 산맥은 보류. R16 관문: 삿포로는 홋카이도와 641, 세렝게티는 세렝게티 7704(나이로비 아님), 상하이는 type City 2. 시퀘이아·시미란·세인트헬레나는 보류. R09 관문: 배리어리프는 케언스, 만리장성은 베이징(자금성과 1·type City), 하롱은 할롱, 호이안은 Zone 1775(목록이 호이안). R10 관문: 이구아수는 푸에르토 이구아수, 잉카 트레일은 올란타이탐보(쿠스코 813 아님), 칼라파타르는 남체, 킬리만자로는 모시. R11 관문: 코타키나발루는 보르네오와 1393, 라싸는 라싸·티베트(type City), 크라비는 끄라비 타운. R12 관문: 로포텐은 스볼바르, 마추픽추는 마추 픽추 타운 3720(쿠스코 813 아님), 마다가스카르는 안타나나리보, 메테오라는 테살리아 IntlCity. R13 관문: 몽블랑은 샤모니 25382, 브로모는 슈카푸라 711041, 후지산은 후지카와구치코 50160, 미야코지마는 나하가 아님. R14 관문: 나스카 라인은 나스카 9997, 북부 파타고니아는 바릴로체 4843(엘칼라파테 6767 아님), 페트라는 와디무사 19741, 피피는 피피섬 1228, 플리트비체는 호수 마을 113090.
