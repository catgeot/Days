import React from 'react';
import MooniChatMarkdown from '../../components/chat/MooniChatMarkdown.jsx';
import { getMooniModelMarkdownForRender } from '../Home/lib/mooniModelMessageText.js';

const SAMPLE = `**2박 3일 힐링 코스**

---

### 🍁 오대산 선재길 단풍 여행 2박 3일 추천 일정

#### 1일차: 평창 도착 및 가벼운 숲길 산책 (적응 단계)

* **오후 (도착 및 체크인):** 진부역 도착 후 숙소 체크인
* **월정사~회사거리** 선재길 가벼운 산책

1. 오전: 월정사 전나무 숲길
2. 오후: 선재길 구간

자세한 안내는 [GATEO](https://www.gateo.kr/)에서 확인하세요.`;

const TRUNCATED = `### 미완성 스트리밍

**굵게 진행 중`;

const COMPARE_TABLE = `| 항목 | 괌 | 오키나와 | 팔라우 | 보홀 |
| --- | --- | --- | --- | --- |
| 비자 | 미국령 | 일본 | 무비자 | 필리핀 |
| **13:30 ** 출발 | 직항 | 직항 | 경유 | 경유 |

**1일차** 오전 **Bohol** 투어 · **Okinawa** 비치 — travel **experience** 요약.`;

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

function Bubble({ variant, children }) {
  const shell =
    variant === 'dark'
      ? 'bg-gray-800 text-gray-200'
      : 'bg-white/90 border border-cyan-100 text-slate-700';
  return (
    <div className={`w-full max-w-md p-4 rounded-2xl text-base shadow-md rounded-tl-sm leading-relaxed ${shell}`}>
      {children}
    </div>
  );
}

export default function MooniChatMarkdownFixturePage() {
  return (
    <div className="min-h-screen bg-black/80 p-4 md:p-8 space-y-8">
      <h1 className="text-white text-sm font-mono">MOONi markdown fixture (QA only)</h1>
      <section data-testid="mooni-md-dark" className="space-y-2">
        <p className="text-cyan-400 text-[10px] font-bold uppercase">Dark bubble</p>
        <Bubble variant="dark">
          <MooniChatMarkdown text={SAMPLE} variant="dark" />
        </Bubble>
      </section>
      <section data-testid="mooni-md-light" className="space-y-2">
        <p className="text-cyan-600 text-[10px] font-bold uppercase">Light bubble</p>
        <Bubble variant="light">
          <MooniChatMarkdown text={SAMPLE} variant="light" />
        </Bubble>
      </section>
      <section data-testid="mooni-md-truncated" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Truncated stream</p>
        <Bubble variant="dark">
          <MooniChatMarkdown text={TRUNCATED} variant="dark" />
        </Bubble>
      </section>
      <section data-testid="mooni-md-table" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">4-place compare table</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(COMPARE_TABLE, { stripPhantomTicketMention: true })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section
        data-testid="mooni-composer-qa-thread"
        className="mx-auto w-full max-w-full space-y-2 px-1"
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
            className="mt-4 px-1 text-[10px] text-gray-500"
          >
            Fixture footer spacer — mock only, not PROD chat chrome
          </p>
        </div>
      </section>
    </div>
  );
}
