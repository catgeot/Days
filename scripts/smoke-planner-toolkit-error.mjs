import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlannerToolkitErrorNotice } from '../src/components/PlaceCard/tabs/planner/PlannerToolkitErrorNotice.jsx';
import {
  plannerToolkitErrorKey,
  plannerToolkitMapHref,
  plannerToolkitSafetyHref,
} from '../src/components/PlaceCard/tabs/planner/plannerToolkitError.js';

const messages = {
  badRequest: '이 장소 정보로는 툴킷을 만들 수 없어요',
  unauthorized: '이 장소 툴킷은 관리자만 다시 만들 수 있어요',
  forbidden: '아직 툴킷을 지원하지 않는 장소예요',
  rateLimit: '방금 생성 중이에요. 몇 분 뒤 다시 시도해 주세요',
  generic: '지금은 툴킷을 만들지 못했어요',
  network: '연결을 확인한 뒤 다시 시도해 주세요',
};

const cases = [
  [plannerToolkitErrorKey({ context: { status: 400 } }, null), 'badRequest'],
  [plannerToolkitErrorKey({ context: { status: 401 } }, null), 'unauthorized'],
  [plannerToolkitErrorKey({ context: { status: 403 } }, null), 'forbidden'],
  [plannerToolkitErrorKey({ context: { status: 429 } }, null), 'rateLimit'],
  [plannerToolkitErrorKey(null, { success: false }), 'generic'],
  [plannerToolkitErrorKey(new Error('network'), null), 'network'],
];

const seen = new Set();
for (const [key, expected] of cases) {
  assert.equal(key, expected);
  assert.ok(!seen.has(messages[key]), key);
  seen.add(messages[key]);
  const html = renderToStaticMarkup(
    React.createElement(PlannerToolkitErrorNotice, {
      message: messages[key],
      safetyHref: plannerToolkitSafetyHref(),
      safetyLabel: '외교부 해외안전여행',
      mapHref: plannerToolkitMapHref({ name: '방콕' }),
      mapLabel: '지도',
    }),
  );
  assert.match(html, new RegExp(messages[key]));
  assert.match(html, /href="https:\/\/www\.0404\.go\.kr\/dev\/country_search\.moa"/);
  assert.equal(html.includes('utm_'), false);
  assert.equal(html.includes('animate-spin'), false);
}
assert.equal(seen.size, 6);
assert.equal(plannerToolkitErrorKey(null, { success: true }), null);
assert.equal(plannerToolkitMapHref({ lat: 13.7, lng: 100.5 }).includes('utm_'), false);

console.log('smoke-planner-toolkit-error: OK');
