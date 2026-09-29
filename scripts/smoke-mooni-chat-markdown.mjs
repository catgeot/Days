import assert from 'node:assert/strict';
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

assert.ok(!mooniChatMarkdownSanitizeSchema.tagNames.includes('img'), 'images disallowed');
assert.ok(mooniChatMarkdownSanitizeSchema.attributes?.a?.includes('rel'), 'link rel allowed');

assert.ok(fullSample.includes('###'), 'fixture has headings');
assert.ok(truncated.includes('**굵게'), 'truncated fixture preserved');

console.log('smoke-mooni-chat-markdown: OK');
