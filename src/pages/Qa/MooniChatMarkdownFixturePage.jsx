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

const COLLAPSED_COMPARE_TABLE =
  '| 구분 | 괌 | 오키나와 | 팔라우 | | --- | --- | --- | --- | | 비자 | 미국령 | 일본 | 무비자 |';

const LIVE_MERGED_COMPARE_TABLE =
  '| 구분 | 괌 | 사이판 | 세부 | 보홀 | : | : | : | : | : | **주요 매력** | 괌 비치 | 사이판 다이빙 | 세부 망고 | 보홀 고래';

const PROD_COLLAPSED_GUAM_COMPARE =
  '구분 | 괌 (Guam) | 오키나와 (Okinawa) | 팔라우 (Palau) | 보홀 (Bohol) : | : | : | : | : 주요 매력 | 쇼핑, 휴양, 가족 친화적 | 드라이브, 미식, 역사 탐방 | 최고의 다이빙 및 스노클링 | 자연 경관, 돌고래 투어 분위기 | 세련되고 편리한 휴양지 | 일본 감성의 여유로운 섬 | 원시 자연 그대로의 평화 | 자연과 어우러진 이동 편의 | 렌터카 선호, 교통 편리 | 렌터카 필수 | 투어 위주 이동 | 렌터카/툭툭 이동 추천 대상 | 쇼핑과 휴식을 중시하는 커플 | 먹거리와 문화 체험 선호 커플 | 바다 속 풍경을 사랑하는 커플 | 이색적인 자연 체험 선호 커플';

const UDO_DUAL_SPACED_BOLD = '우도에는 ** 천진항과 ** 하우목동항 ** 이 있어요';

const ORDERED_WITH_GAP = `1. 우도 터미널 집결

짧은 이동 안내

1. 성산 일출봉

2. 카약 체험

3. 섭지코지 산책`;

const NO_OUTER_PIPE_COMPARE_TABLE = `구분 | 괌 | 오키나와 | 팔라우 | 보홀
:--- | :--- | :--- | :--- | :---
**주요 특징** | 쇼핑 | 문화 | 다이빙 | 자연`;

const DUAL_BOLD_ONE_LINE =
  '우도에는 **천진항과** 하우목동항이 있어요. ** 리조트 체크인** · **1일차** 오전 **Bohol**';

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
      <section data-testid="mooni-md-collapsed-table" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Collapsed compare table</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(COLLAPSED_COMPARE_TABLE, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-live-merged-table" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Live merged compare table</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(LIVE_MERGED_COMPARE_TABLE, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-no-outer-pipe-table" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Compare table (no outer pipes)</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(NO_OUTER_PIPE_COMPARE_TABLE, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-dual-bold-line" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Dual bold on one line</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(DUAL_BOLD_ONE_LINE, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-prod-collapsed-compare" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">PROD collapsed 괌 compare (11/10)</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(PROD_COLLAPSED_GUAM_COMPARE, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-udo-spaced-bold" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">PROD 우도 spaced bold (11/9)</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(UDO_DUAL_SPACED_BOLD, {
              stripPhantomTicketMention: true,
            })}
            variant="dark"
          />
        </Bubble>
      </section>
      <section data-testid="mooni-md-ordered-gap" className="space-y-2">
        <p className="text-gray-400 text-[10px] font-bold uppercase">Ordered list across paragraphs</p>
        <Bubble variant="dark">
          <MooniChatMarkdown
            text={getMooniModelMarkdownForRender(ORDERED_WITH_GAP, {
              stripPhantomTicketMention: true,
            })}
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
