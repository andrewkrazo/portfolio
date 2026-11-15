import type { Landmark } from "./sky";

/*
 * Hand-drawn landmarks for the "your city" tab, in the same flat style as LA and Providence.
 * Sizes are in u (1% of the canvas height) so they scale with the skyline.
 */

export type Ink = { body: string; far: string; marble: string; bridge: string; night: boolean };

type G = CanvasRenderingContext2D;

const rect = (g: G, x: number, y: number, w: number, h: number) => g.fillRect(x - w / 2, y - h, w, h);

function poly(g: G, pts: number[][]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) g.lineTo(x, y);
  g.closePath();
  g.fill();
}

/** Red lights on the tallest tips, for night. */
function beacon(g: G, x: number, y: number, ink: Ink, out: number[][]) {
  if (ink.night) out.push([x, y]);
  void g;
}

function nyc(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  // Empire State: setbacks, then the mast
  const ex = W * 0.7;
  g.fillStyle = ink.body;
  rect(g, ex, base, 11 * u, 60 * u);
  rect(g, ex, base - 60 * u, 8 * u, 12 * u);
  rect(g, ex, base - 72 * u, 5 * u, 8 * u);
  rect(g, ex, base - 80 * u, 2.4 * u, 8 * u);
  rect(g, ex, base - 88 * u, 0.7 * u, 10 * u);
  if (ink.night) {
    g.fillStyle = "rgba(255,196,120,.85)"; // the lit top
    rect(g, ex, base - 72 * u, 5 * u, 1.4 * u);
    rect(g, ex, base - 76 * u, 4 * u, 1.2 * u);
  }
  beacon(g, ex, base - 98 * u, ink, tips);
  // Chrysler: stacked arches, then the needle
  const cx = W * 0.6;
  g.fillStyle = ink.body;
  rect(g, cx, base, 8 * u, 54 * u);
  let y = base - 54 * u;
  for (const r of [4, 3.2, 2.4, 1.6]) {
    g.fillStyle = ink.night ? "rgba(255,226,170,.8)" : ink.marble;
    g.beginPath();
    g.arc(cx, y, r * u, Math.PI, 0);
    g.fill();
    g.fillStyle = ink.body;
    rect(g, cx, y, (r - 0.6) * 2 * u, 2.6 * u);
    y -= 2.6 * u;
  }
  g.fillStyle = ink.body;
  poly(g, [
    [cx - 0.5 * u, y],
    [cx, y - 12 * u],
    [cx + 0.5 * u, y],
  ]);
  beacon(g, cx, y - 12 * u, ink, tips);
}

function sf(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  // Transamerica Pyramid
  const px = W * 0.5;
  g.fillStyle = ink.body;
  poly(g, [
    [px - 6 * u, base],
    [px, base - 62 * u],
    [px + 6 * u, base],
  ]);
  rect(g, px, base - 62 * u, 0.6 * u, 8 * u);
  beacon(g, px, base - 70 * u, ink, tips);
  // Golden Gate, off to the left over the water
  const deck = base - 9 * u;
  const t1 = W * 0.67;
  const t2 = W * 0.91;
  const top = deck - 34 * u;
  g.fillStyle = ink.bridge;
  g.fillRect(W * 0.57, deck, W * 0.43, 1.4 * u);
  for (const tx of [t1, t2]) {
    g.fillRect(tx - 1.6 * u, top, 1 * u, base - top);
    g.fillRect(tx + 0.6 * u, top, 1 * u, base - top);
    for (const k of [0.08, 0.35, 0.62]) g.fillRect(tx - 1.6 * u, top + (deck - top) * k, 3.2 * u, 0.8 * u);
    beacon(g, tx, top, ink, tips);
  }
  g.strokeStyle = ink.bridge;
  g.lineWidth = Math.max(1, 0.4 * u);
  g.beginPath();
  g.moveTo(W * 0.57, deck);
  g.quadraticCurveTo((t1 + W * 0.57) / 2, deck - 6 * u, t1, top);
  g.quadraticCurveTo((t1 + t2) / 2, deck + 12 * u, t2, top);
  g.quadraticCurveTo(t2 + W * 0.06, deck - 6 * u, W * 1.02, deck);
  g.stroke();
  g.lineWidth = 1;
  const sag = (x: number) => {
    const t = (x - t1) / (t2 - t1);
    return top + (deck - 2 * u - top) * (1 - (2 * t - 1) ** 2);
  };
  g.beginPath();
  for (let x = t1 + 6; x < t2 - 3; x += 7) {
    g.moveTo(x, sag(x));
    g.lineTo(x, deck);
  }
  g.stroke();
}

