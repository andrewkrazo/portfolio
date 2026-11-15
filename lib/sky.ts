export type City = "here" | "la" | "pvd";
export type Weather = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";
export type Landmark = "nyc" | "sf" | "seattle" | "chicago" | "boston" | "austin" | "dc" | "london";

/** The visitor's own city, worked out on the server from their approximate location. */
export type Here = {
  name: string;
  tz: string;
  landmark: Landmark | null;
  weather: Weather;
  cold: boolean;
  sunrise: number;
  sunset: number;
};

export type Mode = "light" | "dark";

// [start hour, name, sky1, sky2, sky3, sky4, sun glow, share of lit windows, page mode]
// Daylight gets the light page, sunset and night the dark one, in both cities.
export type Phase = [number, string, string, string, string, string, number, number, Mode];

const LA: Phase[] = [
  [0, "Late night", "#0e1020", "#161a2e", "#22213a", "#2a2533", 0, 0.55, "dark"],
  [5, "Before dawn", "#151a30", "#2c2f4f", "#5a4a6a", "#8a6a72", 0.15, 0.35, "dark"],
  [6.75, "Sunrise", "#9fb4cf", "#d6c9cf", "#f6c7a2", "#fbe0c4", 0.6, 0.05, "light"],
  [9, "Morning haze", "#8fbde0", "#b9d6ea", "#e9e2d2", "#f5ead6", 0.4, 0, "light"],
  [12, "Afternoon", "#7fb6e3", "#a9d1ee", "#e3e6dc", "#f4eee0", 0.3, 0, "light"],
  [16, "Golden hour", "#a9bfd8", "#e6c9b4", "#ffc58a", "#ffe1b8", 0.9, 0.05, "light"],
  [18, "Sunset", "#2a1f3d", "#7a3a5c", "#ff7a45", "#ffc27a", 0.9, 0.3, "dark"],
  [19.25, "Dusk", "#1a1832", "#3c2a52", "#a8456a", "#e0714a", 0.45, 0.55, "dark"],
  [20.5, "Night", "#10122a", "#1c1d3a", "#3a2a4e", "#5a3348", 0.08, 0.7, "dark"],
];

const PVD: Phase[] = [
  [0, "Late night", "#0b1226", "#141d36", "#1f2a45", "#2b3550", 0, 0.5, "dark"],
  [5.5, "Before dawn", "#141c36", "#26304f", "#4d4a66", "#7a6470", 0.1, 0.4, "dark"],
  [6.75, "First light", "#c7d6e6", "#e4dfe0", "#f6dccb", "#fbeadb", 0.5, 0.1, "light"],
  [9, "Morning", "#a9cfe8", "#c9e2ef", "#e6f0ef", "#f3f4ef", 0.4, 0, "light"],
  [12, "Afternoon", "#9cc8e8", "#bfdff0", "#e2eff0", "#f3f4ef", 0.3, 0, "light"],
  [15.5, "Golden hour", "#b7cde0", "#e3d9cf", "#f6cfa6", "#fbe3c2", 0.8, 0.1, "light"],
  [17.5, "Dusk", "#1a1d3a", "#3a3358", "#8a5a6e", "#c47a62", 0.35, 0.5, "dark"],
  [19, "Night", "#0b1226", "#141d36", "#1f2a45", "#2b3550", 0, 0.65, "dark"],
];

/** Hours the sun/moon button jumps to. */
export const DAY_HOUR = 12.5;
export const NIGHT_HOUR = 21.5;

export const CITIES: Record<City, { tz: string; name: string; phases: Phase[] }> = {
  here: { tz: "America/Los_Angeles", name: "Your city", phases: LA }, // filled in by setHere
  la: { tz: "America/Los_Angeles", name: "Los Angeles", phases: LA },
  pvd: { tz: "America/New_York", name: "Providence", phases: PVD },
};

function mix(a: string, b: string, t: number) {
  const n = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return (
    "#" +
    [0, 1, 2].map((i) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * t).toString(16).padStart(2, "0")).join("")
  );
}

// Grey skies wash out the colors and hide the sun.
const OVERCAST: Record<Weather, number> = { clear: 0, cloudy: 0.45, fog: 0.6, rain: 0.55, snow: 0.5, storm: 0.7 };

/** The visitor's day, built around their real sunrise and sunset. */
export function herePhases(here: Here): Phase[] {
  const { sunrise: up, sunset: down } = here;
  const grey = OVERCAST[here.weather];
  const raw: Phase[] = [
    [0, "Late night", "#0e1020", "#161a2e", "#22213a", "#2a2533", 0, 0.55, "dark"],
    [up - 1.25, "Before dawn", "#151a30", "#2c2f4f", "#5a4a6a", "#8a6a72", 0.15, 0.35, "dark"],
    [up, "Sunrise", "#9fb4cf", "#d6c9cf", "#f6c7a2", "#fbe0c4", 0.6, 0.05, "light"],
    [up + 2, "Morning", "#8fbde0", "#b9d6ea", "#e6ebe6", "#f3f1e8", 0.4, 0, "light"],
    [(up + down) / 2, "Afternoon", "#7fb6e3", "#a9d1ee", "#e0eaea", "#f2f1e8", 0.3, 0, "light"],
    [down - 1.5, "Golden hour", "#a9bfd8", "#e6c9b4", "#ffc58a", "#ffe1b8", 0.9, 0.05, "light"],
    [down, "Sunset", "#2a1f3d", "#7a3a5c", "#ff7a45", "#ffc27a", 0.9, 0.3, "dark"],
    [down + 1.25, "Dusk", "#1a1832", "#3c2a52", "#a8456a", "#e0714a", 0.45, 0.55, "dark"],
    [down + 2.5, "Night", "#10122a", "#1c1d3a", "#3a2a4e", "#5a3348", 0.08, 0.7, "dark"],
  ];
  const label = here.weather === "clear" ? "" : ` · ${here.weather === "storm" ? "storm" : here.weather}`;
  return raw.map(([h, name, a, b, c, d, glow, lit, mode]) => {
    const toward = mode === "light" ? "#c3c8cf" : "#24262e";
    return [h, name + label, mix(a, toward, grey), mix(b, toward, grey), mix(c, toward, grey), mix(d, toward, grey), glow * (1 - grey), lit, mode];
  });
}

export function setHere(here: Here) {
  CITIES.here = { tz: here.tz, name: here.name, phases: herePhases(here) };
}

/** Runs right after <body> opens: first visits start on the visitor's own city. */
export function herePaintScript(here: Here) {
  return `(function(){try{
var r=document.documentElement,q=new URLSearchParams(location.search).get('city'),s=null;
try{s=localStorage.getItem('ar-city')}catch(e){}
if(q==='la'||q==='pvd'||(!q&&(s==='la'||s==='pvd')))return;
var P=${JSON.stringify(herePhases(here))};r.dataset.city='here';
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
  let current = CITIES[city].phases[0];
  for (const p of CITIES[city].phases) if (hour >= p[0]) current = p;
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
 * a default sky flash. Inlined in <head>, so it can't import anything.
 */
export const FIRST_PAINT_SCRIPT = `(function(){try{
var C=${JSON.stringify({ la: { tz: CITIES.la.tz, p: LA }, pvd: { tz: CITIES.pvd.tz, p: PVD } })};
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
