/** Shared, framework-free types for the game data and the simulation. */

export type CampId = 'gauche' | 'centre' | 'droite' | 'autres';

export const CAMP_IDS: readonly CampId[] = ['gauche', 'centre', 'droite', 'autres'];

export type ProjectileKind = 'bubble' | 'tract' | 'heart' | 'cat' | 'leaf' | 'cuffs';

export type SceneId = 'mairie' | 'salon' | 'lycee' | 'rue' | 'plateau' | 'sommet' | 'elysee' | 'elysee-nuit';

/**
 * What the crowd is after on a given night: one pile of it at the end of every row.
 * Each opponent who gets through carries a piece away (the five pieces are the lives).
 */
export type GoalId = 'parrainages' | 'pac' | 'portables' | 'caddie' | 'micros' | 'terroir' | 'urnes' | 'fiches' | 'fauteuil' | 'budget';

/** What a figure does once placed on the board. */
export type Ability =
  | { kind: 'generator'; amount: number; interval: number; firstDelay: number }
  | {
      kind: 'shooter';
      damage: number;
      interval: number;
      projectile: ProjectileKind;
      /** Projectile speed in cells per second. */
      speed: number;
      /** Shots per volley (default 1). */
      burst?: number;
      /** Lane offsets fired at simultaneously (default [0]). */
      lanes?: number[];
      /** Extra enemies a projectile passes through (default 0). */
      pierce?: number;
      slow?: { factor: number; duration: number };
      stun?: number;
    }
  | {
      kind: 'wall';
      /** Damage per second returned to whoever debates with it. */
      thorns?: number;
      /** Credibility per second restored to the eight neighbours. */
      healAura?: number;
      /** Credibility per second it restores to itself. */
      regen?: number;
      /** Identity check: periodically freezes whoever is in contact. */
      checkpoint?: { interval: number; stun: number };
      /** Zero tolerance: whoever walks within `range` cells in front of it slows down to `slow`. */
      zone?: { slow: number; range: number };
    }
  | {
      kind: 'bomb';
      fuse: number;
      damage: number;
      area: 'lane' | 'square';
      friendlyFire?: number;
      stun?: number;
      /** These opponents leave on the spot ("back to class!"). */
      sendHome?: string[];
      /** The toughest opponent in the lane loses this share of its credibility (half as much for a headliner). */
      toughest?: number;
    }
  | { kind: 'shout'; interval: number; damage: number; knockback: number; range: number; stun?: number }
  /** Speed camera: every `interval`, everyone in the lane in front of it is flashed (damage, then slowed). */
  | { kind: 'flash'; interval: number; damage: number; slow: { factor: number; duration: number } }
  /** Paramedics: every `interval`, the eight neighbours get `amount` credibility back. */
  | { kind: 'heal'; interval: number; amount: number }
  /** "Frexit": every `interval`, the frontmost opponent within `range` cells is sent back to the gate (a headliner only 2 cells). */
  | { kind: 'expel'; interval: number; range: number }
  /** Fire hose: puts out every fire in the lane and soaks everyone else. */
  | { kind: 'hose'; fuse: number; damage: number; knockback: number; slow: { factor: number; duration: number } };

/** Special behaviour of a marching opponent. */
export type Trait =
  | { kind: 'summon'; what: string; interval: number }
  | { kind: 'ranged'; range: number }
  | { kind: 'blast'; damage: number }
  | { kind: 'silence'; interval: number; duration: number; range: number }
  /** Burning bin: scorches every figure standing close to it. */
  | { kind: 'burn'; dps: number; radius: number }
  /** Motorist: fast until the tank is empty. */
  | { kind: 'fuel'; range: number; slowSpeed: number }
  /** Tariffs: every card costs more while this opponent is on the board. */
  | { kind: 'tariff'; factor: number }
  /** Tax inspector: withholds ballots at source for as long as he is on the board. */
  | { kind: 'tax'; interval: number; amount: number }
  /** Investigative reporter: follows the money. Walks past every figure except the money-makers,
   *  and a money-maker being questioned produces nothing until the interview is over. */
  | { kind: 'investigate' }
  /** Trade unionist: the figure he is debating with goes on strike and does nothing. */
  | { kind: 'picket' }
  /** Undecided voter: walks past everyone to go and vote; convinced on the way, he brings ballots. */
  | { kind: 'undecided'; reward: number }
  ;

/**
 * A headliner's special moves when they march against the player. Timed powers are
 * announced first (`warn` seconds with an angry face and a marker), then they land.
 */
