export type City = "la" | "pvd";

// [start hour, name, sky1, sky2, sky3, sky4, sun glow, share of lit windows]
export type Phase = [number, string, string, string, string, string, number, number];

const LA: Phase[] = [
  [0, "Late night", "#0e1020", "#161a2e", "#22213a", "#2a2533", 0, 0.55],
  [5, "Before dawn", "#151a30", "#2c2f4f", "#5a4a6a", "#8a6a72", 0.15, 0.35],
  [7, "Morning haze", "#2a3550", "#5a6680", "#c99a7a", "#e8c9a0", 0.35, 0.08],
  [11, "Afternoon", "#2b3a55", "#4f6280", "#b98d6a", "#d9b48a", 0.3, 0.05],
  [16.5, "Golden hour", "#33264a", "#8a4a5c", "#ff9a4a", "#ffd08a", 0.95, 0.15],
  [18, "Sunset", "#2a1f3d", "#7a3a5c", "#ff7a45", "#ffc27a", 0.9, 0.3],
  [19.25, "Dusk", "#1a1832", "#3c2a52", "#a8456a", "#e0714a", 0.45, 0.55],
  [20.5, "Night", "#10122a", "#1c1d3a", "#3a2a4e", "#5a3348", 0.08, 0.7],
];

// Providence stays light at every hour, so dark text always reads.
const PVD: Phase[] = [
  [0, "Quiet hours", "#cfd6e2", "#dfe2e8", "#ece8e6", "#f3efe9", 0.1, 0],
  [6, "First light", "#c7d6e6", "#e4dfe0", "#f6dccb", "#fbeadb", 0.5, 0],
  [9, "Morning", "#a9cfe8", "#c9e2ef", "#e6f0ef", "#f3f4ef", 0.4, 0],
  [12, "Afternoon", "#9cc8e8", "#bfdff0", "#e2eff0", "#f3f4ef", 0.3, 0],
  [16, "Golden hour", "#b7cde0", "#e3d9cf", "#f6cfa6", "#fbe3c2", 0.8, 0],
  [18.5, "Last light", "#b9bfd8", "#dcc9d4", "#f2cdbf", "#f8e3d6", 0.45, 0],
  [21, "Quiet hours", "#cfd6e2", "#dfe2e8", "#ece8e6", "#f3efe9", 0.1, 0],
];

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
}

/**
 * Runs before first paint, so a returning visitor never sees the wrong city or
 * a default sky flash. Inlined in <head>, so it can't import anything.
 */
export const FIRST_PAINT_SCRIPT = `(function(){try{
var C=${JSON.stringify({ la: { tz: CITIES.la.tz, p: LA }, pvd: { tz: CITIES.pvd.tz, p: PVD } })};
var r=document.documentElement,t=new URLSearchParams(location.search).get('city');
if(t!=='la'&&t!=='pvd'){try{t=localStorage.getItem('ar-city')}catch(e){}}
if(t!=='pvd')t='la';r.dataset.theme=t;
var f=new Intl.DateTimeFormat('en-US',{timeZone:C[t].tz,hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
var g=function(k){for(var i=0;i<f.length;i++)if(f[i].type===k)return +f[i].value;return 0};
var h=g('hour')%24+g('minute')/60,p=C[t].p[0];
C[t].p.forEach(function(x){if(h>=x[0])p=x});
['--sky1','--sky2','--sky3','--sky4'].forEach(function(v,i){r.style.setProperty(v,p[i+2])});
r.style.setProperty('--glow',p[6]);
}catch(e){}})();`;
