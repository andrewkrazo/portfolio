"use client";

import { RESUME_URL } from "@/lib/content";
import type { City } from "@/lib/sky";
import { useCity } from "./CityProvider";

const OPTIONS: { id: City; label: string }[] = [
  { id: "la", label: "LA night" },
  { id: "pvd", label: "Providence day" },
];

export function Nav() {
  const { city, setCity } = useCity();
  return (
    <nav aria-label="Main">
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
  );
}
