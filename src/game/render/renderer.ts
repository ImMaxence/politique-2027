/**
 * Canvas renderer: a paper puppet theatre.
 * It reads the simulation state, never writes to it.
 */
import { fmt, type GameStrings } from '../../i18n/game';
import { COLS, ROWS } from '../data/levels';
import type { FlameColour } from '../cosmetics';
import { EYES, PHOTOS, type Expression } from '../data/photos';
import type { ProjectileKind } from '../data/types';
import { CAMPS, UNITS, categoryOf, figureOf } from '../data/units';
import { ZUCMAN_SHARE, canPlace, playOn, refundOf, type Enemy, type GameEvent, type GameState, type Projectile, type Unit } from '../sim/engine';
import { BOARD_W, BOARD_X, CELL_H, CELL_W, FIGURE_SCALE, SCENE_LEFT, SCENE_W, VIEW_H, VIEW_W, feetY, laneTop, xToPx } from './layout';
import { HEAD_BOX, INK } from './portraits';
import { drawGoal } from './goals';
import { paintBackdrop } from './scenes';
import type { Sprite, SpriteStore } from './sprites';

export interface ViewState {
  hover: { lane: number; col: number } | null;
  selected: string | null;
  removing: boolean;
}

const PAPER = '#fffdf6';
const GOLD = '#ffd23f';
/** Level 3 figures are on fire. */
const FIRE = '#ff8a00';
/** Level-up flames, by colour (the wardrobe can change them): fire layers from outside in, the rim, the eyes' flame, the embers. */
const FLAMES: Record<FlameColour, { layers: string[]; rim: string; eye: [string, string]; embers: [string, string] }> = {
  classic: { layers: ['rgba(255,120,0,.8)', 'rgba(255,214,70,.9)'], rim: 'rgba(170,50,0,.6)', eye: ['rgba(255,110,0,.92)', 'rgba(255,226,80,.95)'], embers: ['#ff8a00', '#ffd23f'] },
  blue: { layers: ['rgba(40,110,255,.8)', 'rgba(160,220,255,.92)'], rim: 'rgba(10,40,140,.6)', eye: ['rgba(40,120,255,.92)', 'rgba(180,230,255,.95)'], embers: ['#3d8bff', '#bfe3ff'] },
  purple: { layers: ['rgba(140,60,255,.8)', 'rgba(228,190,255,.92)'], rim: 'rgba(70,20,140,.6)', eye: ['rgba(150,70,255,.92)', 'rgba(235,200,255,.95)'], embers: ['#9b5cff', '#e6c4ff'] },
  tricolour: { layers: ['rgba(47,91,211,.88)', 'rgba(255,253,246,.92)', 'rgba(229,56,59,.9)'], rim: 'rgba(20,30,90,.6)', eye: ['rgba(47,91,211,.95)', 'rgba(229,56,59,.95)'], embers: ['#2f5bd3', '#e5383b'] },
};

/** The puppets' SVG viewBox: 120 × 150 plus an 8-unit margin all round (see wrap() in portraits.ts). */
const PUPPET_VIEW = { pad: 8, w: 136, h: 166 };
const RED = '#e5383b';
const WATER = '#6fc3ff';
const BLUE = '#3f7be8';
const DISPLAY = "'Anton', 'Arial Narrow', Impact, sans-serif";
const BODY = "'Public Sans Variable', 'Public Sans', system-ui, sans-serif";
const MAX_BUBBLES = 3;
/** Headliners march this much bigger than everybody else. */
const BOSS_SCALE = 1.42;
/** Where the night's goal stands in every row (inside the phone crop, left of the board). */
const GOAL_X = 135;

interface Particle { x: number; y: number; vx: number; vy: number; rot: number; spin: number; life: number; max: number; size: number; color: string }
interface FloatText { x: number; y: number; text: string; color: string; size: number; life: number; max: number }
interface Ring { x: number; y: number; from: number; to: number; life: number; max: number; color: string; width: number }
interface LaneFlash { lanes: number[]; fromX: number; toX: number; life: number; max: number; color: string }
interface Banner { text: string; color: string; life: number; max: number }
/** A speech bubble follows the puppet that says it. */
interface Bubble { owner: number; lines: string[]; width: number; life: number; max: number; size: number }

function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/**
 * A speech bubble and its tail as one closed path: a rounded box (left, top, width,
 * height, radius) with a tail of half-width `tw` leaving the bottom edge at `tx` and
 * pointing at (px, py).
 */
