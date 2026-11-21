import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  MOONI_CHAT_CLOSE,
  MOONI_CHAT_CLOSE_COLORS,
  MOONI_CHAT_SIDEBAR_TONES,
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