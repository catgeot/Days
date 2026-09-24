import assert from 'node:assert/strict';
import {
  applyMarkdownWrap,
  insertAtCursor,
  toggleLineHeading,
  buildLogbookMomentPlaceholder,
} from '../src/pages/DailyReport/utils/logbookEditorMarkdown.js';

const wrap = applyMarkdownWrap('hello world', 6, 11, '**');
assert.equal(wrap.value, 'hello **world**');
assert.equal(wrap.selectionStart, 8);
assert.equal(wrap.selectionEnd, 13);

const insert = insertAtCursor('aa', 2, 2, '![x](u)', { block: true });
assert.ok(insert.value.includes('![x](u)'));

const heading = toggleLineHeading('line one\nplain', 8, 13, 2);
assert.ok(heading.value.startsWith('## line'));

assert.equal(buildLogbookMomentPlaceholder(0), '[사진 1]');

console.log('smoke-logbook-editor: OK');
