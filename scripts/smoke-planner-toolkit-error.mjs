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
  forbidden: '이 여행지는 아직 툴킷을 준비 중이에요',
  rateLimit: '방금 생성 중이에요. 몇 분 뒤 다시 시도해 주세요',
  generic: '지금은 툴킷을 만들지 못했어요',
  network: '연결을 확인한 뒤 다시 시도해 주세요',
};

const cases = [
  [plannerToolkitErrorKey({ context: { status: 400 } }, null), 'badRequest'],
  [plannerToolkitErrorKey({ context: { status: 401 } }, null), 'generic'],
  [plannerToolkitErrorKey({ context: { status: 403 } }, null), 'generic'],
  [plannerToolkitErrorKey({ context: { status: 429 } }, null), 'rateLimit'],
  [plannerToolkitErrorKey(null, { success: false }), 'generic'],
  [plannerToolkitErrorKey(new Error('network'), null), 'network'],
  [
    plannerToolkitErrorKey({ context: { status: 403 } }, { error: 'forbidden: unregistered place' }),
    'forbidden',
  ],
  [
    plannerToolkitErrorKey({ context: { status: 403 } }, { error: 'forbidden: toolkit overwrite requires admin' }),
    'generic',
  ],
];

for (const [key, expected] of cases) {
  assert.equal(key, expected);
}
const seen = new Set();
for (const text of Object.values(messages)) {
  if (seen.has(text)) continue;
  seen.add(text);
  const html = renderToStaticMarkup(
    React.createElement(PlannerToolkitErrorNotice, {
      message: text,
      safetyHref: plannerToolkitSafetyHref(),
      safetyLabel: '외교부 해외안전여행',
      mapHref: plannerToolkitMapHref({ name: '방콕' }),
      mapLabel: '지도',
    }),
  );
  assert.match(html, new RegExp(text));
  assert.match(html, /href="https:\/\/www\.0404\.go\.kr\/dev\/country_search\.moa"/);
  assert.equal(html.includes('utm_'), false);
  assert.equal(html.includes('animate-spin'), false);
}
assert.equal(seen.size, 5);
assert.equal(
  plannerToolkitErrorKey({ context: { status: 401 } }, { error: 'unauthorized: toolkit overwrite requires admin login' }),
  'generic',
);
assert.equal(plannerToolkitErrorKey(null, { success: true }), null);
assert.equal(plannerToolkitMapHref({ lat: 13.7, lng: 100.5 }).includes('utm_'), false);

console.log('smoke-planner-toolkit-error: OK');
