/**
 * What the crowd is after on each night, drawn at the end of every row (one piece
 * per row: the five lives). Each piece is a card, like the tickets of the HUD: a
 * plain icon and its name written in full underneath, so that nobody has to guess.
 * A card is 62 × 78 units, so that the phone and side layouts, which crop the scene a
 * little left of the board, still show it whole.
 */
import type { GoalId } from '../data/types';
import { INK } from './portraits';

type Ctx = CanvasRenderingContext2D;

const PAPER = '#fffdf6';
const GOLD = '#ffd23f';
const RED = '#e5383b';
const BLUE = '#2f5fe0';
const GREEN = '#3c8a57';
const DISPLAY = "'Anton', 'Arial Narrow', Impact, sans-serif";

function stroke(g: Ctx, width = 2.4): void {
  g.strokeStyle = INK;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.stroke();
}

function shape(g: Ctx, fill: string, draw: () => void, width = 2.4): void {
  g.beginPath();
  draw();
  g.fillStyle = fill;
  g.fill();
  stroke(g, width);
}

function rect(g: Ctx, x: number, y: number, w: number, h: number, fill: string, r: number | number[] = 3): void {
  shape(g, fill, () => g.roundRect(x, y, w, h, r));
}

function text(g: Ctx, value: string, x: number, y: number, size: number, color: string, max?: number): void {
  g.font = `400 ${size}px ${DISPLAY}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = color;
  g.fillText(value, x, y + 1, max);
}

/** The icon of each goal, centred on (0, 0), about 50 × 42 units. */
function icon(g: Ctx, goal: GoalId): void {
  switch (goal) {
    case 'parrainages': {
      // An endorsement form, signed, and its pen.
      rect(g, -16, -21, 32, 40, PAPER, 2);
      g.strokeStyle = '#9aa3b8';
      g.lineWidth = 2;
      for (const y of [-13, -7, -1]) {
        g.beginPath();
        g.moveTo(-10, y);
        g.lineTo(10, y);
        g.stroke();
      }
      g.beginPath();
      g.moveTo(-10, 10);
      g.bezierCurveTo(-6, 2, -3, 16, 1, 8);
      g.bezierCurveTo(4, 3, 6, 12, 10, 8);
      g.strokeStyle = BLUE;
      g.lineWidth = 2.2;
      g.stroke();
      g.save();
      g.translate(16, 4);
      g.rotate(0.6);
      rect(g, -3, -16, 6, 26, GOLD, 2);
      shape(g, INK, () => {
        g.moveTo(-3, 10);
        g.lineTo(0, 16);
        g.lineTo(3, 10);
        g.closePath();
      }, 1.5);
      g.restore();
      break;
    }
    case 'pac': {
      // A sack of money.
      shape(g, '#d8b06a', () => {
        g.moveTo(-17, 20);
        g.quadraticCurveTo(-24, -2, -8, -10);
        g.lineTo(-11, -18);
        g.lineTo(11, -18);
        g.lineTo(8, -10);
        g.quadraticCurveTo(24, -2, 17, 20);
        g.closePath();
      });
      g.beginPath();
      g.moveTo(-9, -11);
      g.lineTo(9, -11);
      stroke(g, 3);
      text(g, '€', 0, 6, 22, '#6b4410');
      break;
    }
    case 'portables': {
      // Two phones in a basket.
      for (const [dx, rot, screen] of [[-8, -0.25, '#8fd3ff'], [9, 0.2, '#ffd23f']] as const) {
        g.save();
        g.translate(dx, -6);
        g.rotate(rot);
        rect(g, -8, -15, 16, 28, INK, 4);
        g.fillStyle = screen;
        g.fillRect(-5.5, -11, 11, 18);
        g.restore();
      }
      rect(g, -20, 4, 40, 16, '#b98558', [2, 2, 6, 6]);
      g.strokeStyle = 'rgba(23,32,63,.45)';
      g.lineWidth = 2;
      for (const x of [-10, 0, 10]) {
        g.beginPath();
        g.moveTo(x, 6);
        g.lineTo(x, 18);
        g.stroke();
      }
      break;
    }
    case 'caddie': {
      // A shopping trolley full of groceries.
      rect(g, -8, -22, 7, 20, '#e0a54a', 3); // baguette
      rect(g, 2, -18, 9, 16, GREEN, [4, 4, 2, 2]); // bottle
      rect(g, -16, -10, 10, 9, RED, 2);
      rect(g, 8, -8, 10, 7, GOLD, 2);
      shape(g, '#c9d1de', () => {
        g.moveTo(-20, -4);
        g.lineTo(22, -4);
        g.lineTo(17, 12);
        g.lineTo(-15, 12);
        g.closePath();
      });
      g.beginPath();
      g.moveTo(-26, -10);
      g.lineTo(-20, -10);
      g.lineTo(-14, 16);
      g.lineTo(18, 16);
      stroke(g, 3);
      for (const x of [-11, 15]) {
        g.beginPath();
        g.arc(x, 20, 3.5, 0, Math.PI * 2);
        g.fillStyle = INK;
        g.fill();
      }
      break;
    }
    case 'micros': {
      // A microphone on its stand.
      g.beginPath();
      g.moveTo(0, -2);
      g.lineTo(0, 18);
      stroke(g, 3.5);
      rect(g, -12, 16, 24, 5, INK, 2);
      shape(g, '#aab6cc', () => g.ellipse(0, -11, 10, 13, 0, 0, Math.PI * 2));
      g.strokeStyle = 'rgba(23,32,63,.35)';
      g.lineWidth = 1.6;
      for (const y of [-16, -11, -6]) {
        g.beginPath();
        g.moveTo(-8, y);
        g.lineTo(8, y);
        g.stroke();
      }
      break;
    }
    case 'terroir': {
      // A wedge of cheese and a bottle of wine.
      shape(g, '#f6d97f', () => {
        g.moveTo(-24, 18);
        g.lineTo(-24, 2);
        g.lineTo(4, -6);
        g.lineTo(4, 18);
        g.closePath();
      });
      for (const [hx, hy, r] of [[-15, 8, 3], [-6, 12, 2.5], [-4, 3, 2]]) {
        g.beginPath();
        g.arc(hx, hy, r, 0, Math.PI * 2);
        g.fillStyle = '#d9a83c';
        g.fill();
      }
      rect(g, 9, -10, 13, 28, '#6b2445', [5, 5, 3, 3]);
      rect(g, 12.5, -22, 6, 13, '#6b2445', 2);
      rect(g, 10, 0, 11, 9, PAPER, 1);
      break;
    }
    case 'urnes': {
      // A see-through ballot box and its envelopes.
      rect(g, -20, -10, 40, 30, 'rgba(210,232,255,.95)', 3);
      for (const [ex, ey, rot] of [[-9, 10, -0.2], [7, 12, 0.15], [-1, 3, 0.05]]) {
        g.save();
        g.translate(ex, ey);
        g.rotate(rot);
        rect(g, -7, -4.5, 14, 9, '#c9d6f5', 1);
        g.restore();
      }
      rect(g, -23, -16, 46, 8, BLUE, 2);
      g.fillStyle = INK;
      g.fillRect(-9, -13.5, 18, 3);
      g.save();
      g.translate(0, -20);
      rect(g, -7, -8, 14, 10, PAPER, 1);
      g.restore();
      break;
    }
    case 'fiches': {
      // A stack of note cards.
      for (let i = 2; i >= 0; i--) {
        g.save();
        g.translate(i * 3 - 3, i * -3 + 2);
        g.rotate(-0.06 * i);
        rect(g, -18, -14, 36, 26, PAPER, 2);
        g.restore();
      }
      g.strokeStyle = '#9aa3b8';
      g.lineWidth = 2;
      for (const y of [-8, -2, 4]) {
        g.beginPath();
        g.moveTo(-12, y);
        g.lineTo(12, y);
        g.stroke();
      }
      g.strokeStyle = RED;
      g.beginPath();
      g.moveTo(-12, -13);
      g.lineTo(12, -13);
      g.stroke();
      break;
    }
    case 'fauteuil': {
      // The presidential armchair.
      rect(g, -16, -22, 32, 28, GOLD, [12, 12, 3, 3]);
      rect(g, -11, -17, 22, 20, RED, [9, 9, 2, 2]);
      rect(g, -22, 2, 44, 10, GOLD, 4);
      rect(g, -17, 3, 34, 6, RED, 2);
      for (const lx of [-19, 14]) rect(g, lx, 11, 5, 10, GOLD, 2);
      break;
    }
    case 'budget': {
      // Bundles of banknotes.
      for (let row = 0; row < 3; row++) {
        for (let i = 0; i < 3 - row; i++) {
          const bx = -24 + i * 16 + row * 8;
          const by = 8 - row * 11;
          rect(g, bx, by, 16, 10, '#8fce8f', 2);
          g.fillStyle = PAPER;
          g.fillRect(bx + 6, by + 1, 4, 8);
        }
      }
      text(g, '€', 16, -16, 18, GREEN);
      break;
    }
  }
}

/** One piece of the night's goal, its base centred on (x, y), with its name. */
export function drawGoal(g: Ctx, goal: GoalId, label: string, x: number, y: number): void {
  g.save();
  g.translate(x, y);
  // The card.
  g.fillStyle = 'rgba(23,32,63,.22)';
  g.beginPath();
  g.roundRect(-28, -78, 62, 76, 8);
  g.fill();
  rect(g, -31, -82, 62, 76, PAPER, 8);
  // Its name, on a strip at the bottom.
  shape(g, INK, () => g.roundRect(-31, -26, 62, 20, [0, 0, 8, 8]), 2.4);
  text(g, label, 0, -16, 12, PAPER, 56);
  g.translate(0, -53);
  g.scale(0.92, 0.92);
  icon(g, goal);
  g.restore();
}
