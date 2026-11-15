export type City = "here" | "la" | "pvd";
export type Weather = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
/** What the sky is doing right now, from the weather service. */
export type Conditions = { weather: Weather; cold: boolean };
export const CLEAR: Conditions = { weather: "clear", cold: false };

export type Landmark = "nyc" | "sf" | "seattle" | "chicago" | "boston" | "austin" | "dc" | "london";

/** The visitor's own city, worked out on the server from their approximate location. */
export type Here = {
  name: string;
  tz: string;
  landmark: Landmark | null;
  weather: Weather;
  cold: boolean;
  lat: number;
  lon: number;
};

export type Mode = "light" | "dark";

// [start hour, name, sky1, sky2, sky3, sky4, sun glow, share of lit windows, page mode]
// Daylight gets the light page, sunset and night the dark one, in both cities.
export type Phase = [number, string, string, string, string, string, number, number, Mode];

/*
 * Every phase is placed relative to that city's real sunrise (r) and sunset (s) for today,
 * so the sky turns when the real one does, and the hours move with the seasons.
 */
const LA = (r: number, s: number): Phase[] => [
  [0, "Late night", "#0e1020", "#161a2e", "#22213a", "#2a2533", 0, 0.55, "dark"],
  [r - 1.5, "Before dawn", "#151a30", "#2c2f4f", "#5a4a6a", "#8a6a72", 0.15, 0.35, "dark"],
  [r, "Sunrise", "#9fb4cf", "#d6c9cf", "#f6c7a2", "#fbe0c4", 0.6, 0.05, "light"],
  [r + 2, "Morning haze", "#8fbde0", "#b9d6ea", "#e9e2d2", "#f5ead6", 0.4, 0, "light"],
  [(r + s) / 2, "Afternoon", "#7fb6e3", "#a9d1ee", "#e3e6dc", "#f4eee0", 0.3, 0, "light"],
  [s - 1.25, "Golden hour", "#a9bfd8", "#e6c9b4", "#ffc58a", "#ffe1b8", 0.9, 0.05, "light"],
  [s, "Sunset", "#2a1f3d", "#7a3a5c", "#ff7a45", "#ffc27a", 0.9, 0.3, "dark"],
  [s + 0.75, "Dusk", "#1a1832", "#3c2a52", "#a8456a", "#e0714a", 0.45, 0.55, "dark"],
  [s + 1.75, "Night", "#10122a", "#1c1d3a", "#3a2a4e", "#5a3348", 0.08, 0.7, "dark"],
];

const PVD = (r: number, s: number): Phase[] => [
  [0, "Late night", "#0b1226", "#141d36", "#1f2a45", "#2b3550", 0, 0.5, "dark"],
  [r - 1.25, "Before dawn", "#141c36", "#26304f", "#4d4a66", "#7a6470", 0.1, 0.4, "dark"],
  [r, "First light", "#c7d6e6", "#e4dfe0", "#f6dccb", "#fbeadb", 0.5, 0.1, "light"],
  [r + 2, "Morning", "#a9cfe8", "#c9e2ef", "#e6f0ef", "#f3f4ef", 0.4, 0, "light"],
  [(r + s) / 2, "Afternoon", "#9cc8e8", "#bfdff0", "#e2eff0", "#f3f4ef", 0.3, 0, "light"],
  [s - 1.25, "Golden hour", "#b7cde0", "#e3d9cf", "#f6cfa6", "#fbe3c2", 0.8, 0.1, "light"],
  [s, "Dusk", "#1a1d3a", "#3a3358", "#8a5a6e", "#c47a62", 0.35, 0.5, "dark"],
  [s + 1.25, "Night", "#0b1226", "#141d36", "#1f2a45", "#2b3550", 0, 0.65, "dark"],
];

/** Hour of day in a time zone, as 0-24 with minutes as a fraction. */
function localHour(tz: string, when: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(when);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (read("hour") % 24) + read("minute") / 60;
}

