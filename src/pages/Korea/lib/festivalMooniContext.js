import { gateoKoreaFestivalDetailUrl } from '../../../shared/korea/mooniKoreaFestivalAssist.js';
import { todayYmd } from '../festivalTimeFilter.js';
import { festivalLngLat } from '../koreaFestivalCorridors.js';

function stripHtml(raw) {
  return String(raw || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipText(raw, max = 320) {
  const t = stripHtml(raw);
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

function festivalEnded(endYmd, now = new Date()) {
  const end = String(endYmd || '').trim();
  if (!/^\d{8}$/.test(end)) return false;
  return end < todayYmd(now);
}

/**
 * @param {{
 *   item?: Record<string, unknown>,
 *   intro?: Record<string, unknown>,
 *   location?: Record<string, unknown> | null,
 *   homepage?: string,
 *   tel?: string,
 *   summaryFields?: { dateText?: string, timeText?: string, fee?: { text?: string } },
 *   overview?: string,
 *   program?: string,
 *   now?: Date,
 * }} input
 */
export function buildFestivalMooniContext(input = {}) {
  const { item, intro, homepage, summaryFields, location, overview, program, tel, now } =
    input;
  const hubLabel = String(location?.name || location?.parentCity || '').trim();
  const title = String(item?.title || '').trim();
  const contentId = String(item?.contentId || '').trim();
  if (!title && !contentId) return null;

  const pt = festivalLngLat(item?.mapx, item?.mapy);
  const venue = String(intro?.eventplace || '').trim();
  const address = String(item?.addr1 || '').trim();
  const eventStartDate = String(
    item?.eventStartDate || intro?.eventstartdate || intro?.eventStartDate || '',
  ).trim();
  const eventEndDate = String(
    item?.eventEndDate || intro?.eventenddate || intro?.eventEndDate || '',
  ).trim();

  return {
    contentId,
    title,
    gateoUrl: gateoKoreaFestivalDetailUrl(contentId),
    eventStartDate,
    eventEndDate,
    dateLabel: String(summaryFields?.dateText || '').trim(),
    timeText: String(summaryFields?.timeText || intro?.playtime || '').trim(),
    feeText: String(summaryFields?.fee?.text || '').trim(),
    venue,
    address,
    lat: pt?.lat ?? null,
    lng: pt?.lng ?? null,
    homepage: String(homepage || '').trim(),
    hubLabel,
    overviewText: clipText(overview || intro?.overview, 360),
    programText: clipText(program || intro?.program, 360),
    contactTel: String(tel || intro?.sponsor1tel || item?.tel || '').trim(),
    hasEnded: festivalEnded(eventEndDate || eventStartDate, now ?? new Date()),
  };
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 * @param {string} [inviteLine]
 */
export function buildFestivalMooniChatOpening(festivalContext, inviteLine = '') {
  const body = buildFestivalMooniGuideOpening(festivalContext);
  const invite = String(inviteLine || '').trim();
  if (!body) return invite;
  if (!invite) return body;
  return `${body}\n\n${invite}`;
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 */
export function buildFestivalMooniNeutralOpening(festivalContext) {
  return buildFestivalMooniGuideOpening(festivalContext);
}

/**
 * @param {ReturnType<typeof buildFestivalMooniContext>} festivalContext
 */
export function buildFestivalMooniGuideOpening(festivalContext) {
  if (!festivalContext?.title) return '';

  const lines = [];
  if (festivalContext.hasEnded) {
    lines.push('이 축제는 공식 일정상 이미 종료된 행사입니다. 아래는 GATEO에 등록된 마지막 안내입니다.');
  }

  lines.push(`${festivalContext.title} 안내입니다.`);

  const whenWhere = [
    festivalContext.dateLabel,
    festivalContext.timeText,
    festivalContext.feeText ? `요금 ${festivalContext.feeText}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  if (whenWhere) lines.push(whenWhere);

  const placeBits = [festivalContext.venue, festivalContext.address].filter(Boolean);
  if (placeBits.length) lines.push(placeBits.join(' — '));

  const seeBits = [];
  if (festivalContext.programText) seeBits.push(festivalContext.programText);
  else if (festivalContext.overviewText) seeBits.push(festivalContext.overviewText);
  if (seeBits.length) {
    lines.push(`볼거리: ${seeBits.join(' ')}`);
  } else {
    lines.push(
      '볼거리·세부 프로그램은 공식 안내를 확인해 주세요.',
    );
  }

  const vibeBits = [];
  if (festivalContext.overviewText && festivalContext.programText) {
    vibeBits.push(festivalContext.overviewText);
  } else if (festivalContext.timeText) {
    vibeBits.push(`운영 시간은 ${festivalContext.timeText}입니다.`);
  }
  if (festivalContext.hubLabel) {
    vibeBits.push(`${festivalContext.hubLabel} 일대에서 열리는 행사입니다.`);
  }
  if (vibeBits.length) {
    lines.push(`현장 분위기: ${vibeBits.join(' ')}`);
  }

  const nearBits = [];
  if (festivalContext.hubLabel) {
    nearBits.push(`${festivalContext.hubLabel} 주변 관광·맛집은 상세 페이지 하단 목록을 참고할 수 있습니다.`);
  }
  const contact = festivalContext.contactTel;
  const home = festivalContext.homepage;
  if (home || contact) {
    const tail = [
      home ? `공식 홈페이지(${home})` : '',
      contact ? `문의 ${contact}` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    nearBits.push(`주차·교통·숙소 등은 ${tail}에서 확인해 주세요.`);
  } else {
    nearBits.push('주차·교통·숙소 정보는 공식 홈페이지나 문의처에서 확인해 주세요.');
  }
  lines.push(`주변 즐길거리: ${nearBits.join(' ')}`);

  return lines.join('\n\n').trim();
}

/**
 * @param {string} [locale]
 * @returns {{ id: string, label: string, sendText: string }[]}
 */
export function getFestivalMooniFollowUpChips(locale = 'ko') {
  const isEn = String(locale || '').toLowerCase().startsWith('en');
  if (isEn) {
    return [
      {
        id: 'festival_parking',
        label: 'Parking & transit',
        sendText: 'How do I get there and where can I park for this festival?',
      },
      {
        id: 'festival_schedule',
        label: 'Schedule',
        sendText: 'What are the festival dates, hours, and main program highlights?',
      },
      {
        id: 'festival_food',
        label: 'Food nearby',
        sendText: 'What are good places to eat near the festival venue?',
      },
      {
        id: 'festival_stay',
        label: 'Places to stay',
        sendText: 'Where should I stay if I visit for this festival?',
      },
    ];
  }
  return [
    {
      id: 'festival_parking',
      label: '주차·교통',
      sendText: '이 축제 가는 길과 주차·대중교통을 알려줘.',
    },
    {
      id: 'festival_schedule',
      label: '일정·시간표',
      sendText: '이 축제 기간·운영 시간·주요 프로그램을 정리해줘.',
    },
    {
      id: 'festival_food',
      label: '근처 맛집',
      sendText: '축제 장소 근처에서 먹기 좋은 곳을 추천해줘.',
    },
    {
      id: 'festival_stay',
      label: '숙소',
      sendText: '이 축제 보려고 묵을 만한 숙소 방향을 알려줘.',
    },
  ];
}
