import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MOONI_CHAT_ACCENT_GRADIENT,
  MOONI_CHAT_CLOSE,
  MOONI_CHAT_CLOSE_COLORS,
  MOONI_CHAT_MAIN_HEADER_RESERVE_CLASS,
  MOONI_CHAT_SOLID_ACCENT,
  MOONI_CHAT_SIDEBAR_TONES,
  MOONI_LIGHT_BOOKING,
  MOONI_LIGHT_COMPOSER,
} from '../../src/pages/Home/lib/mooniChatModalChromeTokens.js';
import { resolveCityAttractionHub, listCityAttractionHubs } from '../../src/pages/Home/lib/cityAttractionHubs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function contrastRatio(rgbA, rgbB) {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(rgbA);
  const l2 = lum(rgbB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const WEAK_BG_ON_WHITE =
  /(?:^|[\s"'`])(?:hover:)?bg-(?:(?:cyan|teal)-(?:300|400|500|600)|(?:gray|slate)-(?:300|400))(?:\/[\w.]+)?/;

function assertNoWeakBgBehindWhite(chatModal) {
  const literal = /'([^'\\]|\\.)*'|"([^"\\]|\\.)*"/g;
  let match;
  while ((match = literal.exec(chatModal)) !== null) {
    const inner = match[0].slice(1, -1);
    if (!inner.includes('text-white')) continue;
    const hits = inner.match(WEAK_BG_ON_WHITE);
    if (hits) {
      assert.fail(
        `text-white class string must not use low-contrast bg: ${hits[0]} …${inner.slice(0, 120)}`,
      );
    }
  }
}

function assertSidebarTone(label, tone) {
  assert.ok(contrastRatio(tone.title, tone.itemBg) >= 4.5, `${label} title`);
  assert.ok(contrastRatio(tone.activeTitle, tone.activeBg) >= 4.5, `${label} active title`);
  assert.ok(contrastRatio(tone.meta, tone.itemBg) >= 4.5, `${label} meta`);
  assert.ok(contrastRatio(tone.delete, tone.itemBg) >= 3, `${label} delete icon`);
  assert.ok(contrastRatio(tone.personaText, tone.personaBg) >= 4.5, `${label} persona`);
  assert.ok(contrastRatio(tone.title, tone.hoverBg) >= 4.5, `${label} hover title`);
  assert.ok(contrastRatio(tone.disabledMeta, tone.itemBg) >= 4.5, `${label} disabled meta`);
}

test('MOONi chat sidebar contrast tokens — default, hover, active, disabled', () => {
  assertSidebarTone('mooni', MOONI_CHAT_SIDEBAR_TONES.mooni);
  assertSidebarTone('travel', MOONI_CHAT_SIDEBAR_TONES.travel);
});

test('MOONi chat close button — top-right anchor, 44px tap target, contrast', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chatModal, new RegExp(`data-testid="${MOONI_CHAT_CLOSE.testId}"`));
  assert.match(chatModal, /data-testid="mooni-chat-close"[\s\S]*?absolute\s+z-\[60\]/);
  assert.match(chatModal, /min-h-\[44px\][\s\S]*?min-w-\[44px\]/);
  assert.match(chatModal, /min-h-\[44px\].*min-w-\[44px\]|min-w-\[44px\].*min-h-\[44px\]/);

  for (const [label, colors] of Object.entries(MOONI_CHAT_CLOSE_COLORS)) {
    assert.ok(contrastRatio(colors.icon, colors.bg) >= 4.5, `${label} close icon`);
    assert.ok(contrastRatio(colors.bg, colors.panel) >= 3, `${label} close on panel`);
  }
  assert.equal(MOONI_CHAT_CLOSE.minTapPx, 44);
});

