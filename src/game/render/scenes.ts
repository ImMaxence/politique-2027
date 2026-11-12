/**
 * Backdrops. Each campaign night has its own stage set: a village square, the
 * agricultural show, a street, a TV studio, an international summit and the
 * Élysée courtyard (at dusk and at night). They are painted once per level
 * onto an offscreen canvas.
 */
import { COLS, ROWS } from '../data/levels';
import type { SceneId } from '../data/types';
import { BOARD_H, BOARD_W, BOARD_X, BOARD_Y, CELL_H, CELL_W, VIEW_H, VIEW_W, laneTop } from './layout';
import { INK } from './portraits';

type Ctx = CanvasRenderingContext2D;

interface Palette {
  sky: string;
  wall: string;
  wallShade: string;
  ground: [string, string];
  line: string;
  steps: [string, string, string];
  carpet: string;
  door: string;
  closed: string;
  border: string;
  edge: 'gate' | 'curtain' | 'barrier' | 'fence';
  dark: boolean;
}

const PAPER = '#fffdf6';
const GOLD = '#ffd23f';
const RED = '#e5383b';
const BLUE = '#2f5fe0';
const DISPLAY = "'Anton', 'Arial Narrow', Impact, sans-serif";
const STONE: [string, string, string] = ['#f4ecd8', '#e6dcc3', '#d6caac'];

const PALETTES: Record<SceneId, Palette> = {
  mairie: { sky: '#cfe6f5', wall: '#f1e3c4', wallShade: '#d9c79a', ground: ['#e8ddc9', '#ddd0b8'], line: 'rgba(23,32,63,.13)', steps: STONE, carpet: '#c62f3a', door: '#6b4a2f', closed: '#5d9d57', border: '#5d9d57', edge: 'fence', dark: false },
  salon: { sky: '#e9d9a8', wall: '#d8c58f', wallShade: '#b79f66', ground: ['#efd98c', '#e6cc74'], line: 'rgba(90,60,20,.16)', steps: ['#e9dcb6', '#dccd9f', '#cdbb87'], carpet: '#3c8a57', door: '#6b4a2f', closed: '#b79f66', border: '#a8834a', edge: 'fence', dark: false },
  rue: { sky: '#c9d3e0', wall: '#e9dfcf', wallShade: '#cdbfa6', ground: ['#8f97a7', '#868e9e'], line: 'rgba(255,255,255,.28)', steps: ['#d5d8de', '#c4c8d0', '#b3b8c2'], carpet: '#c62f3a', door: '#2a3566', closed: '#6c7482', border: '#5f6675', edge: 'barrier', dark: false },
  plateau: { sky: '#151936', wall: '#22275a', wallShade: '#191d45', ground: ['#3d4a8f', '#364283'], line: 'rgba(120,220,255,.22)', steps: ['#4c5aa6', '#414d92', '#37427f'], carpet: '#c62f3a', door: GOLD, closed: '#23284f', border: '#191d45', edge: 'curtain', dark: true },
  sommet: { sky: '#bfe3ff', wall: '#fbf6ea', wallShade: '#e2d8c2', ground: ['#f2ebdf', '#e8dece'], line: 'rgba(23,32,63,.11)', steps: STONE, carpet: '#c62f3a', door: '#2a3566', closed: '#d7ccb8', border: '#b9ad94', edge: 'gate', dark: false },
  elysee: { sky: '#ffd9a8', wall: '#f3deb6', wallShade: '#dcc292', ground: ['#f3d7a6', '#eac98f'], line: 'rgba(23,32,63,.13)', steps: STONE, carpet: '#c62f3a', door: '#2a3566', closed: '#5d9d57', border: '#5d9d57', edge: 'gate', dark: false },
  'elysee-nuit': { sky: '#232a5c', wall: '#b7b1c8', wallShade: '#948eac', ground: ['#4b5287', '#434a7d'], line: 'rgba(255,255,255,.13)', steps: STONE, carpet: '#c62f3a', door: GOLD, closed: '#2f6a45', border: '#2f6a45', edge: 'gate', dark: true },
};

