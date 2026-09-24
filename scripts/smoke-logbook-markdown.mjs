import assert from 'node:assert/strict';
import {
  stripLogbookMarkdownSnippet,
  splitLogbookPhotoPlaceholders,
  parseLogbookPhotoIndex,
} from '../src/pages/DailyReport/utils/logbookMarkdownSnippet.js';

const sample = `## 파리\n\n**루브르** — [공식](https://example.com)\n\n---\n\n[사진 1]\n\nplain line`;

const stripped = stripLogbookMarkdownSnippet(sample);
assert.ok(!stripped.includes('##'), 'headers stripped');
assert.ok(!stripped.includes('**'), 'bold markers stripped');
assert.ok(stripped.includes('루브르'), 'text preserved');
assert.ok(!stripped.includes('[사진'), 'photo placeholder stripped');

const parts = splitLogbookPhotoPlaceholders(sample);
assert.ok(parts.some((p) => parseLogbookPhotoIndex(p) === 0), 'photo placeholder parsed');

console.log('smoke-logbook-markdown: OK');
