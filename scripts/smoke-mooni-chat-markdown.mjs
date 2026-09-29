import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkCjkFriendly from 'remark-cjk-friendly';
import mooniRemarkGfm from '../src/components/chat/mooniRemarkGfm.js';
import { mooniChatMarkdownSanitizeSchema } from '../src/components/chat/mooniChatMarkdownSchema.js';

const fullSample = `**2박 3일 힐링 코스**

---

### 🍁 오대산 선재길 단풍 여행 2박 3일 추천 일정

#### 1일차: 평창 도착

* **오후:** 진부역
* 월정사~회사거리

1. 첫째
2. 둘째

[GATEO](https://www.gateo.kr/)`;

const truncated = `### 미완성 제목

**굵게 진행`;

const cjkBoldSample = '**「📋 플래너 보기」**를 눌러주세요';
const bareUrlSample = '안내: https://www.gateo.kr/ 끝';

function parseMooniMarkdown(source) {
  return unified()
    .use(remarkParse)
    .use(mooniRemarkGfm)
    .use(remarkCjkFriendly)
    .parse(source);
}

function paragraphChildren(tree) {
  const para = tree.children.find((n) => n.type === 'paragraph');
  return para?.children ?? [];
}

assert.ok(!mooniChatMarkdownSanitizeSchema.tagNames.includes('img'), 'images disallowed');
assert.ok(mooniChatMarkdownSanitizeSchema.attributes?.a?.includes('rel'), 'link rel allowed');

assert.ok(fullSample.includes('###'), 'fixture has headings');
assert.ok(truncated.includes('**굵게'), 'truncated fixture preserved');

const cjkTree = parseMooniMarkdown(cjkBoldSample);
const cjkKids = paragraphChildren(cjkTree);
assert.equal(cjkKids[0]?.type, 'strong', 'CJK bold opens before Hangul suffix');
assert.ok(
  cjkKids[0]?.children?.[0]?.value?.includes('플래너 보기'),
  'CJK bold wraps bracket label',
);
assert.match(cjkKids[1]?.value ?? '', /^를/, 'Hangul suffix stays outside bold');

const urlTree = parseMooniMarkdown(bareUrlSample);
const urlKids = paragraphChildren(urlTree);
assert.ok(
  urlKids.every((n) => n.type !== 'link'),
  'bare URL must not become autolink literal',
);
assert.ok(
  urlKids.some((n) => n.type === 'text' && n.value.includes('https://www.gateo.kr/')),
  'bare URL stays plain text',
);

const explicitLink = parseMooniMarkdown('[GATEO](https://www.gateo.kr/)');
const linkKids = paragraphChildren(explicitLink);
assert.equal(linkKids[0]?.type, 'link', 'explicit markdown link still parses');

console.log('smoke-mooni-chat-markdown: OK');
