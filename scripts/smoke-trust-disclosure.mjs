/**
 * 방문자 개선 #6 — 신뢰 링크 바·Credits 출처·제휴 고지.
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
assert.match(layout, /FooterModal/, 'MainLayout FooterModal 호스트');
assert.match(layout, /FOOTER_MODAL_OPEN_EVENT/, '전역 푸터 이벤트');

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

const checklist = read('src/components/PlaceCard/tabs/planner/components/PreTravelChecklist.jsx');
assert.equal(
  checklist.split("t('place.planner.banners.affiliateBadge')").length - 1,
  4,
  '체크리스트 CTA 제휴 고지 4곳(항공·트립닷컴 숙소·MRT 숙소·픽업)',
);

const widget = read('src/components/PlaceCard/common/WhiteLabelWidget.jsx');
assert.match(widget, /place\.planner\.banners\.affiliateBadge/, 'WhiteLabelWidget 제휴 고지');

const panel = read('src/shared/components/MapboxCreditsPanel.jsx');
assert.match(panel, /credits\.dataSources/, 'Credits 데이터 출처 섹션');
assert.match(panel, /credits\.partners/, 'Credits 제휴 파트너 섹션');

console.log('smoke:trust-disclosure PASS');