function seattle(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  const x = W * 0.6;
  g.strokeStyle = ink.body;
  g.lineWidth = 1.2 * u;
  g.beginPath(); // the waisted legs
  g.moveTo(x - 6 * u, base);
  g.quadraticCurveTo(x - 0.6 * u, base - 30 * u, x - 2.2 * u, base - 58 * u);
  g.moveTo(x + 6 * u, base);
  g.quadraticCurveTo(x + 0.6 * u, base - 30 * u, x + 2.2 * u, base - 58 * u);
  g.stroke();
  g.lineWidth = 1;
  g.fillStyle = ink.body;
  g.beginPath(); // the saucer
  g.ellipse(x, base - 60 * u, 10 * u, 1.6 * u, 0, 0, Math.PI * 2);
  g.fill();
  rect(g, x, base - 60 * u, 7 * u, 4 * u);
  g.beginPath();
  g.ellipse(x, base - 64.5 * u, 5 * u, 1.1 * u, 0, 0, Math.PI * 2);
  g.fill();
  rect(g, x, base - 65 * u, 0.6 * u, 11 * u);
  if (ink.night) {
    g.fillStyle = "rgba(255,214,150,.85)";
    rect(g, x, base - 58.4 * u, 12 * u, 0.8 * u);
  }
  beacon(g, x, base - 76 * u, ink, tips);
}

/** Mount Rainier sits behind everything, so it's drawn before the skyline. */
export function rainier(g: G, W: number, H: number, base: number, ink: Ink) {
  const u = H / 100;
  const x = W * 0.85;
  const peak = base - 46 * u;
  g.fillStyle = ink.far;
  poly(g, [
    [x - W * 0.34, base],
    [x - 6 * u, peak + 3 * u],
    [x, peak],
    [x + 7 * u, peak + 4 * u],
    [x + W * 0.34, base],
  ]);
  g.fillStyle = ink.night ? "#4a5068" : "#f4f6f8";
  poly(g, [
    [x - 16 * u, peak + 13 * u],
    [x - 6 * u, peak + 3 * u],
    [x, peak],
    [x + 7 * u, peak + 4 * u],
    [x + 18 * u, peak + 14 * u],
    [x + 8 * u, peak + 10 * u],
    [x, peak + 14 * u],
    [x - 7 * u, peak + 9 * u],
  ]);
}

function chicago(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  // Willis: a bundle of tubes ending at different heights, two antennas
  const wx = W * 0.68;
  g.fillStyle = ink.body;
  rect(g, wx, base, 13 * u, 56 * u);
  rect(g, wx + 0.8 * u, base - 56 * u, 9 * u, 14 * u);
  rect(g, wx - 0.8 * u, base - 70 * u, 6 * u, 8 * u);
  for (const d of [-1.8, 1.8]) rect(g, wx - 0.8 * u + d * u, base - 78 * u, 0.6 * u, 16 * u);
  beacon(g, wx - 2.6 * u, base - 94 * u, ink, tips);
  beacon(g, wx + 1 * u, base - 94 * u, ink, tips);
  // Hancock: tapered, cross-braced, twin antennas
  const hx = W * 0.54;
  poly(g, [
    [hx - 5 * u, base],
    [hx - 3.2 * u, base - 68 * u],
    [hx + 3.2 * u, base - 68 * u],
    [hx + 5 * u, base],
  ]);
  for (const d of [-1.4, 1.4]) rect(g, hx + d * u, base - 68 * u, 0.5 * u, 12 * u);
  g.strokeStyle = ink.night ? "rgba(255,214,150,.35)" : "rgba(255,255,255,.25)";
  g.beginPath();
  for (let k = 0; k < 4; k++) {
    const y0 = base - k * 17 * u;
    const y1 = y0 - 17 * u;
    const w0 = 5 - (1.8 * k * 17) / 68;
    const w1 = 5 - (1.8 * (k + 1) * 17) / 68;
    g.moveTo(hx - w0 * u, y0);
    g.lineTo(hx + w1 * u, y1);
    g.moveTo(hx + w0 * u, y0);
    g.lineTo(hx - w1 * u, y1);
  }
  g.stroke();
  beacon(g, hx - 1.4 * u, base - 80 * u, ink, tips);
}

