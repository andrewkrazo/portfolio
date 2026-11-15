"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_QUESTION_LENGTH } from "@/lib/ask-config";
import { EMAIL } from "@/lib/content";

const STARTERS = [
  "What has Andrew built with AI?",
  "Has Andrew worked with real clients?",
  "What languages and frameworks does Andrew know?",
];

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "answer"; answer: string; source: string; asked: string }
  | { kind: "error"; message: string; asked: string }
  | { kind: "empty" };

export function AskBar() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [website, setWebsite] = useState(""); // hidden from people; see app/api/ask/route.ts

  const [slow, setSlow] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Once a question is answered, the button clears it so the next one starts fresh.
  const answered = (result.kind === "answer" || result.kind === "error") && question === result.asked;

  function clear() {
    setQuestion("");
    setResult({ kind: "idle" });
    input.current?.focus();
  }

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
      if (res.ok) setResult({ kind: "answer", answer: data.answer, source: data.source, asked: trimmed });
      else setResult({ kind: "error", message: data.error, asked: trimmed });
    } catch {
      setResult({
        kind: "error",
        message: "That didn't go through. Check your connection and try again.",
        asked: trimmed,
      });
    }
  }

  return (
    <>
      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          if (answered) clear();
          else ask(question);
        }}
      >
        <label htmlFor="ask-input">Ask about my work</label>
        <input
          id="ask-input"
          ref={input}
          value={question}
          maxLength={MAX_QUESTION_LENGTH}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about my work..."
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
        {answered ? (
          <button className="ask-clear" aria-label="Clear question">
            &times;
          </button>
        ) : (
          <button disabled={result.kind === "loading"}>{result.kind === "loading" ? "Asking" : "Ask"}</button>
        )}
      </form>
      {question.length >= MAX_QUESTION_LENGTH - 20 && (
        <p className="ask-count mono">
          {question.length} of {MAX_QUESTION_LENGTH} characters
        </p>
      )}
      <p className="ask-note">One question at a time. It doesn&apos;t remember earlier ones.</p>
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
