import type { City } from "./sky";

/*
 * The hero's scenery, drawn in code on a canvas.
 * LA: skyline, lit windows, palms and traffic on the freeway.
 * Providence: College Hill with a dome, a steeple, brick rows, fall trees, leaves and the river.
 * The contact section mirrors the same canvas, so the two always match.
 */

type Window = { x: number; y: number; t: number };
type Building = { x: number; w: number; h: number; win: Window[] };
type Palm = { x: number; h: number; lean: number; fronds: number[] };
type Car = { x: number; lane: 0 | 1; v: number };
type Leaf = { x: number; y: number; vx: number; vy: number; a: number; va: number; p: number; s: number; c: string };
type Glint = { x: number; y: number; w: number; v: number };

// Seeded, so redrawing at a new size keeps the same skyline instead of shuffling it.
let seed = 1;
const random = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = (a: number, b: number) => a + random() * (b - a);
const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)];

const FALL = [
  ["#c9622b", "#e0853f"],
  ["#d98a2b", "#ecb04c"],
  ["#b8432a", "#d4643f"],
  ["#e0a93a", "#f0c765"],
  ["#7d8f4a", "#9dad62"],
] as const;
const RIDGE = ["#c98f5c", "#d9ad6a", "#b9a06a", "#a9b184"] as const;
const BRICK = ["#9c4a36", "#8a3d2c", "#a8553f", "#7d3a2b"] as const;

