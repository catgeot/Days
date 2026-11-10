import React from 'react';
import liveExtract from '../../fixtures/mooniGuestTripsLiveLocalStorageExtract.json';
import { MooniChatMarkdownBoundary } from '../../components/chat/MooniChatMarkdownBoundary.jsx';
import { getMooniModelMarkdownForRender, getMooniModelRawText } from '../Home/lib/mooniModelMessageText.js';

const { guam, udo } = liveExtract;

/** QA·캡처 SSOT — fixture JSON 4경로만 (text·mooniRawReply × guam·udo). */
function fixtureMessage(entry, mode) {
  const base = { role: entry.role, finishReason: entry.finishReason };
  if (mode === 'mooniRawReply') {
    return { ...base, text: entry.text, mooniRawReply: entry.mooniRawReply };
  }
  return { ...base, text: entry.text };
}

const GUAM_TEXT = fixtureMessage(guam, 'text');
const GUAM_RAW = fixtureMessage(guam, 'mooniRawReply');
const UDO_TEXT = fixtureMessage(udo, 'text');
const UDO_RAW = fixtureMessage(udo, 'mooniRawReply');

function SavedBubble({ msg, testId }) {
  const raw = getMooniModelRawText(msg);
  const display = getMooniModelMarkdownForRender(raw, { stripPhantomTicketMention: true });
  return (
    <div data-testid={testId} className="w-full max-w-md p-4 rounded-2xl bg-gray-800 text-gray-200 text-sm leading-relaxed">
      <MooniChatMarkdownBoundary text={display} variant="dark" />
    </div>
  );
}

export default function MooniSavedChatMarkdownPage() {
  return (
    <div className="min-h-screen bg-black/90 p-4 space-y-8">
      <h1 className="text-white text-sm font-mono">MOONi saved chat replay (QA)</h1>
      <p className="text-gray-500 text-[10px] font-mono">SSOT: src/fixtures/mooniGuestTripsLiveLocalStorageExtract.json</p>

      <section data-testid="mooni-live-guam-text">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">guam.text (live guest)</p>
        <SavedBubble msg={GUAM_TEXT} testId="mooni-saved-guam-text-only-bubble" />
      </section>
      <section data-testid="mooni-live-guam-mooniRawReply">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">guam.mooniRawReply (live guest · 캡처 괌 표)</p>
        <SavedBubble msg={GUAM_RAW} testId="mooni-saved-guam-raw-bubble" />
      </section>
      <section data-testid="mooni-live-udo-text">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">udo.text (live guest)</p>
        <SavedBubble msg={UDO_TEXT} testId="mooni-saved-udo-text-only-bubble" />
      </section>
      <section data-testid="mooni-live-udo-mooniRawReply">
        <p className="text-cyan-400 text-[10px] font-bold uppercase mb-2">udo.mooniRawReply (live guest · 캡처 도착·탑승)</p>
        <SavedBubble msg={UDO_RAW} testId="mooni-saved-udo-raw-bubble" />
      </section>
    </div>
  );
}
