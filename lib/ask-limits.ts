import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";

/*
 * Brakes on the public ask bar. With a Redis database connected, the counts survive
 * restarts and are shared between server instances. Without one, or if Redis is down,
 * they fall back to memory so the bar keeps working with weaker limits.
 * The hard cap on money is still the spend limit on the API key's workspace.
 */

export type LimitStore = "redis" | "memory";

const RULES = [
  { name: "minute", limit: 5, window: "1 m", ms: 60_000, perVisitor: true },
  { name: "day", limit: 30, window: "1 d", ms: 24 * 60 * 60_000, perVisitor: true },
  { name: "site", limit: 300, window: "1 d", ms: 24 * 60 * 60_000, perVisitor: false },
] as const;

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const MAX_TRACKED_KEYS = 5_000;
const MAX_CACHED = 200;

// Vercel's Upstash integration can name these either way.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token, retry: { retries: 1 } }) : null;

const limiters = redis
  ? RULES.map((rule) => ({
      rule,
      limiter: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(rule.limit, rule.window),
        prefix: `ask:limit:${rule.name}`,
        timeout: 1500,
      }),
    }))
  : [];

// Visitors and questions are stored only as hashes, so the database never holds raw IPs.
const hash = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32);

const hits = new Map<string, number[]>();

function allowInMemory(id: string, now = Date.now()) {
  if (hits.size > MAX_TRACKED_KEYS) {
    const site = hits.get("site:site");
    hits.clear();
    if (site) hits.set("site:site", site);
  }
  const checks = RULES.map((rule) => {
    const key = `${rule.name}:${rule.perVisitor ? id : "site"}`;
    const recent = (hits.get(key) ?? []).filter((t) => now - t < rule.ms);
    hits.set(key, recent);
    return { rule, recent };
  });
  if (checks.some((c) => c.recent.length >= c.rule.limit)) return false;
  checks.forEach((c) => c.recent.push(now));
  return true;
}

export async function allowQuestion(visitor: string): Promise<{ allowed: boolean; store: LimitStore }> {
  const id = hash(visitor);
  if (limiters.length) {
    try {
      for (const { rule, limiter } of limiters) {
        const result = await limiter.limit(rule.perVisitor ? id : "site");
        if (result.reason === "timeout") throw new Error("rate limit timed out");
        if (!result.success) return { allowed: false, store: "redis" };
      }
      return { allowed: true, store: "redis" };
    } catch (error) {
      console.error("Redis limits unavailable, using memory:", error);
    }
  }
  return { allowed: allowInMemory(id), store: "memory" };
}

// The same question gets the same answer without another API call, so the starter
// questions cost almost nothing however often they're clicked.
type Answer = { answer: string; source: string };
const memoryCache = new Map<string, Answer & { at: number }>();
const cacheKey = (question: string) => `ask:answer:${hash(question.toLowerCase().replace(/\s+/g, " ").trim())}`;

export async function cachedAnswer(question: string): Promise<Answer | null> {
  const key = cacheKey(question);
  if (redis) {
    try {
      return await redis.get<Answer>(key);
    } catch (error) {
      console.error("Redis cache unavailable, using memory:", error);
    }
  }
  const entry = memoryCache.get(key);
  if (!entry || Date.now() - entry.at > CACHE_TTL_SECONDS * 1000) return null;
  return { answer: entry.answer, source: entry.source };
}

export async function rememberAnswer(question: string, value: Answer) {
  const key = cacheKey(question);
  if (redis) {
    try {
      await redis.set(key, value, { ex: CACHE_TTL_SECONDS });
      return;
    } catch (error) {
      console.error("Redis cache unavailable, using memory:", error);
    }
  }
  if (memoryCache.size >= MAX_CACHED) memoryCache.delete(memoryCache.keys().next().value!);
  memoryCache.set(key, { ...value, at: Date.now() });
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
