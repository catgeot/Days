import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { JSDOM } from 'jsdom';

import {
  clearLogbookHubScrollRestored,
  scheduleLogbookHubScrollRestore,
} from '../../src/logbookOfficialReviews/logbookReviewHubScrollRestore.js';

const dom = new JSDOM('<!doctype html><body></body>', { url: 'https://www.gateo.kr/blog' });
const { window } = dom;

Object.defineProperty(globalThis, 'window', { value: window, configurable: true, writable: true });
Object.defineProperty(globalThis, 'document', { value: window.document, configurable: true, writable: true });
Object.defineProperty(globalThis, 'HTMLElement', { value: window.HTMLElement, configurable: true, writable: true });
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true, writable: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scroller() {
  const el = document.createElement('div');
  el.setAttribute('data-logbook-main-scroll', '');
  document.body.appendChild(el);
  return el;
}

function wheel(target, deltaY, bubbles = false) {
  const EventCtor = window.WheelEvent || window.Event;
  const event = new EventCtor('wheel', { bubbles, cancelable: true });
  if (!('deltaY' in event)) {
    Object.defineProperty(event, 'deltaY', { value: deltaY });
    Object.defineProperty(event, 'deltaX', { value: 0 });
  } else if (window.WheelEvent && event.deltaY !== deltaY) {
    const wheeled = new window.WheelEvent('wheel', { deltaY, deltaX: 0, bubbles, cancelable: true });
    target.dispatchEvent(wheeled);
    return;
  }
  target.dispatchEvent(event);
}

function fire(target, type) {
  target.dispatchEvent(new window.Event(type, { bubbles: true, cancelable: true }));
}

afterEach(() => {
  clearLogbookHubScrollRestored(document.querySelector('[data-logbook-main-scroll]'));
  document.body.replaceChildren();
});

test('a wheel on the scroller cancels queued realignment for the return', async () => {
  const el = scroller();
  const release = scheduleLogbookHubScrollRestore(el, 1000);
  assert.equal(el.scrollTop, 1000);
  release();
  el.scrollTop = 1500;
  wheel(el, 600, false);
  el.scrollTop = 1500;
  scheduleLogbookHubScrollRestore(el, 1000);
  await wait(180);
  assert.equal(el.scrollTop, 1500);
});

test('document touchstart and window pointerdown and keydown also cancel', async () => {
  for (const fireInput of [
    () => fire(document, 'touchstart'),
    () => fire(window, 'pointerdown'),
    () => fire(document, 'keydown'),
    () => fire(document, 'touchmove'),
  ]) {
    clearLogbookHubScrollRestored();
    const el = scroller();
    scheduleLogbookHubScrollRestore(el, 1000);
    el.scrollTop = 1400;
    fireInput();
    el.scrollTop = 0;
    await wait(120);
    assert.equal(el.scrollTop, 0, fireInput.toString());
    el.remove();
  }
});

test('without input a late scroll height still restores 1000 and 2500', async () => {
  for (const target of [1000, 2500]) {
    clearLogbookHubScrollRestored();
    const el = scroller();
    let accept = false;
    let top = 0;
    Object.defineProperty(el, 'scrollTop', {
      configurable: true,
      get() {
        return top;
      },
      set(value) {
        if (accept) top = Number(value) || 0;
      },
    });
    scheduleLogbookHubScrollRestore(el, target);
    assert.equal(top, 0, `held ${target}`);
    accept = true;
    await wait(120);
    assert.equal(top, target, `restored ${target}`);
    el.remove();
  }
});

test('input before the list is tall blocks the late restore', async () => {
  const el = scroller();
  let accept = false;
  let top = 0;
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    get() {
      return top;
    },
    set(value) {
      if (accept) top = Number(value) || 0;
    },
  });
  scheduleLogbookHubScrollRestore(el, 2500);
  wheel(el, 40, true);
  accept = true;
  scheduleLogbookHubScrollRestore(el, 2500);
  await wait(180);
  assert.equal(top, 0);
});

test('a zero-delta wheel does not abandon an in-progress restore', async () => {
  const el = scroller();
  scheduleLogbookHubScrollRestore(el, 1000);
  assert.equal(el.scrollTop, 1000);
  wheel(el, 0, true);
  el.scrollTop = 0;
  await wait(120);
  assert.equal(el.scrollTop, 1000);
});

test('clearing the session allows the next return to restore', async () => {
  const el = scroller();
  scheduleLogbookHubScrollRestore(el, 1000);
  el.scrollTop = 1600;
  wheel(el, 20, true);
  await wait(80);
  assert.equal(el.scrollTop, 1600);
  clearLogbookHubScrollRestored(el);
  el.scrollTop = 0;
  scheduleLogbookHubScrollRestore(el, 1000);
  assert.equal(el.scrollTop, 1000);
  await wait(80);
  assert.equal(el.scrollTop, 1000);
});
