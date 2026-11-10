import React from 'react';
import { MooniChatMarkdownBoundary } from '../../components/chat/MooniChatMarkdownBoundary.jsx';
import { getMooniModelMarkdownForRender, getMooniModelRawText } from '../Home/lib/mooniModelMessageText.js';

const LIVE_GUAM_TABLE =
  '구분 | 괌 | 오키나와 | 팔라우 | 보홀 : | : | : | : | 주요 특징 | 쇼핑과 휴양의 조화 | 일본식 문화와 휴양 | 세계적인 다이빙 명소 | 자연 친화적, 돌고래 투어 이동 편의 | 직항 많고 접근성 좋음 | 직항 많고 교통 편리 | 직항 적음, 경유 필요 | 세부 경유 또는 직항 주요 활동 | 쇼핑, 해양 액티비티 | 역사 유적, 드라이브 | 스쿠버 다이빙, 스노클링 | 초콜릿 힐, 안경원숭이 추천 동행 | 가족 여행객 | 가족, 커플, 친구 | 다이빙 애호가 | 자연을 선호하는 커플';

const LIVE_UDO_BOLD =
  '우도에는 ** 천진항**과 ** 하우목동항** 두 곳이 있어요.\n\n**이동 시간**: 15분\n\n**출발 항구 선택**: 성산';

const savedTextOnly = { role: 'model', text: LIVE_GUAM_TABLE };
const savedRaw = { role: 'model', text: LIVE_GUAM_TABLE, mooniRawReply: LIVE_GUAM_TABLE };
const savedUdoText = { role: 'model', text: LIVE_UDO_BOLD };
const savedUdoRaw = { role: 'model', text: LIVE_UDO_BOLD, mooniRawReply: LIVE_UDO_BOLD };

function SavedBubble({ msg, testId }) {
  const raw = getMooniModelRawText(msg);
  const display = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  return (
    <div data-testid={testId} className="w-full max-w-md p-4 rounded-2xl bg-gray-800 text-gray-200">
      <MooniChatMarkdownBoundary text={display} variant="dark" />
    </div>
  );
}

export default function MooniSavedChatMarkdownPage() {
  return (
    <div className="min-h-screen bg-black/90 p-4 space-y-6">
      <h1 className="text-white text-sm font-mono">MOONi saved chat replay (QA)</h1>
      <section data-testid="mooni-saved-guam-text-only">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">괌 표 — text only (no mooniRawReply)</p>
        <SavedBubble msg={savedTextOnly} testId="mooni-saved-guam-text-only-bubble" />
      </section>
      <section data-testid="mooni-saved-guam-raw">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">괌 표 — mooniRawReply</p>
        <SavedBubble msg={savedRaw} testId="mooni-saved-guam-raw-bubble" />
      </section>
      <section data-testid="mooni-saved-udo-text-only">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">우도 bold — text only</p>
        <SavedBubble msg={savedUdoText} testId="mooni-saved-udo-text-only-bubble" />
      </section>
      <section data-testid="mooni-saved-udo-raw">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">우도 bold — mooniRawReply</p>
        <SavedBubble msg={savedUdoRaw} testId="mooni-saved-udo-raw-bubble" />
      </section>
    </div>
  );
}
