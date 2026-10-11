import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { messageTextPlain } from '../../src/pages/Home/lib/mooniChatContinue.js';
import { mooniUserBubbleText } from '../../src/pages/Home/lib/mooniChipBubbleText.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SIGHTS_KO = '이 축제에서 볼 수 있는 것과 현장 분위기를 알려줘. 확인된 프로그램과 시간만 말하고, 데이터에 없는 붐비는 시간은 지어내지 마.';
const SIGHTS_EN = 'What can I actually see and do at this festival, and what is the on-site feel? Use only confirmed programs and hours. Do not invent crowd times.';

test('festival chip bubble shows a short label and keeps the instruction for the server', () => {
  assert.equal(mooniUserBubbleText(SIGHTS_KO), '볼거리·분위기 알려 줘');
  assert.equal(mooniUserBubbleText(SIGHTS_EN), 'Tell me the sights and atmosphere');
  assert.equal(mooniUserBubbleText('맛집 추천해줘'), '맛집 추천해줘');

  const stored = { role: 'user', text: '볼거리·분위기 알려 줘', mooniPromptText: SIGHTS_KO };
  assert.equal(messageTextPlain(stored), SIGHTS_KO);
  assert.equal(mooniUserBubbleText(stored.text), '볼거리·분위기 알려 줘');

  const restored = { role: 'user', text: SIGHTS_KO };
  assert.equal(mooniUserBubbleText(restored.text), '볼거리·분위기 알려 줘');
  assert.equal(messageTextPlain(restored), SIGHTS_KO);
  assert.equal(mooniUserBubbleText(SIGHTS_EN), 'Tell me the sights and atmosphere');

  const chat = readFileSync(join(root, 'src/pages/Home/components/ChatModal.jsx'), 'utf8');
  assert.match(chat, /mooniUserBubbleText/);
  assert.match(chat, /mooniPromptText/);
  assert.doesNotMatch(chat, /text: cleanText/);
});
