## 변경 요약
-

## 사이트 건강 점검 (기능을 추가·변경했다면 필수)
- [ ] 영향 기능 (plans/site-health-monitoring-plan.md 기능 지도 #): 
- [ ] 해당 E2E spec / smoke probe / data-health 항목을 이 PR에서 추가·갱신했다 (파일: )
- [ ] 보이는 문구(버튼·탭·라벨)를 바꿨다면 spec의 getByRole name 등 기대값도 이 PR에서 맞췄다
- [ ] 새 Edge 호출이 있으면 `e2e/readOnlyGuard.js` 허용 목록(쓰기 없음)을 확인했다
- [ ] 점검이 Gemini·YouTube Data API를 쓰지 않는다 (mock·캐시 읽기). 예외: 승인된 MOONi health_ping 하루 1회
- [ ] 외부 재고(MRT 등) 개수를 하드코딩하지 않았다 (로딩 종료 + ≥1 또는 명시적 빈 상태)
- [ ] 사용량·호출량 수치를 로그·요약·이슈에 출력하지 않는다 (상태만)
- [ ] 로컬 확인: `SMOKE_SITE_URL=https://www.gateo.kr/ npx playwright test <spec>`
- [ ] 점검이 필요 없는 변경이다 → 사유: (라벨 `health-check-exempt`)