function boston(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  // Prudential, with its stepped top and mast
  const px = W * 0.5;
  g.fillStyle = ink.body;
  rect(g, px, base, 9 * u, 52 * u);
  rect(g, px, base - 52 * u, 6 * u, 3 * u);
  rect(g, px, base - 55 * u, 0.6 * u, 12 * u);
  beacon(g, px, base - 67 * u, ink, tips);
  // Hancock: a thin glass slab
  const hx = W * 0.58;
  g.fillStyle = ink.night ? "#25283a" : "#93a6bd";
  rect(g, hx, base, 6 * u, 60 * u);
  g.fillStyle = ink.night ? "rgba(140,170,220,.25)" : "rgba(255,255,255,.35)";
  rect(g, hx - 1.2 * u, base, 1 * u, 60 * u);
  // Zakim bridge: two inverted-Y towers with fanned cables
  const deck = base - 7 * u;
  g.strokeStyle = ink.marble;
  g.fillStyle = ink.marble;
  g.fillRect(W * 0.66, deck, W * 0.34, 1.2 * u);
  g.lineWidth = 1;
  for (const tx of [W * 0.77, W * 0.92]) {
    const top = deck - 30 * u;
    poly(g, [
      [tx - 2.6 * u, deck + 4 * u],
      [tx - 0.5 * u, top],
      [tx + 0.5 * u, top],
      [tx + 2.6 * u, deck + 4 * u],
      [tx + 1.6 * u, deck + 4 * u],
      [tx, top + 10 * u],
      [tx - 1.6 * u, deck + 4 * u],
    ]);
    g.beginPath();
    for (let k = 1; k <= 7; k++) {
      const y = top + k * 2.2 * u;
      g.moveTo(tx, y);
      g.lineTo(tx - k * 2.6 * u - 6 * u, deck);
      g.moveTo(tx, y);
      g.lineTo(tx + k * 2.6 * u + 6 * u, deck);
    }
    g.stroke();
    beacon(g, tx, top, ink, tips);
  }
}

function austin(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  let u = H / 100;
  // Texas Capitol, in its pink granite (drawn larger: it's the whole point of the view)
  const u2 = u;
  u *= 1.6;
  const cx = W * 0.56;
  g.fillStyle = ink.marble;
  rect(g, cx, base, 30 * u, 10 * u);
  rect(g, cx, base - 10 * u, 10 * u, 9 * u);
  g.beginPath();
  g.arc(cx, base - 19 * u, 5.4 * u, Math.PI, 0);
  g.fill();
  rect(g, cx, base - 24 * u, 1.8 * u, 4 * u);
  rect(g, cx, base - 28 * u, 0.6 * u, 4 * u);
  g.fillStyle = ink.night ? "rgba(255,220,160,.7)" : "rgba(255,255,255,.4)";
  for (let k = -3; k <= 3; k++) rect(g, cx + k * 1.3 * u, base - 11 * u, 0.5 * u, 6 * u);
  u = u2;
  // Frost Bank Tower and its owl-eared crown
  const fx = W * 0.76;
  g.fillStyle = ink.body;
  rect(g, fx, base, 8 * u, 46 * u);
  poly(g, [
    [fx - 4 * u, base - 46 * u],
    [fx - 2.4 * u, base - 54 * u],
    [fx, base - 50 * u],
    [fx + 2.4 * u, base - 54 * u],
    [fx + 4 * u, base - 46 * u],
  ]);
  rect(g, fx, base - 54 * u, 0.5 * u, 6 * u);
  beacon(g, fx, base - 60 * u, ink, tips);
}

function dc(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  let u = H / 100;
  // Washington Monument
  const mx = W * 0.8;
  g.fillStyle = ink.marble;
  poly(g, [
    [mx - 1.8 * u, base],
    [mx - 1.2 * u, base - 50 * u],
    [mx, base - 54 * u],
    [mx + 1.2 * u, base - 50 * u],
    [mx + 1.8 * u, base],
  ]);
  if (ink.night) {
    g.fillStyle = "rgba(255,255,255,.18)"; // floodlit
    poly(g, [
      [mx, base],
      [mx, base - 54 * u],
      [mx + 1.2 * u, base - 50 * u],
      [mx + 1.8 * u, base],
    ]);
  }
  beacon(g, mx - 0.8 * u, base - 52 * u, ink, tips);
  beacon(g, mx + 0.8 * u, base - 52 * u, ink, tips);
  // the Capitol: wings, drum, dome, statue
  u *= 1.4;
  const cx = W * 0.56;
  g.fillStyle = ink.marble;
  rect(g, cx, base, 42 * u, 8 * u);
  rect(g, cx, base - 8 * u, 16 * u, 3 * u);
  rect(g, cx, base - 11 * u, 12 * u, 6 * u);
  g.beginPath();
  g.arc(cx, base - 17 * u, 6.5 * u, Math.PI, 0);
  g.fill();
  rect(g, cx, base - 23 * u, 2 * u, 3 * u);
  rect(g, cx, base - 26 * u, 0.7 * u, 4 * u);
  g.fillStyle = ink.night ? "rgba(255,226,170,.55)" : "rgba(0,0,0,.08)";
  for (let k = -5; k <= 5; k++) rect(g, cx + k * 1.1 * u, base - 11.5 * u, 0.45 * u, 5 * u);
}

