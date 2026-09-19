/**
 * 방문자 개선 #6–#7 — 신뢰 링크 바·Credits 출처·제휴 고지·플래너 3단계.
 *   npm run smoke:trust-disclosure
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GATEO_DATA_SOURCES,
  GATEO_TRAVEL_PARTNERS,
  resolveMapboxAttribution,
} from '../src/data/mapboxAttribution.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const creditsKo = resolveMapboxAttribution('ko');
const creditsEn = resolveMapboxAttribution('en');

assert.equal(GATEO_DATA_SOURCES.length, 4, '데이터 출처 4종');
assert.equal(GATEO_TRAVEL_PARTNERS.length, 4, '제휴 파트너 4종');
assert.match(creditsKo.dataSources.map((item) => item.name).join(' '), /TourAPI/);
assert.match(creditsKo.dataSources.map((item) => item.detail).join(' '), /공공누리/);
assert.ok(creditsKo.dataSources.some((item) => item.name === 'Open-Meteo'));
assert.ok(creditsKo.dataSources.some((item) => item.name === 'Unsplash'));
assert.ok(creditsKo.dataSources.some((item) => item.name === 'Pexels'));
assert.deepEqual(
  creditsKo.partners.map((item) => item.name),
  ['Trip.com', 'Klook', 'GetYourGuide', 'MyRealTrip'],
);
assert.match(creditsEn.dataSources[0].name, /Korea Tourism Organization/);

const layout = read('src/shared/layout/MainLayout.jsx');
assert.match(layout, /TrustLinkBar/, 'MainLayout 신뢰 링크 바');
assert.match(layout, /max-md:hidden/, '홈 모바일은 고정 바 숨김(카테고리 스택으로)');
assert.match(layout, /FooterModal/, 'MainLayout FooterModal 호스트');
assert.match(layout, /FOOTER_MODAL_OPEN_EVENT/, '전역 푸터 이벤트');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert.match(homeUi, /TrustLinkBar variant="stack"/, '모바일 홈 카테고리 스택 위에 신뢰 바');

const bar = read('src/shared/layout/TrustLinkBar.jsx');
assert.match(bar, /openFooterModal\('credits'\)|tab: 'credits'/, '출처 탭 링크');
assert.match(bar, /home\.footerModal\.trustBar/, '신뢰 바 i18n');

const logo = read('src/pages/Home/components/LogoPanel.jsx');
assert.match(logo, /openFooterModal/, '로고 패널이 전역 푸터 이벤트 사용');
assert.doesNotMatch(logo, /from '\.\/FooterModal'/, '로고 패널 FooterModal 이중 마운트 금지');

const planner = read('src/components/PlaceCard/tabs/PlannerTab.jsx');
const noticeIdx = planner.indexOf("t('place.planner.hybridNotice')");
const titleIdx = planner.indexOf("t('place.planner.title')");
const checklistIdx = planner.indexOf('planner-pre-travel-checklist');
const adminIdx = planner.indexOf('planner-admin-force-update');
assert.ok(noticeIdx >= 0, 'hybridNotice 존재');
assert.ok(titleIdx >= 0 && noticeIdx > titleIdx, 'hybridNotice가 플래너 제목 아래');
assert.ok(checklistIdx >= 0 && noticeIdx < checklistIdx, 'hybridNotice가 체크리스트보다 위');
assert.ok(adminIdx >= 0 && noticeIdx < adminIdx, 'hybridNotice가 하단 관리 버튼보다 위');
assert.equal(planner.split("t('place.planner.hybridNotice')").length - 1, 1, 'hybridNotice 1회만');
assert.match(planner, /PlannerStageNav/, '플래너 3단계 네비');
assert.match(planner, /PLANNER_STAGE\.ESSENTIAL/, '1단계 필수');
assert.match(planner, /PLANNER_STAGE\.TRANSFER/, '2단계 이동·통신');
assert.match(planner, /PLANNER_STAGE\.ENJOY/, '3단계 즐기기');
assert.match(planner, /place\.planner\.complexityBadge/, '복잡도 문구 완화');
assert.doesNotMatch(planner, /\/100\)/, '복잡도 90/100 직결 표기 금지');
assert.doesNotMatch(planner, /omitFlightSearchCta/, '항공권 검색 배너는 툴킷에 유지');
assert.match(planner, /omitDuplicateStayCta/, '숙소 툴킷 중복 CTA 생략');
assert.doesNotMatch(planner, /flightBooking=\{/, '항공 위젯을 체크리스트 칸에 넣지 않음');
assert.match(planner, /id="planner-prep-flight-booking"/, '항공 위젯 전체 폭 앵커');
assert.match(planner, /omitFlightBooking/, '체크리스트 항공 CTA 중복 생략');
assert.match(planner, /PlannerPickupCta/, '픽업 CTA는 이동 단계');
assert.match(planner, /place\.planner\.esim\.choose/, '유심 1종 선택');
assert.match(planner, /variant="footer"/, '단계 하단 다음 선택');

const stageNav = read('src/components/PlaceCard/tabs/planner/components/PlannerStageNav.jsx');
assert.match(stageNav, /place\.planner\.stages\.essential/, '단계 라벨 필수');
assert.match(stageNav, /place\.planner\.stages\.transfer/, '단계 라벨 이동·통신');
assert.match(stageNav, /place\.planner\.stages\.enjoy/, '단계 라벨 즐기기');
assert.match(stageNav, /nextHintEssential/, '필수 단계 하단 안내');
assert.match(stageNav, /variant === 'footer'/, '하단 다음 단계 네비');

const focus = read('src/utils/placePlannerFocus.js');
assert.match(focus, /export const PLANNER_STAGE/, '단계 SSOT');
assert.match(focus, /resolvePlannerStageFromFocusId/, 'hash → 단계 매핑');

const checklist = read('src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx');
assert.equal(
  checklist.split("t('place.planner.banners.affiliateBadge')").length - 1,
  4,
  '체크리스트 제휴 고지 4곳(항공 폴백·트립닷컴 숙소·MRT 숙소·픽업)',
);
assert.match(checklist, /export function PlannerPickupCta/, '픽업 CTA 분리 export');
assert.match(checklist, /getKlookAirportTransferUrl/, '픽업 Klook SSOT');

const widget = read('src/components/PlaceCard/common/WhiteLabelWidget.jsx');
assert.match(widget, /place\.planner\.banners\.affiliateBadge/, 'WhiteLabelWidget 제휴 고지');

const panel = read('src/shared/components/MapboxCreditsPanel.jsx');
assert.match(panel, /credits\.dataSources/, 'Credits 데이터 출처 섹션');
assert.match(panel, /credits\.partners/, 'Credits 제휴 파트너 섹션');

const ko = JSON.parse(read('src/i18n/locales/ko.json'));
const en = JSON.parse(read('src/i18n/locales/en.json'));
assert.equal(ko.place.planner.stages.essential, '필수');
assert.equal(en.place.planner.stages.essential, 'Essentials');
assert.ok(ko.place.planner.complexityBadge);
assert.ok(en.place.planner.complexityHint);
assert.match(ko.place.planner.stages.nextHintEssential, /다음 단계/);
assert.ok(en.place.planner.stages.nextHintEssential);

console.log('smoke:trust-disclosure PASS');
