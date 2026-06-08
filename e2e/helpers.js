import { expect } from '@playwright/test';

/** @typedef {import('@playwright/test').Page} Page */

export const AI_ERROR_PATTERN =
  /AI 사용량 한도|일시적으로 바쁩니다|통신에 실패|설정 오류/;

/**
 * MOONi FAB 말풍선·인트로가 있으면 닫는다.
 * @param {Page} page
 */
export async function dismissMooniHintIfPresent(page) {
  const closeHint = page.getByRole('button', { name: '말풍선 닫기' });
  if (await closeHint.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeHint.click();
  }
}

/**
 * MOONi 채팅 1턴 — 모델 응답 또는 S3 에러 문구 중 하나를 기다린다.
 * @param {Page} page
 * @param {string} [message]
 */
export async function mooniOneChatTurn(page, message = '안녕') {
  await dismissMooniHintIfPresent(page);

  await page.getByRole('button', { name: /MOONi와 대화하기/ }).click();
  await expect(page.getByLabel('채팅 닫기')).toBeVisible({ timeout: 20_000 });

  const input = page.getByPlaceholder('메시지 입력...');
  await input.fill(message);
  const chatForm = page.locator('form').filter({ has: input });
  const sendButton = chatForm.getByRole('button', { name: '전송' });
  if (await sendButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sendButton.click();
  } else {
    await chatForm.locator('button[type="submit"]').click();
  }

  await page.waitForFunction(
    ({ patternSource, userMessage }) => {
      const pattern = new RegExp(patternSource);
      const text = document.body.innerText;
      if (pattern.test(text)) return true;
      if (text.includes('답변을 생성 중')) return false;
      return text.includes(userMessage) && text.includes('MOONi');
    },
    { patternSource: AI_ERROR_PATTERN.source, userMessage: message },
    { timeout: 90_000 },
  );

  const bodyText = await page.locator('body').innerText();
  const hasError = AI_ERROR_PATTERN.test(bodyText);
  const hasDialogue = bodyText.includes(message) && bodyText.includes('MOONi');
  return { hasError, hasDialogue, bodyText };
}
