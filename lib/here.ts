import { headers } from "next/headers";
import type { Here, Landmark, Weather } from "./sky";

/*
 * The "your city" tab. Vercel adds the visitor's approximate location to every request
 * (from their IP, so there's no permission prompt). Nothing here is stored or logged.
 */

type Place = { name: string; lat: number; lon: number; tz: string };

// Cities with hand-drawn landmarks. Anyone within ~50 km gets that skyline.
const LANDMARKS: Record<Landmark, Place> = {
  nyc: { name: "New York", lat: 40.758, lon: -73.985, tz: "America/New_York" },
  sf: { name: "San Francisco", lat: 37.779, lon: -122.419, tz: "America/Los_Angeles" },
  seattle: { name: "Seattle", lat: 47.606, lon: -122.332, tz: "America/Los_Angeles" },
  chicago: { name: "Chicago", lat: 41.878, lon: -87.63, tz: "America/Chicago" },
  boston: { name: "Boston", lat: 42.36, lon: -71.058, tz: "America/New_York" },
  austin: { name: "Austin", lat: 30.267, lon: -97.743, tz: "America/Chicago" },
  dc: { name: "Washington", lat: 38.895, lon: -77.036, tz: "America/New_York" },
  london: { name: "London", lat: 51.507, lon: -0.128, tz: "Europe/London" },
};

// Visitors near these already have their own tab.
const HOME = { la: { lat: 34.052, lon: -118.244 }, pvd: { lat: 41.824, lon: -71.413 } };

// For trying the tab from anywhere: ?here=chicago, ?here=denver, ...
const PRESETS: Record<string, Place> = {
  ...LANDMARKS,
  denver: { name: "Denver", lat: 39.739, lon: -104.99, tz: "America/Denver" },
  tokyo: { name: "Tokyo", lat: 35.68, lon: 139.769, tz: "Asia/Tokyo" },
  miami: { name: "Miami", lat: 25.762, lon: -80.192, tz: "America/New_York" },
};

function km(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = Math.PI / 180;
  const x = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r);
  const y = (b.lat - a.lat) * r;
  return Math.hypot(x, y) * 6371;
}

// WMO weather codes, folded into what the scene can draw.
function weatherFrom(code: number): Weather {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 51) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2) return "cloudy";
  return "clear";
}

async function forecast(lat: number, lon: number) {
  // Rounded so nearby visitors share one cached request.
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(1)}&longitude=${lon.toFixed(1)}` +
    "&current=weather_code,temperature_2m";
  try {
    const res = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      weather: weatherFrom(data.current.weather_code),
      cold: data.current.temperature_2m <= 1,
    };
  } catch {
    return null; // a slow or missing forecast never holds the page up
  }
}

export async function getHere(preset?: string, weatherOverride?: string): Promise<Here | null> {
  let place: Place | null = preset ? (PRESETS[preset.toLowerCase()] ?? null) : null;
  if (!place) {
    const h = await headers();
    const lat = Number(h.get("x-vercel-ip-latitude"));
    const lon = Number(h.get("x-vercel-ip-longitude"));
    const tz = h.get("x-vercel-ip-timezone");
    const city = h.get("x-vercel-ip-city");
    if (!lat || !lon || !tz || !city) return null; // local dev, or the location is unknown
    place = { name: decodeURIComponent(city), lat, lon, tz };
  }
  if (km(place, HOME.la) < 50 || km(place, HOME.pvd) < 50) return null;

  const landmark =
    (Object.entries(LANDMARKS).find(([, l]) => km(place, l) < 50)?.[0] as Landmark | undefined) ?? null;
  const sky = await forecast(place.lat, place.lon);
  const weather = (["clear", "cloudy", "rain", "snow", "fog", "storm"] as const).find((w) => w === weatherOverride);

  return {
    name: landmark ? LANDMARKS[landmark].name : place.name,
    tz: place.tz,
    landmark,
    weather: weather ?? sky?.weather ?? "clear",
    cold: weather === "snow" || (sky?.cold ?? false),
    lat: place.lat,
    lon: place.lon,
  };
}
