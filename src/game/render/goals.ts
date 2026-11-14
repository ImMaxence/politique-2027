/**
 * What the crowd is after on each night, drawn at the end of every row (one piece
 * per row: the five lives). Each item fits in about 72 × 84 units so that the phone
 * layout, which crops the scene a little left of the board, still shows it whole.
 */
import type { GoalId } from '../data/types';
import { INK } from './portraits';

type Ctx = CanvasRenderingContext2D;

const PAPER = '#fffdf6';
const GOLD = '#ffd23f';
const RED = '#e5383b';
const BLUE = '#2f5fe0';
const DISPLAY = "'Anton', 'Arial Narrow', Impact, sans-serif";

function outline(g: Ctx, width = 2.6): void {
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.stroke();
}

function rect(g: Ctx, x: number, y: number, w: number, h: number, fill: string, r: number | number[] = 3): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
  outline(g);
}

function text(g: Ctx, value: string, x: number, y: number, size: number, color: string, rotate = 0): void {
  g.save();
  g.translate(x, y);
  g.rotate(rotate);
  g.font = `400 ${size}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(value, 0, 1);
  g.restore();
}

function sack(g: Ctx, x: number, y: number, s: number, label: string): void {
  g.beginPath();
  g.moveTo(x - 16 * s, y);
  g.quadraticCurveTo(x - 22 * s, y - 26 * s, x - 8 * s, y - 34 * s);
  g.lineTo(x - 10 * s, y - 42 * s);
  g.lineTo(x + 10 * s, y - 42 * s);
  g.lineTo(x + 8 * s, y - 34 * s);
  g.quadraticCurveTo(x + 22 * s, y - 26 * s, x + 16 * s, y);
  g.closePath();
  g.fillStyle = '#c9a26a';
  g.fill();
  outline(g);
  g.beginPath();
  g.moveTo(x - 9 * s, y - 35 * s);
  g.lineTo(x + 9 * s, y - 35 * s);
  outline(g, 3);
  text(g, label, x, y - 16 * s, 15 * s, '#5a3b16');
}

/** One piece of the night's goal, its base centred on (x, y). */
export function drawGoal(g: Ctx, goal: GoalId, x: number, y: number): void {
  switch (goal) {
    case 'parrainages': {
      // A pile of signed forms, with the famous figure on a ribbon.
      for (let i = 0; i < 4; i++) {
        g.save();
        g.translate(x + (i % 2 ? 3 : -3), y - 8 - i * 9);
        g.rotate((i % 2 ? 1 : -1) * 0.05);
        rect(g, -26, -6, 52, 10, PAPER, 2);
        g.restore();
      }
      rect(g, -30 + x, y - 64, 60, 26, PAPER, 3);
      g.beginPath();
      g.moveTo(x - 20, y - 52);
      g.quadraticCurveTo(x - 10, y - 60, x, y - 50);
      g.quadraticCurveTo(x + 8, y - 44, x + 18, y - 54);
      outline(g, 2);
      g.beginPath();
      g.arc(x + 18, y - 32, 11, 0, Math.PI * 2);
      g.fillStyle = RED;
      g.fill();
      outline(g);
      text(g, '500', x + 18, y - 32, 11, PAPER);
      break;
    }
    case 'pac':
      sack(g, x - 14, y, 0.9, '€');
      sack(g, x + 14, y, 0.9, '€');
      sack(g, x, y - 26, 0.8, 'PAC');
      break;
    case 'portables': {
      // A crate of confiscated phones, and the school books.
      for (let i = 0; i < 3; i++) rect(g, x - 34, y - 12 - i * 10, 30, 9, ['#2f5fe0', '#e5383b', '#3c8a57'][i], 2);
      for (let i = 0; i < 3; i++) {
        g.save();
        g.translate(x + 2 + i * 10, y - 46);
        g.rotate(-0.2 + i * 0.2);
        rect(g, -6, -14, 12, 24, INK, 3);
        g.fillStyle = ['#8fd3ff', '#ffd23f', '#ff9fb2'][i];
        g.fillRect(-4, -11, 8, 15);
        g.restore();
      }
      rect(g, x - 4, y - 40, 40, 40, '#b98558', 3);
      rect(g, x + 9, y - 33, 14, 24, INK, 3);
      g.fillStyle = '#8fd3ff';
      g.fillRect(x + 11, y - 30, 10, 16);
      g.beginPath();
      g.moveTo(x + 4, y - 8);
      g.lineTo(x + 28, y - 36);
      g.strokeStyle = RED;
      g.lineWidth = 3;
      g.stroke();
      break;
    }
    case 'caddie': {
      // A full trolley: a baguette, a bottle, a bag of pasta.
      g.beginPath();
      g.moveTo(x - 34, y - 58);
      g.lineTo(x - 26, y - 58);
      g.lineTo(x - 18, y - 16);
      g.lineTo(x + 28, y - 16);
      outline(g, 4);
      g.beginPath();
      g.moveTo(x - 24, y - 48);
      g.lineTo(x + 34, y - 48);
      g.lineTo(x + 28, y - 22);
      g.lineTo(x - 19, y - 22);
      g.closePath();
      g.fillStyle = '#c4cad6';
      g.fill();
      outline(g);
      g.save();
      g.translate(x - 6, y - 58);
      g.rotate(-0.5);
      rect(g, -6, -16, 12, 34, '#e0a54a', 6);
      g.restore();
      rect(g, x + 4, y - 66, 10, 22, '#3c8a57', [4, 4, 2, 2]);
      rect(g, x + 16, y - 58, 16, 14, GOLD, 3);
      for (const wx of [x - 16, x + 24]) {
        g.beginPath();
        g.arc(wx, y - 6, 6, 0, Math.PI * 2);
        g.fillStyle = INK;
        g.fill();
      }
      break;
    }
    case 'micros': {
      // Two microphones on their stands: the speaking time.
      for (const dx of [-14, 14]) {
        g.beginPath();
        g.moveTo(x + dx, y - 2);
        g.lineTo(x + dx, y - 50);
        outline(g, 4);
        rect(g, x + dx - 12, y - 6, 24, 6, '#3a3f4b', 3);
        g.beginPath();
        g.ellipse(x + dx, y - 60, 9, 12, 0, 0, Math.PI * 2);
        g.fillStyle = '#aab6cc';
        g.fill();
        outline(g);
      }
      rect(g, x - 26, y - 34, 52, 18, RED, 4);
      text(g, 'ON AIR', x, y - 25, 12, PAPER);
      break;
    }
    case 'terroir': {
      // A wheel of cheese, a bottle of wine and a baguette.
      g.beginPath();
      g.ellipse(x - 8, y - 10, 24, 9, 0, 0, Math.PI * 2);
      g.fillStyle = '#f2cf6b';
      g.fill();
      outline(g);
      rect(g, x - 32, y - 30, 48, 20, '#f6d97f', 4);
      g.beginPath();
      g.moveTo(x - 8, y - 30);
      g.lineTo(x + 16, y - 22);
      g.lineTo(x + 16, y - 12);
      outline(g, 2);
      for (const [hx, hy] of [[-20, -20], [-4, -24], [6, -16]]) {
        g.beginPath();
        g.arc(x + hx, y + hy, 2.5, 0, Math.PI * 2);
        g.fillStyle = '#d9a83c';
        g.fill();
      }
      rect(g, x + 18, y - 58, 12, 56, '#5b1f3a', [5, 5, 3, 3]);
      rect(g, x + 21, y - 70, 6, 14, '#5b1f3a', 2);
      rect(g, x + 18, y - 38, 12, 12, PAPER, 1);
      g.save();
      g.translate(x - 4, y - 52);
      g.rotate(-0.35);
      rect(g, -26, -6, 52, 12, '#e0a54a', 6);
      g.restore();
      break;
    }
    case 'urnes': {
      // A see-through ballot box with envelopes inside.
      rect(g, x - 28, y - 52, 56, 52, 'rgba(220,240,255,.85)', 4);
      for (const [ex, ey] of [[-14, -14], [6, -10], [-4, -24], [12, -26]]) {
        g.save();
        g.translate(x + ex, y + ey);
        g.rotate(ex * 0.02);
        rect(g, -8, -5, 16, 10, '#c9d6f5', 1);
        g.restore();
      }
      rect(g, x - 32, y - 60, 64, 10, BLUE, 3);
      g.fillStyle = INK;
      g.fillRect(x - 12, y - 57, 24, 4);
      text(g, 'URNE', x, y - 40, 13, INK);
      break;
    }
    case 'fiches': {
      // A lectern and a stack of debate notes.
      g.beginPath();
      g.moveTo(x - 22, y);
      g.lineTo(x + 22, y);
      g.lineTo(x + 14, y - 40);
      g.lineTo(x - 14, y - 40);
      g.closePath();
      g.fillStyle = '#8a5a3c';
      g.fill();
      outline(g);
      g.save();
      g.translate(x, y - 50);
      g.rotate(-0.08);
      for (let i = 0; i < 3; i++) rect(g, -24 + i * 3, -12 - i * 4, 44, 24, PAPER, 2);
      g.restore();
      text(g, 'FICHES', x + 2, y - 60, 11, RED, -0.08);
      break;
    }
    case 'fauteuil': {
      // The presidential armchair: gilt and red velvet.
      rect(g, x - 26, y - 76, 52, 50, GOLD, [16, 16, 4, 4]);
      rect(g, x - 18, y - 68, 36, 38, RED, [12, 12, 3, 3]);
      rect(g, x - 30, y - 30, 60, 16, GOLD, 4);
      rect(g, x - 24, y - 28, 48, 10, RED, 3);
      for (const lx of [x - 26, x + 20]) rect(g, lx, y - 16, 6, 16, GOLD, 2);
      break;
    }
    case 'budget': {
      // Bundles of banknotes and a label.
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 3 - row; i++) {
          const bx = x - 30 + i * 20 + row * 10;
          const by = y - 12 - row * 14;
          rect(g, bx, by, 20, 12, '#8fce8f', 2);
          g.fillStyle = PAPER;
          g.fillRect(bx + 8, by + 1, 4, 10);
        }
      }
      rect(g, x - 26, y - 68, 52, 18, PAPER, 3);
      text(g, 'BUDGET', x, y - 59, 12, INK);
      break;
    }
  }
}
