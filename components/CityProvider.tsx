"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createScene } from "@/lib/scene";
import { applySky, cityHour, phaseAt, type City } from "@/lib/sky";

type CityContext = {
  city: City;
  setCity: (city: City) => void;
  hour: number | null;
  previewing: boolean;
  preview: (hour: number) => void;
  backToNow: () => void;
  heroCanvas: React.RefObject<HTMLCanvasElement | null>;
  contactCanvas: React.RefObject<HTMLCanvasElement | null>;
};

const Ctx = createContext<CityContext | null>(null);

export function useCity() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCity must be used inside CityProvider");
  return value;
}

export function CityProvider({ children }: { children: React.ReactNode }) {
  const [city, setCityState] = useState<City>("la");
  const [hour, setHour] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const heroCanvas = useRef<HTMLCanvasElement>(null);
  const contactCanvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<ReturnType<typeof createScene> | null>(null);

  const showHour = useCallback((c: City, h: number) => {
    const phase = phaseAt(c, h);
    applySky(document.documentElement, phase);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", phase[2]);
    scene.current?.setLitShare(phase[7]);
    setHour(h);
  }, []);

  const setCity = useCallback(
    (next: City) => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("ar-city", next);
      } catch {}
      setCityState(next);
      setPreviewing(false);
      scene.current?.setCity(next);
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

  // The script in <head> already picked the city before first paint; adopt its choice.
  useEffect(() => {
    scene.current = createScene(heroCanvas.current!, contactCanvas.current!);
    setCity(document.documentElement.dataset.theme === "pvd" ? "pvd" : "la");
    return () => scene.current?.destroy();
  }, [setCity]);

  // Keep the sky on the real clock unless someone is previewing another hour.
  useEffect(() => {
    if (previewing) return;
    const id = setInterval(() => showHour(city, cityHour(city)), 60_000);
    return () => clearInterval(id);
  }, [city, previewing, showHour]);

  return (
    <Ctx.Provider value={{ city, setCity, hour, previewing, preview, backToNow, heroCanvas, contactCanvas }}>
      {children}
    </Ctx.Provider>
  );
}
