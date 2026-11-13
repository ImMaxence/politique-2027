import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRID_BOX } from '../../src/game/render/layout';

describe('board geometry', () => {
  it('the grid of buttons in game.css sits exactly on the painted courtyard', () => {
    const css = readFileSync(resolve(import.meta.dirname, '../../src/styles/game.css'), 'utf8');
    const rule = /\n\.grid \{([^}]*)\}/.exec(css)?.[1] ?? '';
    const value = (prop: string) => Number(new RegExp(`\\n\\s*${prop}: ([\\d.]+)%`).exec(rule)?.[1]);
    expect(value('left')).toBeCloseTo(GRID_BOX.left, 3);
    expect(value('top')).toBeCloseTo(GRID_BOX.top, 3);
    expect(value('width')).toBeCloseTo(GRID_BOX.width, 3);
    expect(value('height')).toBeCloseTo(GRID_BOX.height, 3);
  });
});