function bubblePath(g: CanvasRenderingContext2D, left: number, top: number, w: number, h: number, r: number, tx: number, tw: number, px: number, py: number): void {
  const right = left + w;
  const bottom = top + h;
  tx = Math.max(left + r + tw, Math.min(right - r - tw, tx));
  g.beginPath();
  g.moveTo(left + r, top);
  g.arcTo(right, top, right, bottom, r);
  g.arcTo(right, bottom, left, bottom, r);
  g.lineTo(tx + tw, bottom);
  g.lineTo(px, py);
  g.lineTo(tx - tw, bottom);
  g.arcTo(left, bottom, left, top, r);
  g.arcTo(left, top, right, top, r);
  g.closePath();
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export class Renderer {
  reducedMotion = false;

  /** Phone layout: the controls sit over the top of the scenery, so the level banner is left out. */
  private compact = false;
  /**
   * Part of the scene the player actually sees, in canvas units. The phone layout
   * crops the scenery around the courtyard (see `.stage__view` in game.css), so
   * captions and speech bubbles are kept inside this window rather than the canvas.
   */
  private view = { left: 0, right: VIEW_W, top: 0 };
  /** Whether the level's sign is painted over the top of the scenery. */
  private sign = true;
  /** Smallest caption, and speech-bubble type size, in canvas units (see resize). */
  private minLabel = 0;
  private bubbleSize = 15;
  private ctx: CanvasRenderingContext2D;
  private backdrop: HTMLCanvasElement | null = null;
  private backdropKey = '';
  private scale = 1;
  private last = 0;
  private shake = 0;
  private chatter = 4;
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private rings: Ring[] = [];
  private hints: (() => void)[] = [];
  /** What your figures wear (a key of SpriteStore's dressed pictures) and the colour of their flames. */
  private look = '';
  private flameColour: FlameColour = 'classic';
  private flashes: LaneFlash[] = [];
  private bubbles: Bubble[] = [];
  /** Answers to a duo's first line, said a moment later by the partner. */
  private replies: { owner: number; text: string; at: number }[] = [];
  /** Name plates and health bars, drawn after every lane so that no puppet hides them. */
  private plates: (() => void)[] = [];
  private banner: Banner | null = null;
  /** The goal's five pieces, one per row: false once an opponent has carried it away. */
  private goals = [true, true, true, true, true];
  /** Pieces just taken, fading out. */
  private taken: { row: number; life: number }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private sprites: SpriteStore,
    private strings: GameStrings,
  ) {
    this.ctx = canvas.getContext('2d')!;
  }

  /** Match the backing store to the displayed size: every device pixel, up to 3× and 2560 px wide. */
  resize(): void {
    // clientWidth, not getBoundingClientRect(): the stage may be rotated by CSS on phones.
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.max(480, Math.min(2560, Math.round(this.canvas.clientWidth * dpr)));
    if (this.canvas.width !== width) {
      this.canvas.width = width;
      this.canvas.height = Math.round((width * VIEW_H) / SCENE_W);
      this.backdropKey = '';
    }
    this.scale = this.canvas.width / SCENE_W;
    // Type never shrinks below a readable size, however small the board: on a phone the
    // scene is drawn at half size, so captions and speech bubbles are drawn bigger.
    const px = this.canvas.clientWidth ? this.canvas.clientWidth / SCENE_W : 1;
    this.minLabel = 11 / px;
    this.bubbleSize = Math.max(15, Math.min(26, 12.5 / px));

    // Layout offsets are not affected by the quarter turn of the phone layout either.
    const frame = this.canvas.parentElement;
    const stage = frame?.parentElement;
    const units = this.canvas.clientWidth ? SCENE_W / this.canvas.clientWidth : 1;
    if (frame && stage && stage.clientWidth) {
      const left = -SCENE_LEFT + Math.max(0, -frame.offsetLeft * units);
      this.view = {
        left,
        right: Math.min(VIEW_W, left + stage.clientWidth * units),
        top: Math.max(0, -frame.offsetTop * units),
      };
      // The level's sign hangs in the middle of the top strip: on a wide board there is
      // room for it between the two groups of controls, on a phone there is not.
      const sign = !this.compact || (stage.clientWidth >= 960 && this.view.top < 50);
      if (sign !== this.sign) {
        this.sign = sign;
        this.backdropKey = '';
      }
    }
  }

  /** A banner across the scene (the night's goal at the start of a match). */
  announce(text: string): void {
    this.showBanner(text, INK, 3.4);
  }

  /** What your figures wear this match: the key of their dressed pictures, and the colour of their flames. */
  setLook(look: string, flames: FlameColour): void {
    this.look = look;
    this.flameColour = flames;
  }

  setCompact(compact: boolean): void {
    if (compact === this.compact) return;
    this.compact = compact;
    this.backdropKey = '';
  }

  reset(): void {
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.flashes = [];
    this.bubbles = [];
    this.replies = [];
    this.banner = null;
    this.shake = 0;
    this.chatter = 4;
    this.goals = [true, true, true, true, true];
    this.taken = [];
  }

  private buildBackdrop(state: GameState): void {
    const key = `${state.level.id}|${this.canvas.width}|${this.sign}`;
    if (key === this.backdropKey && this.backdrop) return;
    this.backdropKey = key;
    const canvas = this.backdrop ?? document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    this.backdrop = canvas;
    const g = canvas.getContext('2d')!;
    g.setTransform(this.scale, 0, 0, this.scale, SCENE_LEFT * this.scale, 0);
    paintBackdrop(g, state.level.scene, state.level.lanes, this.sign ? this.signText(state) : null);
  }

  /** The sign over the stage set: the night's date and name (or the two-player mode's name). */
  private signText(state: GameState): string {
    const level = this.strings.levels[state.level.id];
    return level ? `${level.date} · ${level.name}` : this.strings.ui.versusName;
  }

  // ───────────────────────────── effects ─────────────────────────────

  private confetti(x: number, y: number, color: string, count: number, power = 1): void {
    if (this.reducedMotion) count = Math.ceil(count / 4);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 180) * power;
      const max = 0.5 + Math.random() * 0.5;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 120 * power,
        rot: Math.random() * 6, spin: (Math.random() - 0.5) * 14, life: max, max,
        size: 5 + Math.random() * 6, color: Math.random() > 0.35 ? color : PAPER,
      });
    }
  }

  private float(x: number, y: number, text: string, color: string, size = 24, life = 1.1): void {
    this.texts.push({ x, y, text, color, size, life, max: life });
  }

  private ring(x: number, y: number, to: number, color: string, width = 6, life = 0.45): void {
    this.rings.push({ x, y, from: 10, to, life, max: life, color, width });
  }

  private showBanner(text: string, color = INK, life = 2.4): void {
    this.banner = { text, color, life, max: life };
  }

  /** Puts a catchphrase above a puppet. `owner` is the simulation id of the unit or opponent. */
  private speak(owner: number, text: string | undefined): void {
    if (!text || this.bubbles.length >= MAX_BUBBLES || this.bubbles.some((b) => b.owner === owner)) return;
    const g = this.ctx;
    const size = this.bubbleSize;
    g.font = `700 ${size}px ${BODY}`;
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const attempt = line ? `${line} ${word}` : word;
      if (line && g.measureText(attempt).width > 190 * (size / 15)) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    if (line) lines.push(line);
    const width = Math.max(...lines.map((l) => g.measureText(l).width)) + 24 * (size / 15);
    const life = 2 + text.length * 0.035;
    this.bubbles.push({ owner, lines, width, life, max: life, size });
  }

  /** Finds two neighbours who have a duo and starts it. */
  private duet(state: GameState): boolean {
    const near = (a: Unit, b: Unit) => (a.lane === b.lane && Math.abs(a.col - b.col) === 1) || (a.col === b.col && Math.abs(a.lane - b.lane) === 1);
    const options: { first: Unit; second: Unit; lines: [string, string] }[] = [];
    for (const duo of this.strings.duos) {
      for (const first of state.units) {
        if (first.def.id !== duo.a) continue;
        const second = state.units.find((u) => u.def.id === duo.b && near(first, u));
        if (second) options.push({ first, second, lines: duo.lines });
      }
    }
    if (!options.length) return false;
    const chosen = pick(options);
    this.speak(chosen.first.id, chosen.lines[0]);
    this.replies.push({ owner: chosen.second.id, text: chosen.lines[1], at: 1.4 });
    return true;
  }

  private linesOf(enemy: Enemy): string[] | undefined {
    const id = figureOf(enemy.def);
    return id ? this.strings.figures[id]?.lines : this.strings.extraLines[enemy.def.id];
  }

  private enemyName(enemyId: string): string {
    if (enemyId === 'hologram') return this.strings.extras.hologram;
    if (enemyId.startsWith('star:')) return this.strings.figures[enemyId.slice(5)].short;
    return this.strings.figures[enemyId]?.short ?? this.strings.extras[enemyId];
  }

  /** Turn simulation events into visual feedback. */
  consume(events: GameEvent[], state: GameState): void {
    const t = this.strings;
    const a = t.announce;
    const campColor = CAMPS[state.camp].color;
    for (const e of events) {
      switch (e.type) {
        case 'place': {
          this.ring(xToPx(e.col + 0.5), feetY(e.lane) - 8, 60, PAPER, 5, 0.3);
          const unit = state.grid[e.lane][e.col];
          if (unit) this.speak(unit.id, pick(t.figures[e.unitId].lines));
          break;
        }
        case 'produce':
          this.float(xToPx(e.col + 0.5), feetY(e.lane) - 118, `+${e.amount}`, GOLD, 28);
          break;
        case 'remove': {
          const x = xToPx(e.col + 0.5);
          const y = feetY(e.lane);
          this.float(x, y - 150, `+${e.refund}`, GOLD, 40, 1.5);
          this.confetti(x, y - 90, GOLD, 12, 0.9);
          break;
        }
        case 'merge': {
          const x = xToPx(e.col + 0.5);
          const y = feetY(e.lane);
          const color = e.tier >= 3 ? FIRE : GOLD;
          this.ring(x, y - 80, 120, color, 8, 0.5);
          this.ring(x, y - 80, 80, PAPER, 5, 0.35);
          this.confetti(x, y - 90, color, 22, 1.2);
          this.float(x, y - 190, fmt(t.ui.tierUp, { n: e.tier }), color, 30, 1.4);
          break;
        }
        case 'hit':
          this.confetti(xToPx(e.x), feetY(e.lane) - 60, PAPER, 3, 0.5);
          break;
        case 'damage': {
          // A crowded courtyard keeps a lid on the numbers.
          if (this.texts.length > 70) break;
          const jitter = Math.sin(e.id * 12.9898 + state.time * 7.1) * 16;
          const big = e.amount >= 100;
          this.float(xToPx(e.x) + jitter, feetY(e.lane) - 150, `-${e.amount}`, big ? '#ff8a00' : RED, big ? 30 : 22, 0.8);
          break;
        }
        case 'unitDown':
          this.confetti(xToPx(e.col + 0.5), feetY(e.lane) - 60, campColor, 16);
          this.float(xToPx(e.col + 0.5), feetY(e.lane) - 110, a.resign, RED, 26, 1.4);
          break;
        case 'enemyDown': {
          const x = xToPx(e.x);
          const y = feetY(e.lane) - 60;
          if (e.enemyId === 'poubelle') {
            this.confetti(x, y, WATER, 10);
            this.float(x, y - 50, a.fireOut, '#1c3fa8', 22);
          } else if (e.enemyId === 'lyceen') {
            this.confetti(x, y, '#7d65b8', 8);
            if (Math.random() < 0.35) this.float(x, y - 50, a.backToClass, '#4a3a80', 20);
          } else if (e.enemyId === 'agriculteur') {
            this.confetti(x, y, '#e6c15a', 10);
            if (Math.random() < 0.4) this.float(x, y - 50, a.backToFarm, '#3c7a4a', 20);
          } else if (e.enemyId === 'impots') {
            this.confetti(x, y, PAPER, 14);
            this.float(x, y - 50, a.fileClosed, INK, 22);
          } else if (e.enemyId === 'patron') {
            this.confetti(x, y, GOLD, 18);
            this.float(x, y - 50, a.goldenParachute, '#8a5300', 22, 1.5);
          } else if (e.enemyId === 'cnews') {
            this.confetti(x, y, '#aab6cc', 18);
            this.float(x, y - 50, a.offAir, INK, 24, 1.5);
          } else if (e.enemyId === 'hologram') {
            this.confetti(x, y, WATER, 14);
            this.float(x, y - 50, a.hologramOff, '#1c3fa8', 22, 1.4);
          } else {
            const color = e.enemyId.startsWith('star:') ? CAMPS[e.camp].color : e.boss ? GOLD : '#c4cad6';
            this.confetti(x, y, color, e.boss ? 40 : 12, e.boss ? 1.5 : 1);
          }
          if (e.boss) this.shake = 0.35;
          break;
        }
        case 'leak': {
          this.flashes.push({ lanes: [e.lane], fromX: 0, toX: BOARD_X + CELL_W, life: 0.8, max: 0.8, color: RED });
          for (let i = 0; i < e.loss; i++) {
            // The piece in that row, or else the nearest one still standing.
            const rows = [0, 1, 2, 3, 4].filter((r) => this.goals[r]).sort((p, q) => Math.abs(p - e.lane) - Math.abs(q - e.lane));
            if (!rows.length) break;
            this.goals[rows[0]] = false;
            this.taken.push({ row: rows[0], life: 0.8 });
            this.confetti(GOAL_X, feetY(rows[0]) - 40, RED, 14);
          }
          this.float(GOAL_X, feetY(e.lane) - 96, `−${e.loss}`, RED, 40, 1.5);
          this.shake = 0.3;
          break;
        }
        case 'boom': {
          const x = xToPx(e.col + 0.5);
          const y = laneTop(e.lane) + CELL_H / 2;
          if (e.area === 'lane') {
            this.flashes.push({ lanes: [e.lane], fromX: BOARD_X, toX: BOARD_X + BOARD_W, life: 0.7, max: 0.7, color: e.unitId === 'conseil' ? RED : GOLD });
            const label = e.unitId === 'profs' ? a.boomProfs : e.unitId === 'conseil' ? a.boomConseil : a.boom493;
            this.float(VIEW_W / 2, y - 10, label, INK, 44, 1.5);
          } else {
            this.ring(x, y, CELL_W * 1.7, RED, 10, 0.5);
            this.ring(x, y, CELL_W * 1.2, GOLD, 8, 0.4);
            const label = e.unitId === 'zemmour' ? a.boomPolemic : e.unitId === 'poutou' ? a.boomDebate : a.boomReport;
            this.float(x, y - 70, label, INK, 34, 1.4);
          }
          this.confetti(x, y, GOLD, 26, 1.4);
          this.shake = 0.4;
          break;
        }
        case 'shout': {
          const x = xToPx(e.col + 0.5);
          const y = laneTop(e.lane) + CELL_H / 2;
          const unit = state.grid[e.lane][e.col];
          const melee = UNITS[e.unitId].ability.kind === 'shout' && (UNITS[e.unitId].ability as { range: number }).range < 2;
          if (melee) {
            this.ring(x + 60, y, 90, PAPER, 8, 0.35);
            this.confetti(x + 70, y, PAPER, 8, 1.2);
          } else {
            for (let i = 0; i < 3; i++) this.ring(x + 40 + i * 110, y, 80, RED, 6, 0.4 + i * 0.12);
          }
          if (unit) this.speak(unit.id, t.figures[e.unitId].lines[0]);
          this.shake = 0.2;
          break;
        }
        case 'blast':
          this.ring(xToPx(e.x), feetY(e.lane) - 50, CELL_W * 1.3, RED, 9, 0.45);
          this.confetti(xToPx(e.x), feetY(e.lane) - 50, RED, 18, 1.2);
          this.float(xToPx(e.x), feetY(e.lane) - 120, a.boomPolemic, RED, 26, 1.2);
          this.shake = 0.3;
          break;
        case 'silence':
          this.float(xToPx(e.x - e.range / 2), feetY(e.lane) - 120, a.silenced, INK, 24, 1.3);
          break;
        case 'checkpoint':
          this.float(xToPx(e.col + 1.1), feetY(e.lane) - 118, a.checkpoint, '#1c2a4a', 24, 1.2);
          this.ring(xToPx(e.col + 1), feetY(e.lane) - 50, 60, '#1c2a4a', 5, 0.35);
          break;
        case 'hose': {
          const y = laneTop(e.lane) + CELL_H / 2;
          this.flashes.push({ lanes: [e.lane], fromX: BOARD_X, toX: BOARD_X + BOARD_W, life: 0.9, max: 0.9, color: WATER });
          for (let i = 0; i < 9; i++) this.confetti(xToPx(e.col + 0.5 + i * 0.9), y, WATER, 5, 0.9);
          this.float(xToPx(e.col + 1.5), y - 60, a.hose, '#1c3fa8', 34, 1.3);
          break;
        }
        case 'flash': {
          // The speed camera: a white flash down the lane.
          this.flashes.push({ lanes: [e.lane], fromX: xToPx(e.col + 0.5), toX: BOARD_X + BOARD_W, life: 0.35, max: 0.35, color: PAPER });
          this.float(xToPx(e.col + 1.2), feetY(e.lane) - 118, a.flashed, INK, 26, 1.2);
          break;
        }
        case 'heal': {
          const x = xToPx(e.col + 0.5);
          const y = feetY(e.lane) - 60;
          this.ring(x, y, CELL_W * 1.4, '#58c26b', 6, 0.5);
          for (let i = 0; i < 6; i++) this.float(x + (Math.random() - 0.5) * CELL_W * 2, y - 20 - Math.random() * 60, '+', '#1f7a3d', 30, 0.9);
          break;
        }
        case 'expel':
          this.flashes.push({ lanes: [e.lane], fromX: xToPx(e.from), toX: xToPx(e.to), life: 0.5, max: 0.5, color: BLUE });
          this.float(xToPx(e.from), feetY(e.lane) - 120, a.expelled, '#1c3fa8', 28, 1.3);
          break;
        case 'sentHome':
          this.confetti(xToPx(e.x), feetY(e.lane) - 60, '#7d65b8', 8);
          this.float(xToPx(e.x), feetY(e.lane) - 110, a.backToClass, '#4a3a80', 20, 1.2);
          break;
        case 'censored':
          this.ring(xToPx(e.x), feetY(e.lane) - 60, 90, RED, 9, 0.5);
          this.float(xToPx(e.x), feetY(e.lane) - 130, a.censured, RED, 30, 1.5);
          this.shake = Math.max(this.shake, 0.25);
          break;
        case 'dry':
          this.float(xToPx(e.x), feetY(e.lane) - 110, a.dry, INK, 24, 1.4);
          break;
        case 'tariff':
          if (e.on) this.showBanner(a.tariffBanner, RED, 3);
          break;
        case 'tax':
          this.float(xToPx(e.x), feetY(e.lane) - 122, fmt(a.tax, { n: e.amount }), RED, 22, 1.3);
          break;
        case 'twist':
          this.showBanner(e.id === 'manif' ? a.twist_manif : a.twist_force, RED, 3);
          break;
        case 'theme':
          this.showBanner(a[`theme_${e.id}`], '#8a5300', 3.2);
          break;
        case 'riposte': {
          const x = xToPx(e.col + 0.5);
          const y = laneTop(e.lane) + CELL_H * 0.45;
          this.ring(x, y, 70, GOLD, 6, 0.4);
          this.float(x, y - 40, a.riposte, '#1f7a3d', 26, 1.2);
          if (e.x !== null) {
            this.confetti(xToPx(e.x), feetY(e.lane) - 70, GOLD, 14);
            this.flashes.push({ lanes: [e.lane], fromX: x, toX: xToPx(e.x), life: 0.5, max: 0.5, color: GOLD });
          }
          break;
        }
        case 'punchlineLanded':
          this.float(xToPx(e.col + 0.5), laneTop(e.lane) + 20, a.landed, RED, 24, 1.3);
          if (e.hit) this.shake = Math.max(this.shake, 0.15);
          break;
        case 'interview':
          this.float(xToPx(e.col + 0.5), feetY(e.lane) - 122, a.noComment, INK, 22, 1.6);
          break;
        case 'picket':
          this.float(xToPx(e.col + 0.5), feetY(e.lane) - 122, a.picket, RED, 24, 1.4);
          break;
        case 'wonOver':
          this.confetti(xToPx(e.x), feetY(e.lane) - 60, GOLD, 12);
          this.float(xToPx(e.x), feetY(e.lane) - 120, fmt(a.wonOver, { n: e.amount }), '#1f7a3d', 22, 1.6);
          break;
        case 'zucman':
          this.showBanner(e.adopted ? a.zucmanOn : a.zucmanOff, e.adopted ? '#1f7a3d' : INK, 2.6);
          for (const exile of e.exiles) {
            this.confetti(xToPx(exile.x), feetY(exile.lane) - 60, GOLD, 16);
            this.float(xToPx(exile.x), feetY(exile.lane) - 120, fmt(a.exile, { n: ZUCMAN_SHARE }), '#8a5300', 22, 1.8);
          }
          break;
        case 'caf':
          // A transfer lands by the steps… or a letter says the file is incomplete.
          if (e.amount > 0) {
            this.float(BOARD_X - 60, VIEW_H - 80, fmt(a.cafPaid, { n: e.amount }), '#1f7a3d', 26, 2.4);
            this.confetti(BOARD_X - 80, VIEW_H - 100, GOLD, 12, 0.8);
          } else {
            this.float(BOARD_X + 40, VIEW_H - 80, a.cafLate, '#5b6270', 20, 2.6);
          }
          break;
        case 'cast': {
          const p = t.powers[e.power];
          if (p?.cast) {
            this.speak(e.id, p.cast);
            if (e.power === 'dissolve' || e.power === 'roar' || e.power === 'lag') this.showBanner(p.cast, RED, 1.8);
          }
          this.ring(xToPx(e.x), feetY(e.lane) - 70, 90, RED, 6, 0.5);
          break;
        }
        case 'power': {
          const p = t.powers[e.power];
          const color = e.power === 'lag' ? WATER : e.power === 'hologram' ? '#1c3fa8' : RED;
          for (const hit of e.hits) {
            this.ring(xToPx(hit.col + 0.5), feetY(hit.lane) - 60, 70, color, 7, 0.45);
            if (e.power === 'lag') this.float(xToPx(hit.col + 0.5), feetY(hit.lane) - 120, a.lagged, '#1c3fa8', 18, 1.6);
          }
          if (p?.landed) this.float(xToPx(e.x), feetY(e.to ?? e.lane) - 140, p.landed, color === RED ? RED : '#1c3fa8', 26, 1.4);
          if (e.power === 'dissolve' || e.power === 'ippon') this.shake = Math.max(this.shake, 0.35);
          break;
        }
        case 'appeal':
          this.showBanner(a.appealBanner, RED, 3);
          this.float(xToPx(e.x), feetY(e.lane) - 150, a.appeal, RED, 30, 1.8);
          this.confetti(xToPx(e.x), feetY(e.lane) - 80, PAPER, 24, 1.2);
          this.speak(e.id, a.appealLine);
          this.shake = 0.4;
          break;
        case 'enrage':
          this.float(xToPx(e.x), feetY(e.lane) - 150, a.enrage, RED, 28, 1.6);
          this.shake = 0.25;
          break;
        case 'hike':
          this.showBanner(a.hikeBanner, RED, 3);
          break;
        case 'censure':
          for (const hit of e.hits) {
            this.ring(xToPx(hit.x), feetY(hit.lane) - 60, 90, CAMPS[state.camp].color, 9, 0.5);
            this.float(xToPx(hit.x), feetY(hit.lane) - 130, a.censured, CAMPS[state.camp].ink, 30, 1.5);
          }
          this.shake = 0.35;
          break;
        case 'wave':
          if (e.final) this.showBanner(a.finalWave, RED, 3);
          else if (e.big) this.showBanner(a.bigWave, RED, 3);
          else {
            const text = Number.isFinite(e.total) ? fmt(a.wave, { n: e.index + 1, total: e.total }) : fmt(a.waveEndless, { n: e.index + 1 });
            this.showBanner(text, INK, 1.8);
          }
          break;
        case 'spawn':
          if (e.boss) this.showBanner(fmt(a.bossIn, { name: this.enemyName(e.enemyId) }), RED, 3);
          break;
        case 'ultimate':
          this.showBanner(fmt(a.ultUsed, { name: t.ultimates[e.id].name }), CAMPS[state.camp].ink, 2.6);
          this.flashes.push({ lanes: [...state.level.lanes], fromX: BOARD_X, toX: BOARD_X + BOARD_W, life: 0.9, max: 0.9, color: campColor });
          break;
      }
    }
  }

  /** Every few seconds somebody on the board says their line. */
  private chat(state: GameState, dt: number): void {
    // A reply is on its way: the partner answers a moment later.
    for (let i = this.replies.length - 1; i >= 0; i--) {
      const reply = this.replies[i];
      reply.at -= dt;
      if (reply.at > 0) continue;
      this.replies.splice(i, 1);
      if (state.units.some((u) => u.id === reply.owner)) this.speak(reply.owner, reply.text);
    }
    this.chatter -= dt;
    if (this.chatter > 0 || state.status !== 'playing') return;
    this.chatter = 3.5 + Math.random() * 3;
    const speakers: { id: number; lines: string[] }[] = [];
    for (const unit of state.units) speakers.push({ id: unit.id, lines: this.strings.figures[unit.def.id].lines });
    for (const enemy of state.enemies) {
      const lines = this.linesOf(enemy);
      // Named opponents speak more often than extras; nobody talks from behind the gate.
      if (lines && enemy.x < 8.6 && (enemy.def.unitId || enemy.def.portrait || Math.random() < 0.3)) {
        speakers.push({ id: enemy.id, lines });
      }
    }
    if (!speakers.length) return;
    // Now and then two neighbours of the same camp answer each other.
    if (Math.random() < 0.45 && this.duet(state)) return;
    const speaker = pick(speakers);
    this.speak(speaker.id, pick(speaker.lines));
  }

  // ───────────────────────────── drawing ─────────────────────────────

  private blit(sprite: Sprite, x: number, y: number, sx: number, sy: number, rot: number, flash: number, alpha = 1): void {
    const g = this.ctx;
    const pad = sprite.h * 0.045;
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(sx, sy);
    g.globalAlpha = alpha;
    g.drawImage(sprite.image, -sprite.w / 2, -sprite.h + pad, sprite.w, sprite.h);
    if (flash > 0) {
      g.globalAlpha = alpha * flash;
      g.drawImage(sprite.flash, -sprite.w / 2, -sprite.h + pad, sprite.w, sprite.h);
    }
    g.restore();
  }

  private shadow(x: number, y: number, rx: number): void {
    const g = this.ctx;
    g.fillStyle = 'rgba(23,32,63,.2)';
    g.beginPath();
    g.ellipse(x, y, rx, rx * 0.26, 0, 0, Math.PI * 2);
    g.fill();
  }

  private bar(x: number, y: number, width: number, ratio: number, color: string): void {
    const g = this.ctx;
    g.fillStyle = INK;
    g.beginPath();
    g.roundRect(x - width / 2 - 2, y - 2, width + 4, 11, 5);
    g.fill();
    g.fillStyle = '#4a5273';
    g.beginPath();
    g.roundRect(x - width / 2, y, width, 7, 3);
    g.fill();
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(x - width / 2, y, Math.max(3, width * Math.max(0, Math.min(1, ratio))), 7, 3);
    g.fill();
  }

