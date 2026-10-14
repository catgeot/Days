import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { MOONI_ACCESS_NUMBER_TOKEN_RE } from '../../src/components/chat/mooniAccessNumberToken.js';
import { polishFestivalModelReply } from '../../src/shared/korea/mooniKoreaFestivalAssist.js';
import { buildFestivalAccessAskText } from '../../src/pages/Home/lib/festivalDomesticOrigins.js';

const root = join(import.meta.dirname, '..', '..');

test('MOONI access number token regex matches clock and fare units', () => {
  const sample = '05:06부터 22:34까지 27,600원이고 1시간 51분';
  const hits = [...sample.matchAll(MOONI_ACCESS_NUMBER_TOKEN_RE)].map((m) => m[0]);
  assert.deepEqual(hits, ['05:06', '22:34', '27,600원', '51분']);
});

test('gukhyang daegu polish drops vague 환승을 거쳐 and leads with bus', () => {
  const raw = [
    '대구에서 대한민국 국향대전이 열리는 함평 엑스포공원까지 이동하는 방법이에요.',
    '대중교통을 이용할 때는 동대구터미널이나 서대구터미널에서 광주(유·스퀘어)로 가는 고속버스를 타고 광주에서 함평행 버스로 갈아타는 방법이 편해요.',
    '열차는 대구에서 광주송정역으로 바로 가는 확인된 직통 열차가 없어서 동대구역에서 환승을 거쳐 광주송정역으로 이동한 뒤, 함평역으로 가는 무궁화호나 ITX 열차로 갈아타야 해요.',
  ].join(' ');
  const polished = polishFestivalModelReply(raw, {
    contentId: '638576',
    chipId: 'festival_access',
    locale: 'ko',
    departureOriginId: 'daegu',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    eventStartDate: '20261023',
    eventEndDate: '20261108',
  });
  assert.doesNotMatch(polished, /환승을\s*거쳐/);
  assert.doesNotMatch(polished, /동대구역에서 환승/);
  const orphan = polishFestivalModelReply(
    '버스로 이어 가면 돼요역으로 이동한 뒤, 함평역까지 ITX로 갈아타요.',
    {
      contentId: '638576',
      chipId: 'festival_access',
      locale: 'ko',
      departureOriginId: 'daegu',
      userText: buildFestivalAccessAskText('daegu', 'ko'),
    },
  );
  assert.doesNotMatch(orphan, /돼요\s*역으로/);
  const busIdx = polished.indexOf('동대구터미널이나 서대구터미널');
  assert.ok(busIdx >= 0 && busIdx < 200, `bus lead too late: ${busIdx}`);
  assert.match(polished, /함평행 버스/);
});

test('MooniChatMarkdown wires nowrap number-token rehype before sanitize', () => {
  const markdown = readFileSync(join(root, 'src/components/chat/MooniChatMarkdown.jsx'), 'utf8');
  assert.match(markdown, /rehypeMooniWrapAccessNumberTokens/);
  const schema = readFileSync(join(root, 'src/components/chat/mooniChatMarkdownSchema.js'), 'utf8');
  assert.match(schema, /nowrap/);
  assert.match(schema, /dataMooniAccessNumber/);
});