function london(g: G, W: number, H: number, base: number, ink: Ink, tips: number[][]) {
  const u = H / 100;
  // the Shard: a split glass spike
  const sx = W * 0.84;
  g.fillStyle = ink.night ? "#25283a" : "#93a6bd";
  poly(g, [
    [sx - 6 * u, base],
    [sx - 0.8 * u, base - 72 * u],
    [sx + 0.4 * u, base - 66 * u],
    [sx + 1 * u, base - 74 * u],
    [sx + 6 * u, base],
  ]);
  g.fillStyle = ink.night ? "rgba(140,170,220,.3)" : "rgba(255,255,255,.35)";
  poly(g, [
    [sx - 6 * u, base],
    [sx - 0.8 * u, base - 72 * u],
    [sx - 2 * u, base],
  ]);
  beacon(g, sx + 1 * u, base - 74 * u, ink, tips);
  // the London Eye
  const ex = W * 0.68;
  const r = 15 * u;
  const ey = base - 4 * u - r;
  g.strokeStyle = ink.marble;
  g.lineWidth = Math.max(1, 0.5 * u);
  g.beginPath();
  g.arc(ex, ey, r, 0, Math.PI * 2);
  g.moveTo(ex - 5 * u, base);
  g.lineTo(ex, ey);
  g.lineTo(ex + 5 * u, base);
  g.stroke();
  g.lineWidth = 1;
  g.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    g.moveTo(ex, ey);
    g.lineTo(ex + Math.cos(a) * r, ey + Math.sin(a) * r);
  }
  g.stroke();
  g.fillStyle = ink.night ? "#7fb2ff" : ink.marble; // the pods, lit blue at night
  for (let k = 0; k < 32; k++) {
    const a = (k / 32) * Math.PI * 2;
    g.fillRect(ex + Math.cos(a) * r - 0.6 * u, ey + Math.sin(a) * r - 0.6 * u, 1.2 * u, 1.2 * u);
  }
  // Parliament and Big Ben
  const bx = W * 0.54;
  g.fillStyle = ink.body;
  g.fillRect(bx - 22 * u, base - 11 * u, 22 * u, 11 * u);
  for (let k = 0; k < 9; k++) rect(g, bx - 21 * u + k * 2.5 * u, base - 11 * u, 0.7 * u, 2.4 * u);
  rect(g, bx - 18 * u, base, 4.5 * u, 22 * u); // Victoria Tower
  rect(g, bx, base, 4.4 * u, 40 * u);
  rect(g, bx, base - 40 * u, 5.4 * u, 7 * u);
  rect(g, bx, base - 47 * u, 4.4 * u, 5 * u);
  poly(g, [
    [bx - 2.6 * u, base - 52 * u],
    [bx, base - 64 * u],
    [bx + 2.6 * u, base - 52 * u],
  ]);
  g.fillStyle = ink.night ? "#ffd98a" : "#f4efe2";
  g.beginPath();
  g.arc(bx, base - 43.5 * u, 1.9 * u, 0, Math.PI * 2);
  g.fill();
  beacon(g, bx, base - 64 * u, ink, tips);
}

const DRAW: Record<Landmark, typeof nyc> = { nyc, sf, seattle, chicago, boston, austin, dc, london };

/** How tall the generated skyline around each landmark should be (DC keeps its height limit). */
export const SKYLINE_HEIGHT: Record<Landmark | "generic", number> = {
  nyc: 0.6,
  chicago: 0.6,
  sf: 0.45,
  seattle: 0.45,
  boston: 0.42,
  austin: 0.4,
  dc: 0.16,
  london: 0.36,
  generic: 0.5,
};

/** Stretches kept free of buildings, as shares of the width: water under a bridge, the lawn before a capitol. */
export const CLEARINGS: Partial<Record<Landmark, [number, number]>> = {
  sf: [0.56, 1],
  boston: [0.65, 1],
  austin: [0.45, 0.67],
  dc: [0.42, 0.86],
  london: [0.5, 0.76],
};

/** Draws the landmark and returns where its red night lights go. */
export function drawLandmark(g: G, id: Landmark, W: number, H: number, base: number, ink: Ink) {
  const tips: number[][] = [];
  DRAW[id](g, W, H, base, ink, tips);
  return tips;
}
