import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import { ensureI18n } from '../../src/i18n/config.js';
import { LocaleProvider } from '../../src/i18n/LocaleProvider.jsx';
import PlannerTab from '../../src/components/PlaceCard/tabs/PlannerTab.jsx';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://www.gateo.kr/place/gyeongbokgung-palace/planner',
});

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

setGlobal('window', dom.window);
setGlobal('document', dom.window.document);
setGlobal('navigator', dom.window.navigator);
setGlobal('HTMLElement', dom.window.HTMLElement);
setGlobal('Element', dom.window.Element);
setGlobal('Node', dom.window.Node);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));
setGlobal('matchMedia', () => ({ matches: false, addListener: () => {}, removeListener: () => {} }));

const i18n = ensureI18n('ko');

const GYEONGBOKGUNG = {
  name: '경복궁',
  slug: 'gyeongbokgung-palace',
  lat: 37.579617,
  lng: 126.977041,
  country: '대한민국',
};

const MYEONGDONG_GYOZA = {
  name: '명동교자',
  slug: 'tour-403053',
  kind: 'restaurant',
  badge: '식당',
  exploreRestaurant: true,
  contentTypeId: '39',
  cat1: 'A05',
  lat: 37.563569,
  lng: 126.985032,
  addr1: '서울특별시 중구 명동10길 29',
  parentCity: '중구',
  country: '대한민국',
};

let root;
let container;

afterEach(async () => {
  if (root) {
    await act(async () => {
      root.unmount();
    });
    root = null;
  }
  if (container?.parentNode) {
    container.parentNode.removeChild(container);
    container = null;
  }
});

function countGenerationLabels(text) {
  const creating = i18n.t('place.planner.toolkitCreating');
  const checking = i18n.t('place.planner.toolkitChecking');
  const re = new RegExp(`${creating}|${checking}|생성 중|점검 중`, 'gu');
  return (text.match(re) || []).length;
}

async function mountPlannerLoading({ location, plannerData = null }) {
  container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      React.createElement(
        MemoryRouter,
        { initialEntries: [`/place/${location.slug}/planner`] },
        React.createElement(
          LocaleProvider,
          null,
          React.createElement(
            I18nextProvider,
            { i18n },
            React.createElement(PlannerTab, {
              location,
              plannerData,
              isPlannerLoading: true,
              isActive: true,
            }),
          ),
        ),
      ),
    );
    await new Promise((r) => setTimeout(r, 0));
  });
}

test('저장본 DB 로드 중 — AI 툴킷 생성/점검 문구·진행률 UI 없음', async () => {
  await mountPlannerLoading({ location: GYEONGBOKGUNG });

  const shell = container.querySelector('[data-planner-stored-fetch-loading]');
  assert.ok(shell, 'stored-fetch skeleton shell');

  const text = shell.textContent || '';
  assert.equal(countGenerationLabels(text), 0, `unexpected generation copy: ${text}`);
  assert.equal(shell.querySelector('[data-planner-toolkit-generating]'), null);
  assert.ok(!/%\s*$/u.test(text) && !text.includes('%'), 'progress percent should not render');
  assert.ok(text.includes(i18n.t('place.summary.preparing')));
});

test('명동교자(서울 호스트) 저장본 로드 중 — 생성 중 문구 0회', async () => {
  await mountPlannerLoading({ location: MYEONGDONG_GYOZA });
  const shell = container.querySelector('[data-planner-stored-fetch-loading]');
  assert.ok(shell);
  assert.equal(countGenerationLabels(shell.textContent || ''), 0);
});
