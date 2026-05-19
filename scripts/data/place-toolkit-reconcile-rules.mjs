/**
 * place_toolkit.place_id 정리 규칙 (Phase 0 P0).
 * --apply 시 이 목록을 기준으로 병합·리네임합니다.
 */

/** 제거된 별칭 — DB가 여전히 잘못된 slug로 해석되면 audit `wrongAlias` */
export const REMOVED_PLACE_ID_ALIASES = {
  Brunei: 'borneo',
  브루나이: 'borneo',
  Manado: 'borneo',
  마나도: 'borneo'
};

/** place_id가 forbiddenSlug로 해석되면 정책 위반 */
export const WRONG_ALIAS_POLICIES = [
  {
    id: 'brunei-not-borneo',
    patterns: ['brunei', '브루나이'],
    forbiddenSlug: 'borneo',
    reason: '브루나이는 보르네오(borneo)와 별도 여행지 — 병합 금지'
  },
  {
    id: 'manado-not-borneo',
    patterns: ['manado', '마나도'],
    forbiddenSlug: 'borneo',
    reason: '마나도는 보르네오와 별도 — 별칭 제거됨'
  }
];

/**
 * @typedef {'rename' | 'merge_into_canonical' | 'flag_only'} ReconcileAction
 */

/**
 * @type {Array<{
 *   id: string,
 *   slugs: string[],
 *   canonicalPlaceId: string,
 *   mergeFrom: string[],
 *   action?: ReconcileAction,
 *   note?: string
 * }>}
 */
export const PLACE_TOOLKIT_RECONCILE_RULES = [
  {
    id: 'borneo',
    slugs: ['borneo'],
    canonicalPlaceId: '보르네오',
    mergeFrom: ['Borneo', 'borneo', '보르네오', '보르네오 섬', 'Borneo Island']
  },
  {
    id: 'angkor-wat',
    slugs: ['angkor-wat'],
    canonicalPlaceId: '앙코르 와트',
    mergeFrom: [
      'Siem Reap',
      '시엠립',
      'Angkor Wat',
      'angkor wat',
      '앙코르',
      'Angkor',
      '앙코르 와트',
      '앙코르와트'
    ]
  },
  {
    id: 'brunei-separate',
    slugs: [],
    canonicalPlaceId: '브루나이',
    mergeFrom: ['Brunei', '브루나이'],
    action: 'flag_only',
    note: '보르네오로 병합하지 않음 — 잘못 매핑된 행만 수동 검토·삭제 대상'
  },
  // —— Phase 2 P1: duplicateSlug 배치 ——
  {
    id: 'bali',
    slugs: ['bali'],
    canonicalPlaceId: '발리',
    mergeFrom: ['Bali', 'bali', '발리', '우붓', 'Ubud']
  },
  {
    id: 'kuala-lumpur',
    slugs: ['kuala-lumpur'],
    canonicalPlaceId: '쿠알라룸푸르',
    mergeFrom: ['Kuala Lumpur', 'kuala-lumpur', '쿠알라룸푸르', '쿠알라셀랑고르']
  },
  {
    id: 'uyuni-salt-flat',
    slugs: ['uyuni-salt-flat'],
    canonicalPlaceId: '우유니 소금사막',
    mergeFrom: [
      'Uyuni',
      'uyuni',
      'Uyuni Salt Flat',
      '우유니',
      '우유니 사막',
      '우유니소금사막',
      '우유니 소금사막'
    ]
  },
  {
    id: 'plitvice-lakes',
    slugs: ['plitvice-lakes'],
    canonicalPlaceId: '플리트비체 호수',
    mergeFrom: [
      'Plitvice',
      'Plitvice Lakes',
      'Plitvice Lakes National Park',
      '플리트비체',
      '플리트비체 국립공원',
      '플리트비체호수',
      '플리트비체 호수'
    ]
  },
  {
    id: 'everest-base-camp',
    slugs: ['everest-base-camp'],
    canonicalPlaceId: '에베레스트 베이스캠프',
    mergeFrom: [
      'Everest',
      'Everest Base Camp',
      '에베레스트',
      '에베레스트 캠프',
      '에베레스트베이스캠프',
      '에베레스트 베이스캠프'
    ]
  },
  {
    id: 'alaska',
    slugs: ['alaska'],
    canonicalPlaceId: '알래스카',
    mergeFrom: ['Alaska', 'alaska', '알래스카', '앵커리지', 'Anchorage']
  },
  // —— Phase 2 P2: geoMismatch·근접 지명 혼입 ——
  {
    id: 'banff-national-park',
    slugs: ['banff-national-park'],
    canonicalPlaceId: '밴프 국립공원',
    mergeFrom: ['Banff National Park', 'banff-national-park', '밴프 국립공원', '로키 산맥']
  },
  {
    id: 'galapagos',
    slugs: ['galapagos'],
    canonicalPlaceId: '갈라파고스',
    mergeFrom: ['Galapagos', 'galapagos', '갈라파고스', '다윈', '다윈섬', 'Darwin']
  },
  {
    id: 'phuket',
    slugs: ['phuket'],
    canonicalPlaceId: '푸켓',
    mergeFrom: ['Phuket', 'phuket', '푸켓', '태국 파타야', '파타야', 'Pattaya']
  },
  {
    id: 'iceland',
    slugs: ['iceland'],
    canonicalPlaceId: '아이슬란드',
    mergeFrom: [
      'Iceland',
      'iceland',
      '아이슬란드',
      'Ilulissat',
      '일룰리사트',
      '일루리삿',
      'Ilulissat Icefjord'
    ]
  }
];
