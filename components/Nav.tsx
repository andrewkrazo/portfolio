"use client";

import { useEffect, useState } from "react";
import { RESUME_URL } from "@/lib/content";
import type { City } from "@/lib/sky";
import { useCity } from "./CityProvider";


export function Nav() {
  const { here, city, setCity, mode, flipDayNight } = useCity();
  // Phones get the short labels.
  const hereShort = here?.landmark === "nyc" ? "NYC" : here?.landmark === "sf" ? "SF" : here?.landmark === "dc" ? "DC" : null;
  const options: { id: City; label: string; short: string }[] = [
    ...(here
      ? [
          {
            id: "here" as const,
            label: here.name.length <= 13 ? here.name : "Your city",
            short: hereShort ?? (here.name.length <= 8 ? here.name : "Here"),
          },
        ]
      : []),
    { id: "la", label: "Los Angeles", short: "LA" },
    { id: "pvd", label: "Providence", short: "PVD" },
  ];
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
        <span className="nav-right">
          <span className="mode" role="group" aria-label="Choose a city">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={city === o.id}
                aria-label={o.label}
                onClick={() => setCity(o.id)}
              >
                <span className="long">{o.label}</span>
                <span className="short" aria-hidden="true">
                  {o.short}
                </span>
              </button>
            ))}
          </span>
          <button
            type="button"
            className="daynight"
            onClick={flipDayNight}
            aria-label={mode === "light" ? "Switch to night" : "Switch to day"}
            title={mode === "light" ? "Switch to night" : "Switch to day"}
          >
            {mode === "light" ? "☾" : "☀"}
          </button>
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