test('MOONi chat accent gradient — white on cyan/teal-700 stops ≥ 4.5:1', () => {
  const text = MOONI_CHAT_ACCENT_GRADIENT.text;
  for (const [label, bg] of Object.entries({
    from: MOONI_CHAT_ACCENT_GRADIENT.from,
    to: MOONI_CHAT_ACCENT_GRADIENT.to,
    hoverFrom: MOONI_CHAT_ACCENT_GRADIENT.hoverFrom,
    hoverTo: MOONI_CHAT_ACCENT_GRADIENT.hoverTo,
  })) {
    const ratio = contrastRatio(text, bg);
    assert.ok(ratio >= 4.5, `${label} accent gradient ${ratio.toFixed(2)}:1`);
  }
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.doesNotMatch(
    chatModal,
    /from-cyan-400 to-teal-400/,
    'light accent must not use cyan-400/teal-400 gradient',
  );
  assert.match(chatModal, /from-cyan-700 to-teal-700/);
});

test('MOONi light booking + composer tokens ≥ 4.5:1 (body)', () => {
  const pb = MOONI_LIGHT_BOOKING.plannerButton;
  assert.ok(contrastRatio(pb.text, pb.bg) >= 4.5, 'light planner button');
  const comp = MOONI_LIGHT_COMPOSER;
  assert.ok(contrastRatio(comp.inputText, comp.inputBg) >= 4.5, 'light composer input');
  assert.ok(contrastRatio(comp.listActiveText, comp.listActiveBg) >= 4.5, 'light origin option active');
  assert.ok(contrastRatio(comp.recommendText, comp.recommendBg) >= 4.5, 'light browser suggest');
});

test('MOONi chat solid accent — white on cyan-700/800 ≥ 4.5:1', () => {
  const text = MOONI_CHAT_SOLID_ACCENT.text;
  for (const [label, bg] of Object.entries({
    bg: MOONI_CHAT_SOLID_ACCENT.bg,
    hoverBg: MOONI_CHAT_SOLID_ACCENT.hoverBg,
  })) {
    const ratio = contrastRatio(text, bg);
    assert.ok(ratio >= 4.5, `${label} solid accent ${ratio.toFixed(2)}:1`);
  }
});

test('ChatModal — text-white must not pair with cyan/teal 300–600 or gray/slate 300–400 bg', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assertNoWeakBgBehindWhite(chatModal);
});

test('MOONi chat main header — close reserve padding, mobile new-chat label', () => {
  const chatModal = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chatModal, /data-testid="mooni-chat-main-header"/);
  assert.match(chatModal, /\$\{MOONI_CHAT_MAIN_HEADER_RESERVE_CLASS\}/);
  assert.match(chatModal, /data-testid="mooni-chat-main-header-title"/);
  assert.match(chatModal, /max-md:line-clamp-2/);
  assert.match(chatModal, /from '\.\.\/lib\/mooniChatModalChromeTokens\.js'/);
  assert.ok(MOONI_CHAT_MAIN_HEADER_RESERVE_CLASS.includes('2.75rem'));
  assert.match(chatModal, /data-testid="mooni-chat-new"[\s\S]*?\{t\('mooni\.chat\.newChat'\)\}/);
  assert.doesNotMatch(
    chatModal,
    /data-testid="mooni-chat-new"[\s\S]{0,400}md:hidden[\s\S]{0,220}h-8 w-8/,
    'mobile new-chat must not be icon-only 32px circle',
  );
  assert.doesNotMatch(chatModal, /flex-1[\s\S]{0,120}max-md:pr-12/);
});

test('호찌민 허브 SSOT — 공식명·별칭 검색', () => {
  const hub = listCityAttractionHubs().find((h) => h.hubId === 'ho-chi-minh');
  assert.ok(hub);
  assert.equal(hub.name, '호찌민');
  assert.equal(hub.hubId, 'ho-chi-minh');
  for (const alias of ['호치민', '호치민시', '호찌민', '호찌민시', '사이공']) {
    const hit = resolveCityAttractionHub(alias);
    assert.equal(hit?.hubId, 'ho-chi-minh', `alias ${alias}`);
  }
  const mausoleum = hub.attractions.find((a) => a.name === '호치민 묘소');
  assert.equal(mausoleum, undefined);
  const hanoi = listCityAttractionHubs().find((h) => h.hubId === 'hanoi');
  assert.ok(hanoi?.attractions.some((a) => a.name === '호치민 묘소'));
});