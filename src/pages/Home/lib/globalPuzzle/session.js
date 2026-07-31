/** 세트 상태머신: pick → find → capital → result */

export const PUZZLE_PHASE = {
  IDLE: 'idle',
  FIND: 'find',
  CAPITAL: 'capital',
  RESULT: 'result',
};

/**
 * @typedef {{
 *   phase: string,
 *   countryId: string | null,
 *   hintUsed: boolean,
 *   hadWrong: boolean,
 *   capitalChoices: string[],
 *   stars: number | null,
 *   feedback: string,
 * }} PuzzleSession
 */

/** @returns {PuzzleSession} */
export function createIdleSession() {
  return {
    phase: PUZZLE_PHASE.IDLE,
    countryId: null,
    hintUsed: false,
    hadWrong: false,
    capitalChoices: [],
    stars: null,
    feedback: '',
  };
}

/**
 * @param {string} countryId
 * @param {string[]} capitalChoices
 * @returns {PuzzleSession}
 */
export function startFindSession(countryId, capitalChoices = []) {
  return {
    phase: PUZZLE_PHASE.FIND,
    countryId,
    hintUsed: false,
    hadWrong: false,
    capitalChoices: [...capitalChoices],
    stars: null,
    feedback: '',
  };
}

/** @param {PuzzleSession} session */
export function markHintUsed(session) {
  if (!session || session.phase !== PUZZLE_PHASE.FIND) return session;
  if (session.hintUsed) return { ...session, feedback: '힌트는 이미 사용했습니다' };
  return {
    ...session,
    hintUsed: true,
    feedback: '나라 위치를 표시했습니다 (별 −1)',
  };
}

/**
 * @param {PuzzleSession} session
 * @param {boolean} correct
 */
export function applyFindTap(session, correct) {
  if (!session || session.phase !== PUZZLE_PHASE.FIND) return session;
  if (correct) {
    return {
      ...session,
      phase: PUZZLE_PHASE.CAPITAL,
      feedback: '정답! 수도를 고르세요',
    };
  }
  return {
    ...session,
    hadWrong: true,
    feedback: '다른 나라예요. 다시 찾아보세요',
  };
}

/**
 * @param {PuzzleSession} session
 * @param {boolean} correct
 * @param {(flags: { hintUsed: boolean, hadWrong: boolean }) => number} computeStars
 */
export function applyCapitalAnswer(session, correct, computeStars) {
  if (!session || session.phase !== PUZZLE_PHASE.CAPITAL) return session;
  if (!correct) {
    return {
      ...session,
      hadWrong: true,
      feedback: '수도가 아니에요. 다시 고르세요',
    };
  }
  const stars = computeStars({
    hintUsed: session.hintUsed,
    hadWrong: session.hadWrong,
  });
  return {
    ...session,
    phase: PUZZLE_PHASE.RESULT,
    stars,
    feedback: `클리어! 별 ${stars}`,
  };
}

/**
 * 같은 나라 재도전 — find로 리셋 (별/힌트 초기화)
 * @param {PuzzleSession} session
 * @param {string[]} capitalChoices
 */
export function restartFindSession(session, capitalChoices = []) {
  if (!session?.countryId) return createIdleSession();
  return startFindSession(session.countryId, capitalChoices);
}
