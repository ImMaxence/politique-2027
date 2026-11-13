/**
 * Canvas renderer: a paper puppet theatre.
 * It reads the simulation state, never writes to it.
 */
import { fmt, type GameStrings } from '../../i18n/game';
import { ROWS } from '../data/levels';
import type { ProjectileKind } from '../data/types';
import { CAMPS, UNITS } from '../data/units';
import { canPlace, type Enemy, type GameEvent, type GameState, type Projectile, type Unit } from '../sim/engine';
import { BOARD_W, BOARD_X, CELL_H, CELL_W, VIEW_H, VIEW_W, feetY, laneTop, xToPx } from './layout';
import { INK } from './portraits';
import { paintBackdrop } from './scenes';
import type { Sprite, SpriteStore } from './sprites';

export interface ViewState {
  hover: { lane: number; col: number } | null;
  selected: string | null;
  removing: boolean;
}

const PAPER = '#fffdf6';
const GOLD = '#ffd23f';
const RED = '#e5383b';
const WATER = '#6fc3ff';
const DISPLAY = "'Anton', 'Arial Narrow', Impact, sans-serif";
const BODY = "'Public Sans Variable', 'Public Sans', system-ui, sans-serif";
const MAX_BUBBLES = 3;

interface Particle { x: number; y: number; vx: number; vy: number; rot: number; spin: number; life: number; max: number; size: number; color: string }
interface FloatText { x: number; y: number; text: string; color: string; size: number; life: number; max: number }
interface Ring { x: number; y: number; from: number; to: number; life: number; max: number; color: string; width: number }
interface LaneFlash { lanes: number[]; fromX: number; toX: number; life: number; max: number; color: string }
interface Banner { text: string; color: string; life: number; max: number }
/** A speech bubble follows the puppet that says it. */
interface Bubble { owner: number; lines: string[]; width: number; life: number; max: number }

