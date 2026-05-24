/** MOONi FAB 말풍선 SSOT — intro · peek · idle · react · easterEgg */

const EASTER_EGG_CHANCE = 0.03;

export const MOONI_LINE_POOLS = {
  intro: [
    '안녕! MOONi예요.',
    '반가워요, MOONi예요.',
    '오늘도 여행 기분, MOONi예요.',
  ],
  peek: {
    invite: [
      'MOONi와 이야기해 봐요',
      '어서 오세요',
      '궁금한 게 있으면 눌러보세요',
      '살짝만 불러주세요',
      '저랑 한마디 할래요?',
      '탭하면 대화 시작이에요',
    ],
    curious: [
      '떠나고 싶은 곳이 어디인가요?',
      '여행 이야기 들려주세요',
      '오늘 기분은 어디로 가고 싶은 기분?',
      '지금 떠오르는 곳이 있어요?',
      '어디부터 알아볼까요?',
    ],
    tease: [
      '저… 안 자고 있어요',
      '지도 구경 중이에요',
      '말 걸어주면 기뻐요',
      '구름 사이로 엿보는 중…',
      '살짝 졸렸다 깼어요',
    ],
  },
  idle: {
    playful: [
      'Z Z Z…',
      '구름 위를 걸어볼까…',
      '바람 냄새가 여행 같아요.',
      '여기저기 구경 중…',
      '멀리 있는 섬이 보여요.',
      '별빛 여행, 떠올려 볼까요?',
    ],
    travel: [
      '안녕하세요, MOONi입니다.',
      '떠나고 싶어요…',
      '오늘은 어디로 갈까요?',
      '지도만 봐도 마음이 가요.',
      '다음 휴가는 언제죠…',
      '파란 바다가 보이는 것 같아요.',
    ],
    hint: [
      '궁금한 게 있으면 불러주세요.',
      '일정·교통도 물어보세요',
      '가고 싶은 섬 이름만 말해도 돼요',
      '여행지 추천도 도와드려요',
      '항공·페리 궁금한 것도 OK',
    ],
  },
  react: {
    drag: [
      '앗, 거기요!',
      '천천히 옮겨 주세요~',
      '바람 따라 날아가요',
      '여기도 뷰가 좋네요',
      '드래그도 OK예요',
    ],
    dismiss: [
      '다음에 또 올게요…',
      '조용히 구름 보러 갈게요',
      '필요하면 또 불러주세요',
      '천천히 둘러보세요~',
    ],
  },
  easterEgg: [
    '…별 하나를 훔쳐 올까요?',
    'MOONi는 달에서 왔어요. 비밀이에요.',
    '지구는 생각보다 넓어요!',
    '오늘은 행운의 여행지가… (두근)',
  ],
};

const IDLE_CATEGORY_ORDER = ['playful', 'travel', 'hint'];

function pickRandomIndex(pool, lastIndex) {
  if (pool.length <= 1) return 0;
  let index;
  do {
    index = Math.floor(Math.random() * pool.length);
  } while (index === lastIndex);
  return index;
}

function rollEasterEgg() {
  return Math.random() < EASTER_EGG_CHANCE;
}

function pickFromFlatPool(pool, lastIndex) {
  const index = pickRandomIndex(pool, lastIndex);
  return { text: pool[index], index };
}

/** 세션 intro — 단일 줄 */
export function pickIntroLine(lastIndex = -1) {
  return pickFromFlatPool(MOONI_LINE_POOLS.intro, lastIndex);
}

/** 호버·누르고 있기 peek */
export function pickPeekLine(lastCategory = null) {
  if (rollEasterEgg()) {
    const { text } = pickFromFlatPool(MOONI_LINE_POOLS.easterEgg, -1);
    return { text, category: 'easterEgg' };
  }

  const categories = Object.keys(MOONI_LINE_POOLS.peek);
  let category = categories[Math.floor(Math.random() * categories.length)];
  if (categories.length > 1) {
    let guard = 0;
    while (category === lastCategory && guard < 8) {
      category = categories[Math.floor(Math.random() * categories.length)];
      guard += 1;
    }
  }

  const pool = MOONI_LINE_POOLS.peek[category];
  const index = Math.floor(Math.random() * pool.length);
  return { text: pool[index], category };
}

/** 45초(모바일 32초) idle nudge — 카테고리 순환 */
export function pickIdleLine(lastCategory = null) {
  if (rollEasterEgg()) {
    const { text } = pickFromFlatPool(MOONI_LINE_POOLS.easterEgg, -1);
    return { text, category: 'easterEgg' };
  }

  const lastIdx = lastCategory ? IDLE_CATEGORY_ORDER.indexOf(lastCategory) : -1;
  const nextIdx = (lastIdx + 1) % IDLE_CATEGORY_ORDER.length;
  const category = IDLE_CATEGORY_ORDER[nextIdx];
  const pool = MOONI_LINE_POOLS.idle[category];
  const index = Math.floor(Math.random() * pool.length);
  return { text: pool[index], category };
}

export function pickDragReactLine(lastIndex = -1) {
  return pickFromFlatPool(MOONI_LINE_POOLS.react.drag, lastIndex);
}

export function pickDismissReactLine(lastIndex = -1) {
  return pickFromFlatPool(MOONI_LINE_POOLS.react.dismiss, lastIndex);
}

export const MOONI_INTRO_SEEN_KEY = 'gateo_mooni_intro_seen';

export function hasMooniIntroSeen() {
  try {
    return sessionStorage.getItem(MOONI_INTRO_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markMooniIntroSeen() {
  try {
    sessionStorage.setItem(MOONI_INTRO_SEEN_KEY, '1');
  } catch {
    // ignore
  }
}

/** 터치·coarse pointer — idle nudge 간격 단축 */
export function getMooniNudgeIntervalMs() {
  if (typeof window === 'undefined') return 45_000;
  return window.matchMedia('(hover: none)').matches ? 32_000 : 45_000;
}