/**
 * Today's sunrise and sunset in a city's local hours, from the standard sunrise equation
 * (within a minute or two of published times). No network needed.
 */
export function sunTimes(lat: number, lon: number, tz: string, now = new Date()) {
  const rad = Math.PI / 180;
  const jd = now.getTime() / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545 + 0.0008 + lon / 360) - lon / 360; // the local solar day
  const m = (357.5291 + 0.98560028 * n) % 360;
  const c = 1.9148 * Math.sin(m * rad) + 0.02 * Math.sin(2 * m * rad) + 0.0003 * Math.sin(3 * m * rad);
  const l = (m + c + 180 + 102.9372) % 360;
  const transit = 2451545 + n + 0.0053 * Math.sin(m * rad) - 0.0069 * Math.sin(2 * l * rad);
  const dec = Math.asin(Math.sin(l * rad) * Math.sin(23.4397 * rad));
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(lat * rad) * Math.sin(dec)) / (Math.cos(lat * rad) * Math.cos(dec));
  const w = Math.acos(Math.min(1, Math.max(-1, cosW))) / rad; // clamped for polar days and nights
  const toDate = (j: number) => new Date((j - 2440587.5) * 86400000);
  return { rise: localHour(tz, toDate(transit - w / 360)), set: localHour(tz, toDate(transit + w / 360)) };
}

/** Hours the sun/moon button jumps to. */
export const DAY_HOUR = 12.5;
export const NIGHT_HOUR = 21.5;

type CityInfo = {
  tz: string;
  name: string;
  lat: number;
  lon: number;
  day: (r: number, s: number) => Phase[];
  now: Conditions;
};

export const CITIES: Record<City, CityInfo> = {
  here: { tz: "America/Los_Angeles", name: "Your city", lat: 34.05, lon: -118.24, day: LA, now: CLEAR }, // filled in by setHere
  la: { tz: "America/Los_Angeles", name: "Los Angeles", lat: 34.052, lon: -118.244, day: LA, now: CLEAR },
  pvd: { tz: "America/New_York", name: "Providence", lat: 41.824, lon: -71.413, day: PVD, now: CLEAR },
};

const phaseCache = new Map<string, Phase[]>();

/** A city's phases for today, rebuilt when the date (or the city) changes. */
export function phasesFor(city: City, now = new Date()): Phase[] {
  const c = CITIES[city];
  const key = `${city}:${c.name}:${c.now.weather}:${now.toLocaleDateString("en-US", { timeZone: c.tz })}`;
  let phases = phaseCache.get(key);
  if (!phases) {
    const { rise, set } = sunTimes(c.lat, c.lon, c.tz, now);
    phases = withWeather(c.day(rise, set), c.now.weather);
    phaseCache.set(key, phases);
  }
  return phases;
}

function mix(a: string, b: string, t: number) {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    "#" +
    [0, 1, 2].map((i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * t).toString(16).padStart(2, "0")).join("")
  );
}

// Grey skies wash out the colors and hide the sun.
const OVERCAST: Record<Weather, number> = { clear: 0, cloudy: 0.45, fog: 0.6, rain: 0.55, snow: 0.5, storm: 0.7 };

/** Grey skies wash out the colors and hide the sun; the clock label says what's falling. */
function withWeather(phases: Phase[], weather: Weather): Phase[] {
  const grey = OVERCAST[weather];
  if (!grey) return phases;
  return phases.map(([h, name, a, b, c, d, glow, lit, mode]) => {
    const toward = mode === "light" ? "#c3c8cf" : "#24262e";
    return [h, `${name} · ${weather}`, mix(a, toward, grey), mix(b, toward, grey), mix(c, toward, grey), mix(d, toward, grey), glow * (1 - grey), lit, mode];
  });
}

/** Set the weather for LA and Providence. */
export function setConditions(now: Record<"la" | "pvd", Conditions>) {
  CITIES.la.now = now.la;
  CITIES.pvd.now = now.pvd;
}

