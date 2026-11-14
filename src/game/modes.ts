/**
 * Ways to start a match besides the campaign: the daily challenge (the same night,
 * camp and waves for everybody on a given day) and the turn-based duel (a short code
 * that replays the same match, with the score to beat).
 */
import { LAST_LEVEL } from './data/levels';
import { CAMP_IDS, type CampId } from './data/types';

/** How a match was started: the campaign, the daily challenge, a turn-based duel or two players at once. */
export type Mode = 'campaign' | 'daily' | 'duel' | 'versus';
export interface Setup {
  mode: Mode;
  level: number;
  camp: CampId;
  seed: number;
  /** Duel: the score the second player has to beat. */
  rival?: number;
  /** Campaign: the cards chosen for the night. */
  deck?: string[];
}


export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** FNV-1a: the same day gives the same challenge on every device. */
export function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dailySetup(day = today()): Setup {
  const h = hash(`politique2027:${day}`);
  return { mode: 'daily', level: 2 + (h % (LAST_LEVEL - 1)), camp: CAMP_IDS[(h >>> 8) % 4], seed: h % 1_000_000_000 };
}

/** A duel fits in a short code: night, camp, seed and, once played, the score to beat. */
export function duelCode(setup: Setup, score?: number): string {
  const parts = [setup.level, CAMP_IDS.indexOf(setup.camp), setup.seed.toString(36)];
  return (score === undefined ? parts : [...parts, score.toString(36)]).join('-');
}

export function parseDuel(code: string): Setup | null {
  const m = /^([1-9])-([0-3])-([0-9a-z]{1,7})(?:-([0-9a-z]{1,6}))?$/.exec(code.trim().toLowerCase());
  if (!m || Number(m[1]) > LAST_LEVEL) return null;
  return { mode: 'duel', level: Number(m[1]), camp: CAMP_IDS[Number(m[2])], seed: parseInt(m[3], 36), rival: m[4] ? parseInt(m[4], 36) : undefined };
}

