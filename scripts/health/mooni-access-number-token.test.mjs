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

test('gukhyang daegu bus leg uses 함평공용버스터미널 and 광주송정 rail secondary', () => {
  const raw = [
    '대중교통을 이용할 때는 동대구터미널이나 서대구터미널에서 광주(유·스퀘어)로 가는 고속버스를 타고 광주에서 함평행 버스로 갈아타는 방법이 편해요.',
    '광주 도착 후에는 함평행 직행버스를 타거나 함평역으로 이동하여 기차를 이용할 수 있어요.',
    '열차를 이용할 경우 확인된 동대구→광주송정 직통 열차는 없어요.',
    '함평행 버스로 함평역에서 축제장까지는 택시나 시내버스로 10~20분 정도 걸려요.',
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
  assert.doesNotMatch(polished, /함평역으로\s*이동하여\s*기차/);
  assert.doesNotMatch(polished, /함평행\s*버스로\s*함평역에서/);
  assert.match(polished, /함평공용버스터미널/);
  assert.match(polished, /광주송정역에서/);
  assert.match(polished, /10~20분|10~20\s*분/);
});

test('gangneung daegu drops 제공되지 data phrase for booking links', () => {
  const polished = polishFestivalModelReply(
    '대구고속버스터미널에서 강릉으로 버스를 탈 수 있어요. 현재 대구 출발 직통 열차의 확인된 운행 시각 정보는 제공되지 않아서, 열차를 이용할 경우 동대구역에서 서울역으로 이동한 뒤 강릉행 KTX로 환승해야 해요.',
    {
      contentId: '2930716',
      chipId: 'festival_access',
      locale: 'ko',
      departureOriginId: 'daegu',
      userText: buildFestivalAccessAskText('daegu', 'ko'),
      eventStartDate: '20261015',
      eventEndDate: '20261018',
    },
  );
  assert.doesNotMatch(polished, /데이터는\s*제공되지|제공되지\s*않아서/);
  assert.match(polished, /코레일|버스타고|고속버스/);
});

test('gukhyang access adds period after festival tel', () => {
  const polished = polishFestivalModelReply(
    '주차 안내는 공식 홈페이지에 있어요. 문의 061-320-2247 더 자세한 축제 내용은 대한민국 국향대전 페이지에서 확인할 수 있어요.',
    {
      contentId: '638576',
      chipId: 'festival_access',
      locale: 'ko',
      departureOriginId: 'seoul',
      userText: buildFestivalAccessAskText('seoul', 'ko'),
      tel: '061-320-2247',
      eventStartDate: '20261023',
      eventEndDate: '20261108',
    },
  );
  assert.match(polished, /061-320-2247\.\s/);
});

test('MooniChatMarkdown wires nowrap number-token rehype before sanitize', () => {
  const markdown = readFileSync(join(root, 'src/components/chat/MooniChatMarkdown.jsx'), 'utf8');
  assert.match(markdown, /rehypeMooniWrapAccessNumberTokens/);
  const schema = readFileSync(join(root, 'src/components/chat/mooniChatMarkdownSchema.js'), 'utf8');
  assert.match(schema, /nowrap/);
  assert.match(schema, /dataMooniAccessNumber/);
});
