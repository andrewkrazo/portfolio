"use client";

import { INTRO, RESUME_URL } from "@/lib/content";
import { CITIES, formatHour, phaseAt } from "@/lib/sky";
import { AskBar } from "./AskBar";
import { useCity } from "./CityProvider";

export function Hero() {
  const { city, hour, previewing, preview, heroCanvas } = useCity();
  return (
    <section className="hero" id="top">
      <div className="sky" />
      <div className="sun" />
      <canvas id="city" ref={heroCanvas} aria-hidden="true" />
      <div className="haze" />

      <div className="copy">
        <h1>
          Andrew<span className="r">Razo</span>
        </h1>
        <p className="sub">{INTRO}</p>
        <AskBar />
        {RESUME_URL && (
          <a className="resume" href={RESUME_URL} download>
            Download resume
          </a>
        )}
      </div>

      <div className="clock">
        {hour !== null && (
          <>
            <div className="now mono">
              {CITIES[city].name} {formatHour(hour)} · <b>{phaseAt(city, hour)[1]}</b>
              {previewing && " (preview)"}
            </div>
            <input
              type="range"
              min={0}
              max={23.75}
              step={0.25}
              value={hour}
              aria-label="Preview the sky at another hour"
              onChange={(e) => preview(Number(e.target.value))}
            />
          </>
        )}
      </div>
    </section>
  );
}
