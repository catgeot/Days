import React from 'react';
import MooniChatMarkdown from '../../components/chat/MooniChatMarkdown.jsx';
import { getMooniModelMarkdownForRender } from '../Home/lib/mooniModelMessageText.js';

const COMPOSER_MOCK_RAW = [
  'Here **A** and **B** in one line.',
  '**1일차** 오전 **Bohol** · **Okinawa** — travel **experience**.',
  '| 항목 | 괌 | 링크 |\n| --- | --- | --- |\n| **13:30 ** 출발 | 직항 | [GATEO](https://www.gateo.kr/) |',
  '* bullet one\n* bullet two',
  '',
  'Paragraph after list — chips sit below this block (mock).',
  '<script>alert(1)</script>',
  '[loopback](http://127.0.0.1/x)',
].join('\n');

const COMPOSER_MARKDOWN = getMooniModelMarkdownForRender(COMPOSER_MOCK_RAW, {
  stripPhantomTicketMention: true,
});

export default function MooniMarkdownComposerFixturePage() {
  return (
    <div
      data-testid="mooni-composer-qa-isolated"
      className="min-h-screen w-full min-w-0 overflow-x-hidden bg-black p-4 pb-8 box-border"
    >
      <p className="text-[10px] font-mono text-cyan-500 mb-3">
        QA only — isolated composer mock (no MainLayout trust bar)
      </p>
      <section
        data-testid="mooni-composer-qa-thread"
        className="mx-auto w-full max-w-md min-w-0 space-y-2"
      >
        <p className="text-cyan-400 text-[10px] font-bold uppercase">Composer QA (mock MOONi turn)</p>
        <div className="flex flex-col items-start w-full min-w-0">
          <span className="text-[10px] font-bold mb-1 px-1 uppercase tracking-wider text-cyan-400">
            MOONi
          </span>
          <div
            data-testid="mooni-composer-qa-bubble"
            className="mooni-composer-qa-bubble p-4 rounded-2xl text-base shadow-md w-full min-w-0 bg-gray-800 text-gray-200 rounded-tl-sm leading-relaxed"
          >
            <MooniChatMarkdown text={COMPOSER_MARKDOWN} variant="dark" />
          </div>
          <div
            data-testid="mooni-composer-qa-chips"
            className="flex flex-wrap gap-2 mt-3 w-full min-w-0 px-1"
          >
            {['다음 일정', '숙소 비교', '입국 서류'].map((label) => (
              <span
                key={label}
                className="inline-flex shrink-0 min-h-[36px] items-center rounded-full border border-cyan-500/35 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-100"
              >
                {label}
              </span>
            ))}
          </div>
          <p
            data-testid="mooni-composer-qa-foot"
            className="mt-4 px-1 text-[10px] text-gray-500 leading-relaxed"
          >
            Fixture footer spacer — mock only, not PROD chat chrome
          </p>
        </div>
      </section>
    </div>
  );
}