export function isDarkScene(scene: SceneId): boolean {
  return PALETTES[scene].dark;
}

/** Deterministic noise, so rebuilding a backdrop never flickers. */
function noise(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function outline(g: Ctx, width = 3): void {
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.stroke();
}

function box(g: Ctx, x: number, y: number, w: number, h: number, fill: string, radius: number | number[] = 0, width = 3): void {
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fillStyle = fill;
  g.fill();
  if (width) outline(g, width);
}

function bunting(g: Ctx): void {
  const colors = [BLUE, PAPER, RED];
  g.beginPath();
  g.moveTo(0, 6);
  g.lineTo(VIEW_W, 6);
  outline(g, 2);
  for (let i = 0; i < 43; i++) {
    const x = i * 30;
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x + 26, 6);
    g.lineTo(x + 13, 30);
    g.closePath();
    g.fillStyle = colors[i % 3];
    g.fill();
    outline(g, 2);
  }
}

function wallBand(g: Ctx, pal: Palette, from = 34): void {
  g.fillStyle = pal.wall;
  g.fillRect(0, from, VIEW_W, BOARD_Y - from);
  g.fillStyle = pal.wallShade;
  g.fillRect(0, from, VIEW_W, 10);
  g.fillRect(0, BOARD_Y - 12, VIEW_W, 12);
}

// ───────────────────────────── stage sets ─────────────────────────────

function palace(g: Ctx, pal: Palette): void {
  if (pal.dark) {
    const rnd = noise(5);
    g.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 40; i++) g.fillRect(rnd() * VIEW_W, rnd() * 34, 2, 2);
  }
  wallBand(g, pal);
  for (let i = 0; i < COLS; i++) {
    const x = BOARD_X + i * CELL_W + CELL_W / 2;
    g.beginPath();
    g.moveTo(x - 22, BOARD_Y - 12);
    g.lineTo(x - 22, 70);
    g.quadraticCurveTo(x, 44, x + 22, 70);
    g.lineTo(x + 22, BOARD_Y - 12);
    g.closePath();
    g.fillStyle = pal.dark ? GOLD : '#2a3566';
    g.fill();
    outline(g);
    g.beginPath();
    g.moveTo(x, 58);
    g.lineTo(x, BOARD_Y - 12);
    g.moveTo(x - 22, 88);
    g.lineTo(x + 22, 88);
    g.strokeStyle = pal.wall;
    g.lineWidth = 3;
    g.stroke();
  }
  bunting(g);
}

function village(g: Ctx): void {
  const fronts = ['#f6e6c8', '#f3cdbd', '#dfe9d2', '#f9efd9', '#e6d7ee', '#f6e6c8', '#f3cdbd', '#dfe9d2', '#f9efd9', '#e6d7ee'];
  const roofs = ['#b5533c', '#8a5a44', '#a8463a'];
  // A row of village houses…
  for (let i = 0; i < 11; i++) {
    const x = i * 122 - 30;
    const top = 58 + (i % 3) * 7;
    box(g, x, top, 122, BOARD_Y - top, fronts[i % fronts.length]);
    g.beginPath();
    g.moveTo(x - 6, top);
    g.lineTo(x + 61, top - 34);
    g.lineTo(x + 128, top);
    g.closePath();
    g.fillStyle = roofs[i % 3];
    g.fill();
    outline(g);
    for (const wx of [x + 24, x + 74]) {
      box(g, wx, top + 18, 24, 30, '#9fc3e0', 3, 2.5);
      g.fillStyle = '#4b8a5c';
      g.fillRect(wx - 8, top + 18, 7, 30);
      g.fillRect(wx + 25, top + 18, 7, 30);
    }
  }
  // …and the town hall in the middle.
  const cx = VIEW_W / 2;
  box(g, cx - 140, 44, 280, BOARD_Y - 44, '#fbf3df');
  g.beginPath();
  g.moveTo(cx - 154, 46);
  g.lineTo(cx, 6);
  g.lineTo(cx + 154, 46);
  g.closePath();
  g.fillStyle = '#e8dcc0';
  g.fill();
  outline(g);
  g.beginPath();
  g.arc(cx, 31, 10, 0, Math.PI * 2);
  g.fillStyle = PAPER;
  g.fill();
  outline(g, 2.5);
  g.beginPath();
  g.moveTo(cx, 31);
  g.lineTo(cx, 25);
  g.moveTo(cx, 31);
  g.lineTo(cx + 5, 33);
  outline(g, 2);
  for (const wx of [cx - 116, cx + 84]) box(g, wx, 62, 32, 44, '#9fc3e0', [16, 16, 2, 2], 2.5);
  // Flag
  g.fillStyle = BLUE;
  g.fillRect(cx + 150, 52, 12, 24);
  g.fillStyle = PAPER;
  g.fillRect(cx + 162, 52, 12, 24);
  g.fillStyle = RED;
  g.fillRect(cx + 174, 52, 12, 24);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.strokeRect(cx + 150, 52, 36, 24);
}