function easeOutBack(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
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
  private flashes: LaneFlash[] = [];
  private bubbles: Bubble[] = [];
  private banner: Banner | null = null;

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
      this.canvas.height = Math.round((width * VIEW_H) / VIEW_W);
      this.backdropKey = '';
    }
    this.scale = this.canvas.width / VIEW_W;

    // Layout offsets are not affected by the quarter turn of the phone layout either.
    const frame = this.canvas.parentElement;
    const stage = frame?.parentElement;
    const units = this.canvas.clientWidth ? VIEW_W / this.canvas.clientWidth : 1;
    if (frame && stage && stage.clientWidth) {
      const left = Math.max(0, -frame.offsetLeft * units);
      this.view = {
        left,
        right: Math.min(VIEW_W, left + stage.clientWidth * units),
        top: Math.max(0, -frame.offsetTop * units),
      };
    }
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
    this.banner = null;
    this.shake = 0;
    this.chatter = 4;
  }

  private buildBackdrop(state: GameState): void {
    const key = `${state.level.id}|${this.canvas.width}|${this.compact}`;
    if (key === this.backdropKey && this.backdrop) return;
    this.backdropKey = key;
    const canvas = this.backdrop ?? document.createElement('canvas');
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    this.backdrop = canvas;
    const g = canvas.getContext('2d')!;
    g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const level = this.strings.levels[state.level.id];
    paintBackdrop(g, state.level.scene, state.level.lanes, this.compact ? null : `${level.date} · ${level.name}`);
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
    g.font = `700 15px ${BODY}`;
    const lines: string[] = [];
    let line = '';
    for (const word of text.split(' ')) {
      const attempt = line ? `${line} ${word}` : word;
      if (line && g.measureText(attempt).width > 190) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    }
    if (line) lines.push(line);
    const width = Math.max(...lines.map((l) => g.measureText(l).width)) + 24;
    const life = 2 + text.length * 0.035;
    this.bubbles.push({ owner, lines, width, life, max: life });
  }

  private linesOf(enemy: Enemy): string[] | undefined {
    const id = enemy.def.unitId ?? enemy.def.portrait;
    return id ? this.strings.figures[id]?.lines : this.strings.extraLines[enemy.def.id];
  }

  private enemyName(enemyId: string): string {
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
        case 'hit':
          this.confetti(xToPx(e.x), feetY(e.lane) - 60, PAPER, 3, 0.5);
          break;
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
          } else {
            this.confetti(x, y, e.enemyId === 'auto' || e.enemyId === 'trump' ? GOLD : CAMPS[e.camp].color, e.boss ? 40 : 12, e.boss ? 1.5 : 1);
          }
          if (e.boss) this.shake = 0.35;
          break;
        }
        case 'leak':
          this.flashes.push({ lanes: [e.lane], fromX: 0, toX: BOARD_X + CELL_W, life: 0.8, max: 0.8, color: RED });
          this.float(BOARD_X - 30, feetY(e.lane) - 70, `−${e.loss}`, RED, 40, 1.5);
          this.shake = 0.3;
          break;
        case 'boom': {
          const x = xToPx(e.col + 0.5);
          const y = laneTop(e.lane) + CELL_H / 2;
          if (e.area === 'lane') {
            this.flashes.push({ lanes: [e.lane], fromX: BOARD_X, toX: BOARD_X + BOARD_W, life: 0.7, max: 0.7, color: GOLD });
            this.float(VIEW_W / 2, y - 10, a.boom493, INK, 44, 1.5);
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
        case 'dry':
          this.float(xToPx(e.x), feetY(e.lane) - 110, a.dry, INK, 24, 1.4);
          break;
        case 'tariff':
          if (e.on) this.showBanner(a.tariffBanner, RED, 3);
          break;
        case 'tax':
          this.float(xToPx(e.x), feetY(e.lane) - 122, fmt(a.tax, { n: e.amount }), RED, 22, 1.3);
          break;
        case 'interview':
          this.float(xToPx(e.col + 0.5), feetY(e.lane) - 122, a.noComment, INK, 22, 1.6);
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

  private label(text: string, x: number, y: number, size: number, color: string, outline = PAPER): void {
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

  private drawUnit(state: GameState, unit: Unit, now: number, removing = false): void {
    const sprite = this.sprites.unit(unit.def.id);
    if (!sprite) return;
    const g = this.ctx;
    const x = xToPx(unit.col + 0.5);
    const y = feetY(unit.lane);
    const ability = unit.def.ability;
    this.shadow(x, y - 2, 36);

    if (state.ult.frenzy > 0) {
      g.fillStyle = 'rgba(255,210,63,.45)';
      g.beginPath();
      g.ellipse(x, y - 4, 46 + Math.sin(now * 10) * 3, 14, 0, 0, Math.PI * 2);
      g.fill();
    }

    const age = state.time - unit.born;
    const pop = age < 0.25 ? 0.55 + 0.45 * easeOutBack(age / 0.25) : 1;
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
    this.blit(sprite, x, y, sx, sy, rot, removing ? 0.55 : flash, removing ? 0.9 : 1);
    if (removing) {
      const pulse = this.reducedMotion ? 1 : 1 + 0.12 * Math.sin(now * 7 + unit.id);
      g.save();
      g.translate(x + 30, y - 104);
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
      g.translate(x + 30, y - 122);
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
    if (unit.hp < unit.def.hp) this.bar(x, y + 2, 58, unit.hp / unit.def.hp, '#58c26b');
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
    const sprite = this.sprites.enemy(enemy.def.id, enemy.camp);
    if (!sprite) return;
    const g = this.ctx;
    const figureId = enemy.def.unitId ?? enemy.def.portrait;
    const vehicle = enemy.def.id === 'bus' || enemy.def.id === 'auto' || enemy.def.id === 'tracteur' || enemy.def.id === 'cnews';
    const size = enemy.def.boss ? 1.22 : 1;
    const y = feetY(enemy.lane);
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
    const hit = state.time - enemy.lastHit;
    this.blit(sprite, x, y - lift, size, size, rot, hit >= 0 && hit < 0.09 ? 0.6 : 0, (striking || enemy.dry ? 0.75 : 1) * (dimmed ? 0.45 : 1));
    if (enemy.def.fire) this.flames(x - 2, y - sprite.h * 0.74, now, enemy.id);

    const top = y - sprite.h * size + 6;
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
      const name = this.strings.figures[figureId].short.toUpperCase();
      const ink = enemy.def.unitId ? CAMPS[enemy.camp].ink : '#8a5300';
      this.label(name, x, top - (striking ? 28 : 10), enemy.def.boss ? 20 : 15, ink);
      this.bar(x, y + 2, enemy.def.boss ? 96 : 62, enemy.hp / enemy.def.hp, RED);
    } else if (enemy.hp < enemy.def.hp && enemy.def.hp > 200) {
      this.bar(x, y + 2, 46, enemy.hp / enemy.def.hp, RED);
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
    g.beginPath();
    g.roundRect(-15, -12, 30, 21, 8);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-8, 8);
    g.lineTo(-13, 16);
    g.lineTo(-1, 9);
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
      case 'word':
        this.speechShape('?');
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
      case 'ice':
        g.rotate(phase * 3);
        g.fillStyle = '#bfe8ff';
        g.beginPath();
        g.moveTo(0, -14);
        g.lineTo(12, -6);
        g.lineTo(12, 7);
        g.lineTo(0, 14);
        g.lineTo(-12, 7);
        g.lineTo(-12, -6);
        g.closePath();
        g.fill();
        g.stroke();
        g.strokeStyle = PAPER;
        g.beginPath();
        g.moveTo(-5, -4);
        g.lineTo(-5, 4);
        g.stroke();
        break;
      case 'cat': {
        const cat = this.sprites.enemy('cat', 'droite');
        if (cat) {
          g.translate(0, 34 - Math.abs(Math.sin(phase * 12)) * 8);
          g.scale(-1, 1);
          g.drawImage(cat.image, -cat.w / 2, -cat.h, cat.w, cat.h);
        }
        break;
      }
      case 'order':
        g.strokeStyle = '#2f5fe0';
        g.lineWidth = 6;
        g.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(-18 + i * 12, -12);
          g.lineTo(-9 + i * 12, 0);
          g.lineTo(-18 + i * 12, 12);
          g.stroke();
        }
        break;
    }
  }

  /** Placement preview: where the figure would stand and what it would cover. */
  private drawSelection(state: GameState, view: ViewState): void {
    const g = this.ctx;
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
      if (ok) {
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
        } else if (ability.kind === 'shout' || ability.kind === 'aura') {
          g.fillRect(cellX, cellY, Math.min((ability.range + 0.5) * CELL_W, BOARD_X + BOARD_W - cellX), CELL_H);
        } else if (ability.kind === 'hose' || (ability.kind === 'bomb' && ability.area === 'lane')) {
          g.fillRect(BOARD_X, cellY, BOARD_W, CELL_H);
        } else if (ability.kind === 'bomb' || (ability.kind === 'wall' && ability.healAura)) {
          around();
        }
        g.globalAlpha = 1;
        const sprite = this.sprites.unit(def.id);
        if (sprite) this.blit(sprite, cellX + CELL_W / 2, feetY(hover.lane), 1, 1, 0, 0, 0.6);
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
      const height = bubble.lines.length * 18 + 14;
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
      g.beginPath();
      g.roundRect(-bubble.width / 2, -height, bubble.width, height, 10);
      g.fill();
      g.stroke();
      // Tail pointing at the speaker.
      const tail = Math.max(-bubble.width / 2 + 14, Math.min(bubble.width / 2 - 14, anchorX - x));
      g.beginPath();
      g.moveTo(tail - 8, -2);
      g.lineTo(tail, 12);
      g.lineTo(tail + 8, -2);
      g.fill();
      g.stroke();
      g.fillRect(tail - 9, -5, 18, 5);
      g.fillStyle = INK;
      g.font = `700 15px ${BODY}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      bubble.lines.forEach((line, index) => g.fillText(line, 0, -height + 16 + index * 18));
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
    g.translate(VIEW_W / 2, 208 + slide);
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
    const level = this.strings.levels[state.level.id];
    g.save();
    g.translate(VIEW_W / 2, 82);
    g.rotate(-0.012);
    const bob = this.reducedMotion ? 0 : Math.sin(now * 4) * 2;
    g.translate(0, bob);
    // Wide enough to cover the sign it is pinned on (see paintBackdrop).
    g.font = `400 26px ${DISPLAY}`;
    const sign = Math.min(760, g.measureText(`${level.date} · ${level.name}`.toUpperCase()).width + 56);
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
  private drawTariff(): void {
    const g = this.ctx;
    const text = this.strings.announce.tariffBanner.toUpperCase();
    g.save();
    g.font = `400 20px ${DISPLAY}`;
    const width = g.measureText(text).width + 30;
    g.translate(Math.min(VIEW_W - 150, this.view.right - width / 2 - 12), 100);
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

  /** `now` is a visual clock in seconds that stops while the match is paused. */
  draw(state: GameState | null, view: ViewState, now: number): void {
    const g = this.ctx;
    const dt = Math.max(0, Math.min(0.05, now - this.last));
    this.last = now;
    g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    // Sprites are drawn smaller than they were rasterised: ask for the smooth resampler.
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    if (!state) {
      g.fillStyle = '#f3ecdd';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
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
    g.drawImage(this.backdrop!, 0, 0, VIEW_W, VIEW_H);

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

    // Warn when someone is about to reach the steps.
    for (const lane of state.level.lanes) {
      if (!state.enemies.some((e) => e.lane === lane && e.x < 1.6)) continue;
      const pulse = this.reducedMotion ? 0.3 : 0.2 + Math.abs(Math.sin(now * 5)) * 0.25;
      g.fillStyle = `rgba(229,56,59,${pulse})`;
      g.fillRect(0, laneTop(lane), BOARD_X, CELL_H);
    }

    // Removal mode: a dark veil falls over the board so that it is obvious something changed.
    if (view.removing) {
      g.fillStyle = 'rgba(20,26,54,.5)';
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    this.drawSelection(state, view);

    for (let lane = 0; lane < ROWS; lane++) {
      for (const unit of state.units) if (unit.lane === lane) this.drawUnit(state, unit, now, view.removing);
      const marching = state.enemies.filter((e) => e.lane === lane).sort((a, b) => b.x - a.x);
      for (const enemy of marching) this.drawEnemy(state, enemy, now, view.removing);
      for (const shot of state.projectiles) if (shot.lane === lane) this.drawProjectile(shot, now);
    }

    this.drawEffects(dt);
    this.drawBubbles(state, dt);
    if (state.tariff > 1) this.drawTariff();
    if (view.removing) this.drawRemoveRibbon(state, now);
    else this.drawBanner(dt);
  }
}
