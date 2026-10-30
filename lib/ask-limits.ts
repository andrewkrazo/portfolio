export const MAX_QUESTION_LENGTH = 200;

/*
 * Brakes on the public ask bar. These live in memory, so they reset on a cold start
 * and are counted per server instance: they stop casual spam, not a determined attacker.
 * The hard cap on money is the spend limit on the API key's workspace.
 */
const RULES = {
  visitorPerMinute: { limit: 5, windowMs: 60_000 },
  visitorPerDay: { limit: 30, windowMs: 24 * 60 * 60_000 },
  sitePerDay: { limit: 300, windowMs: 24 * 60 * 60_000 },
};

const MAX_TRACKED_KEYS = 5_000;
const hits = new Map<string, number[]>();

function count(key: string, windowMs: number, now: number) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.set(key, recent);
  return recent;
}

/** Checks every rule first and records the request only if all of them pass. */
export function allowQuestion(visitor: string, now = Date.now()) {
  // A flood of made-up visitors shouldn't be able to grow this map forever.
  if (hits.size > MAX_TRACKED_KEYS) {
    const site = hits.get("site");
    hits.clear();
    if (site) hits.set("site", site);
  }

  const checks = [
    { key: `min:${visitor}`, ...RULES.visitorPerMinute },
    { key: `day:${visitor}`, ...RULES.visitorPerDay },
    { key: "site", ...RULES.sitePerDay },
  ];
  const counted = checks.map((c) => ({ ...c, recent: count(c.key, c.windowMs, now) }));
  if (counted.some((c) => c.recent.length >= c.limit)) return false;
  counted.forEach((c) => c.recent.push(now));
  return true;
}

// The same question gets the same answer without another API call, so the starter
// questions cost almost nothing however often they're clicked.
const CACHE_TTL_MS = 6 * 60 * 60_000;
const MAX_CACHED = 200;
const cache = new Map<string, { answer: string; source: string; at: number }>();

const cacheKey = (question: string) => question.toLowerCase().replace(/\s+/g, " ").trim();

export function cachedAnswer(question: string) {
  const entry = cache.get(cacheKey(question));
  if (!entry || Date.now() - entry.at > CACHE_TTL_MS) return null;
  return { answer: entry.answer, source: entry.source };
}

export function rememberAnswer(question: string, answer: string, source: string) {
  if (cache.size >= MAX_CACHED) cache.delete(cache.keys().next().value!);
  cache.set(cacheKey(question), { answer, source, at: Date.now() });
}

/** Browsers always send Origin on a POST, so this turns away simple scripts and other sites. */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
