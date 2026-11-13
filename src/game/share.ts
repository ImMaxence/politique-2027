/**
 * The end-of-match front page, drawn as a 1200 × 630 picture for the system share
 * sheet. Everything happens on the device.
 */
import type { GameStrings } from '../i18n/game';
import type { CampId } from './data/types';
import { CAMPS } from './data/units';
import type { Sprite } from './render/sprites';

export interface ResultCard {
  headline: string;
  won: boolean;
  stars: number;
  stats: [string, string][];
  notes: string[];
}

export async function resultPicture(result: ResultCard, camp: CampId, t: GameStrings, sprite: Sprite | undefined): Promise<Blob | null> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) return null;
  await document.fonts?.load("64px 'Anton'").catch(() => undefined);
  const ink = '#17203f';
  const display = "'Anton', 'Arial Narrow', Impact, sans-serif";
  const body = "'Public Sans Variable', 'Public Sans', system-ui, sans-serif";
  g.fillStyle = '#fbf6e9';
  g.fillRect(0, 0, W, H);
  g.fillStyle = CAMPS[camp].color;
  g.fillRect(0, 0, W, 16);
  g.fillRect(0, H - 16, W, 16);

  g.fillStyle = ink;
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.font = `400 52px ${display}`;
  g.fillText(t.ui.gazette.toUpperCase(), 56, 92);
  g.fillRect(56, 112, 760, 3);
  g.fillRect(56, 150, 760, 3);
  g.font = `700 19px ${body}`;
  g.fillText(t.ui.gazetteTag.toUpperCase(), 56, 139, 760);

  // The headline, wrapped on up to three lines.
  g.font = `400 62px ${display}`;
  g.fillStyle = result.won ? '#b0191f' : ink;
  const lines: string[] = [];
  let line = '';
  for (const word of result.headline.toUpperCase().split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (g.measureText(attempt).width > 760 && line) {
      lines.push(line);
      line = word;
    } else line = attempt;
  }
  if (line) lines.push(line);
  lines.slice(0, 3).forEach((text, i) => g.fillText(text, 56, 232 + i * 70, 760));
  let y = 232 + Math.min(3, lines.length) * 70;
  if (result.stars) {
    g.font = `400 52px ${body}`;
    g.fillStyle = '#c98a00';
    g.fillText(`${'★'.repeat(result.stars)}${'☆'.repeat(3 - result.stars)}`, 56, y + 6);
    y += 60;
  }
  if (result.notes.length) {
    g.font = `800 22px ${body}`;
    g.fillStyle = ink;
    g.fillText(result.notes.join(' · ').toUpperCase(), 56, y);
  }

  // Four figures from the match along the bottom.
  result.stats.forEach(([term, value], i) => {
    const x = 56 + i * 190;
    g.fillStyle = 'rgba(23,32,63,.25)';
    g.fillRect(x, 470, 170, 2);
    g.fillStyle = ink;
    g.font = `700 16px ${body}`;
    g.fillText(term.toUpperCase(), x, 500, 170);
    g.font = `400 44px ${display}`;
    g.fillText(value, x, 552);
  });

  // The camp's headliner, as a sticker.
  if (sprite) {
    const height = 400;
    const width = (sprite.w / sprite.h) * height;
    g.drawImage(sprite.image, 860 + (300 - width) / 2, 120, width, height);
  }
  g.fillStyle = ink;
  g.textAlign = 'right';
  g.font = `800 24px ${body}`;
  g.fillText(location.host || 'politique2027.mbonnici.fr', W - 56, H - 44);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}
