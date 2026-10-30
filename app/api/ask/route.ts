import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { MAX_QUESTION_LENGTH } from "@/lib/ask-config";
import { allowQuestion, cachedAnswer, isSameOrigin, rememberAnswer } from "@/lib/ask-limits";
import { SYSTEM_PROMPT } from "@/lib/knowledge";

const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return fail("Not allowed.", 403);

  let body: { question?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return fail("That didn't look like a question.", 400);
  }

  // `website` is a field people can't see. Only bots fill it in, and they learn nothing from the reply.
  if (body.website) return NextResponse.json({ answer: "Thanks for asking.", source: "None" });

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return fail("Type a question first.", 400);
  if (question.length > MAX_QUESTION_LENGTH) {
    return fail(`Keep it under ${MAX_QUESTION_LENGTH} characters.`, 400);
  }

  const cached = await cachedAnswer(question);
  if (cached) return NextResponse.json(cached);

  const visitor =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const { allowed, store } = await allowQuestion(visitor);
  if (!allowed) {
    const denied = fail("That's a lot of questions at once. Try again later.", 429);
    denied.headers.set("x-limit-store", store);
    return denied;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    const off = fail("This isn't switched on yet.", 503);
    off.headers.set("x-limit-store", store);
    return off;
  }

  try {
    const client = new Anthropic({ timeout: 20_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: "claude-haiku-5-5",
      max_tokens: 1000,
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
      messages: [{ role: "user", content: question }],
    });

    if (response.stop_reason === "refusal") return fail("I can't answer that one here.", 422);

    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const { answer, source } = JSON.parse(text) as { answer: string; source: string };
    await rememberAnswer(question, { answer, source });
    return NextResponse.json({ answer, source }, { headers: { "x-limit-store": store } });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return fail("This is busy right now. Try again in a minute.", 429);
    }
    console.error("ask failed:", error instanceof Anthropic.APIError ? `${error.status} ${error.message}` : error);
    return fail("Something went wrong answering that.", 502);
  }
}
