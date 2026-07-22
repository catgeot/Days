# 2026-07-23 프로젝트 일지

직전: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md)

## cityAttractionHubs — #22~#47 tip 점검·커밋

**상태**: ✅ audit issues 0 · resolve 스모크 PASS · **커밋·push** (`main`)

- 중단 직후 점검: tip **410 hub / 2850 명소** · #47(`chemnitz`…`daedeok`) 완전 반영 · `_batch*`/`_tmp*` 잔여 없음 · #48 미착수
- 구성: 국내 **210** / 해외 **200** (배치당 5:5 유지) · 최근 KR은 광역 **구 단위** 비중 큼(~53) · 해외는 독일·영국 편중(76/200)

### 국내 vs 해외 — 재개 방향 (권고)

| 옵션 | 판단 |
|------|------|
| 국내 구·시군 계속 | ❌ 비권고 — 주요 시군 대부분 커버, 잔여는 구 세분·검색 수요 대비 한계효용↓ |
| **해외 허브 우선** | ✅ **권고** — 미국·중국·동남아·인도·중동·중남미 공백 큼 · DE/UK 중소도시 추가 속도↓ |
| 혼합 5:5 유지 | 보류 — 국내 쪽 후보 품질이 떨어짐 |

**사전 배치 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) — **R48~R61** (14×10=140 hub) · 라운드당 워커A5+워커B5  
- **다음 시작 R48**: A=`chicago`·`miami`·`seattle`·`boston`·`las-vegas` / B=`honolulu`·`washington-dc`·`philadelphia`·`denver`·`atlanta`  
- `new-york`·`hong-kong` 등은 **EXISTS** → 큐에서 제외됨  
- 구 배치안 `muenster`…`bukgu_busan` **보류**

**제시어**: `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R48부터 워커2 · 큐 순서」

상세 배치 이력: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md) #22~#47 절.

## 오케스트레이터 방법 v2 (2026-07-23)

**상태**: ✅ [`orchestrator-method.md`](./orchestrator-method.md) · Rule `gateo-orchestrator.mdc` · project-context · `.ai-context` 4절

- **고정**: 후임 메인 = **워커 2 재기동 → tip 직렬 머지 → 이관** (본인 런·배치마다 이관 금지)
- **재발 방지**: Task만·tip 미append 금지 · 이관서에 **다음 배치표 2개** · 명소 커버리지 §5.1(해외 우선)
- **§3.3 문제 조치**: audit FAIL→부분 제거/롤백 · A/B 비대칭 머지 · 중단 체크리스트 · 재작업/스킵 · 사람 escalate
- #22~#47 퇴화(솔로 계주) 교훈 반영
- **무결성**: 매 라운드 VERIFY PASS tip만 정상 — FAIL을 남긴 채 다음 턴 금지
