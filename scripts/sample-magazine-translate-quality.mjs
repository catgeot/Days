/**
 * Sample KO magazine prose → Google Translate (unofficial gtx client) for quality review.
 * Not used in production — decision aid for #43 Travel Sketch EN strategy.
 *
 * Usage: node scripts/sample-magazine-translate-quality.mjs
 */
const SAMPLE_KO = `권력이 만들어낸 거대한 대리석 기념비들의 도시. 하지만 그 이면에는 붉은 벽돌과 짙은 녹음이 빚어내는 다정한 숨결이 흐릅니다. 🏛️

[ 에디터의 시선 ]
워싱턴 DC의 봄은 벚꽃이 아니라 기념비의 그림자에서 시작됩니다. 국회의사당 돔 아래를 걸을 때면, 대리석의 차가움이 햇살에 녹아 공기 중에 맴돕니다.

[ 미각의 기억 ]
이 도시의 아침은 커피 향보다 브런치 줄의 웅성거림으로 깨어납니다. 현지인들이 주말마다 찾는 남부식 그릴과 해산물 타코는 이름을 외울 필요 없이, 골목의 온기만 기억하면 됩니다.`;

async function googleTranslateKoToEn(text) {
  const url = new URL('https://translate.googleapis.com/translate_a/single');
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('sl', 'ko');
  url.searchParams.set('tl', 'en');
  url.searchParams.set('dt', 't');
  url.searchParams.set('q', text);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`translate HTTP ${res.status}`);
  const data = await res.json();
  return data[0].map((part) => part[0]).join('');
}

function printSection(title, body) {
  console.log(`\n=== ${title} ===\n`);
  console.log(body);
}

async function main() {
  printSection('Korean original (magazine-style sample)', SAMPLE_KO);

  try {
    const translated = await googleTranslateKoToEn(SAMPLE_KO);
    printSection('Google Translate (gtx) output', translated);

    console.log('\n=== Quality notes (editorial) ===\n');
    console.log('- Structure: bracket anchors like [ Editor\'s eye ] usually survive; rhythm may flatten.');
    console.log('- Tone: literary metaphors often become literal or generic ("beautiful city").');
    console.log('- Place names: generally OK; honorific endings become neutral English.');
    console.log('- Verdict: readable for gist, below Condé Nast feature tone — native EN generation preferred for new EN rows.');
  } catch (err) {
    console.error('Translate fetch failed (network?). Qualitative notes only:', err.message);
    console.log('\nWithout live translate: expect flattened rhythm, lost nuance in sensory lines, OK for facts, weak for feature voice.');
  }
}

main();
