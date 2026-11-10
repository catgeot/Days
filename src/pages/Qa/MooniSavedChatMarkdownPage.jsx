import React from 'react';
import liveExtract from '../../fixtures/mooniGuestTripsLiveLocalStorageExtract.json';
import { MooniChatMarkdownBoundary } from '../../components/chat/MooniChatMarkdownBoundary.jsx';
import { getMooniModelMarkdownForRender, getMooniModelRawText } from '../Home/lib/mooniModelMessageText.js';

const { guam, udo } = liveExtract;

const savedGuamTextOnly = { role: guam.role, text: guam.text, finishReason: guam.finishReason };
const savedGuamRaw = {
  role: guam.role,
  text: guam.text,
  mooniRawReply: guam.mooniRawReply,
  finishReason: guam.finishReason,
};
const savedUdoTextOnly = { role: udo.role, text: udo.text, finishReason: udo.finishReason };
const savedUdoRaw = {
  role: udo.role,
  text: udo.text,
  mooniRawReply: udo.mooniRawReply,
  finishReason: udo.finishReason,
};

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
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">괌 표 — text only (live guest)</p>
        <SavedBubble msg={savedGuamTextOnly} testId="mooni-saved-guam-text-only-bubble" />
      </section>
      <section data-testid="mooni-saved-guam-raw">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">괌 표 — mooniRawReply (live guest)</p>
        <SavedBubble msg={savedGuamRaw} testId="mooni-saved-guam-raw-bubble" />
      </section>
      <section data-testid="mooni-saved-udo-text-only">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">우도 — text only (live guest)</p>
        <SavedBubble msg={savedUdoTextOnly} testId="mooni-saved-udo-text-only-bubble" />
      </section>
      <section data-testid="mooni-saved-udo-raw">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">우도 — mooniRawReply (live guest)</p>
        <SavedBubble msg={savedUdoRaw} testId="mooni-saved-udo-raw-bubble" />
      </section>
    </div>
  );
}