/**
   * A defender's credibility, always on show: a thick bar with the points left
   * written on it (green, then yellow, then red as it runs low).
   */
  /** Level 3: the figure is on fire, red, orange and yellow tongues behind it (no taller than the figure). */
  private aura(x: number, y: number, w: number, h: number, now: number, seed: number): void {
    const g = this.ctx;
    const t = this.reducedMotion ? seed : now;
    // A simple fire: two colours (three for the tricolour one), from outside in.
    const palette = FLAMES[this.flameColour];
    const layers = palette.layers.map((color, i, all) => ({ color, scale: 1 - (i * 0.4) / Math.max(1, all.length - 1) }));
    const tongues = 7;
    const width = w * 0.8;
    g.save();
    for (const layer of layers) {
      g.fillStyle = layer.color;
      g.beginPath();
      for (let i = 0; i < tongues; i++) {
        const u = i / (tongues - 1) - 0.5; // -0.5 … 0.5
        const cx = x + u * width * layer.scale;
        // Taller in the middle, flickering.
        const flicker = 0.85 + 0.15 * Math.sin(t * 12 + i * 1.9 + seed);
        const height = h * layer.scale * 0.88 * (1 - Math.abs(u) * 0.7) * flicker;
        const half = ((width * layer.scale) / tongues) * 0.95;
        const sway = Math.sin(t * 7 + i * 2.3 + seed) * half * 0.6;
        const base = y - 6;
        g.moveTo(cx - half, base);
        g.quadraticCurveTo(cx - half * 1.1, base - height * 0.55, cx + sway, base - height);
        g.quadraticCurveTo(cx + half * 1.1, base - height * 0.55, cx + half, base);
        g.closePath();
      }
      g.moveTo(x + width * 0.45 * layer.scale, y - h * 0.36);
      g.ellipse(x, y - h * 0.36, width * 0.45 * layer.scale, h * 0.36 * layer.scale, 0, 0, Math.PI * 2);
      g.fill();
      if (layer === layers[0]) {
        g.strokeStyle = palette.rim;
        g.lineWidth = 3;
        g.stroke();
      }
    }
    g.restore();
  }

  /** Eyes on fire: a white-hot glow on each eye of the photo, with a flame rising from it (bigger at level 3). */
  private eyes(sprite: Sprite, id: string, mood: Expression, x: number, y: number, sx: number, sy: number, rot: number, tier: number, now: number, seed: number): void {
    const spots = EYES[`${id}-${mood}`] ?? EYES[`${id}-neutral`];
    if (!spots) return;
    const g = this.ctx;
    const pad = sprite.h * 0.045;
    const t = this.reducedMotion ? seed : now;
    const big = tier >= 3 ? 1.25 : 1;
    // Puppet SVG units → sprite units (the viewBox has an 8-unit margin, centred in the sprite).
    const k = Math.min(sprite.w / PUPPET_VIEW.w, sprite.h / PUPPET_VIEW.h);
    const ox = -sprite.w / 2 + (sprite.w - PUPPET_VIEW.w * k) / 2;
    const oy = -sprite.h + pad + (sprite.h - PUPPET_VIEW.h * k) / 2;
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.scale(sx, sy);
    for (let i = 0; i < spots.length; i += 2) {
      const ex = ox + (HEAD_BOX.x + spots[i] * HEAD_BOX.w + PUPPET_VIEW.pad) * k;
      const ey = oy + (HEAD_BOX.y + spots[i + 1] * HEAD_BOX.h + PUPPET_VIEW.pad) * k;
      // The flame: outer orange, inner yellow, leaning and flickering.
      const flicker = 0.8 + 0.2 * Math.sin(t * 14 + i * 2.1 + seed);
      const lean = Math.sin(t * 6 + i + seed) * 1.6;
      const [outer, inner] = FLAMES[this.flameColour].eye;
      for (const [color, w, hgt] of [[outer, 3.6, 13], [inner, 2.2, 8.5]] as const) {
        const fw = w * big;
        const fh = hgt * big * flicker;
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(ex - fw, ey);
        g.quadraticCurveTo(ex - fw * 1.1, ey - fh * 0.5, ex + lean, ey - fh);
        g.quadraticCurveTo(ex + fw * 1.1, ey - fh * 0.5, ex + fw, ey);
        g.arc(ex, ey, fw, 0, Math.PI);
        g.fill();
      }
      // The eye itself, white-hot.
      const r = 2.9 * big * (this.reducedMotion ? 1 : 0.9 + 0.1 * Math.sin(t * 9 + i));
      const halo = g.createRadialGradient(ex, ey, 0, ex, ey, r * 2.2);
      halo.addColorStop(0, 'rgba(255,255,240,1)');
      halo.addColorStop(0.4, inner);
      halo.addColorStop(1, 'rgba(255,140,0,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(ex, ey, r * 2.2, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  /** Embers rising around a figure on fire (level 3). */
  private sparks(x: number, y: number, w: number, h: number, now: number, seed: number): void {
    if (this.reducedMotion) return;
    const g = this.ctx;
    const count = 6;
    g.save();
    for (let i = 0; i < count; i++) {
      const phase = (now * 0.9 + i / count + seed * 0.37) % 1;
      const px = x + Math.sin(i * 2.4 + seed + phase * 3) * w * 0.38;
      const py = y - 10 - phase * h * 0.95;
      g.globalAlpha = 1 - phase;
      g.fillStyle = FLAMES[this.flameColour].embers[i % 2];
      g.beginPath();
      g.arc(px, py, 4 * (1 - phase * 0.6), 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }

  /** "LV 2" / "NIV. 2" on the figure: gold, then fire. */
  private tierBadge(x: number, y: number, tier: number): void {
    const g = this.ctx;
    const size = Math.max(15, this.minLabel);
    const text = fmt(this.strings.ui.tierShort, { n: tier });
    g.font = `400 ${size}px ${DISPLAY}`;
    const width = g.measureText(text).width + 14;
    const height = size + 8;
    g.fillStyle = INK;
    g.beginPath();
    g.roundRect(x - width / 2 - 2.5, y - height / 2 - 2.5, width + 5, height + 5, 9);
    g.fill();
    g.fillStyle = tier >= 3 ? FIRE : GOLD;
    g.beginPath();
    g.roundRect(x - width / 2, y - height / 2, width, height, 7);
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = INK;
    g.fillText(text, x, y + 1);
  }

  /** Over a figure the selected card can level up: a tag pointing at it, with the next level and what it costs. */
  private levelUpHint(x: number, y: number, tier: number, cost: number, affordable: boolean): void {
    const g = this.ctx;
    const bob = this.reducedMotion ? 0 : Math.sin(performance.now() / 160) * 4;
    const size = Math.max(16, this.minLabel);
    const text = `${fmt(this.strings.ui.tierShort, { n: tier })} · ${cost}`;
    g.save();
    g.translate(x, y + bob);
    g.font = `400 ${size}px ${DISPLAY}`;
    const icon = 14;
    const gap = 7;
    const width = icon + gap + g.measureText(text).width + 24;
    const height = size + 12;
    const left = -width / 2;
    const right = width / 2;
    const top = -height;
    const r = 9;
    g.globalAlpha = affordable ? 1 : 0.6;
    g.beginPath();
    g.moveTo(left + r, top);
    g.arcTo(right, top, right, 0, r);
    g.arcTo(right, 0, left, 0, r);
    g.lineTo(9, 0);
    g.lineTo(0, 11);
    g.lineTo(-9, 0);
    g.arcTo(left, 0, left, top, r);
    g.arcTo(left, top, right, top, r);
    g.closePath();
    g.fillStyle = tier >= 3 ? FIRE : GOLD;
    g.fill();
    g.lineJoin = 'round';
    g.lineWidth = 3.5;
    g.strokeStyle = INK;
    g.stroke();
    // Double chevron: "up a level".
    const ix = left + 12 + icon / 2;
    const iy = -height / 2;
    g.lineCap = 'round';
    g.lineWidth = 3;
    g.beginPath();
    for (const dy of [-3.5, 3.5]) {
      g.moveTo(ix - icon / 2, iy + dy + 3.5);
      g.lineTo(ix, iy + dy - 3);
      g.lineTo(ix + icon / 2, iy + dy + 3.5);
    }
    g.stroke();
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillStyle = INK;
    g.fillText(text, ix + icon / 2 + gap, iy + 1);
    g.restore();
  }

  /** Removal mode: what taking this figure off gives back. */
  private refundTag(x: number, y: number, refund: number): void {
    const g = this.ctx;
    const size = Math.max(17, this.minLabel);
    const text = `+${refund}`;
    g.font = `400 ${size}px ${DISPLAY}`;
    const width = g.measureText(text).width + 16;
    const height = size + 8;
    g.fillStyle = INK;
    g.beginPath();
    g.roundRect(x - width - 2.5, y - height / 2 - 2.5, width + 5, height + 5, 9);
    g.fill();
    g.fillStyle = GOLD;
    g.beginPath();
    g.roundRect(x - width, y - height / 2, width, height, 7);
    g.fill();
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = INK;
    g.fillText(text, x - width / 2, y + 1);
  }

  private credibility(x: number, y: number, hp: number, max: number): void {
    const g = this.ctx;
    const ratio = Math.max(0, Math.min(1, hp / max));
    const width = 78;
    const height = 20;
    const size = Math.max(14, this.minLabel);
    g.fillStyle = INK;
    g.beginPath();
    g.roundRect(x - width / 2 - 2.5, y - 2.5, width + 5, height + 5, 8);
    g.fill();
    g.fillStyle = '#4a5273';
    g.beginPath();
    g.roundRect(x - width / 2, y, width, height, 6);
    g.fill();
    g.fillStyle = ratio > 0.5 ? '#58c26b' : ratio > 0.25 ? '#f6aa1c' : RED;
    g.beginPath();
    g.roundRect(x - width / 2, y, Math.max(6, width * ratio), height, 6);
    g.fill();
    g.font = `400 ${size}px ${DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = 3.5;
    g.strokeStyle = INK;
    const text = String(Math.ceil(hp));
    g.strokeText(text, x, y + height / 2 + 1);
    g.fillStyle = PAPER;
    g.fillText(text, x, y + height / 2 + 1);
  }

  private label(text: string, x: number, y: number, size: number, color: string, outline = PAPER): void {
    size = Math.max(size, this.minLabel);
    const g = this.ctx;
    g.font = `400 ${size}px ${DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.lineJoin = 'round';
    g.lineWidth = Math.max(4, size / 4);
    g.strokeStyle = outline;
    // A long caption next to an edge stays whole instead of being cut by the frame.
    const half = g.measureText(text).width / 2 + g.lineWidth + 6;
    const { left, right } = this.view;
    if (half * 2 < right - left) x = Math.max(left + half, Math.min(right - half, x));
    g.strokeText(text, x, y);
    g.fillStyle = color;
    g.fillText(text, x, y);
  }

  /** Which photo a figure wears: angry while it acts or announces a power, hurt when it is struggling. */
  private mood(id: string, angry: boolean, hurt: boolean): Expression {
    const faces = PHOTOS[id];
    if (angry && faces?.includes('angry')) return 'angry';
    if (hurt && faces?.includes('hurt')) return 'hurt';
    return 'neutral';
  }

  /** A cartoon sign of the mood, for the faces that have no photo of it: an anger mark, or sweat drops. */
  private moodMark(x: number, y: number, mood: 'angry' | 'hurt', now: number): void {
    const g = this.ctx;
    g.save();
    g.translate(x, y);
    if (mood === 'angry') {
      const s = this.reducedMotion ? 1 : 1 + Math.abs(Math.sin(now * 10)) * 0.15;
      g.scale(s, s);
      g.strokeStyle = RED;
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        g.rotate(Math.PI / 2);
        g.beginPath();
        g.moveTo(4, -9);
        g.quadraticCurveTo(4, -4, 9, -4);
        g.stroke();
      }
    } else {
      for (const [dx, dy] of [[0, 0], [10, 8]]) {
        g.beginPath();
        g.moveTo(dx, dy - 8);
        g.quadraticCurveTo(dx + 6, dy, dx, dy + 4);
        g.quadraticCurveTo(dx - 6, dy, dx, dy - 8);
        g.fillStyle = '#8fd3ff';
        g.fill();
        g.strokeStyle = INK;
        g.lineWidth = 2;
        g.stroke();
      }
    }
    g.restore();
  }

  private drawUnit(state: GameState, unit: Unit, now: number, removing = false): void {
    const acting = state.time - unit.lastAct < 0.45;
    const struggling = unit.hp < unit.def.hp * 0.4;
    const mood = this.mood(unit.def.id, acting, struggling);
    const sprite = this.sprites.unit(unit.def.id, mood, this.look);
    if (!sprite) return;
    const g = this.ctx;
    const x = xToPx(unit.col + 0.5);
    const y = feetY(unit.lane);
    const ability = unit.def.ability;
    this.shadow(x, y - 2, 36 * FIGURE_SCALE);

    if (state.ult.frenzy > 0) {
      g.fillStyle = 'rgba(255,210,63,.45)';
      g.beginPath();
      g.ellipse(x, y - 4, 46 + Math.sin(now * 10) * 3, 14, 0, 0, Math.PI * 2);
      g.fill();
    }

    const age = state.time - unit.born;
    let pop = age < 0.25 ? 0.55 + 0.45 * easeOutBack(age / 0.25) : 1;
    // Level-up: the figure swells for a moment, in a white flash.
    const since = state.time - unit.tierAt;
    const transforming = since >= 0 && since < 0.5 ? 1 - since / 0.5 : 0;
    if (transforming) pop *= 1 + 0.3 * Math.sin(transforming * Math.PI);
    if (unit.tier >= 3 && !removing) this.aura(x, y, sprite.w * FIGURE_SCALE, sprite.h * FIGURE_SCALE, now, unit.id);
    let sx = pop;
    let sy = pop * (1 + Math.sin(now * 2.4 + unit.id) * 0.018);
    let rot = 0;
    const acted = state.time - unit.lastAct;
    if (acted >= 0 && acted < 0.2) {
      const p = 1 - acted / 0.2;
      sx *= 1 + 0.08 * p;
      sy *= 1 - 0.07 * p;
      rot = 0.08 * p;
    }
    if (ability.kind === 'bomb' || ability.kind === 'hose') {
      const p = 1 - Math.max(0, unit.timer) / ability.fuse;
      const pulse = 1 + 0.16 * p * Math.abs(Math.sin(now * 16));
      sx *= pulse;
      sy *= pulse;
    }
    // Being debated is continuous damage: pulse instead of staying washed out.
    const hit = state.time - unit.lastHit;
    const flash = hit >= 0 && hit < 0.1 ? (this.reducedMotion ? 0.18 : 0.12 + 0.3 * Math.abs(Math.sin(now * 9))) : 0;
    // Removal mode: every figure is washed out and tagged with a red cross.
    this.blit(sprite, x, y, sx * FIGURE_SCALE, sy * FIGURE_SCALE, rot, removing ? 0.55 : Math.max(flash, transforming * 0.85), removing ? 0.9 : 1);
    if (unit.tier > 1 && !removing) {
      if (unit.tier >= 3) this.sparks(x, y, sprite.w * FIGURE_SCALE, sprite.h * FIGURE_SCALE, now, unit.id);
      this.eyes(sprite, unit.def.id, mood, x, y, sx * FIGURE_SCALE, sy * FIGURE_SCALE, rot, unit.tier, now, unit.id);
      const top = y - sprite.h * FIGURE_SCALE;
      const tier = unit.tier;
      this.plates.push(() => this.tierBadge(x - 40, top + 30, tier));
    }
    if (!removing && struggling && mood === 'neutral' && PHOTOS[unit.def.id]) this.moodMark(x + 30, y - sprite.h * FIGURE_SCALE + 30, 'hurt', now);
    if (removing) {
      const refund = refundOf(unit);
      this.plates.push(() => this.refundTag(x - 16, y - 128, refund));
      const pulse = this.reducedMotion ? 1 : 1 + 0.12 * Math.sin(now * 7 + unit.id);
      g.save();
      g.translate(x + 34, y - 128);
      g.scale(pulse, pulse);
      g.fillStyle = RED;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, 16, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.strokeStyle = PAPER;
      g.lineWidth = 4.5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-6, -6);
      g.lineTo(6, 6);
      g.moveTo(6, -6);
      g.lineTo(-6, 6);
      g.stroke();
      g.restore();
    }

    if (unit.silenced > 0) {
      // Microphone cut: a crossed-out speech bubble.
      g.save();
      g.translate(x + 34, y - 146);
      g.fillStyle = PAPER;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.roundRect(-16, -12, 32, 22, 7);
      g.fill();
      g.stroke();
      g.strokeStyle = RED;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-10, -8);
      g.lineTo(10, 6);
      g.stroke();
      g.restore();
    }
    // Defenders always show their credibility, in figures; the others once they are hurt.
    if (categoryOf(unit.def) === 'defence') {
      const hp = unit.hp;
      const max = unit.def.hp;
      this.plates.push(() => this.credibility(x, y - 6, hp, max));
    } else if (unit.hp < unit.def.hp) {
      this.bar(x, y + 2, 58, unit.hp / unit.def.hp, '#58c26b');
    }
  }

  /** Flames licking above a burning bin. */
  private flames(x: number, y: number, now: number, seed: number): void {
    const g = this.ctx;
    for (let i = 0; i < 3; i++) {
      const sway = this.reducedMotion ? 0 : Math.sin(now * 9 + seed + i * 2.1);
      const height = 26 + i * 8 + sway * 6;
      const dx = (i - 1) * 13 + sway * 3;
      g.beginPath();
      g.moveTo(x + dx - 11, y);
      g.quadraticCurveTo(x + dx - 13, y - height * 0.6, x + dx + sway * 4, y - height);
      g.quadraticCurveTo(x + dx + 13, y - height * 0.6, x + dx + 11, y);
      g.closePath();
      g.fillStyle = i === 1 ? GOLD : '#ff7b1c';
      g.globalAlpha = 0.9;
      g.fill();
    }
    g.globalAlpha = 1;
  }

  private drawEnemy(state: GameState, enemy: Enemy, now: number, dimmed = false): void {
    const figureId = figureOf(enemy.def);
    const casting = enemy.cast !== null;
    const struggling = enemy.revived || enemy.hp < enemy.def.hp * 0.4;
    const mood = figureId ? this.mood(figureId, casting, struggling) : 'neutral';
    const sprite = this.sprites.enemy(enemy.def.id, mood);
    if (!sprite) return;
    const g = this.ctx;
    const vehicle = enemy.def.id === 'bus' || enemy.def.id === 'auto' || enemy.def.id === 'tracteur' || enemy.def.id === 'cnews' || enemy.def.id === 'vache';
    // Puppets are drawn bigger than their bitmap; vehicles already fill a square; headliners tower over the rest.
    const size = (enemy.def.boss ? BOSS_SCALE : 1) * (vehicle ? 1 : FIGURE_SCALE);
    // Crossing the street: a short hop from the old lane to the new one.
    const shift = Math.min(1, (state.time - enemy.shiftAt) / 0.5);
    const y = shift < 1 ? feetY(enemy.fromLane) + (feetY(enemy.lane) - feetY(enemy.fromLane)) * shift - Math.sin(shift * Math.PI) * 30 : feetY(enemy.lane);
    const striking = state.ult.strike > 0;
    const stunned = enemy.stunT > 0;
    const moving = !enemy.attacking && !striking && !stunned;
    let x = xToPx(enemy.x);
    let rot = 0;
    let lift = 0;

    if (vehicle) {
      lift = moving && !enemy.dry ? Math.abs(Math.sin(now * 9 + enemy.id)) * 2 : 0;
    } else if (enemy.def.id === 'poubelle') {
      rot = moving ? Math.sin(now * 5 + enemy.id) * 0.05 : 0;
    } else if (moving) {
      rot = Math.sin(now * (5 + enemy.def.speed * 14) + enemy.id) * 0.075;
      lift = Math.abs(Math.sin(now * (5 + enemy.def.speed * 14) + enemy.id)) * 4;
    } else if (enemy.attacking) {
      x -= Math.abs(Math.sin(now * 9 + enemy.id)) * 9;
      rot = -0.06;
    }
    if (casting && !this.reducedMotion) {
      // Winding up: a tremble, as the angry face comes on.
      x += Math.sin(now * 40) * 3;
      rot = Math.sin(now * 25) * 0.04;
    }
    if (this.reducedMotion) {
      rot *= 0.3;
      lift = 0;
    }

    this.shadow(xToPx(enemy.x), y - 2, sprite.w * 0.36 * size);
    if (enemy.slowed) {
      g.strokeStyle = WATER;
      g.lineWidth = 4;
      g.beginPath();
      g.ellipse(xToPx(enemy.x), y - 2, sprite.w * 0.42 * size, 12, 0, 0, Math.PI * 2);
      g.stroke();
    }
    if (enemy.def.trait?.kind === 'burn') {
      g.fillStyle = 'rgba(255,123,28,.16)';
      g.beginPath();
      g.ellipse(xToPx(enemy.x), y - 10, CELL_W * 0.95, 34, 0, 0, Math.PI * 2);
      g.fill();
    }
    if (casting) {
      // The warning: a red circle on the floor that fills up until the power lands.
      const cast = enemy.cast!;
      const p = 1 - cast.left / cast.max;
      g.strokeStyle = RED;
      g.lineWidth = 5;
      g.beginPath();
      g.ellipse(xToPx(enemy.x), y - 2, sprite.w * 0.5 * size, 16, 0, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = `rgba(229,56,59,${0.15 + p * 0.3})`;
      g.beginPath();
      g.ellipse(xToPx(enemy.x), y - 2, sprite.w * 0.5 * size * p, 16 * p, 0, 0, Math.PI * 2);
      g.fill();
      if (cast.zone) {
        // Dissolution: the squares that are about to go.
        const pulse = this.reducedMotion ? 0.3 : 0.18 + Math.abs(Math.sin(now * 12)) * 0.3;
        for (let dl = -1; dl <= 1; dl++) {
          const lane = cast.zone.lane + dl;
          if (!state.level.lanes.includes(lane)) continue;
          for (let dc = -1; dc <= 1; dc++) {
            const col = cast.zone.col + dc;
            if (col < 0 || col >= COLS) continue;
            g.fillStyle = `rgba(229,56,59,${pulse})`;
            g.fillRect(BOARD_X + col * CELL_W + 3, laneTop(lane) + 3, CELL_W - 6, CELL_H - 6);
          }
        }
      }
    }
    const hit = state.time - enemy.lastHit;
    const ghost = enemy.def.ghost === true;
    // A hit flashes the puppet white; a photo face only lightly, so that it stays recognisable under fire.
    const flash = hit >= 0 && hit < 0.09 ? (figureId ? 0.22 : 0.6) : 0;
    this.blit(sprite, x, y - lift, size, size, rot, ghost ? 0.35 : flash, (ghost ? 0.62 : striking || enemy.dry ? 0.75 : 1) * (dimmed ? 0.45 : 1));
    if (ghost) {
      // A hologram: blue scan lines over the puppet.
      g.fillStyle = 'rgba(111,195,255,.35)';
      const top0 = y - sprite.h * size;
      for (let ly = top0 + ((now * 40) % 8); ly < y; ly += 8) g.fillRect(x - sprite.w * size * 0.38, ly, sprite.w * size * 0.76, 2);
    }
    if (enemy.def.fire) this.flames(x - 2, y - sprite.h * 0.74, now, enemy.id);

    const top = y - sprite.h * size + 6;
    if (figureId && !ghost) {
      const wanted = casting ? 'angry' : struggling ? 'hurt' : null;
      if (wanted && mood === 'neutral') this.moodMark(x + 26 * size, top + 26 * size, wanted, now);
    }
    if (casting) {
      // "!" above the head.
      g.save();
      g.translate(x, top - 34);
      const s = this.reducedMotion ? 1 : 1 + Math.abs(Math.sin(now * 14)) * 0.2;
      g.scale(s, s);
      g.fillStyle = RED;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.beginPath();
      g.arc(0, 0, 15, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.font = `400 22px ${DISPLAY}`;
      g.fillStyle = PAPER;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('!', 0, 1);
      g.restore();
    }
    if (striking) {
      g.save();
      g.translate(x, top - 6);
      g.rotate(-0.08);
      g.fillStyle = RED;
      g.strokeStyle = INK;
      g.lineWidth = 2.5;
      g.beginPath();
      g.roundRect(-36, -12, 72, 22, 4);
      g.fill();
      g.stroke();
      g.font = `400 14px ${DISPLAY}`;
      g.fillStyle = PAPER;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(this.strings.announce.strike.toUpperCase(), 0, 0);
      g.restore();
    } else if (stunned) {
      for (let i = 0; i < 3; i++) {
        const angle = now * 5 + (i * Math.PI * 2) / 3;
        g.fillStyle = GOLD;
        g.strokeStyle = INK;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(x + Math.cos(angle) * 22, top + 6 + Math.sin(angle) * 6, 5, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    }

    if (figureId) {
      const name = (ghost ? this.strings.extras.hologram : this.strings.figures[figureId].short).toUpperCase();
      const ink = ghost ? '#1c3fa8' : enemy.def.unitId ? CAMPS[enemy.camp].ink : '#8a5300';
      const ratio = enemy.hp / enemy.def.hp;
      this.plates.push(() => {
        this.label(name, x, top - (striking ? 28 : casting ? 58 : 10), enemy.def.boss ? 22 : 15, ink);
        this.bar(x, y + 2, enemy.def.boss ? 120 : 62, ratio, enemy.revived ? '#f6aa1c' : RED);
      });
    } else if (enemy.hp < enemy.def.hp && enemy.def.hp > 200) {
      const ratio = enemy.hp / enemy.def.hp;
      this.plates.push(() => this.bar(x, y + 2, 46, ratio, RED));
    }
  }

  private drawProjectile(shot: Projectile, now: number): void {
    const g = this.ctx;
    g.save();
    g.translate(xToPx(shot.x), laneTop(shot.lane) + CELL_H * 0.42);
    g.strokeStyle = INK;
    g.lineWidth = 2.5;
    g.lineJoin = 'round';
    this.projectileShape(shot.kind, now + shot.id);
    g.restore();
  }

  private speechShape(glyph: string): void {
    const g = this.ctx;
    g.fillStyle = PAPER;
    bubblePath(g, -15, -12, 30, 21, 8, -6, 4, -13, 16);
    g.fill();
    g.stroke();
    g.fillStyle = INK;
    g.font = `400 17px ${DISPLAY}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(glyph, 0, -1);
  }

  private projectileShape(kind: ProjectileKind, phase: number): void {
    const g = this.ctx;
    switch (kind) {
      case 'bubble':
        this.speechShape('!');
        break;
      case 'tract':
        g.rotate(phase * 9);
        g.fillStyle = PAPER;
        g.beginPath();
        g.rect(-9, -12, 18, 24);
        g.fill();
        g.stroke();
        g.fillStyle = '#f6aa1c';
        g.fillRect(-5, -7, 10, 3);
        g.fillRect(-5, -1, 10, 3);
        break;
      case 'heart':
        g.scale(1 + Math.sin(phase * 10) * 0.08, 1 + Math.sin(phase * 10) * 0.08);
        g.fillStyle = '#ff4d6d';
        g.beginPath();
        g.moveTo(0, 12);
        g.bezierCurveTo(-18, 0, -14, -14, -6, -12);
        g.bezierCurveTo(-2, -12, 0, -9, 0, -6);
        g.bezierCurveTo(0, -9, 2, -12, 6, -12);
        g.bezierCurveTo(14, -14, 18, 0, 0, 12);
        g.fill();
        g.stroke();
        break;
      case 'leaf':
        g.rotate(Math.sin(phase * 8) * 0.6);
        g.fillStyle = '#58c26b';
        g.beginPath();
        g.moveTo(-14, 0);
        g.quadraticCurveTo(0, -14, 14, 0);
        g.quadraticCurveTo(0, 14, -14, 0);
        g.fill();
        g.stroke();
        g.beginPath();
        g.moveTo(-12, 0);
        g.lineTo(12, 0);
        g.stroke();
        break;
      case 'cuffs':
        g.rotate(phase * 6);
        g.strokeStyle = '#aab6cc';
        g.lineWidth = 5;
        for (const dx of [-8, 8]) {
          g.beginPath();
          g.arc(dx, 0, 7, 0, Math.PI * 2);
          g.stroke();
        }
        g.strokeStyle = INK;
        g.lineWidth = 2;
        for (const dx of [-8, 8]) {
          g.beginPath();
          g.arc(dx, 0, 9.5, 0, Math.PI * 2);
          g.stroke();
        }
        break;
      case 'cat': {
        const cat = this.sprites.enemy('cat');
        if (cat) {
          g.translate(0, 34 - Math.abs(Math.sin(phase * 12)) * 8);
          g.scale(-1, 1);
          g.drawImage(cat.image, -cat.w / 2, -cat.h, cat.w, cat.h);
        }
        break;
      }
    }
  }

  /** Placement preview: where the figure would stand and what it would cover. */
  private drawSelection(state: GameState, view: ViewState): void {
    const g = this.ctx;
    const selected = view.selected;
    if (selected && !view.removing) {
      // Each figure the selected card could level up: a golden arrow, the next level and its price.
      for (const unit of state.units) {
        if (unit.def.id !== selected) continue;
        const next = playOn(state, selected, unit.lane, unit.col);
        if (!next || next.tier < 2) continue;
        const x = xToPx(unit.col + 0.5);
        const y = feetY(unit.lane);
        const affordable = state.resources >= next.cost;
        this.hints.push(() => this.levelUpHint(x, y - 196, next.tier, next.cost, affordable));
      }
    }
    const hover = view.hover;
    if (!hover || !state.level.lanes.includes(hover.lane)) return;
    const cellX = BOARD_X + hover.col * CELL_W;
    const cellY = laneTop(hover.lane);
    const occupant = state.grid[hover.lane][hover.col];

    if (view.removing) {
      g.fillStyle = occupant ? 'rgba(229,56,59,.32)' : 'rgba(23,32,63,.08)';
      g.fillRect(cellX, cellY, CELL_W, CELL_H);
    } else if (view.selected) {
      const def = UNITS[view.selected];
      const ok = canPlace(state, def.id, hover.lane, hover.col) === null;
      const ability = def.ability;
      if (ok && occupant) {
        // Same figure: it will level up where it stands.
        g.fillStyle = 'rgba(255,210,63,.35)';
        g.fillRect(cellX, cellY, CELL_W, CELL_H);
      } else if (ok) {
        g.globalAlpha = 0.22;
        g.fillStyle = def.camp === 'neutre' ? WATER : CAMPS[state.camp].color;
        const open = (lane: number) => state.level.lanes.includes(lane);
        const around = () => {
          for (let dl = -1; dl <= 1; dl++) {
            if (!open(hover.lane + dl)) continue;
            const from = Math.max(BOARD_X, cellX - CELL_W);
            const to = Math.min(BOARD_X + BOARD_W, cellX + CELL_W * 2);
            g.fillRect(from, laneTop(hover.lane + dl), to - from, CELL_H);
          }
        };
        if (ability.kind === 'shooter') {
          for (const offset of ability.lanes ?? [0]) {
            if (open(hover.lane + offset)) g.fillRect(cellX, laneTop(hover.lane + offset), BOARD_X + BOARD_W - cellX, CELL_H);
          }
        } else if (ability.kind === 'shout' || ability.kind === 'expel') {
          g.fillRect(cellX, cellY, Math.min((ability.range + 0.5) * CELL_W, BOARD_X + BOARD_W - cellX), CELL_H);
        } else if (ability.kind === 'flash') {
          g.fillRect(cellX, cellY, BOARD_X + BOARD_W - cellX, CELL_H);
        } else if (ability.kind === 'heal') {
          around();
        } else if (ability.kind === 'wall' && ability.zone) {
          g.fillRect(cellX, cellY, Math.min((ability.zone.range + 0.5) * CELL_W, BOARD_X + BOARD_W - cellX), CELL_H);
        } else if (ability.kind === 'hose' || (ability.kind === 'bomb' && ability.area === 'lane')) {
          g.fillRect(BOARD_X, cellY, BOARD_W, CELL_H);
        } else if (ability.kind === 'bomb' || (ability.kind === 'wall' && ability.healAura)) {
          around();
        }
        g.globalAlpha = 1;
        const sprite = this.sprites.unit(def.id, 'neutral', this.look);
        if (sprite) this.blit(sprite, cellX + CELL_W / 2, feetY(hover.lane), FIGURE_SCALE, FIGURE_SCALE, 0, 0, 0.6);
      } else {
        g.fillStyle = 'rgba(229,56,59,.22)';
        g.fillRect(cellX, cellY, CELL_W, CELL_H);
      }
    }

    g.strokeStyle = PAPER;
    g.lineWidth = 4;
    g.setLineDash([10, 8]);
    g.strokeRect(cellX + 4, cellY + 4, CELL_W - 8, CELL_H - 8);
    g.setLineDash([]);
  }

  private drawEffects(dt: number): void {
    const g = this.ctx;

    for (let i = this.rings.length - 1; i >= 0; i--) {
      const ring = this.rings[i];
      ring.life -= dt;
      if (ring.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      const p = 1 - ring.life / ring.max;
      g.globalAlpha = 1 - p;
      g.strokeStyle = ring.color;
      g.lineWidth = ring.width * (1 - p * 0.6);
      g.beginPath();
      g.arc(ring.x, ring.y, ring.from + (ring.to - ring.from) * p, 0, Math.PI * 2);
      g.stroke();
    }
    g.globalAlpha = 1;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.rot);
      g.globalAlpha = Math.min(1, p.life / (p.max * 0.4));
      g.fillStyle = p.color;
      g.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      g.restore();
    }

    for (let i = this.texts.length - 1; i >= 0; i--) {
      const text = this.texts[i];
      text.life -= dt;
      if (text.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      const p = 1 - text.life / text.max;
      g.globalAlpha = p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1;
      const rise = this.reducedMotion ? 0 : p * 34;
      this.label(text.text, text.x, text.y - rise, text.size, text.color);
    }
    g.globalAlpha = 1;
  }

  /** Speech bubbles sit above everything else and follow their owner. */
  private drawBubbles(state: GameState, dt: number): void {
    const g = this.ctx;
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];
      bubble.life -= dt;
      const unit = state.units.find((u) => u.id === bubble.owner);
      const enemy = unit ? undefined : state.enemies.find((e) => e.id === bubble.owner);
      if (bubble.life <= 0 || (!unit && !enemy)) {
        this.bubbles.splice(i, 1);
        continue;
      }
      const anchorX = unit ? xToPx(unit.col + 0.5) : xToPx(enemy!.x);
      const lane = unit ? unit.lane : enemy!.lane;
      const k = bubble.size / 15;
      const height = (bubble.lines.length * 18 + 14) * k;
      const anchorY = feetY(lane) - 128;
      const { left, right, top } = this.view;
      const x = Math.max(left + bubble.width / 2 + 6, Math.min(right - bubble.width / 2 - 6, anchorX + (unit ? 34 : -34)));
      const y = Math.max(top + height + 6, anchorY);
      const p = 1 - bubble.life / bubble.max;
      const pop = this.reducedMotion ? 1 : p < 0.08 ? easeOutBack(p / 0.08) : 1;

      g.save();
      g.globalAlpha = Math.min(1, bubble.life / 0.25);
      g.translate(x, y);
      g.scale(pop, pop);
      g.fillStyle = PAPER;
      g.strokeStyle = INK;
      g.lineWidth = 3;
      g.lineJoin = 'round';
      // The bubble and its tail, pointing at the speaker, in one outline.
      const tail = Math.max(-bubble.width / 2 + 18, Math.min(bubble.width / 2 - 18, anchorX - x));
      bubblePath(g, -bubble.width / 2, -height, bubble.width, height, 10, tail, 8, tail, 13);
      g.fill();
      g.stroke();
      g.fillStyle = INK;
      g.font = `700 ${bubble.size}px ${BODY}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      bubble.lines.forEach((line, index) => g.fillText(line, 0, -height + (16 + index * 18) * k));
      g.restore();
    }
  }

  private drawBanner(dt: number): void {
    const banner = this.banner;
    if (!banner) return;
    banner.life -= dt;
    if (banner.life <= 0) {
      this.banner = null;
      return;
    }
    const g = this.ctx;
    const p = 1 - banner.life / banner.max;
    const enter = Math.min(1, p / 0.12);
    const leave = Math.min(1, banner.life / 0.3);
    const slide = this.reducedMotion ? 0 : (1 - easeOutBack(enter)) * -90;
    g.save();
    g.globalAlpha = Math.min(enter * 1.5, leave);
    g.translate((this.view.left + this.view.right) / 2, 208 + slide);
    g.rotate(-0.02);
    g.font = `400 46px ${DISPLAY}`;
    const text = banner.text.toUpperCase();
    const width = Math.min(1040, g.measureText(text).width + 90);
    g.fillStyle = 'rgba(23,32,63,.25)';
    g.beginPath();
    g.roundRect(-width / 2 + 6, -34 + 8, width, 72, 8);
    g.fill();
    g.fillStyle = PAPER;
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(-width / 2, -36, width, 72, 8);
    g.fill();
    g.stroke();
    g.fillStyle = banner.color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 3, width - 60);
    g.restore();
  }

  /**
   * Removal mode: a ribbon says what the next tap will do. It is pinned over the
   * sign of the stage set, above the lanes, so that it never hides a figure. The
   * phone layout has no sign: there the toolbar carries the sentence instead.
   */
  private drawRemoveRibbon(state: GameState, now: number): void {
    if (this.compact) return;
    const g = this.ctx;
    const text = this.strings.announce.removeBanner.toUpperCase();
    g.save();
    g.translate(VIEW_W / 2, 82);
    g.rotate(-0.012);
    const bob = this.reducedMotion ? 0 : Math.sin(now * 4) * 2;
    g.translate(0, bob);
    // Wide enough to cover the sign it is pinned on (see paintBackdrop).
    g.font = `400 26px ${DISPLAY}`;
    const sign = Math.min(760, g.measureText(this.signText(state).toUpperCase()).width + 56);
    g.font = `400 30px ${DISPLAY}`;
    const width = Math.min(1000, Math.max(sign + 20, g.measureText(text).width + 60));
    g.fillStyle = RED;
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(-width / 2, -28, width, 56, 8);
    g.fill();
    g.stroke();
    g.fillStyle = PAPER;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2, width - 36);
    g.restore();
  }

  /** A price tag stays pinned to the wall for as long as tariffs apply. */
  /** The daily challenge's rule, on the wall for the whole night. */
  private drawRule(state: GameState): void {
    const g = this.ctx;
    const text = fmt(this.strings.ui.ruleBanner, { name: this.strings.rules[state.rule!].name }).toUpperCase();
    g.save();
    g.font = `400 20px ${DISPLAY}`;
    const width = g.measureText(text).width + 30;
    g.translate(Math.min(VIEW_W - width / 2 - 12, this.view.right - width / 2 - 12), 100);
    g.rotate(-0.03);
    g.fillStyle = GOLD;
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(-width / 2, -17, width, 34, 6);
    g.fill();
    g.stroke();
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);
    g.restore();
  }

  private drawTariff(shift = 0): void {
    const g = this.ctx;
    const text = this.strings.announce.tariffBanner.toUpperCase();
    g.save();
    g.font = `400 20px ${DISPLAY}`;
    const width = g.measureText(text).width + 30;
    g.translate(Math.min(VIEW_W - 150, this.view.right - width / 2 - 12), 100 + shift);
    g.rotate(0.04);
    g.fillStyle = RED;
    g.strokeStyle = INK;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(-width / 2, -17, width, 34, 6);
    g.fill();
    g.stroke();
    g.fillStyle = PAPER;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 0, 2);
    g.restore();
  }

  /** The debate's soundbites: a speech bubble per square, with the time left as a ring. */
  private drawPunchlines(state: GameState, now: number): void {
    const g = this.ctx;
    for (const line of state.punchlines) {
      const x = xToPx(line.col + 0.5);
      const bob = this.reducedMotion ? 0 : Math.sin(now * 6 + line.id) * 4;
      const y = laneTop(line.lane) + CELL_H * 0.42 + bob;
      const ratio = Math.max(0, line.life / line.max);
      g.save();
      g.translate(x, y);
      g.fillStyle = PAPER;
      g.strokeStyle = INK;
      g.lineWidth = 4;
      bubblePath(g, -40, -28, 80, 50, 14, -4, 9, -18, 36);
      g.fill();
      g.stroke();
      g.fillStyle = ratio < 0.35 ? RED : INK;
      g.font = `400 30px ${DISPLAY}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('!?', 0, -2);
      // Time left before it lands.
      g.strokeStyle = ratio < 0.35 ? RED : GOLD;
      g.lineWidth = 6;
      g.beginPath();
      g.arc(0, -2, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
      g.stroke();
      g.restore();
    }
  }

  /** The night's goal: one piece per row, faded out once it has been carried away. */
  private drawGoals(state: GameState, dt: number): void {
    const g = this.ctx;
    for (let row = 0; row < 5; row++) {
      const fading = this.taken.find((p) => p.row === row);
      const alpha = this.goals[row] ? 1 : fading ? Math.max(0.16, fading.life / 0.8) : 0.16;
      g.save();
      g.globalAlpha = alpha;
      if (fading && !this.reducedMotion) {
        g.translate(0, -(1 - fading.life / 0.8) * 30);
      }
      drawGoal(g, state.level.goal, this.strings.goals[state.level.goal].label, GOAL_X, feetY(row) - 2);
      g.restore();
    }
    for (let i = this.taken.length - 1; i >= 0; i--) {
      this.taken[i].life -= dt;
      if (this.taken[i].life <= 0) this.taken.splice(i, 1);
    }
  }

  /** The headliner on stage, with a long health bar over the sign (wide layouts only). */
  private drawBossBar(state: GameState): void {
    if (!this.sign) return;
    const boss = state.enemies.filter((e) => e.def.boss && e.x <= COLS && e.hp > 0).sort((p, q) => p.x - q.x)[0];
    if (!boss) return;
    const id = figureOf(boss.def);
    if (!id) return;
    const g = this.ctx;
    const name = this.strings.figures[id].name.toUpperCase();
    const width = 520;
    g.save();
    g.translate(VIEW_W / 2, 82);
    g.fillStyle = INK;
    g.strokeStyle = PAPER;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(-width / 2, -26, width, 52, 10);
    g.fill();
    g.stroke();
    g.font = `400 18px ${DISPLAY}`;
    g.fillStyle = PAPER;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillText(name, -width / 2 + 16, -10, width - 140);
    if (boss.revived) {
      g.fillStyle = '#f6aa1c';
      g.textAlign = 'right';
      g.fillText(this.strings.announce.appeal.toUpperCase(), width / 2 - 16, -10);
    }
    const ratio = Math.max(0, boss.hp / boss.def.hp);
    g.fillStyle = '#4a5273';
    g.beginPath();
    g.roundRect(-width / 2 + 16, 4, width - 32, 12, 6);
    g.fill();
    g.fillStyle = boss.revived ? '#f6aa1c' : RED;
    g.beginPath();
    g.roundRect(-width / 2 + 16, 4, Math.max(6, (width - 32) * ratio), 12, 6);
    g.fill();
    g.restore();
  }

  /** `now` is a visual clock in seconds that stops while the match is paused. */
  draw(state: GameState | null, view: ViewState, now: number): void {
    const g = this.ctx;
    const dt = Math.max(0, Math.min(0.05, now - this.last));
    this.last = now;
    g.setTransform(this.scale, 0, 0, this.scale, SCENE_LEFT * this.scale, 0);
    // Sprites are drawn smaller than they were rasterised: ask for the smooth resampler.
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (!state) {
      g.fillStyle = '#f3ecdd';
      g.fillRect(-SCENE_LEFT, 0, SCENE_W, VIEW_H);
      return;
    }
    this.buildBackdrop(state);
    this.chat(state, dt);

    if (this.shake > 0) {
      this.shake -= dt;
      if (!this.reducedMotion) {
        const amount = Math.max(0, this.shake) * 16;
        g.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
      }
    }
    g.drawImage(this.backdrop!, -SCENE_LEFT, 0, SCENE_W, VIEW_H);

    // Lane flashes sit under the puppets.
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const flash = this.flashes[i];
      flash.life -= dt;
      if (flash.life <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }
      g.globalAlpha = (flash.life / flash.max) * (this.reducedMotion ? 0.2 : 0.42);
      g.fillStyle = flash.color;
      for (const lane of flash.lanes) g.fillRect(flash.fromX, laneTop(lane), flash.toX - flash.fromX, CELL_H);
    }
    g.globalAlpha = 1;

    this.drawGoals(state, dt);

    // Warn when someone is about to reach the goal.
    for (const lane of state.level.lanes) {
      if (!state.enemies.some((e) => e.lane === lane && e.x < 1.6)) continue;
      const pulse = this.reducedMotion ? 0.3 : 0.2 + Math.abs(Math.sin(now * 5)) * 0.25;
      g.fillStyle = `rgba(229,56,59,${pulse})`;
      g.fillRect(0, laneTop(lane), BOARD_X, CELL_H);
    }

    // Removal mode: a dark veil falls over the board so that it is obvious something changed.
    if (view.removing) {
      g.fillStyle = 'rgba(20,26,54,.5)';
      g.fillRect(-SCENE_LEFT, 0, SCENE_W, VIEW_H);
    }
    this.drawSelection(state, view);

    for (let lane = 0; lane < ROWS; lane++) {
      for (const unit of state.units) if (unit.lane === lane) this.drawUnit(state, unit, now, view.removing);
      const marching = state.enemies.filter((e) => e.lane === lane).sort((a, b) => b.x - a.x);
      for (const enemy of marching) this.drawEnemy(state, enemy, now, view.removing);
      for (const shot of state.projectiles) if (shot.lane === lane) this.drawProjectile(shot, now);
    }
    for (const plate of this.plates) plate();
    this.plates.length = 0;
    // Level-up hints go over everything else on the board.
    for (const hint of this.hints) hint();
    this.hints.length = 0;

    this.drawEffects(dt);
    // Removal mode: no speech bubbles over the refunds.
    if (!view.removing) this.drawBubbles(state, dt);
    // The debate's soundbites are targets: nothing may hide them.
    this.drawPunchlines(state, now);
    if (state.rule) this.drawRule(state);
    if (state.tariff > 1) this.drawTariff(state.rule ? 44 : 0);
    if (view.removing) this.drawRemoveRibbon(state, now);
    else {
      this.drawBossBar(state);
      this.drawBanner(dt);
    }
  }
}
