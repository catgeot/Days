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
  }
];
