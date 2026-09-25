import assert from 'node:assert/strict';
import {
  extractLogbookLeadParagraph,
  resolveLogbookDek,
  resolveLogbookFeedExcerpt,
} from '../src/utils/logbookDek.js';

assert.equal(extractLogbookLeadParagraph('## 첫 문단\n\n두 번째'), '첫 문단');

const longTitle = '짜오프라야 석양, 방콕의 밤이 내려앉을 때';
const lead = '석양이 질 때 왓 아룬의 첨탑이 금빛으로 물드는 장면은 여전히 숨이 멎는다.';
const report = {
  title: longTitle,
  content: `${lead}\n\n본문 두 번째 단락입니다.`,
};

assert.equal(resolveLogbookDek(report), lead);
assert.equal(resolveLogbookDek({ title: longTitle, dek: '짧은 부제', content: lead }), '짧은 부제');
assert.equal(resolveLogbookDek({ title: longTitle, dek: longTitle, content: lead }), lead);
assert.equal(resolveLogbookDek({ title: '제목만', content: '' }), '');
assert.ok(resolveLogbookFeedExcerpt(report).includes('석양'));

console.log('smoke-logbook-dek: OK');
