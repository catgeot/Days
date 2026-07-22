# cityAttractionHubs — 사전 배치 큐 (해외 우선)

**상태**: ✅ 2026-07-23 · tip 기준 **550 hub** (R48–R61 소진 · R61 VERIFY) · **다음 ⬜ 없음** 
**규칙**: 라운드 = **10 hub** · 워커A **5** + 워커B **5** · 메인 직렬 머지(A→B) · VERIFY 후 다음 라운드  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) v2.1 · 일지 [`2026-07-23-project-log.md`](./2026-07-23-project-log.md)

### 사용법 (오케스트레이터)

1. 아래 **다음 미완료 라운드**부터 워커 2 기동 (hubId 목록만 전달).  
2. 완료 라운드는 표에서 ✅로 표시(또는 일지에 R번호 VERIFY).  
3. EXISTS/충돌 시 **같은 권역 예비**에서 1:1 대체 후 큐·일지에 1줄.  
4. **금지**: 큐 무시하고 KR 구·DE/UK 중소 임의 추가 · 워커 tip 직접 append.  
5. **문제 시**: [`orchestrator-method.md`](./orchestrator-method.md) **§3.3** (롤백·A/B 실패·중단 체크·스킵·escalate).

### hubId 표기

- 다단어: **하이픈** (`las-vegas`, `kuala-lumpur`) — tip의 `new-york`/`hong-kong`과 동일  
- 이미 tip에 있는 ID는 큐에 **넣지 않음** (`new-york`, `hong-kong`, `los-angeles`, `san-francisco`, `taipei`, `ho-chi-minh`, `vancouver` 등)

---

## 라운드 표 (워커A 5 + 워커B 5)

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

**합계**: 14 라운드 × 10 = **140 hub** 사전 계획 (해외만).

### 예비 (EXISTS·스킵 시 1:1 대체)

`honolulu` 대체: `maui` · `tampa` · `minneapolis` · `detroit` · `salt-lake-city` · `kansas-city` · `memphis` · `charleston` · `savannah` · `anchorage`  
`macau` 대체: `zhuhai` · `hualien` · `kenting`  
동남아 대체: `da-nang` EXISTS→`hoi-an` · `hue` · `nha-trang` · `vung-tau` · `ipoh` · `malacca` · `lombok` · `boracay` · `palawan`  
중동·아프리카 대체: `sharjah` · `manama` · `kuwait-city` · `beirut` · `petra` · `aswan` · `essaouira` · `kampala` · `dar-es-salaam`

### 한 세션 권장

| 컨텍스트 | 라운드 수 | hub |
|----------|-----------|-----|
| 짧게 | R 1개 (워커2) | 10 |
| 기본 세대 | R **2개** 연속 | 20 |
| 여유 시 상한 | R **3~4개** 후 이관 | 30~40 |

이관서에는 **다음에 할 R번호 2개**(또는 표의 다음 ⬜ 두 줄)만 적으면 됨.

### 진행 체크 (에이전트용)

```text
다음 시작: **큐 소진** (R48–R61 전부 ✅)
완료 시: 사람 보고 · 후임 Task 기동 금지 (§3.0)
```
