import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KO, EN } from '../../src/i18n/mooniPromptBundleData.js';
import { KO as ServerKO, EN as ServerEN } from '../../supabase/functions/_shared/gemini/mooniPromptBundleData.js';
import { renderMooniSystem } from '../../supabase/functions/_shared/gemini/templates.js';
import {
  festivalFoodPlaceUrl,
  polishFestivalModelReply,
  resolveMooniChatKoreaFestivalHint,
} from '../../src/shared/korea/mooniKoreaFestivalAssist.js';

const SHOPS = [
  { name: '장안식당', distKm: 0.4, cat3: 'A05020100', locality: '함평읍' },
  { name: '키친205', distKm: 0.25, locality: '함평읍' },
  { name: '목포식당', distKm: 0.7, cat3: 'A05020100' },
  { name: '화랑식당', distKm: 1.1, cat3: 'A05020100' },
  { name: '없는비빔밥집', distKm: 0.3 },
];

test('food hint carries name, type, distance, and a copyable link', async () => {
  const { hint } = await resolveMooniChatKoreaFestivalHint({
    userText: '근처 맛집 추천해 줘',
    festivalContext: {
      title: '대한민국 국향대전',
      contentId: '638576',
      nearbyRestaurants: SHOPS.slice(0, 4),
    },
    locale: 'ko',
  });
  assert.match(hint, /바로 찾아갈 수 있도록/);
  assert.match(hint, /\[장안식당\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(hint, /한식 · 도보 5분/);
  assert.match(hint, /키친205/);
  assert.match(hint, /도보 3분/);
  assert.doesNotMatch(hint, /없는비빔밥집/);
  assert.match(KO.festivalAnswerRules, /바로 찾아갈 수 있도록/);
  assert.match(ServerKO.festivalAnswerRules, /바로 찾아갈 수 있도록/);
  assert.match(EN.chips.festival_nearby.rules.join('\n'), /Describe only names, distances, and types/);
  assert.match(ServerEN.chips.festival_nearby.rules.join('\n'), /Describe only names, distances, and types/);
  assert.match(
    renderMooniSystem({ locale: 'ko', persona: 'PLANNER', isMooni: true, locationName: '대한민국 국향대전' }),
    /바로 찾아갈 수 있도록/,
  );
});

test('a natural model answer that already names the hint shops is kept', () => {
  const shops = [
    { name: '키친205', distKm: 0.25, locality: '함평읍' },
    { name: '장안식당', distKm: 0.4, cat3: 'A05020100', locality: '함평읍' },
    { name: '목포식당', distKm: 0.7, cat3: 'A05020100', locality: '함평읍' },
    { name: '화랑식당', distKm: 1.1, cat3: 'A05020100', locality: '함평읍' },
  ];
  const url = festivalFoodPlaceUrl(shops[1]);
  const model = `함평 행사장 가까이에서 식사할 곳을 소개할게요. [키친205](${festivalFoodPlaceUrl(shops[0])})은 도보 3분이고, [장안식당](${url})은 한식, 도보 5분이에요. [목포식당](${festivalFoodPlaceUrl(shops[2])})은 한식, 도보 9분, [화랑식당](${festivalFoodPlaceUrl(shops[3])})은 한식, 도보 14분이에요.`;
  const kept = polishFestivalModelReply(model, {
    contentId: '638576',
    locale: 'ko',
    userText: '근처 맛집 추천해 줘',
    nearbyRestaurants: shops,
  });
  assert.match(kept, /함평 행사장 가까이에서/);
  assert.match(kept, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.doesNotMatch(kept, /여행자는 이 답을 보고 바로 찾아갈 수 있어요|링크를 누르면 그 가게를 바로 찾을 수 있어요|사용자는 이 답을 보고 실제로 가게를 찾아가요/);
});

test('a name-only line gains type, distance, and link, and drops an invented shop', () => {
  const reply = polishFestivalModelReply(
    '주변 맛집은 장안식당, 키친205이에요. 차로 3분 육회비빔밥집도 있어요.',
    {
      contentId: '638576',
      locale: 'ko',
      userText: '근처 맛집 추천해 줘',
      nearbyRestaurants: SHOPS.slice(0, 2),
    },
  );
  assert.match(reply, /\[장안식당\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(reply, /한식/);
  assert.match(reply, /도보 5분/);
  assert.match(reply, /\[키친205\]\(https:\/\/search\.naver\.com\/search\.naver\?query=/);
  assert.match(reply, /도보 3분/);
  assert.match(reply, /많지 않아요/);
  assert.doesNotMatch(reply, /육회비빔밥|없는비빔밥집/);
  assert.doesNotMatch(reply, /여행자는 이 답을 보고 바로 찾아갈 수 있어요|링크를 누르면 그 가게를 바로 찾을 수 있어요|사용자는 이 답을 보고 실제로 가게를 찾아가요/);
});

test('a long walk is not called a nearby meal, and no meta sentence is echoed', () => {
  const reply = polishFestivalModelReply(
    '여행자는 이 답을 보고 바로 찾아갈 수 있어요. 근처 맛집은 고유커피예요. 링크를 누르면 그 가게를 바로 찾을 수 있어요.',
    {
      contentId: '637693',
      locale: 'ko',
      userText: '근처 맛집 추천해 줘',
      nearbyRestaurants: [
        { name: '고유커피', distKm: 2.26, cat3: 'A05020900', locality: '마산합포구' },
        { name: '마로니에', distKm: 5.96, cat3: 'A05020900', locality: '창원시' },
      ],
    },
  );
  assert.match(reply, /많지 않아요/);
  assert.match(reply, /고유커피/);
  assert.match(reply, /카페/);
  assert.match(reply, /차로 5분/);
  assert.match(reply, /https:\/\/www\.gateo\.kr\/korea\/\?festival=637693/);
  assert.doesNotMatch(reply, /마로니에|도보 28분/);
  assert.doesNotMatch(reply, /여행자는 이 답을 보고 바로 찾아갈 수 있어요|링크를 누르면 그 가게를 바로 찾을 수 있어요|사용자는 이 답을 보고 실제로 가게를 찾아가요/);
});

test('키친205 is not called a bar from a bar category code', () => {
  const reply = polishFestivalModelReply('주변 맛집은 키친205예요.', {
    contentId: '638576',
    locale: 'ko',
    userText: '근처 맛집 추천해 줘',
    nearbyRestaurants: [
      { name: '장안식당', distKm: 0.4, cat3: 'A05020100', locality: '함평읍' },
      { name: '키친205', distKm: 0.25, cat3: 'A05020900', locality: '함평읍' },
      { name: '목포식당', distKm: 0.7, cat3: 'A05020100', locality: '함평읍' },
      { name: '화랑식당', distKm: 0.6, cat3: 'A05020100', locality: '함평읍' },
    ],
  });
  assert.match(reply, /키친205/);
  assert.doesNotMatch(reply, /키친205[^\n]{0,24}바|바인 \[키친205\]/);
});
