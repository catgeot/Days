import { i18n } from '../../../i18n/config.js';
import { curationTasteLabelById } from '../../DailyReport/lib/curationHistory.js';

function curationTasteLabelsForPrompt(tasteTags, locale) {
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  return (tasteTags || [])
    .map((id) => {
      const key = String(id ?? '').trim();
      if (!key) return '';
      if (!isEn) return curationTasteLabelById(key);
      return i18n.t(`logbook.curationHub.taste.${key}`, {
        lng: 'en',
        defaultValue: curationTasteLabelById(key),
      });
    })
    .filter(Boolean);
}

// 큐레이션 전용 프롬프트 (excludeList: 지명 문자열 또는 history 객체)
export const getCurationPrompt = (
  validReports = [],
  validSaved = [],
  excludeList = [],
  {
    rejectedList = [],
    tasteTags = [],
    recentSearches = [],
    recentVisited = [],
    locale = 'ko',
  } = {},
) => {
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  const reportLines = (validReports || [])
    .map((r) => String(r?.location || '').trim())
    .filter(Boolean)
    .map((loc) => `- ${loc}`);
  const savedLines = (validSaved || [])
    .map((s) => String(s?.destination || '').trim())
    .filter(Boolean)
    .map((dest) => `- ${dest}`);
  const searchLines = (recentSearches || [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((s) => `- ${s}`);
  const visitedLines = (recentVisited || [])
    .map((v) => {
      if (typeof v === 'string') return v.trim();
      return String(v?.name || v?.location || '').trim();
    })
    .filter(Boolean)
    .slice(0, 10)
    .map((v) => `- ${v}`);

  const surveyLabels = curationTasteLabelsForPrompt(tasteTags, locale);
  const hasSurvey = surveyLabels.length > 0;
  const hasExploreTaste = searchLines.length > 0 || visitedLines.length > 0;
  const hasTasteData =
    reportLines.length > 0 || savedLines.length > 0 || hasSurvey || hasExploreTaste;

  const excludeNames = (excludeList || [])
    .map((item) => (typeof item === 'string' ? item : item?.location))
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  const rejectedNames = (rejectedList || [])
    .map((item) => (typeof item === 'string' ? item : item?.location))
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  const noneLabel = isEn ? '(none)' : '(없음)';
  let userDataText;
  if (hasTasteData) {
    const parts = [];
    if (reportLines.length || savedLines.length) {
      parts.push(
        isEn
          ? `[Past logbook entries] ${reportLines.length ? reportLines.join(', ') : noneLabel}`
          : `[사용자의 과거 기록] ${reportLines.length ? reportLines.join(', ') : noneLabel}`,
      );
      parts.push(
        isEn
          ? `[Saved trips] ${savedLines.length ? savedLines.join(', ') : noneLabel}`
          : `[사용자의 북마크] ${savedLines.length ? savedLines.join(', ') : noneLabel}`,
      );
    }
    if (searchLines.length) {
      parts.push(
        isEn ? `[Recent searches] ${searchLines.join(', ')}` : `[최근 검색어] ${searchLines.join(', ')}`,
      );
    }
    if (visitedLines.length) {
      parts.push(
        isEn
          ? `[Recently visited] ${visitedLines.join(', ')}`
          : `[최근 방문 목적지] ${visitedLines.join(', ')}`,
      );
    }
    if (hasSurvey) {
      parts.push(
        isEn
          ? `[Taste survey] Preferred vibes: ${surveyLabels.join(', ')}`
          : `[취향 설문] 선호 분위기: ${surveyLabels.join(', ')}`,
      );
    }
    userDataText = `\n    ${parts.join('\n    ')}\n  `;
  } else {
    userDataText = isEn
      ? `
    [Taste data] None (logged out / no history). Do not tailor to a specific user — freely recommend one lesser-known hidden gem for a broad audience.
  `
      : `
    [취향 데이터] 없음 (비로그인·기록 없음). 특정 사용자 이력에 맞추지 말고, 대중에게 덜 알려진 숨겨진 낙원 1곳을 자유롭게 추천하세요.
  `;
  }

  const excludeText =
    excludeNames.length > 0
      ? isEn
        ? `\n🚨 [Must exclude]: ${excludeNames.join(', ')} (already recommended — do not suggest again).`
        : `\n🚨 [강제 제외 장소]: ${excludeNames.join(', ')} (이미 추천한 곳이므로 다시 추천하지 마세요.)`
      : '';

  const rejectedText =
    rejectedNames.length > 0
      ? isEn
        ? `\n🚫 [Rejected picks]: ${rejectedNames.join(', ')} — the user dismissed these. Avoid similar vibe, type, or region; pick a different hidden gem.`
        : `\n🚫 [취향 불일치·삭제된 추천]: ${rejectedNames.join(', ')} — 사용자가 맞지 않다고 지운 장소입니다. 이 장소와 비슷한 분위기·유형·지역 성격도 피하고, 다른 취향의 숨은 낙원을 추천하세요.`
      : '';

  if (isEn) {
    return `You are GATEO's lead travel curator who knows hidden gems worldwide.
Recommend exactly one lesser-known paradise${hasTasteData ? " that fits the user's taste" : ''}.

[User taste signals]
${userDataText}${excludeText}${rejectedText}

🚨 [Language & data rules]
1. "location": accurate Korean place name for catalog matching (e.g. 아이투타키).
2. "locationEn": accurate English place name (City, Country) (e.g. Aitutaki, Cook Islands).
3. "title": English only. Short, evocative headline (max ~60 characters).
4. "description": English only. Rich sensory storytelling (~300 characters), not a dry summary.
5. "searchKeyword": English only for Unsplash. Include place name plus visual keywords (nature, landscape, beach, etc.).
6. "whyHidden": English. 1–2 sentences on why it is lesser known (single line, no line breaks).
7. "bestSeason": English. Short best-time-to-visit phrase.
8. "tips": English string array, 2–4 practical tips, one line each.
9. Never put real line breaks or tabs inside JSON string values — use spaces only.
10. Do not mention or compare the user's past trips or taste data in the output. Focus only on the recommended place.

Output JSON only:
{
  "location": "Korean place name (e.g. 아이투타키)",
  "locationEn": "English place name (e.g. Aitutaki, Cook Islands)",
  "title": "English headline",
  "description": "English storytelling (single line)",
  "searchKeyword": "English image search keywords",
  "whyHidden": "Why it is hidden (English, one line)",
  "bestSeason": "Best season (English, short)",
  "tips": ["tip1", "tip2", "tip3"]
}`;
  }

  return `당신은 세계 곳곳의 숨겨진 명소를 잘 아는 GATEO의 수석 여행 큐레이터입니다.
대중에게 덜 알려졌으나${hasTasteData ? ', 사용자의 취향에 완벽히 맞는' : ''} 숨겨진 낙원 딱 1곳을 추천하세요.

[사용자 취향 데이터]
${userDataText}${excludeText}${rejectedText}

🚨 [언어 및 데이터 정합성 엄수 규칙]
1. "location": 구글 검색이 가능한 정확한 '한국어 지명' (예: 아이투타키).
2. "locationEn": 정확한 '영문 고유 지명 (City, Country 형식)' (예: Aitutaki, Cook Islands).
3. "title": 반드시 '한국어'로 작성. 공백 포함 15자 이내의 짧고 매혹적인 제목.
4. "description": 반드시 '한국어'로 작성. 단순 요약이 아닌, 공간의 분위기와 감각이 느껴지는 300자 내외의 풍부하고 깊이 있는 스토리텔링.
5. "searchKeyword": 🚨 반드시 '영어(English)'로만 작성. Unsplash API 이미지 검색용입니다. 특정 지명만 넣으면 사진이 안 나올 수 있으므로, 지명과 함께 그 장소의 시각적 특징을 나타내는 풍경 키워드(예: nature, landscape, city, beach 등)를 반드시 포함하세요. (예: "Aitutaki tropical island pristine beach clear water landscape").
6. "whyHidden": 반드시 '한국어'. 왜 대중에게 덜 알려졌는지 1~2문장 (줄바꿈 없이).
7. "bestSeason": 반드시 '한국어'. 가기 좋은 시기·계절을 짧게 (예: "5~9월 건기").
8. "tips": 반드시 한국어 문자열 배열 2~4개. 실용·덜 알려진 팁. 각 항목은 한 줄.
9. [치명적 시스템 에러 방지]: 응답을 생성할 때, JSON 문자열 내부에 절대로 실제 줄바꿈(Enter)이나 탭(Tab) 키를 치지 마세요. 문장이 길어도 반드시 띄어쓰기(Space)로만 구분하며 한 줄로 쭉 작성하세요.
10. [침묵 규칙]: 사용자의 과거 방문지나 취향 데이터를 결과물에 절대 직접 언급하거나 비교하지 마세요. (예: "~를 다녀오신 당신에게" 같은 표현 엄금). 오직 새롭게 추천하는 장소 자체의 매력과 풍경 묘사에만 100% 집중하세요.

응답은 반드시 아래 JSON 형식으로만 출력하세요:
{
  "location": "한국어 지명 (예: 아이투타키)",
  "locationEn": "영문 고유 지명 (예: Aitutaki, Cook Islands)",
  "title": "한국어 제목 (15자 이내)",
  "description": "한국어 스토리텔링 설명 (줄바꿈 없이 한 줄로 작성)",
  "searchKeyword": "영문 확장 키워드",
  "whyHidden": "덜 알려진 이유 (한국어 한 줄)",
  "bestSeason": "가기 좋은 시기 (한국어 짧은 문구)",
  "tips": ["실용 팁1", "실용 팁2", "숨은 팁3"]
}`;
};
