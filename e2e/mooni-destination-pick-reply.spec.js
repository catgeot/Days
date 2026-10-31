import { test, expect } from '@playwright/test';
import { buildGeminiProxyMockBody } from './gemini-proxy-mock-response.js';
import { dismissMooniHintIfPresent } from './helpers.js';

/** 점검 검토서(2026-10-31) 1·2·3·4턴 — resolveDestinationFromChat `low`(후보 칩) 경로. */
const PICK_TURNS = [
  '조용한 섬에서 부부가 스노클링하기 좋은 여행지 10곳 추천해 주세요',
  '5박 6일로 다녀올 예정입니다',
  '상기 4곳 중에서 숙소가 좋은 곳을 알려 주세요',
  '괌·오키나와·팔라우·보홀 4곳을 표로 비교해 주세요',
];
const GUAM_TURN = '괌으로 5박 6일 부부 스노클링 여행을 가려고 해요';
const GUAM_OKINAWA_COMPARE = '괌이랑 오키나와 비교해 주세요';
const VIENNA_FALSE_POSITIVE = '빈 시간에 뭐 할까요';
const HIGH_CONFIDENCE_TURN = '카오락과 푸꾸옥이요';
const PICK_PROMPT = '이 중 어디로 가고 싶으세요?';
const replyMarker = (n) => `E2E-PICK-REPLY-${n}`;

/** @type {Record<number, 'chips' | 'none'>} */
const TURN_CHIP_EXPECT = {
  1: 'chips',
  2: 'none',
  3: 'chips',
  4: 'none',
};

async function installCountingGeminiMock(context) {
  const tasks = [];
  await context.route(/\/functions\/v1\/gemini-proxy/i, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    let task = '';
    try {
      task = route.request().postDataJSON()?.task ?? '';
    } catch {
      task = '';
    }
    tasks.push(task);
    const n = tasks.filter((t) => t === 'mooni_chat').length;
    const text =
      task === 'mooni_chat'
        ? `${replyMarker(n)} 본문 답이에요. 부부 스노클링이면 물이 맑고 조용한 섬부터 볼게요.`
        : 'E2E-PICK-INTRO 여행지 소개예요.';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildGeminiProxyMockBody(text, { modelUsed: 'mock-e2e-pick' })),
    });
  });
  return { mooniChatCalls: () => tasks.filter((t) => t === 'mooni_chat').length };
}

async function openHomeMooni(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await dismissMooniHintIfPresent(page);
  await page.getByRole('button', { name: /MOONi와 대화하기|Chat with MOONi/i }).click();
  await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 30_000 });
}

async function sendTurn(page, text) {
  const input = page.getByRole('textbox', {
    name: /메시지 입력|직접 입력|Type a message|Type directly/i,
  });
  await expect(input).toBeVisible({ timeout: 30_000 });
  await input.fill(text);
  const chatForm = input.locator('xpath=ancestor::form[1]');
  const sendButton = chatForm.getByRole('button', { name: /전송|Send/i });
  if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await chatForm.locator('button[type="submit"]').click();
  }
}

async function expectPickChipsOnlyUnderReplies(page) {
  const total = await page.getByText(PICK_PROMPT, { exact: true }).count();
  const inReplies = await page
    .getByTestId('mooni-model-reply')
    .getByText(PICK_PROMPT, { exact: true })
    .count();
  expect(inReplies, 'pick chips must live under MOONi replies, not user bubbles').toBe(total);
}

async function expectReplyPickChips(reply, mode) {
  const prompt = reply.getByText(PICK_PROMPT, { exact: true });
  if (mode === 'none') {
    await expect(prompt).toHaveCount(0);
    return;
  }
  await expect(prompt).toBeVisible();
}

test.describe('MOONi destination pick — AI reply first, chips below', () => {
  test.setTimeout(240_000);

  test('1·2·3·4턴: 매 턴 본문 답 + 칩 규칙 + AI 1회', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    for (let i = 0; i < PICK_TURNS.length; i += 1) {
      const n = i + 1;
      await sendTurn(page, PICK_TURNS[i]);
      const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(n) });
      await expect(reply).toBeVisible({ timeout: 90_000 });
      await expectReplyPickChips(reply, TURN_CHIP_EXPECT[n] ?? 'chips');
      expect(mock.mooniChatCalls(), `turn ${n}: one mooni_chat call per turn`).toBe(n);
      await expectPickChipsOnlyUnderReplies(page);
    }
  });

  test('괌 5박 6일 스노클링: 본문 답 + 괌(오탐 칩 없음)', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    await sendTurn(page, GUAM_TURN);
    const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(1) });
    await expect(reply).toBeVisible({ timeout: 90_000 });
    expect(mock.mooniChatCalls()).toBe(1);
    await expect(page.getByText(/목적지 · .*괌/).first()).toBeVisible();
    await expect(page.getByText(PICK_PROMPT, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '길리 메노' })).toHaveCount(0);
  });

  test('괌·오키나와 비교: 칩은 괌·오키나와만', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    await sendTurn(page, GUAM_OKINAWA_COMPARE);
    const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(1) });
    await expect(reply).toBeVisible({ timeout: 90_000 });
    expect(mock.mooniChatCalls()).toBe(1);
    await expect(reply.getByText(PICK_PROMPT, { exact: true })).toBeVisible();
    await expect(reply.getByRole('button', { name: '괌' })).toBeVisible();
    await expect(reply.getByRole('button', { name: '오키나와' })).toBeVisible();
    await expect(reply.getByRole('button', { name: '길리 메노' })).toHaveCount(0);
  });

  test('빈 시간: 비엔나 칩 없음', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    await sendTurn(page, VIENNA_FALSE_POSITIVE);
    const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(1) });
    await expect(reply).toBeVisible({ timeout: 90_000 });
    expect(mock.mooniChatCalls()).toBe(1);
    await expect(page.getByText(PICK_PROMPT, { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '빈' })).toHaveCount(0);
  });

  test('답 아래 후보 칩을 누르면 기존처럼 목적지가 확정돼요', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    await sendTurn(page, PICK_TURNS[0]);
    const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(1) });
    await expect(reply).toBeVisible({ timeout: 90_000 });
    await reply.getByRole('button', { name: '길리 메노' }).click();
    await expect(reply.getByText(/목적지 · .*길리 메노/)).toBeVisible({ timeout: 60_000 });
    await expect(reply.getByText(PICK_PROMPT, { exact: true })).toHaveCount(0);
    expect(mock.mooniChatCalls()).toBe(1);
  });

  test('목적지가 하나로 잡히는 턴은 그대로예요', async ({ page, context }) => {
    const mock = await installCountingGeminiMock(context);
    await openHomeMooni(page);

    await sendTurn(page, HIGH_CONFIDENCE_TURN);
    const reply = page.getByTestId('mooni-model-reply').filter({ hasText: replyMarker(1) });
    await expect(reply).toBeVisible({ timeout: 90_000 });
    expect(mock.mooniChatCalls()).toBe(1);
    await expect(page.getByText(PICK_PROMPT, { exact: true })).toHaveCount(0);
    await expect(page.getByText(/목적지 · .*푸꾸옥/).first()).toBeVisible();
  });
});