export function setHere(here: Here) {
  CITIES.here = { tz: here.tz, name: here.name, lat: here.lat, lon: here.lon, day: LA, now: here };
}

/** Runs right after <body> opens: first visits start on the visitor's own city. */
export function herePaintScript(here: Here) {
  setHere(here);
  return `(function(){try{
var r=document.documentElement,q=new URLSearchParams(location.search).get('city'),s=null;
try{s=localStorage.getItem('ar-city')}catch(e){}
if(q==='la'||q==='pvd'||(!q&&(s==='la'||s==='pvd')))return;
var P=${JSON.stringify(phasesFor("here"))};r.dataset.city='here';
var f=new Intl.DateTimeFormat('en-US',{timeZone:${JSON.stringify(here.tz)},hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
var g=function(k){for(var i=0;i<f.length;i++)if(f[i].type===k)return +f[i].value;return 0};
var h=g('hour')%24+g('minute')/60,p=P[0],m=null;
try{m=localStorage.getItem('ar-mode')}catch(e){}
if(m==='day')h=${DAY_HOUR};if(m==='night')h=${NIGHT_HOUR};
P.forEach(function(x){if(h>=x[0])p=x});
['--sky1','--sky2','--sky3','--sky4'].forEach(function(v,i){r.style.setProperty(v,p[i+2])});
r.style.setProperty('--glow',p[6]);r.dataset.theme=p[8];
}catch(e){}})();`;
}

export function cityHour(city: City, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CITIES[city].tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return (read("hour") % 24) + read("minute") / 60;
}

export function phaseAt(city: City, hour: number): Phase {
  const phases = phasesFor(city);
  let current = phases[0];
  for (const p of phases) if (hour >= p[0]) current = p;
  return current;
}

export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const d = new Date(2000, 0, 1, h, Math.round((hour - h) * 60));
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function cityTime(city: City, now = new Date()): string {
  return now.toLocaleTimeString("en-US", {
    timeZone: CITIES[city].tz,
    hour: "numeric",
    minute: "2-digit",
  });
}

export function applySky(root: HTMLElement, phase: Phase) {
  root.style.setProperty("--sky1", phase[2]);
  root.style.setProperty("--sky2", phase[3]);
  root.style.setProperty("--sky3", phase[4]);
  root.style.setProperty("--sky4", phase[5]);
  root.style.setProperty("--glow", String(phase[6]));
  root.dataset.theme = phase[8];
}

/**
 * Runs before first paint, so a returning visitor never sees the wrong city or
 * a default sky flash. Inlined in <head> with today's phases, so it can't import anything.
 */
export const firstPaintScript = (now: Record<"la" | "pvd", Conditions>) => {
  setConditions(now);
  return `(function(){try{
var C=${JSON.stringify({ la: { tz: CITIES.la.tz, p: phasesFor("la") }, pvd: { tz: CITIES.pvd.tz, p: phasesFor("pvd") } })};
var r=document.documentElement,t=new URLSearchParams(location.search).get('city');
if(t!=='la'&&t!=='pvd'){try{t=localStorage.getItem('ar-city')}catch(e){}}
if(t!=='pvd')t='la';r.dataset.city=t;
var f=new Intl.DateTimeFormat('en-US',{timeZone:C[t].tz,hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
var g=function(k){for(var i=0;i<f.length;i++)if(f[i].type===k)return +f[i].value;return 0};
var h=g('hour')%24+g('minute')/60,p=C[t].p[0],m=null;
try{m=localStorage.getItem('ar-mode')}catch(e){}
if(m==='day')h=${DAY_HOUR};if(m==='night')h=${NIGHT_HOUR};
C[t].p.forEach(function(x){if(h>=x[0])p=x});
['--sky1','--sky2','--sky3','--sky4'].forEach(function(v,i){r.style.setProperty(v,p[i+2])});
r.style.setProperty('--glow',p[6]);r.dataset.theme=p[8];
}catch(e){}})();`;
};
