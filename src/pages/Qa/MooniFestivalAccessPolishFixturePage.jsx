import React, { useMemo } from 'react';
import { buildFestivalMooniContext } from '../Korea/lib/festivalMooniContext.js';
import { buildFestivalMooniPolishOptions } from '../Home/lib/festivalMooniRequest.js';
import { buildFestivalAccessAskText } from '../Home/lib/festivalDomesticOrigins.js';
import { polishFestivalModelReply } from '../../shared/korea/mooniKoreaFestivalAssist.js';
import { getMooniModelMarkdownForRender } from '../Home/lib/mooniModelMessageText.js';
import MooniChatMarkdown from '../../components/chat/MooniChatMarkdown.jsx';

const GUKHYANG_MODEL = [
  '용산역에서 ITX-새마을로 함평역까지 가는 편이 환승 없이 편해요.',
  'KTX는 광주송정에서 내린 뒤 ITX·무궁화로 함평역에 이어야 해요.',
  '함평역에서 택시나 시내버스로 함평엑스포공원까지 15분 정도면 충분해요.',
].join(' ');

const MASAN_MODEL = [
  '동대구역에서 KTX로 마산역에 도착해요.',
  '마산역에서 3·15해양누리공원까지 버스나 택시로 가면 돼요.',
  '열차·버스 시각은 [코레일](https://www.letskorail.com/), [고속버스](https://www.kobus.co.kr/), [시외버스](https://txbus.t-money.co.kr/)에서 확인할 수 있어요.',
].join(' ');

function polishAccessSample(contentId, title, venue, modelReply, originId) {
  const ctx = buildFestivalMooniContext({
    item: { contentId, title, eventStartDate: contentId === '638576' ? '20261023' : '20261031', eventEndDate: '20261108' },
    intro: { eventplace: venue },
  });
  const userText = buildFestivalAccessAskText(originId, 'ko');
  const opts = buildFestivalMooniPolishOptions(ctx, {
    locale: 'ko',
    chipId: 'festival_access',
    userText,
  });
  const polished = polishFestivalModelReply(modelReply, opts);
  return getMooniModelMarkdownForRender(polished);
}

function ChatBubble({ testId, title, userLabel, markdown }) {
  return (
    <div data-testid={testId} className="max-w-[360px] mx-auto space-y-3">
      <p className="text-cyan-400/90 text-xs font-bold truncate">{title}</p>
      <div className="flex justify-end">
        <div className="bg-cyan-600/90 text-white text-sm px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%]">
          {userLabel}
        </div>
      </div>
      <div className="w-full p-4 rounded-2xl text-base shadow-md rounded-tl-sm leading-relaxed bg-gray-800 text-gray-200">
        <MooniChatMarkdown text={markdown} variant="dark" />
      </div>
    </div>
  );
}

export default function MooniFestivalAccessPolishFixturePage() {
  const gukhyang = useMemo(
    () => polishAccessSample('638576', '국향대전', '함평엑스포공원', GUKHYANG_MODEL, 'seoul'),
    [],
  );
  const masan = useMemo(
    () => polishAccessSample('637693', '마산가고파국화축제', '3·15해양누리공원', MASAN_MODEL, 'daegu'),
    [],
  );

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-3 space-y-10">
      <p className="text-center text-[10px] font-mono text-slate-500">MOONi festival access polish (QA)</p>
      <ChatBubble
        testId="mooni-access-638576-seoul"
        title="국향대전 · 가는 법"
        userLabel={buildFestivalAccessAskText('seoul', 'ko')}
        markdown={gukhyang}
      />
      <ChatBubble
        testId="mooni-access-637693-daegu"
        title="마산가고파국화축제 · 가는 법"
        userLabel={buildFestivalAccessAskText('daegu', 'ko')}
        markdown={masan}
      />
    </div>
  );
}
