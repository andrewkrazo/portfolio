import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

const MAX_QUESTION_LENGTH = 300;

// This endpoint is public and spends real money, so it has two limits.
// They live in memory, so they reset on a cold start and are per server instance:
// a brake rather than a guarantee. The hard cap is a spend limit on the API key.
const PER_VISITOR = { limit: 8, windowMs: 60_000 };
const SITE_WIDE = { limit: 300, windowMs: 60 * 60_000 };
const hits = new Map<string, number[]>();

function allow(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) return false;
  recent.push(now);
  hits.set(key, recent);
  return true;
}

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail("This isn't switched on yet.", 503);
  }

  let question: unknown;
  try {
    ({ question } = await request.json());
  } catch {
    return fail("That didn't look like a question.", 400);
  }
  if (typeof question !== "string" || !question.trim()) {
    return fail("Type a question first.", 400);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return fail(`Keep it under ${MAX_QUESTION_LENGTH} characters.`, 400);
  }

  const visitor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allow(`ip:${visitor}`, PER_VISITOR) || !allow("site", SITE_WIDE)) {
    return fail("That's a lot of questions at once. Try again in a minute.", 429);
  }

  try {
    const client = new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 1500,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: { answer: { type: "string" }, source: { type: "string" } },
            required: ["answer", "source"],
            additionalProperties: false,
          },
        },
      },
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: question.trim() }],
    });

    if (response.stop_reason === "refusal") {
      return fail("I can't answer that one here.", 422);
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const { answer, source } = JSON.parse(text) as { answer: string; source: string };
    return NextResponse.json({ answer, source });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail("This is busy right now. Try again in a minute.", 429);
    }
    console.error("ask failed:", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
    return fail("Something went wrong answering that.", 502);
  }
}
