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

test('gangneung daegu access — bus lead and no data-disclaimer noise', () => {
  const raw = [
    '대구에서 강릉 월화거리 일원의 축제장까지 대중교통을 이용할 때는 대구고속버스터미널에서 강릉고속버스터미널로 이동하는 고속버스를 이용할 수 있어요.',
    '현재 대구 출발 편의 확인된 상세 시간표와 운임 데이터는 준비되어 있지 않으니 터미널 예매 시스템을 참고해 주세요.',
    '열차편 역시 동대구역에서 강릉역으로 가는 직통이나 환승 편명에 대한 확인된 정보가 없어서 대구고속버스터미널발 버스 이용을 권해 드려요.',
    '승용차로 갈 때는 강릉 월화거리로 이동하면 돼요.',
  ].join(' ');
  const polished = polishFestivalModelReply(raw, {
    contentId: '2930716',
    chipId: 'festival_access',
    locale: 'ko',
    departureOriginId: 'daegu',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    eventStartDate: '20261015',
    eventEndDate: '20261018',
  });
  assert.match(polished, /대구고속버스터미널에서 강릉고속버스터미널로 가는 고속버스가 가장 편해요/);
  assert.match(polished, /버스타고·고속버스에서 바로 볼 수 있어요/);
  assert.doesNotMatch(polished, /데이터|준비되어\s*있지\s*않|제공되지|정보가\s*없어서|터미널\s*예매\s*시스템/);
  assert.doesNotMatch(polished, /열차편\s*역시/);
});

test('gukhyang daegu access drops duplicate bus route after summary lead', () => {
  const raw = [
    '대중교통을 이용할 때는 동대구터미널이나 서대구터미널에서 광주(유·스퀘어)로 가는 고속버스를 타고, 유·스퀘어에서 함평공용버스터미널행 버스로 이어 택시·시내버스로 약 10~20분이면 함평 엑스포공원까지 편해요.',
    '고속버스를 이용할 때는 동대구터미널이나 대구고속버스터미널에서 광주(유·스퀘어)행 고속버스를 타고 유·스퀘어에서 함평공용버스터미널행 버스로 갈아타면 됩니다.',
    '확인된 대구→광주송정 직통 열차는 없어요. 열차로 가시려면 광주송정역에서 함평역 방면 열차로 갈아타야 해요.',
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
  assert.doesNotMatch(polished, /고속버스를\s*이용할\s*때는/);
  assert.equal((polished.match(/함평 엑스포공원까지 편해요/g) || []).length, 1);
  assert.match(polished, /광주송정역에서/);
});

test('gangneung daegu access drops duplicate terminal bus sentence', () => {
  const raw = [
    '대구고속버스터미널에서 강릉고속버스터미널로 가는 고속버스가 가장 편해요. 시간과 요금은 아래 버스타고·고속버스에서 바로 볼 수 있어요.',
    '고속버스를 이용할 때는 동대구터미널에서 강릉고속버스터미널행 고속버스를 타면 됩니다.',
    '승용차로 갈 때는 강릉 월화거리로 이동하면 돼요.',
  ].join(' ');
  const polished = polishFestivalModelReply(raw, {
    contentId: '2930716',
    chipId: 'festival_access',
    locale: 'ko',
    departureOriginId: 'daegu',
    userText: buildFestivalAccessAskText('daegu', 'ko'),
    eventStartDate: '20261015',
    eventEndDate: '20261018',
  });
  assert.doesNotMatch(polished, /고속버스를\s*이용할\s*때는/);
  assert.equal((polished.match(/강릉고속버스터미널/g) || []).length, 1);
  assert.match(polished, /버스타고·고속버스에서 바로 볼 수 있어요/);
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
