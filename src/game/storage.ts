import { LAST_LEVEL } from './data/levels';
import { CAMP_IDS, type CampId } from './data/types';

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
  v: 2;
  camp: CampId | null;
  progress: Record<CampId, CampProgress>;
  muted: boolean;
  speed: 1 | 2;
  /** On a phone held upright, draw the match sideways so that it must be turned (default on). */
  forceLandscape: boolean;
}

/** v1 had five levels; 1.1.0 inserted "the street" and "the summit". */
const V1_LEVELS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 6, 5: 7 };

function blankProgress(): CampProgress {
  return { unlocked: 1, stars: {}, endlessBest: 0, finished: false };
}

export function blankSave(): Save {
  return {
    v: 2,
    camp: null,
    progress: { gauche: blankProgress(), centre: blankProgress(), droite: blankProgress(), autres: blankProgress() },
    muted: false,
    speed: 1,
    forceLandscape: true,
  };
}

export function loadSave(): Save {
  const save = blankSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return save;
    const data = JSON.parse(raw) as {
      v?: number; camp?: unknown; muted?: unknown; speed?: unknown; forceLandscape?: unknown;
      progress?: Record<string, Partial<CampProgress>>;
    };
    if (data.v !== 1 && data.v !== 2) return save;
    const level = (n: number) => (data.v === 1 ? (V1_LEVELS[n] ?? 1) : n);

    if (CAMP_IDS.includes(data.camp as CampId)) save.camp = data.camp as CampId;
    save.muted = data.muted === true;
    save.speed = data.speed === 2 ? 2 : 1;
    save.forceLandscape = data.forceLandscape !== false;
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
