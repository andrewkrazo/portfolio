export type City = "la" | "pvd";

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

export const CITIES = {
  la: { tz: "America/Los_Angeles", name: "Los Angeles", phases: LA },
  pvd: { tz: "America/New_York", name: "Providence", phases: PVD },
} as const;

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
  let current = CITIES[city].phases[0] as Phase;
  for (const p of CITIES[city].phases) if (hour >= p[0]) current = p as Phase;
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
