/**
 * Ways to start a match besides the campaign: the daily challenge (the same night,
 * camp and waves for everybody on a given day) and the turn-based duel (a short code
 * that replays the same match, with the score to beat).
 */
import { LAST_LEVEL } from './data/levels';
import { CAMP_IDS, RULES, type CampId, type RuleId } from './data/types';

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
  /** Daily challenge (and a duel taken from it): the rule of the day. */
  rule?: RuleId;
}


function dayOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function today(): string {
  return dayOf(new Date());
}

/** The day before a "YYYY-MM-DD" day. */
export function dayBefore(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y, m - 1, d - 1));
}

/** Daily challenges played to the end on consecutive days. */
export interface Streak {
  days: number;
  best: number;
  last: string | null;
}

/** Days in a row it takes to earn the "Assidu" achievement (and the tricolour flames). */
export const STREAK_GOAL = 5;

/** A daily challenge played to the end on `day`: the streak goes on, or starts again. */
export function advanceStreak(streak: Streak, day: string): Streak {
  if (streak.last === day) return streak;
  const days = streak.last === dayBefore(day) ? streak.days + 1 : 1;
  return { days, best: Math.max(streak.best, days), last: day };
}

/** The streak as of `day`: still alive the day after the last challenge, gone after that. */
export function currentStreak(streak: Streak, day: string): number {
  return streak.last === day || streak.last === dayBefore(day) ? streak.days : 0;
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
  return { mode: 'daily', level: 2 + (h % (LAST_LEVEL - 1)), camp: CAMP_IDS[(h >>> 8) % 4], seed: h % 1_000_000_000, rule: RULES[(h >>> 16) % RULES.length] };
}

/** A duel fits in a short code: night, camp, seed and, once played, the score to beat (and the rule of the day, if any). */
export function duelCode(setup: Setup, score?: number): string {
  const parts: (string | number)[] = [setup.level, CAMP_IDS.indexOf(setup.camp), setup.seed.toString(36)];
  if (score === undefined) return parts.join('-');
  parts.push(score.toString(36));
  if (setup.rule) parts.push(RULES.indexOf(setup.rule) + 1);
  return parts.join('-');
}

export function parseDuel(code: string): Setup | null {
  const m = /^([1-9])-([0-3])-([0-9a-z]{1,7})(?:-([0-9a-z]{1,6})(?:-([1-9]))?)?$/.exec(code.trim().toLowerCase());
  if (!m || Number(m[1]) > LAST_LEVEL || (m[5] && Number(m[5]) > RULES.length)) return null;
  return {
    mode: 'duel', level: Number(m[1]), camp: CAMP_IDS[Number(m[2])], seed: parseInt(m[3], 36),
    rival: m[4] ? parseInt(m[4], 36) : undefined, rule: m[5] ? RULES[Number(m[5]) - 1] : undefined,
  };
}