function cow(g: Ctx, x: number, y: number, flip: boolean): void {
  g.save();
  g.translate(x, y);
  if (flip) g.scale(-1, 1);
  // ears and horns
  box(g, -34, -6, 16, 10, '#f3c9a5', 5, 2.5);
  box(g, 18, -6, 16, 10, '#f3c9a5', 5, 2.5);
  g.beginPath();
  g.moveTo(-18, -14);
  g.quadraticCurveTo(-26, -30, -14, -30);
  g.moveTo(18, -14);
  g.quadraticCurveTo(26, -30, 14, -30);
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = '#efe6cf';
  g.lineWidth = 3;
  g.stroke();
  box(g, -22, -18, 44, 46, PAPER, 14);
  g.fillStyle = '#2a2422';
  g.beginPath();
  g.ellipse(-12, -6, 9, 12, 0.4, 0, Math.PI * 2);
  g.fill();
  box(g, -17, 12, 34, 20, '#f6a9b0', 9, 2.5);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(-9, 2, 2.6, 0, Math.PI * 2);
  g.arc(9, 2, 2.6, 0, Math.PI * 2);
  g.arc(-6, 22, 2, 0, Math.PI * 2);
  g.arc(6, 22, 2, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function show(g: Ctx, pal: Palette): void {
  wallBand(g, pal, 0);
  // Roof beams and pennants
  g.strokeStyle = '#8a6a3a';
  g.lineWidth = 8;
  g.beginPath();
  for (let x = 60; x < VIEW_W; x += 160) {
    g.moveTo(x, 0);
    g.lineTo(x + 80, 30);
    g.lineTo(x + 160, 0);
  }
  g.stroke();
  const pennants = ['#3c8a57', GOLD, PAPER];
  for (let i = 0; i < 43; i++) {
    g.beginPath();
    g.moveTo(i * 30, 34);
    g.lineTo(i * 30 + 26, 34);
    g.lineTo(i * 30 + 13, 54);
    g.closePath();
    g.fillStyle = pennants[i % 3];
    g.fill();
    outline(g, 2);
  }
  // Cows looking over the fence
  [250, 470, 820, 1040].forEach((x, i) => cow(g, x, 82, i % 2 === 1));
  // Fence
  g.fillStyle = '#a8744e';
  for (let x = 0; x < VIEW_W; x += 58) box(g, x + 4, 88, 12, BOARD_Y - 88, '#a8744e', 2, 2.5);
  box(g, 0, 98, VIEW_W, 10, '#b98558', 0, 2.5);
  box(g, 0, 114, VIEW_W, 10, '#b98558', 0, 2.5);
  // Hay bales
  for (const x of [20, 1150]) {
    box(g, x, 74, 96, 52, '#e6c15a', 10);
    g.strokeStyle = 'rgba(90,60,20,.35)';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 1; i < 5; i++) {
      g.moveTo(x + 8, 74 + i * 10);
      g.lineTo(x + 88, 74 + i * 10);
    }
    g.stroke();
  }
}

function street(g: Ctx, pal: Palette): void {
  // Zinc roofs and chimneys
  g.fillStyle = '#8f9bb0';
  g.fillRect(0, 0, VIEW_W, 26);
  for (let x = 70; x < VIEW_W; x += 190) box(g, x, 2, 26, 22, '#b5533c', 2, 2.5);
  g.beginPath();
  g.moveTo(0, 26);
  g.lineTo(VIEW_W, 26);
  outline(g);
  wallBand(g, pal, 26);
  // Tall windows with wrought-iron balconies
  for (let i = 0; i < 22; i++) {
    const x = 14 + i * 58;
    box(g, x, 38, 30, 40, '#5f6f8f', [8, 8, 2, 2], 2.5);
    g.strokeStyle = pal.wall;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x + 15, 40);
    g.lineTo(x + 15, 78);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x - 4, 78);
    g.lineTo(x + 34, 78);
    for (let b = 0; b <= 6; b++) {
      g.moveTo(x - 2 + b * 5.6, 68);
      g.lineTo(x - 2 + b * 5.6, 78);
    }
    g.stroke();
  }
  // Shop fronts and striped awnings
  const awnings = [RED, '#3c8a57', BLUE, GOLD];
  for (let i = 0; i < 8; i++) {
    const x = 10 + i * 160;
    box(g, x, 96, 140, BOARD_Y - 96, '#3a3f4b', 0, 2.5);
    box(g, x + 8, 104, 124, BOARD_Y - 108, '#dff1ff', 0, 2);
    g.beginPath();
    g.moveTo(x - 6, 104);
    g.lineTo(x + 4, 86);
    g.lineTo(x + 136, 86);
    g.lineTo(x + 146, 104);
    g.closePath();
    g.fillStyle = awnings[i % awnings.length];
    g.fill();
    outline(g, 2.5);
    g.fillStyle = PAPER;
    for (let st = 0; st < 5; st++) {
      g.beginPath();
      g.moveTo(x + 14 + st * 28, 86);
      g.lineTo(x + 28 + st * 28, 86);
      g.lineTo(x + 30 + st * 29, 104);
      g.lineTo(x + 14 + st * 29, 104);
      g.closePath();
      g.fill();
    }
  }
}

