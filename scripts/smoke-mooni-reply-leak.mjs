#!/usr/bin/env node
/**
 * MOONi reply / place_chat_intro leak sanitizer — unit vectors (no live Gemini).
 *   npm run smoke:mooni-reply-leak
 */
import assert from 'node:assert/strict';
import {
  detectMooniReplyLeak,
  sanitizeGeminiUserText,
} from '../supabase/functions/_shared/gemini/answerSanitize.mjs';

const BOROBUDUR_LEAK =
  '1 million tourists per year". Stick to historical/visual facts.\n\n3. **Draft\n\n이곳이 어떤 곳인지부터, 가는 방법·준비·즐길거리까지 골라보셔도 좋아요.';

let fail = 0;
function check(cond, msg) {
  if (!cond) {
    fail += 1;
    console.error(`FAIL  ${msg}`);
  }
}

check(detectMooniReplyLeak(BOROBUDUR_LEAK) !== null, 'Borobudur leak detected');
const cleaned = sanitizeGeminiUserText(BOROBUDUR_LEAK);
check(cleaned.startsWith('이곳이'), 'Borobudur prefix stripped');
check(detectMooniReplyLeak(cleaned) === null, 'cleaned text passes leak scan');

const koList = '1. 아침에는 사원을 둘러보고\n2. 오후에는 박물관을 방문해 보세요.';
check(sanitizeGeminiUserText(koList) === koList, 'Korean numbered list preserved');

const koProse =
  '보로부두르는 자바 중부에 있는 불교 사원 단지입니다. 일출을 보며 올라가는 코스가 인기 있습니다.';
check(sanitizeGeminiUserText(koProse) === koProse, 'clean Korean prose unchanged');

if (fail) {
  console.error(`smoke-mooni-reply-leak: ${fail} failure(s)`);
  process.exit(1);
}
console.log('smoke-mooni-reply-leak: OK');