export type Power =
  /** "La République, c'est moi !": every figure up to `range` cells ahead, in three lanes, loses its voice. */
  | { kind: 'roar'; interval: number; warn: number; range: number; duration: number }
  /** A hologram of the speaker holds a meeting in another lane. */
  | { kind: 'hologram'; interval: number; warn: number }
  /** "Je traverse la rue": steps into the next lane. */
  | { kind: 'cross'; interval: number; warn: number }
  /** Dissolution: every figure on the 3 × 3 squares ahead goes back to the voters (off the board, `refund` of its cost back, card ready). */
  | { kind: 'dissolve'; interval: number; warn: number; refund: number }
  /** Ippon: the figure in contact is thrown (a share of its credibility at once). */
  | { kind: 'ippon'; interval: number; warn: number; share: number }
  /** Network outage: every figure in three lanes freezes. */
  | { kind: 'lag'; interval: number; warn: number; duration: number }
  /** Appeal: back on her feet once, with this share of her credibility. */
  | { kind: 'appeal'; share: number }
  /** Last stand: below `below` of her credibility, faster and harder. */
  | { kind: 'enrage'; below: number; speed: number }
  /** Below `below` of his credibility, tariffs go up to `factor`. */
  | { kind: 'hike'; below: number; factor: number };

export type PowerKind = Power['kind'];

/** The four families shown on every card. */
export type Category = 'money' | 'attack' | 'effect' | 'defence';

export interface AttackerProfile {
  hp: number;
  /** Cells per second. */
  speed: number;
  /** Credibility removed per second from the figure it debates with. */
  dps: number;
  /** Cost in the wave budget. */
  threat: number;
  /** Poll points lost when it reaches the steps. */
  leak: number;
  trait?: Trait;
  /** 0 = fully pushed back / stunned, 1 = immune. */
  resist?: number;
  /** Headliners only: special moves. */
  powers?: Power[];
}

export interface UnitDef {
  id: string;
  /** 'neutre' = public-service reinforcements any camp can call. */
  camp: CampId | 'neutre';
  /** Unlock order inside the camp roster, 0-4. */
  slot: number;
  cost: number;
  hp: number;
  /** Seconds before the card can be played again. */
  recharge: number;
  ability: Ability;
  /** Profile used when this figure marches against the player (roster figures only). */
  attacker?: AttackerProfile;
  /** Headliners get a name plate and a health bar when they march. */
  boss?: boolean;
  /** Reinforcements: the night from which every camp can call them. */
  unlock?: number;
}

export interface EnemyDef extends AttackerProfile {
  id: string;
  /** Set when the enemy is a roster politician rather than an extra. */
  unitId?: string;
  camp?: CampId;
  boss?: boolean;
  /** Portrait used for a named guest who is not in any roster (e.g. a foreign leader). */
  portrait?: string;
  /** Put out instantly by the fire brigade. */
  fire?: boolean;
  /** A guest who only turns up against one camp (a real-life public stance, not a game bias). */
  onlyAgainst?: CampId;
  /** A hologram: drawn see-through, and gone at the first real argument. */
  ghost?: boolean;
}

export type UltimateId = 'greve' | 'dissolution' | 'trocadero' | 'censure';

/** News twists: a march against the pension reform, or a rival forcing a text through (49.3). */
export type TwistId = 'manif' | 'force';

/** Endless mode: every ten waves, a themed week changes who turns up. */
export type ThemeId = 'cnews' | 'zucman' | 'greve' | 'smic' | 'agri' | 'blocus';

export interface CampDef {
  id: CampId;
  color: string;
  /** Darker shade used for text on light backgrounds. */
  ink: string;
  ultimate: UltimateId;
  /** Roster in unlock order. */
  roster: string[];
}

export interface LevelDef {
  id: number;
  scene: SceneId;
  /** Active lanes (0-4, top to bottom). */
  lanes: number[];
  startResources: number;
  polls: number;
  waves: number;
  baseBudget: number;
  growth: number;
  /** Wave indexes announced as a rival rally (bigger budget). */
  bigWaves: number[];
  /** Extras allowed, with the first wave they may appear in. */
  pool: { id: string; weight: number; from: number }[];
  /** First wave in which lieutenants (non-boss headliners) may appear. */
  starsFrom: number;
  /** Rival heavyweights added to the final wave. */
  bosses: number;
  /** Named guests added to the final wave (ids from EXTRAS). */
  guests?: string[];
  firstWaveAt: number;
  waveGap: number;
  /** What the crowd is after tonight (drawn at the end of every row). */
  goal: GoalId;
  /** Number of roster slots available (3-6). */
  slots: number;
  /** Whether the public-service reinforcements can be called. */
  reinforcements: boolean;
  endless?: boolean;
  /** News twists that may happen once during the night (every so often in endless mode). */
  twists?: TwistId[];
  /** The debate: "petites phrases" drop on the board, to be sent back before they land. */
  punchlines?: { interval: number; life: number };
  /** Two players, one screen: no waves, an attacker with a budget, and a clock. */
  versus?: { duration: number };
}

/** The daily challenge's rule of the day (a duel taken from it carries it too). */
export const RULES = ['doubleVotes', 'noRemove', 'sale', 'tough', 'cheapMerge'] as const;
export type RuleId = (typeof RULES)[number];

/** Campaign difficulty, from very easy to extreme (the daily challenge, duels and head to head are always "normal"). */
export const DIFFICULTIES = ['veryEasy', 'easy', 'normal', 'hard', 'extreme'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];