function studio(g: Ctx, pal: Palette): void {
  wallBand(g, pal, 0);
  // Screens
  for (const [x, w] of [
    [70, 250],
    [VIEW_W - 320, 250],
  ] as const) {
    box(g, x, 20, w, 86, '#17203f', 10);
    box(g, x + 8, 28, w - 16, 70, '#3b6fe0', 6, 0);
    g.fillStyle = 'rgba(255,255,255,.75)';
    for (let i = 0; i < 6; i++) g.fillRect(x + 26 + i * 34, 86 - (20 + ((i * 37) % 40)), 20, 20 + ((i * 37) % 40));
  }
  // Spotlights
  for (let i = 0; i < 6; i++) {
    const x = 250 + i * 160;
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x - 70, BOARD_Y);
    g.lineTo(x + 70, BOARD_Y);
    g.closePath();
    g.fillStyle = 'rgba(255,240,190,.10)';
    g.fill();
    box(g, x - 13, 0, 26, 16, '#0f1330', 4, 2.5);
    g.fillStyle = GOLD;
    g.fillRect(x - 8, 12, 16, 5);
  }
}

function flag(g: Ctx, x: number, y: number, kind: number): void {
  const w = 54;
  const h = 34;
  const vertical = (colors: string[]) => colors.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(x + (i * w) / colors.length, y, w / colors.length + 0.5, h);
  });
  const horizontal = (colors: string[]) => colors.forEach((c, i) => {
    g.fillStyle = c;
    g.fillRect(x, y + (i * h) / colors.length, w, h / colors.length + 0.5);
  });
  switch (kind % 9) {
    case 0: vertical([BLUE, PAPER, RED]); break;
    case 1: {
      g.fillStyle = '#1c3fa8';
      g.fillRect(x, y, w, h);
      g.fillStyle = GOLD;
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        g.beginPath();
        g.arc(x + w / 2 + Math.cos(a) * 10, y + h / 2 + Math.sin(a) * 10, 1.8, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case 2: {
      horizontal([RED, PAPER, RED, PAPER, RED, PAPER, RED]);
      g.fillStyle = '#1c3fa8';
      g.fillRect(x, y, w * 0.42, h * 0.56);
      break;
    }
    case 3: horizontal(['#17181d', RED, GOLD]); break;
    case 4: vertical(['#3c8a57', PAPER, RED]); break;
    case 5: {
      g.fillStyle = PAPER;
      g.fillRect(x, y, w, h);
      g.fillStyle = RED;
      g.beginPath();
      g.arc(x + w / 2, y + h / 2, 9, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 6: {
      vertical([RED, PAPER, PAPER, RED]);
      g.fillStyle = RED;
      g.beginPath();
      g.arc(x + w / 2, y + h / 2, 6, 0, Math.PI * 2);
      g.fill();
      break;
    }
    case 7: horizontal([RED, GOLD, RED]); break;
    default: horizontal(['#f08a1c', PAPER, '#3c8a57']);
  }
  g.strokeStyle = INK;
  g.lineWidth = 2.5;
  g.strokeRect(x, y, w, h);
}

function summit(g: Ctx, pal: Palette): void {
  wallBand(g, pal);
  // Colonnade
  for (let x = 30; x < VIEW_W; x += 116) box(g, x, 44, 22, BOARD_Y - 56, '#fffaf0', 4, 2.5);
  // One flag per lane column
  for (let i = 0; i < COLS; i++) {
    const x = BOARD_X + i * CELL_W + CELL_W / 2;
    g.beginPath();
    g.moveTo(x - 30, 10);
    g.lineTo(x - 30, BOARD_Y - 12);
    outline(g, 4);
    g.fillStyle = GOLD;
    g.beginPath();
    g.arc(x - 30, 9, 4.5, 0, Math.PI * 2);
    g.fill();
    flag(g, x - 28, 16, i);
  }
}

// ───────────────────────────── floor details ─────────────────────────────

function floorDetails(g: Ctx, scene: SceneId, lanes: number[]): void {
  const rnd = noise(77);
  if (scene === 'rue') {
    // Zebra crossing in front of the steps, and a centre line in each lane.
    for (const lane of lanes) {
      g.fillStyle = 'rgba(255,255,255,.55)';
      for (let i = 0; i < 4; i++) g.fillRect(BOARD_X + 10, laneTop(lane) + 10 + i * 26, CELL_W - 20, 13);
      g.fillStyle = 'rgba(255,255,255,.35)';
      for (let x = BOARD_X + CELL_W * 1.3; x < BOARD_X + BOARD_W - 30; x += 70) g.fillRect(x, laneTop(lane) + CELL_H / 2 - 3, 36, 6);
    }
  } else if (scene === 'salon') {
    g.strokeStyle = 'rgba(150,110,30,.28)';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < 520; i++) {
      const x = BOARD_X + rnd() * BOARD_W;
      const y = BOARD_Y + rnd() * BOARD_H;
      const a = rnd() * Math.PI;
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 5);
    }
    g.stroke();
  } else if (scene === 'mairie') {
    g.strokeStyle = 'rgba(23,32,63,.10)';
    g.lineWidth = 2;
    for (let y = BOARD_Y + 14; y < BOARD_Y + BOARD_H; y += 28) {
      for (let x = BOARD_X + (Math.round(y / 28) % 2) * 20; x < BOARD_X + BOARD_W - 20; x += 40) {
        g.beginPath();
        g.arc(x + 20, y + 10, 18, Math.PI, 0);
        g.stroke();
      }
    }
  } else if (scene === 'plateau') {
    g.fillStyle = 'rgba(255,255,255,.05)';
    for (let i = 0; i < 9; i++) {
      g.beginPath();
      g.moveTo(BOARD_X + i * 140, BOARD_Y);
      g.lineTo(BOARD_X + i * 140 + 50, BOARD_Y);
      g.lineTo(BOARD_X + i * 140 - 110, BOARD_Y + BOARD_H);
      g.lineTo(BOARD_X + i * 140 - 160, BOARD_Y + BOARD_H);
      g.closePath();
      g.fill();
    }
  } else if (scene === 'sommet') {
    g.strokeStyle = 'rgba(23,32,63,.07)';
    g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i < 60; i++) {
      const x = BOARD_X + rnd() * BOARD_W;
      const y = BOARD_Y + rnd() * BOARD_H;
      g.moveTo(x, y);
      g.quadraticCurveTo(x + 20, y + (rnd() - 0.5) * 30, x + 46, y + (rnd() - 0.5) * 20);
    }
    g.stroke();
  }
}

