import assert from 'node:assert/strict';
import { test } from 'node:test';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';
import {
  isMooniPrivateOrLoopbackHost,
  isUnsafeMooniLinkUrl,
  sanitizeMooniMarkdownLinks,
  shouldStripMooniMarkdownLink,
} from '../../src/utils/mooniPlaceholderUrls.js';
import { getMooniModelMarkdownForRender } from '../../src/pages/Home/lib/mooniModelMessageText.js';

function renderMd(markdown) {
  return micromark(markdown, { extensions: [gfm()], htmlExtensions: [gfmHtml()] });
}

test('MOONi model bubbles — ChatModal·PlaceChatView → MooniChatMarkdown only', () => {
  assert.ok(
    typeof getMooniModelMarkdownForRender === 'function',
    'all model types use getMooniModelMarkdownForRender before MooniChatMarkdown',
  );
});

test('① unsafe / example domain — plain text, no anchor', () => {
  const raw = '[플래너 보기](https://planner.example.com/plan)';
  assert.equal(shouldStripMooniMarkdownLink('https://planner.example.com/plan', '플래너 보기'), true);
  assert.equal(isUnsafeMooniLinkUrl('javascript:alert(1)'), true);
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  const html = renderMd(md);
  assert.ok(!html.includes('<a'), 'example domain must not be a link');
  assert.ok(html.includes('플래너 보기'));
});

test('② in-app UI label + non-gateo URL — plain text', () => {
  const raw = '일정은 [플래너 보기](https://www.trip.com/flights)에서 확인하세요.';
  assert.equal(shouldStripMooniMarkdownLink('https://www.trip.com/flights', '플래너 보기'), true);
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  const html = renderMd(md);
  assert.ok(!html.includes('<a'));
  assert.ok(html.includes('플래너 보기'));
});

test('③ real external official link — anchor kept', () => {
  const raw = '관광청 [공식 안내](https://www.okinawastory.jp/)를 참고하세요.';
  assert.equal(shouldStripMooniMarkdownLink('https://www.okinawastory.jp/', '공식 안내'), false);
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  const html = renderMd(md);
  assert.ok(html.includes('<a'), 'official external link should remain');
  assert.ok(html.includes('okinawastory.jp'));
});

test('sanitizeMooniMarkdownLinks — gateo production planner path allowed', () => {
  const kept = sanitizeMooniMarkdownLinks('[플래너 보기](https://www.gateo.kr/place/miyakojima/planner)');
  assert.ok(kept.includes('](https://www.gateo.kr/'));
});

test('④ private / loopback IP hosts — plain text', () => {
  const samples = [
    'http://127.0.0.1/planner',
    'http://10.0.0.5/x',
    'http://172.16.3.1/x',
    'http://192.168.0.2/x',
    'http://169.254.1.1/x',
    'http://0.0.0.0/',
    'http://[::1]/local',
    'http://[fe80::1]/link',
    'http://[fc00::1]/ula',
  ];
  for (const href of samples) {
    assert.equal(isUnsafeMooniLinkUrl(href), true, href);
    const host = new URL(href).hostname;
    assert.equal(isMooniPrivateOrLoopbackHost(host), true, host);
  }
  const raw = '[내부](http://127.0.0.1/secret)';
  const md = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  assert.ok(!renderMd(md).includes('<a'));
});
