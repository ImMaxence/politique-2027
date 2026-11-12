import { COLS, ROWS } from '../data/levels';

/** Logical canvas size; the backing store is scaled to the device. */
export const VIEW_W = 1280;
export const VIEW_H = 720;

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

/** CSS percentages used to align the DOM grid of buttons with the canvas. */
export const GRID_BOX = {
  left: (BOARD_X / VIEW_W) * 100,
  top: (BOARD_Y / VIEW_H) * 100,
  width: (BOARD_W / VIEW_W) * 100,
  height: (BOARD_H / VIEW_H) * 100,
};
