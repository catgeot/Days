import React from 'react';
import MooniChatMarkdown from '../../components/chat/MooniChatMarkdown.jsx';

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
    </div>
  );
}
