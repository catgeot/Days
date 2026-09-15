/**
 * 방문자 개선 #8 — 언어 일관성·가입 혜택·접근성/지구본 모션.
 *   npm run smoke:visitor-locale
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getLocalizedPlaceDesc,
  getLocalizedPlaceKeywords,
  isPlaceDescKoreanOnly,
} from '../src/pages/Home/lib/placeSeoText.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const koreanSpot = {
  slug: 'smoke-korean-only-spot',
  name: '테스트섬',
  name_en: 'Test Island',
  country: '대한민국',
  country_en: 'South Korea',
  desc: '한글로만 적힌 여행지 소개입니다.',
  keywords: ['섬', '휴양'],
  primaryCategory: 'paradise',
};

assert.equal(isPlaceDescKoreanOnly(koreanSpot), true, '한글 desc + EN 오버라이드 없음');
assert.match(getLocalizedPlaceDesc(koreanSpot, 'en'), /Discover Test Island/);
assert.ok(getLocalizedPlaceKeywords(koreanSpot, 'en').includes('South Korea'));
assert.equal(getLocalizedPlaceDesc(koreanSpot, 'ko'), koreanSpot.desc);

const expanded = read('src/components/PlaceCard/modes/PlaceCardExpanded.jsx');
assert.match(expanded, /getLocalizedPlaceDesc/, 'PlaceCardExpanded desc 로컬라이징');
assert.match(expanded, /getLocalizedPlaceKeywords/, 'PlaceCardExpanded keywords 로컬라이징');
assert.match(expanded, /isPlaceDescKoreanOnly/, '한글 본문 안내 칩 조건');
assert.doesNotMatch(expanded, /location\.desc \|\| location\.description/, 'raw desc 직접 참조 금지');

const gallery = read('src/components/PlaceCard/views/GalleryInfoView.jsx');
assert.match(gallery, /place\.localeNotice\.koreanGuide/, '갤러리 개요 영문 안내 칩');
assert.match(gallery, /getLocalizedPlaceKeywords/, '갤러리 태그 로컬라이징');
assert.match(gallery, /place\.overview\.fromQuery/, '큐레이션 쿼리 문구 i18n');

const login = read('src/shared/Auth/Login.jsx');
const signup = read('src/shared/Auth/SignUp.jsx');
assert.match(login, /AuthBenefits/, '로그인 4대 혜택');
assert.match(signup, /AuthBenefits/, '회원가입 4대 혜택');

const benefits = read('src/shared/Auth/AuthBenefits.jsx');
assert.match(benefits, /key: 'bucket'/, '버킷리스트 혜택');
assert.match(benefits, /key: 'logbook'/, '로그북 혜택');
assert.match(benefits, /key: 'ai'/, 'AI 도슨트 혜택');
assert.match(benefits, /key: 'planner'/, '플래너 혜택');
assert.match(benefits, /authPage\.benefits\.\$\{key\}/, '혜택 i18n 키');

const homeUi = read('src/pages/Home/components/HomeUI.jsx');
assert.match(homeUi, /layout\.nav\.login/, 'LOGIN i18n');
assert.match(homeUi, /layout\.nav\.logout/, 'LOGOUT i18n');
assert.match(homeUi, /layout\.nav\.logbook/, 'LOGBOOK i18n');
assert.match(homeUi, /aria-label=\{t\('home\.globe\.themeToggle'\)\}/, '테마 토글 aria-label');
assert.match(homeUi, /aria-label=\{t\('home\.globe\.zenMode'\)\}/, 'Zen aria-label');
assert.match(homeUi, /aria-label=\{t\('home\.globe\.clearScouts'\)\}/, 'Trash aria-label');
assert.doesNotMatch(homeUi, /home\.globe\.rotatePause/, '자전 일시정지 버튼 없음');
assert.match(homeUi, /role="button"/, '로고 키보드 역할');
assert.match(homeUi, /tabIndex=\{0\}/, '로고 탭 포커스');
assert.doesNotMatch(homeUi, />LOGIN</, 'LOGIN 하드코딩 금지');

const logo = read('src/pages/Home/components/LogoPanel.jsx');
assert.match(logo, /text-\[9px\] text-gray-300/, '푸터 명도 대비');

const globe = read('src/pages/Home/components/HomeGlobeMapbox.jsx');
assert.match(globe, /autoRotatePaused/, '자전 일시정지 prop');
assert.match(globe, /userPausedRotateRef/, '자전 루프 가드');

const home = read('src/pages/Home/index.jsx');
assert.match(home, /prefers-reduced-motion: reduce/, 'reduced-motion 기본 정지');
assert.doesNotMatch(home, /onToggleGlobeRotate/, '자전 토글 버튼 연결 없음');

const ko = JSON.parse(read('src/i18n/locales/ko.json'));
const en = JSON.parse(read('src/i18n/locales/en.json'));
assert.equal(ko.authPage.signup.subtitle.includes('일보'), false, '레거시 일보 카피 제거');
assert.ok(ko.authPage.signup.subtitle.includes('여행 스케치'));
assert.ok(ko.authPage.benefits.bucket.title);
assert.ok(en.authPage.benefits.planner.body);
assert.ok(ko.layout.nav.login);
assert.equal(en.home.globe.rotatePlay, undefined);

console.log('OK smoke:visitor-locale');