export function createScene(main: HTMLCanvasElement, mirror: HTMLCanvasElement) {
  const cx = main.getContext("2d")!;
  const fx = mirror.getContext("2d")!;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let city: City = "la";
  let litShare = 0.3;
  let W = 0;
  let H = 0;
  let DPR = 1;
  let back: Building[] = [];
  let front: Building[] = [];
  let palms: Palm[] = [];
  let cars: Car[] = [];
  let backdrop: HTMLCanvasElement | null = null;
  let leaves: Leaf[] = [];
  let glints: Glint[] = [];
  let raf = 0;
  let mainVisible = true;
  let mirrorVisible = false;

  function makeWindows(w: number, height: number, density: number) {
    const out: Window[] = [];
    for (let y = 8; y < height - 6; y += 9)
      for (let x = 5; x < w - 5; x += 7)
        if (random() < density) out.push({ x, y, t: random() });
    return out;
  }

  function buildLA() {
    back = [];
    front = [];
    palms = [];
    cars = [];
    backdrop = null;
    // back row: hazy towers, with a downtown cluster right of center
    let x = 0;
    while (x < W) {
      const downtown = Math.abs(x - W * 0.66) < W * 0.14;
      const w = rnd(26, downtown ? 70 : 54);
      const h = downtown ? rnd(0.45, 0.92) : rnd(0.12, 0.36);
      back.push({ x, w, h, win: makeWindows(w, h * H * 0.8, 0.45) });
      x += w + rnd(2, 10);
    }
    // front row: low LA sprawl
    x = 0;
    while (x < W) {
      const w = rnd(40, 110);
      const h = rnd(0.08, 0.22);
      front.push({ x, w, h, win: makeWindows(w, h * H, 0.6) });
      x += w + rnd(0, 6);
    }
    for (let i = 0; i < Math.ceil(W / 170); i++)
      palms.push({
        x: rnd(W * 0.42, W),
        h: rnd(0.26, 0.4),
        lean: rnd(-0.08, 0.08),
        fronds: Array.from({ length: 7 }, () => rnd(22, 30)),
      });
    for (let i = 0; i < Math.ceil(W / 22); i++)
      cars.push({ x: rnd(0, W), lane: random() < 0.5 ? 0 : 1, v: rnd(0.4, 1.1) });
  }

  function drawRow(row: Building[], base: number, fill: string, lightA: number, scale: number) {
    for (const b of row) {
      const bh = b.h * H * scale;
      const top = base - bh;
      cx.fillStyle = fill;
      cx.fillRect(b.x, top, b.w, bh);
      for (const wn of b.win) {
        if (wn.t < litShare) {
          cx.fillStyle =
            wn.t < litShare * 0.25 ? `rgba(255,226,170,${lightA})` : `rgba(255,170,90,${lightA * 0.8})`;
          cx.fillRect(b.x + wn.x, top + wn.y, 3, 4);
        }
      }
    }
  }

  function drawPalm(p: Palm, base: number) {
    const h = p.h * H;
    const tx = p.x + p.lean * h;
    const ty = base - h;
    cx.strokeStyle = "#0b0c0f";
    cx.lineWidth = 3;
    cx.beginPath();
    cx.moveTo(p.x, base);
    cx.quadraticCurveTo(p.x + p.lean * h * 0.3, base - h * 0.5, tx, ty);
    cx.stroke();
    cx.lineWidth = 2.2;
    p.fronds.forEach((len, i) => {
      const a = -Math.PI * 0.95 + i * ((Math.PI * 0.9) / 6);
      cx.beginPath();
      cx.moveTo(tx, ty);
      cx.quadraticCurveTo(
        tx + Math.cos(a) * len * 0.6,
        ty + Math.sin(a) * len * 0.6 - 8,
        tx + Math.cos(a) * len,
        ty + Math.sin(a) * len + 10,
      );
      cx.stroke();
    });
  }

  function drawLA() {
    cx.clearRect(0, 0, W, H);
    const base = H - 26;
    drawRow(back, base - 24, "#23222c", 0.75, 0.8);
    cx.fillStyle = "#121317";
    cx.fillRect(0, base - 26, W, 26); // street level: no sky between the low buildings
    drawRow(front, base, "#121317", 0.95, 1);
    palms.forEach((p) => drawPalm(p, base));
    // freeway: headlights one way, tail lights the other
    cx.fillStyle = "#0d0e11";
    cx.fillRect(0, base, W, 26);
    for (const c of cars) {
      if (!reduce) c.x += (c.lane ? 1 : -1) * c.v;
      if (c.x > W + 10) c.x = -10;
      if (c.x < -10) c.x = W + 10;
      cx.fillStyle = c.lane ? "rgba(255,240,210,.9)" : "rgba(255,70,60,.85)";
      cx.fillRect(c.x, base + (c.lane ? 8 : 16), 4, 2);
    }
    // a few windows switch on and off
    if (!reduce && Math.random() < 0.3) {
      const b = pick(back);
      if (b?.win.length) pick(b.win).t = Math.random();
    }
  }

  function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  function brickBlock(g: CanvasRenderingContext2D, x: number, top: number, w: number, h: number, base: number) {
    g.fillStyle = pick(BRICK);
    g.fillRect(x, top, w, h);
    g.fillStyle = "rgba(0,0,0,.05)";
    for (let y = top + 4; y < base; y += 5) g.fillRect(x, y, w, 1);
    if (random() < 0.6) {
      g.fillStyle = "#4d4f52";
      g.beginPath();
      g.moveTo(x - 3, top);
      g.lineTo(x + w / 2, top - w * 0.24);
      g.lineTo(x + w + 3, top);
      g.fill();
      g.fillStyle = "#6d3226";
      g.fillRect(x + w * 0.72, top - w * 0.2, 9, w * 0.18);
    } else {
      g.fillStyle = "#efece2";
      g.fillRect(x - 2, top - 3, w + 4, 4);
    }
    const cols = Math.floor((w - 14) / 20);
    const rows = Math.floor((h - 12) / 26);
    const ox = x + (w - (cols * 20 - 10)) / 2;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = ox + c * 20;
        const wy = top + 10 + r * 26;
        g.fillStyle = "#f4f2ea";
        g.fillRect(wx - 1, wy - 1, 12, 17);
        g.fillStyle = random() < 0.15 ? "#f6e2b4" : "#b9ccd4";
        g.fillRect(wx, wy, 10, 15);
        g.fillStyle = "#f4f2ea";
        g.fillRect(wx, wy + 7, 10, 1);
      }
    }
  }

  function tree(g: CanvasRenderingContext2D, x: number, h: number, base: number) {
    const [c1, c2] = pick(FALL);
    const cy = base - h * 0.68;
    const r = h * 0.3;
    g.fillStyle = "#4b3a2e";
    g.fillRect(x - 2.5, cy, 5, base - cy);
    for (let i = 0; i < 8; i++) blob(g, x + rnd(-r, r), cy + rnd(-r * 0.8, r * 0.6), rnd(r * 0.45, r * 0.7), c1);
    for (let i = 0; i < 5; i++) blob(g, x + rnd(-r * 0.7, r * 0.6), cy + rnd(-r * 0.9, r * 0.1), rnd(r * 0.25, r * 0.45), c2);
  }

  // Providence barely changes frame to frame, so its scenery is painted once and reused.
  function buildPvd() {
    backdrop = document.createElement("canvas");
    backdrop.width = main.width;
    backdrop.height = main.height;
    const g = backdrop.getContext("2d")!;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const base = H - 30;
    const hill = (x: number) => {
      const t = x / W;
      return base - (H * 0.16 + H * 0.34 * (t * t * (3 - 2 * t)) + Math.sin(x / 170) * 9);
    };
    // College Hill, with a soft far tree line along its ridge
    g.fillStyle = "#bfccb6";
    g.beginPath();
    g.moveTo(0, base);
    for (let x = 0; x <= W; x += 10) g.lineTo(x, hill(x));
    g.lineTo(W, base);
    g.fill();
    for (let x = 0; x < W; x += 16) blob(g, x + rnd(-5, 5), hill(x) + rnd(0, 8), rnd(9, 17), pick(RIDGE));
    // marble dome
    const dx = W * 0.6;
    const dy = base - H * 0.5;
    g.fillStyle = "#e9e6db";
    g.fillRect(dx - 70, dy + 22, 140, H * 0.5);
    g.fillRect(dx - 46, dy, 92, 24);
    g.fillRect(dx - 34, dy - 34, 68, 36);
    g.fillStyle = "#d3d0c5";
    g.fillRect(dx - 74, dy + 20, 148, 3);
    g.fillRect(dx - 48, dy - 2, 96, 3);
    for (let i = -3; i <= 3; i++) {
      g.fillRect(dx + i * 19 - 1.5, dy + 28, 3, H * 0.5);
      g.fillStyle = "#b9ccd4";
      g.fillRect(dx + i * 19 + 5, dy + 34, 7, 16);
      g.fillStyle = "#d3d0c5";
    }
    g.fillStyle = "#f4f2ea";
    g.beginPath();
    g.arc(dx, dy - 34, 34, Math.PI, 0);
    g.fill();
    g.fillStyle = "#d3d0c5";
    for (let i = -3; i <= 3; i++) g.fillRect(dx + i * 9 - 1, dy - 32, 2, 30);
    g.fillRect(dx - 5, dy - 84, 10, 18);
    g.fillStyle = "#c9b77a";
    g.beginPath();
    g.arc(dx, dy - 88, 5, 0, Math.PI * 2);
    g.fill();
    // white steeple
    const sx = W * 0.84;
    const sy = base - H * 0.5;
    g.fillStyle = "#f4f2ea";
    g.fillRect(sx - 17, sy, 34, H * 0.5);
    g.fillRect(sx - 12, sy - 44, 24, 44);
    g.beginPath();
    g.moveTo(sx - 11, sy - 44);
    g.lineTo(sx, sy - H * 0.3);
    g.lineTo(sx + 11, sy - 44);
    g.fill();
    g.fillStyle = "#8fa0a8";
    g.fillRect(sx - 5, sy - 34, 10, 20);
    g.fillRect(sx - 8, sy + 14, 16, 26);
    // brick rows, taller up the hill on the right
    let x = -10;
    while (x < W) {
      const t = x / W;
      const w = rnd(74, 132);
      const h = H * (t > 0.48 ? rnd(0.2, 0.36) : rnd(0.1, 0.19));
      brickBlock(g, x, base - h, w, h, base);
      x += w + rnd(-2, 3);
    }
    // fall trees in front
    for (let i = 0; i < Math.ceil(W / 78); i++) {
      const tx = rnd(0, W);
      tree(g, tx, H * (tx / W > 0.48 ? rnd(0.2, 0.32) : rnd(0.14, 0.22)), base);
    }
    g.fillStyle = "#8c8678";
    g.fillRect(0, base, W, 4); // stone riverbank
    leaves = Array.from({ length: Math.ceil(W / 70) }, () => ({
      x: rnd(0, W),
      y: rnd(0, H),
      vx: rnd(0.1, 0.45),
      vy: rnd(0.2, 0.5),
      a: rnd(0, 6),
      va: rnd(-0.03, 0.03),
      p: rnd(0, 6),
      s: rnd(3, 5.5),
      c: pick(FALL.slice(0, 4))[0],
    }));
    glints = Array.from({ length: Math.ceil(W / 40) }, () => ({
      x: rnd(0, W),
      y: rnd(7, 24),
      w: rnd(10, 34),
      v: rnd(0.06, 0.22),
    }));
  }

  function drawPvd() {
    cx.clearRect(0, 0, W, H);
    if (backdrop) cx.drawImage(backdrop, 0, 0, W, H);
    const base = H - 26;
    // the river moves slowly where the freeway ran in LA
    const river = cx.createLinearGradient(0, base, 0, H);
    river.addColorStop(0, "#a8c8d4");
    river.addColorStop(1, "#8db3c4");
    cx.fillStyle = river;
    cx.fillRect(0, base, W, 26);
    cx.fillStyle = "rgba(255,255,255,.55)";
    for (const g of glints) {
      if (!reduce) {
        g.x += g.v;
        if (g.x > W) g.x = -g.w;
      }
      cx.fillRect(g.x, base + g.y, g.w, 1.5);
    }
    for (const l of leaves) {
      if (!reduce) {
        l.y += l.vy;
        l.x += l.vx + Math.sin(l.y / 30 + l.p) * 0.35;
        l.a += l.va;
        if (l.y > H - 30) {
          l.y = -6;
          l.x = rnd(0, W);
        }
        if (l.x > W + 6) l.x = -6;
      }
      cx.save();
      cx.translate(l.x, l.y);
      cx.rotate(l.a);
      cx.fillStyle = l.c;
      cx.beginPath();
      cx.ellipse(0, 0, l.s, l.s * 0.55, 0, 0, Math.PI * 2);
      cx.fill();
      cx.restore();
    }
  }

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = main.clientWidth;
    H = main.clientHeight;
    seed = city === "pvd" ? 2 : 1;
    main.width = W * DPR;
    main.height = H * DPR;
    cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    mirror.width = main.width;
    mirror.height = main.height;
    mirror.style.height = `${H}px`;
    if (city === "pvd") buildPvd();
    else buildLA();
  }

  function paint() {
    if (city === "pvd") drawPvd();
    else drawLA();
    if (mirrorVisible) {
      fx.clearRect(0, 0, mirror.width, mirror.height);
      fx.drawImage(main, 0, 0);
    }
  }

  function frame() {
    raf = 0;
    if (!mainVisible && !mirrorVisible) return; // nothing on screen: stop until something is
    paint();
    if (!reduce) raf = requestAnimationFrame(frame); // reduced motion: one still frame per change
  }
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.target === main) mainVisible = e.isIntersecting;
      else mirrorVisible = e.isIntersecting;
    }
    wake();
  });
  observer.observe(main);
  observer.observe(mirror);

  build();
  wake();

  // The canvas also changes size when the hero grows, as when an answer opens.
  const sizer = new ResizeObserver(() => {
    if (main.clientWidth === W && main.clientHeight === H) return;
    build();
    paint(); // resizing clears the canvas: redraw before the browser shows it blank
  });
  sizer.observe(main);

  return {
    setCity(next: City) {
      city = next;
      build();
      wake();
    },
    setLitShare(share: number) {
      litShare = share;
      wake();
    },
    destroy() {
      observer.disconnect();
      sizer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    },
  };
}
