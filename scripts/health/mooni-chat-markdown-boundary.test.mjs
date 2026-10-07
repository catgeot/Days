import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import React, { act, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { mooniChatMarkdownPlainFallback } from '../../src/components/chat/mooniChatMarkdownPlainFallback.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const boundarySrc = readFileSync(
  join(rootDir, 'src/components/chat/MooniChatMarkdownBoundary.jsx'),
  'utf8',
);

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://localhost/',
});
const { window } = dom;

function setGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    value,
    configurable: true,
    writable: true,
  });
}

setGlobal('window', window);
setGlobal('document', window.document);
setGlobal('navigator', window.navigator);
setGlobal('HTMLElement', window.HTMLElement);
setGlobal('Element', window.Element);
setGlobal('Node', window.Node);
setGlobal('IS_REACT_ACT_ENVIRONMENT', true);
setGlobal('requestAnimationFrame', (cb) => setTimeout(cb, 0));
setGlobal('cancelAnimationFrame', (id) => clearTimeout(id));

class ThrowingMarkdown extends Component {
  render() {
    throw new Error('MooniChatMarkdown render throw');
  }
}

/** Production MooniChatMarkdownBoundary와 동일한 failed 분기(plain fallback). */
class MooniMarkdownBoundaryHarness extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.text !== this.props.text && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    const { text, variant } = this.props;
    if (this.state.failed) {
      const plain = mooniChatMarkdownPlainFallback(text);
      return React.createElement(
        'div',
        {
          className: `mooni-chat-markdown mooni-chat-markdown--plain-fallback${
            variant === 'dark' ? ' mooni-chat-markdown--dark' : ''
          }`,
          style: { whiteSpace: 'pre-wrap' },
        },
        plain,
      );
    }
    return React.createElement(ThrowingMarkdown);
  }
}

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

test('MooniChatMarkdownBoundary 소스 — failed 시 plain fallback', () => {
  assert.match(boundarySrc, /this\.state\.failed/);
  assert.match(boundarySrc, /mooniChatMarkdownPlainFallback/);
  assert.match(boundarySrc, /whiteSpace:\s*['"]pre-wrap['"]/);
});

test('mooniChatMarkdownPlainFallback — 링크·URL 제거', () => {
  const plain = mooniChatMarkdownPlainFallback(
    '안내 [플래너](https://planner.example.com) 및 https://evil.test/x',
  );
  assert.ok(!plain.includes('http'));
  assert.ok(plain.includes('플래너'));
});

test('markdown 렌더 throw — boundary가 plain 본문으로 복구(크래시 없음)', async () => {
  container = globalThis.document.createElement('div');
  globalThis.document.body.appendChild(container);
  root = createRoot(container);

  const body = '주차는 공식 안내를 확인하세요.\n[링크](https://example.com/p)';

  await act(async () => {
    root.render(
      React.createElement(MooniMarkdownBoundaryHarness, { text: body, variant: 'dark' }),
    );
    await new Promise((r) => setTimeout(r, 0));
  });

  const plainEl = container.querySelector('.mooni-chat-markdown--plain-fallback');
  assert.ok(plainEl, 'plain fallback element');
  assert.ok(plainEl.textContent.includes('주차는'));
  assert.ok(!plainEl.innerHTML.includes('<a'));
  assert.ok(!plainEl.textContent.includes('https://'));
});
