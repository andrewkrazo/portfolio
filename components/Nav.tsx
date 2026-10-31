"use client";

import { useEffect, useState } from "react";
import { RESUME_URL } from "@/lib/content";
import type { City } from "@/lib/sky";
import { useCity } from "./CityProvider";

const OPTIONS: { id: City; label: string }[] = [
  { id: "la", label: "Los Angeles" },
  { id: "pvd", label: "Providence" },
];

export function Nav() {
  const { city, setCity } = useCity();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setPastHero(window.scrollY > window.innerHeight * 0.6);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav aria-label="Main" className={scrolled ? "scrolled" : undefined}>
        <a className="mark" href="#top" aria-label="Andrew Razo, back to top">
          AR
        </a>
        <span className="links">
          <a href="#work">Work</a>
          <a href="#about">About</a>
          {RESUME_URL && <a href={RESUME_URL}>Resume</a>}
          <a href="#contact">Contact</a>
        </span>
        <span className="mode" role="group" aria-label="Choose a city">
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" aria-pressed={city === o.id} onClick={() => setCity(o.id)}>
              {o.label}
            </button>
          ))}
        </span>
      </nav>
      {/* phones: the main nav scrolls away, so sections stay reachable from here */}
      <nav aria-label="Sections" className={`phone-nav${pastHero ? " on" : ""}`}>
        <a href="#work">Work</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </nav>
    </>
  );
}