function entrance(g: Ctx, pal: Palette): void {
  const x = BOARD_X + BOARD_W;
  const w = VIEW_W - x;
  if (pal.edge === 'curtain') {
    for (let i = 0; i < 6; i++) {
      g.fillStyle = i % 2 ? '#a3222b' : '#c62f3a';
      g.fillRect(x + (i * w) / 6, BOARD_Y, w / 6 + 0.5, BOARD_H);
    }
  } else if (pal.edge === 'barrier') {
    g.fillStyle = '#6c7482';
    g.fillRect(x, BOARD_Y, w, BOARD_H);
    for (let lane = 0; lane < ROWS; lane++) {
      const y = laneTop(lane) + CELL_H / 2 - 16;
      box(g, x + 6, y, w - 12, 32, PAPER, 4, 2.5);
      g.fillStyle = RED;
      for (let s = 0; s < 3; s++) g.fillRect(x + 10 + s * 18, y + 2, 9, 28);
    }
  } else if (pal.edge === 'fence') {
    g.fillStyle = pal.closed;
    g.fillRect(x, BOARD_Y, w, BOARD_H);
    for (let y = BOARD_Y + 6; y < BOARD_Y + BOARD_H; y += 40) box(g, x + 8, y, w - 16, 12, '#b98558', 3, 2.5);
    box(g, x + 14, BOARD_Y, 10, BOARD_H, '#a8744e', 0, 2.5);
    box(g, x + w - 24, BOARD_Y, 10, BOARD_H, '#a8744e', 0, 2.5);
  } else {
    g.fillStyle = pal.dark ? '#1b2046' : '#b9c4d6';
    g.fillRect(x, BOARD_Y, w, BOARD_H);
    for (let y = BOARD_Y + 8; y < BOARD_Y + BOARD_H; y += 20) {
      g.fillStyle = INK;
      g.fillRect(x + 4, y, w - 8, 5);
    }
    for (let i = 0; i < 4; i++) {
      g.fillStyle = INK;
      g.fillRect(x + 8 + i * 16, BOARD_Y, 6, BOARD_H);
      g.fillStyle = GOLD;
      for (let lane = 0; lane < ROWS; lane++) {
        g.beginPath();
        g.arc(x + 11 + i * 16, laneTop(lane) + CELL_H / 2, 5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.beginPath();
  g.moveTo(x, BOARD_Y);
  g.lineTo(x, BOARD_Y + BOARD_H);
  outline(g);
}

// ───────────────────────────── entry point ─────────────────────────────

/** Paints a full backdrop in logical coordinates (the caller sets the scale). */
export function paintBackdrop(g: Ctx, scene: SceneId, lanes: number[], label: string | null): void {
  const pal = PALETTES[scene];
  g.fillStyle = pal.sky;
  g.fillRect(0, 0, VIEW_W, VIEW_H);

  switch (scene) {
    case 'mairie': village(g); break;
    case 'salon': show(g, pal); break;
    case 'rue': street(g, pal); break;
    case 'plateau': studio(g, pal); break;
    case 'sommet': summit(g, pal); break;
    default: palace(g, pal);
  }
  g.beginPath();
  g.moveTo(0, BOARD_Y);
  g.lineTo(VIEW_W, BOARD_Y);
  outline(g);

  // Lanes
  for (let lane = 0; lane < ROWS; lane++) {
    for (let col = 0; col < COLS; col++) {
      g.fillStyle = pal.ground[(lane + col) % 2];
      g.fillRect(BOARD_X + col * CELL_W, laneTop(lane), CELL_W, CELL_H);
    }
  }
  floorDetails(g, scene, lanes);
  for (let lane = 0; lane < ROWS; lane++) {
    if (lanes.includes(lane)) continue;
    // Closed lanes are hedged off.
    g.fillStyle = pal.closed;
    g.fillRect(BOARD_X, laneTop(lane), BOARD_W, CELL_H);
    g.fillStyle = 'rgba(0,0,0,.12)';
    const rnd = noise(lane + 11);
    for (let i = 0; i < 70; i++) {
      g.beginPath();
      g.arc(BOARD_X + rnd() * BOARD_W, laneTop(lane) + rnd() * CELL_H, 10 + rnd() * 16, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.strokeStyle = pal.line;
  g.lineWidth = 2;
  g.setLineDash([6, 8]);
  g.beginPath();
  for (let col = 1; col < COLS; col++) {
    g.moveTo(BOARD_X + col * CELL_W, BOARD_Y);
    g.lineTo(BOARD_X + col * CELL_W, BOARD_Y + BOARD_H);
  }
  for (let lane = 1; lane < ROWS; lane++) {
    g.moveTo(BOARD_X, laneTop(lane));
    g.lineTo(BOARD_X + BOARD_W, laneTop(lane));
  }
  g.stroke();
  g.setLineDash([]);

  // The steps (left): what the player defends.
  pal.steps.forEach((color, i) => {
    g.fillStyle = color;
    g.fillRect(40 + i * 44, BOARD_Y, 44, BOARD_H);
  });
  g.fillStyle = pal.wall;
  g.fillRect(0, BOARD_Y, 40, BOARD_H);
  for (const lane of lanes) {
    g.fillStyle = pal.carpet;
    g.fillRect(40, laneTop(lane) + 36, BOARD_X - 40, CELL_H - 72);
    g.fillStyle = 'rgba(0,0,0,.14)';
    for (let i = 0; i < 3; i++) g.fillRect(40 + i * 44 + 39, laneTop(lane) + 36, 5, CELL_H - 72);
    box(g, 8, laneTop(lane) + 22, 24, CELL_H - 44, pal.door, [12, 12, 2, 2]);
  }
  g.beginPath();
  for (let i = 0; i <= 3; i++) {
    g.moveTo(40 + i * 44, BOARD_Y);
    g.lineTo(40 + i * 44, BOARD_Y + BOARD_H);
  }
  outline(g);

  entrance(g, pal);

  // Bottom border
  g.fillStyle = pal.border;
  g.fillRect(0, BOARD_Y + BOARD_H, VIEW_W, VIEW_H - BOARD_Y - BOARD_H);
  g.beginPath();
  g.moveTo(0, BOARD_Y + BOARD_H);
  g.lineTo(VIEW_W, BOARD_Y + BOARD_H);
  outline(g);

  // Level banner (left out on phones, where the controls sit over the top of the scenery)
  if (label) {
    const text = label.toUpperCase();
    g.font = `400 26px ${DISPLAY}`;
    const width = Math.min(760, g.measureText(text).width + 56);
    g.save();
    g.translate(VIEW_W / 2, 82);
    g.rotate(-0.012);
    box(g, -width / 2, -24, width, 48, PAPER, 6);
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2, width - 40);
    g.restore();
  }

  // Paper grain
  const rnd = noise(2027);
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = rnd() > 0.5 ? 'rgba(255,255,255,.05)' : 'rgba(23,32,63,.035)';
    g.fillRect(rnd() * VIEW_W, rnd() * VIEW_H, 2, 2);
  }
}
