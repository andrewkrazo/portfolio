"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createScene } from "@/lib/scene";
import {
  applySky,
  cityHour,
  DAY_HOUR,
  NIGHT_HOUR,
  phaseAt,
  setConditions,
  setHere,
  type City,
  type Conditions,
  type Here,
  type Mode,
} from "@/lib/sky";

type CityContext = {
  here: Here | null;
  city: City;
  setCity: (city: City) => void;
  hour: number | null;
  previewing: boolean;
  preview: (hour: number) => void;
  backToNow: () => void;
  mode: Mode;
  /** Jump to midday or night for this visit, until "Back to now". */
  flipDayNight: () => void;
  heroCanvas: React.RefObject<HTMLCanvasElement | null>;
  contactCanvas: React.RefObject<HTMLCanvasElement | null>;
};

const Ctx = createContext<CityContext | null>(null);

export function useCity() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCity must be used inside CityProvider");
  return value;
}

type Props = { here: Here | null; now: Record<"la" | "pvd", Conditions>; children: React.ReactNode };

export function CityProvider({ here, now, children }: Props) {
  if (here) setHere(here);
  setConditions(now);
  const [city, setCityState] = useState<City>("la");
  const [hour, setHour] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [mode, setMode] = useState<Mode>("dark");
  const heroCanvas = useRef<HTMLCanvasElement>(null);
  const contactCanvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createScene> | null>(null);

  const showHour = useCallback((c: City, h: number) => {
    const phase = phaseAt(c, h);
    const root = document.documentElement;
    // At sunrise and sunset the whole page eases between light and dark.
    if (root.dataset.theme !== phase[8]) {
      root.classList.add("shifting");
      setTimeout(() => root.classList.remove("shifting"), 800);
    }
    applySky(root, phase);
    scene.current?.setNight(phase[8] === "dark");
    setMode(phase[8]);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", phase[2]);
    scene.current?.setLitShare(phase[7]);
    setHour(h);
  }, []);

  const setCity = useCallback(
    (next: City) => {
      document.documentElement.dataset.city = next;
      try {
        localStorage.setItem("ar-city", next);
      } catch {}
      setCityState(next);
      scene.current?.setCity(next);
      setPreviewing(false);
      showHour(next, cityHour(next));
    },
    [showHour],
  );

  const preview = useCallback(
    (h: number) => {
      setPreviewing(true);
      showHour(city, h);
    },
    [city, showHour],
  );

  const backToNow = useCallback(() => {
    setPreviewing(false);
    showHour(city, cityHour(city));
  }, [city, showHour]);

  const flipDayNight = useCallback(() => {
    const toNight = mode === "light";
    setPreviewing(true);
    showHour(city, toNight ? NIGHT_HOUR : DAY_HOUR);
  }, [city, mode, showHour]);

  // The script in <head> already picked the city before first paint; adopt its choice.
  useEffect(() => {
    scene.current = createScene(heroCanvas.current!, contactCanvas.current!, here, now);
    const chosen = document.documentElement.dataset.city;
    setCity(chosen === "pvd" || (chosen === "here" && here) ? chosen : "la");
    return () => scene.current?.destroy();
  }, [setCity, here, now]);

  // Keep the sky on the real clock unless someone is previewing another hour.
  useEffect(() => {
    if (previewing) return;
    const id = setInterval(() => showHour(city, cityHour(city)), 60_000);
    return () => clearInterval(id);
  }, [city, previewing, showHour]);

  return (
    <Ctx.Provider value={{ here, city, setCity, hour, previewing, preview, backToNow, mode, flipDayNight, heroCanvas, contactCanvas }}>
      {children}
    </Ctx.Provider>
  );
}
