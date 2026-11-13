import { COLS, ROWS } from '../data/levels';

/**
 * Logical canvas size; the backing store is scaled to the device.
 * The phone layout shows a crop of it (see `.stage__view` in game.css): keep the
 * courtyard, the floor strip under it and room for the controls above it in view.
 */
export const VIEW_W = 1280;
export const VIEW_H = 720;

/**
 * The scenery goes on to the left of the steps (more of the building's front), so
 * that a wide, short screen can be filled edge to edge. The game itself lives in
 * 0…VIEW_W; the painted scene spans -SCENE_LEFT…VIEW_W.
 */
export const SCENE_LEFT = 160;
export const SCENE_W = VIEW_W + SCENE_LEFT;

/** Puppets on the board are drawn this much bigger than their rasterised size. */
export const FIGURE_SCALE = 1.25;

export const BOARD_X = 170;
export const BOARD_Y = 128;
export const CELL_W = 116;
export const CELL_H = 112;
export const BOARD_W = COLS * CELL_W;
export const BOARD_H = ROWS * CELL_H;

/** Horizontal pixel position of a simulation x (in cells). */
export function xToPx(x: number): number {
  return BOARD_X + x * CELL_W;
}

/** Where a figure's stick touches the ground in a lane. */
export function feetY(lane: number): number {
  return BOARD_Y + (lane + 1) * CELL_H - 8;
}

export function laneTop(lane: number): number {
  return BOARD_Y + lane * CELL_H;
}

/** CSS percentages used to align the DOM grid of buttons with the painted scene (see game.css). */
export const GRID_BOX = {
  left: ((BOARD_X + SCENE_LEFT) / SCENE_W) * 100,
  top: (BOARD_Y / VIEW_H) * 100,
  width: (BOARD_W / SCENE_W) * 100,
  height: (BOARD_H / VIEW_H) * 100,
};
