export type LimitConfig = {
  ip_minute: number;
  ip_hour: number;
  ip_day: number;
  user_day: number;
  global_hour: number;
  global_day: number;
  tasks: Record<string, number>;
};

export type RateCheck = { bucket: string; window_s: number; limit: number };

/** 7일 194회 → 일평균 약 28. 전역 일 2000은 그 5배(140) 이상. */
export const DEFAULT_LIMITS: LimitConfig = {
  ip_minute: 6,
  ip_hour: 40,
  ip_day: 150,
  user_day: 120,
  global_hour: 200,
  global_day: 2000,
  tasks: {
    mooni_chat: 1200,
    mooni_chat_quality: 400,
    place_intro: 300,
    search_intent: 400,
    review_draft: 150,
    logbook_polish: 100,
    curation: 150,
    health_ping: 12,
    legacy: 600,
  },
};

/**
 * 토큰도 호출과 같은 5배 이상.
 * 호출당 8,000 토큰이어도 28 * 8000 * 5 = 1,120,000. 기본 8,000,000은 그 위.
 */
export const DEFAULT_DAILY_TOKEN_BUDGET = 8_000_000;

const memory = new Map<string, { minute: number; n: number }>();

export function resetRateMemory(): void {
  memory.clear();
}

export function loadLimits(raw: string | undefined): LimitConfig {
  if (!raw?.trim()) return structuredClone(DEFAULT_LIMITS);
  try {
    const parsed = JSON.parse(raw) as Partial<LimitConfig> & { tasks?: Record<string, number> };
    return {
      ...DEFAULT_LIMITS,
      ...parsed,
      tasks: { ...DEFAULT_LIMITS.tasks, ...(parsed.tasks ?? {}) },
    };
  } catch {
    console.error(JSON.stringify({ fn: "gemini-proxy", error: "bad_limits_json" }));
    return structuredClone(DEFAULT_LIMITS);
  }
}

export function loadTokenBudget(raw: string | undefined): number {
  if (!raw?.trim()) return DEFAULT_DAILY_TOKEN_BUDGET;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return DEFAULT_DAILY_TOKEN_BUDGET;
  return Math.floor(value);
}

export function buildRateChecks(
  ipHash: string,
  uid: string | null,
  task: string,
  tier: string | null,
  limits: LimitConfig,
): RateCheck[] {
  const taskLimit = limits.tasks[task] ?? limits.tasks.legacy ?? 600;
  const checks: RateCheck[] = [
    { bucket: `ip:${ipHash}:m`, window_s: 60, limit: limits.ip_minute },
    { bucket: `ip:${ipHash}:h`, window_s: 3600, limit: limits.ip_hour },
    { bucket: `ip:${ipHash}:d`, window_s: 86400, limit: limits.ip_day },
  ];
  if (uid) {
    checks.push({ bucket: `uid:${uid}:d`, window_s: 86400, limit: limits.user_day });
  }
  checks.push({ bucket: `task:${task}:d`, window_s: 86400, limit: taskLimit });
  if (task === "mooni_chat" && tier === "quality") {
    checks.push({
      bucket: "task:mooni_chat:quality:d",
      window_s: 86400,
      limit: limits.tasks.mooni_chat_quality,
    });
  }
  checks.push({ bucket: "global:h", window_s: 3600, limit: limits.global_hour });
  checks.push({ bucket: "global:d", window_s: 86400, limit: limits.global_day });
  return checks;
}

function bumpMemory(key: string, limit: number, minute: number): boolean {
  const row = memory.get(key);
  if (!row || row.minute !== minute) {
    memory.set(key, { minute, n: 1 });
    return true;
  }
  if (row.n >= limit) return false;
  row.n += 1;
  return true;
}

/** RPC가 죽었을 때만. IP 분 3, isolate 전역 분 20. */
export function allowMemoryBypass(ipHash: string, nowMs = Date.now()): boolean {
  const minute = Math.floor(nowMs / 60_000);
  if (!bumpMemory(`ip:${ipHash}`, 3, minute)) return false;
  if (!bumpMemory("global", 20, minute)) return false;
  return true;
}
