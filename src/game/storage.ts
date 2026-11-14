import { LAST_LEVEL } from './data/levels';
import { ACHIEVEMENTS, blankCounters, type AchievementId, type Counters } from './achievements';
import { CAMP_IDS, DIFFICULTIES, type CampId, type Difficulty } from './data/types';
import { UNITS } from './data/units';
import { cleanWardrobe, type CosmeticId } from './cosmetics';
import type { Streak } from './modes';

/**
 * Progress lives in localStorage only: nothing is sent to a server.
 * Every access is guarded because storage can be unavailable (private mode,
 * blocked site data) and the game must still run.
 */
const KEY = 'politique2027:save';

export interface CampProgress {
  /** Highest campaign level available. */
  unlocked: number;
  /** Best star rating per level. */
  stars: Record<number, number>;
  /** Best number of waves survived in endless mode. */
  endlessBest: number;
  /** True once the last level has been won. */
  finished: boolean;
}

export interface Save {
  v: 4;
  camp: CampId | null;
  progress: Record<CampId, CampProgress>;
  muted: boolean;
  /** Game speed: slow (accessibility), normal or fast. */
  speed: 0.5 | 1 | 2;
  /** On a phone held upright, draw the match sideways so that it must be turned (default on). */
  forceLandscape: boolean;
  /** Hard mode: bigger waves (default off). */
  /** Campaign difficulty (the daily challenge, duels and head to head ignore it). */
  difficulty: Difficulty;
  /** The looks your figures wear (won with achievements). */
  wardrobe: CosmeticId[];
  /** Daily challenges played to the end on consecutive days. */
  streak: Streak;
  /** Opponents whose "New!" card has already been shown. */
  seen: string[];
  /** True once the "add to home screen" tip has been dismissed. */
  installTipDismissed: boolean;
  /** Daily challenge: best score per day (YYYY-MM-DD), the last few days only. */
  daily: Record<string, number>;
  /** Achievements earned, and the running totals they are counted from. */
  achievements: AchievementId[];
  counters: Counters;
  /** Background music (sound effects follow the mute button). */
  music: boolean;
  /** The last deck chosen with each camp (from night 6). */
  teams: Record<CampId, string[]>;
}

/** v1 had five levels; 1.1.0 inserted "the street" and "the summit". */
const V1_LEVELS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 6, 5: 7 };
/** 2.0.0 inserted the debate as night 7: the run-off night moved to 8. */
const V2_LEVELS = (n: number) => (n >= 7 ? n + 1 : n);
/** 3.0.0 inserted the school blockade as night 3: "the street" (now the 17th of October) and every later night move up one. */
const V3_LEVELS = (n: number) => (n >= 3 ? n + 1 : n);

function blankProgress(): CampProgress {
  return { unlocked: 1, stars: {}, endlessBest: 0, finished: false };
}

export function blankSave(): Save {
  return {
    v: 4,
    camp: null,
    progress: { gauche: blankProgress(), centre: blankProgress(), droite: blankProgress(), autres: blankProgress() },
    muted: false,
    speed: 1,
    forceLandscape: true,
    difficulty: 'normal',
    wardrobe: [],
    streak: { days: 0, best: 0, last: null },
    seen: [],
    installTipDismissed: false,
    daily: {},
    achievements: [],
    counters: blankCounters(),
    music: true,
    teams: { gauche: [], centre: [], droite: [], autres: [] },
  };
}

export function loadSave(): Save {
  const save = blankSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return save;
    const data = JSON.parse(raw) as {
      v?: number; camp?: unknown; muted?: unknown; speed?: unknown; forceLandscape?: unknown;
      hard?: unknown; difficulty?: unknown; wardrobe?: unknown; streak?: { days?: unknown; best?: unknown; last?: unknown }; seen?: unknown; installTipDismissed?: unknown;
      daily?: unknown; achievements?: unknown; counters?: Record<string, unknown>; music?: unknown;
      teams?: Record<string, unknown>;
      progress?: Record<string, Partial<CampProgress>>;
    };
    if (data.v !== 1 && data.v !== 2 && data.v !== 3 && data.v !== 4) return save;
    const level = (n: number) =>
      data.v === 1 ? V3_LEVELS(V2_LEVELS(V1_LEVELS[n] ?? 1)) : data.v === 2 ? V3_LEVELS(V2_LEVELS(n)) : data.v === 3 ? V3_LEVELS(n) : n;

    if (CAMP_IDS.includes(data.camp as CampId)) save.camp = data.camp as CampId;
    save.muted = data.muted === true;
    save.speed = data.speed === 2 ? 2 : data.speed === 0.5 ? 0.5 : 1;
    save.forceLandscape = data.forceLandscape !== false;
    save.difficulty = DIFFICULTIES.includes(data.difficulty as Difficulty) ? (data.difficulty as Difficulty) : data.hard === true ? 'hard' : 'normal';
    if (Array.isArray(data.wardrobe)) save.wardrobe = cleanWardrobe(data.wardrobe);
    const streak = data.streak;
    if (streak && typeof streak === 'object' && typeof streak.last === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(streak.last)) {
      const days = Math.max(1, Math.min(9999, Math.floor(Number(streak.days) || 1)));
      save.streak = { days, best: Math.max(days, Math.min(9999, Math.floor(Number(streak.best) || 0))), last: streak.last };
    }
    save.seen = Array.isArray(data.seen) ? data.seen.filter((id): id is string => typeof id === 'string').slice(0, 100) : [];
    save.installTipDismissed = data.installTipDismissed === true;
    save.music = data.music !== false;
    for (const camp of CAMP_IDS) {
      const team = data.teams?.[camp];
      if (Array.isArray(team)) save.teams[camp] = team.filter((id): id is string => typeof id === 'string' && id in UNITS).slice(0, 8);
    }
    if (data.daily && typeof data.daily === 'object') {
      const days = Object.entries(data.daily as Record<string, unknown>)
        .filter(([day, score]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Number(score)))
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, 14);
      save.daily = Object.fromEntries(days.map(([day, score]) => [day, Math.max(0, Number(score))]));
    }
    if (Array.isArray(data.achievements)) {
      save.achievements = data.achievements.filter((id): id is AchievementId => ACHIEVEMENTS.includes(id as AchievementId));
    }
    for (const key of Object.keys(save.counters) as (keyof Counters)[]) {
      save.counters[key] = Math.max(0, Number(data.counters?.[key]) || 0);
    }
    for (const camp of CAMP_IDS) {
      const stored = data.progress?.[camp];
      if (!stored) continue;
      const stars: Record<number, number> = {};
      if (stored.stars && typeof stored.stars === 'object') {
        for (const [key, value] of Object.entries(stored.stars)) {
          const rating = Math.min(3, Math.max(0, Number(value) || 0));
          if (rating) stars[level(Number(key))] = rating;
        }
      }
      save.progress[camp] = {
        unlocked: Math.min(LAST_LEVEL, Math.max(1, level(Number(stored.unlocked) || 1))),
        stars,
        endlessBest: Math.max(0, Number(stored.endlessBest) || 0),
        finished: stored.finished === true,
      };
    }
  } catch {
    // Unreadable or blocked storage: start from a blank save.
  }
  return save;
}

export function storeSave(save: Save): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Nothing to do: the session simply will not be remembered.
  }
}
