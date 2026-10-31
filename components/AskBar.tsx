"use client";

import { useEffect, useState } from "react";
import { MAX_QUESTION_LENGTH } from "@/lib/ask-config";
import { EMAIL } from "@/lib/content";

const STARTERS = [
  "What has Andrew built with AI?",
  "Has Andrew worked with real clients?",
  "What's the tech stack?",
];

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "answer"; answer: string; source: string }
  | { kind: "error"; message: string }
  | { kind: "empty" };

export function AskBar() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [website, setWebsite] = useState(""); // hidden from people; see app/api/ask/route.ts

  const [slow, setSlow] = useState(false);

  // Answers can take a while: after a few seconds, say so.
  useEffect(() => {
    setSlow(false);
    if (result.kind !== "loading") return;
    const id = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(id);
  }, [result.kind]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (result.kind === "loading") return;
    if (!trimmed) return setResult({ kind: "empty" });
    setQuestion(trimmed);
    setResult({ kind: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, website }),
      });
      const data = await res.json();
      if (res.ok) setResult({ kind: "answer", answer: data.answer, source: data.source });
      else setResult({ kind: "error", message: data.error });
    } catch {
      setResult({ kind: "error", message: "That didn't go through. Check your connection and try again." });
    }
  }

  return (
    <>
      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="ask-input">Ask about my work</label>
        <input
          id="ask-input"
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about my work..."
          autoComplete="off"
        />
        <input
          className="hp"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
        <button disabled={result.kind === "loading"}>{result.kind === "loading" ? "Asking" : "Ask"}</button>
      </form>
      {question.length >= MAX_QUESTION_LENGTH - 20 && (
        <p className="ask-count mono">
          {question.length} of {MAX_QUESTION_LENGTH} characters
        </p>
      )}
      <div className="chips">
        {STARTERS.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
      <div aria-live="polite">
        {result.kind === "loading" && (
          <div className="answer on answer-loading" aria-label="Finding an answer">
            <i />
            <i />
            {slow && <span>Still working on it...</span>}
          </div>
        )}
        {result.kind === "empty" && <div className="answer on">Type a question first.</div>}
        {result.kind === "answer" && (
          <div className="answer on" tabIndex={0}>
            {result.answer}
            {result.source && !/^none$/i.test(result.source.trim()) && <cite>Source: {result.source}</cite>}
          </div>
        )}
        {result.kind === "error" && (
          <div className="answer on">
            {result.message} You can also email me at <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </div>
        )}
      </div>
    </>
  );
}
