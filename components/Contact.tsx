"use client";

import { useEffect, useState } from "react";
import { EMAIL, GITHUB_URL, LINKEDIN_URL, RESUME_URL } from "@/lib/content";
import { CITIES, cityTime } from "@/lib/sky";
import { useCity } from "./CityProvider";

export function Contact() {
  const { city, contactCanvas } = useCity();
  const [copied, setCopied] = useState<"idle" | "yes" | "no">("idle");
  const [otherTime, setOtherTime] = useState<string | null>(null);
  const other = city === "pvd" ? "la" : "pvd";

  // Each city's page tells the time in the other one.
  useEffect(() => {
    const tick = () => setOtherTime(cityTime(other));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [other]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied("yes");
    } catch {
      setCopied("no"); // clipboard blocked: show the address instead
    }
    setTimeout(() => setCopied("idle"), 1800);
  }

  return (
    <section className="contact" id="contact">
      <div className="contact-in">
        <h2>
          Let&apos;s
          <br />
          <span>talk</span>
        </h2>
        <div className="reach">
          <button type="button" className="primary" onClick={copyEmail} aria-live="polite">
            {copied === "yes" ? "Copied" : copied === "no" ? EMAIL : "Copy my email"}
          </button>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {LINKEDIN_URL && (
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          )}
          {RESUME_URL && (
            <a href={RESUME_URL} download>
              Download resume
            </a>
          )}
        </div>
        <div className="direct">
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
        </div>
        <p className="now-pvd mono">
          {otherTime ? (
            <>
              It&apos;s <b>{otherTime}</b> in {CITIES[other].name},{" "}
              {other === "la" ? "where I grew up." : "where I am now."}
            </>
          ) : (
            " "
          )}
        </p>
      </div>
      <canvas id="cityFoot" ref={contactCanvas} aria-hidden="true" />
      <div className="foot-bar">
        <span>Andrew Razo, 2026</span>
        <span>Designed and built by me. The sky follows {CITIES[city].name}&apos;s real clock.</span>
      </div>
    </section>
  );
}
