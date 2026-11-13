/** Shared, framework-free types for the game data and the simulation. */

export type CampId = 'gauche' | 'centre' | 'droite' | 'autres';

export const CAMP_IDS: readonly CampId[] = ['gauche', 'centre', 'droite', 'autres'];

export type ProjectileKind = 'bubble' | 'tract' | 'heart' | 'ice' | 'cat' | 'order' | 'word';

export type SceneId = 'mairie' | 'salon' | 'rue' | 'plateau' | 'sommet' | 'elysee' | 'elysee-nuit';

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
      /** Insurance: the eight neighbours take this share less damage (0-1). */
      shield?: number;
    }
  | { kind: 'bomb'; fuse: number; damage: number; area: 'lane' | 'square'; friendlyFire?: number; stun?: number }
  | { kind: 'shout'; interval: number; damage: number; knockback: number; range: number }
  | { kind: 'aura'; slow: number; range: number; dps: number }
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
  /** Tax inspector: withholds endorsements at source for as long as he is on the board. */
  | { kind: 'tax'; interval: number; amount: number }
  /** Investigative reporter: follows the money. Walks past every figure except the money-makers,
   *  and a money-maker being questioned produces nothing until the interview is over. */
  | { kind: 'investigate' }
  /** Trade unionist: the figure he is debating with goes on strike and does nothing. */
  | { kind: 'picket' }
  /** Undecided voter: walks past everyone to go and vote; convinced on the way, he brings endorsements. */
  | { kind: 'undecided'; reward: number }
  /** Red carpet: every opponent walking behind him in his lane moves this much faster. */
  | { kind: 'carpet'; factor: number };

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
}

export interface UnitDef {
  id: string;
  /** 'neutre' = public-service reinforcements any camp can call. */
  camp: CampId | 'neutre';
  /** Unlock order inside the camp roster, 0-5. */
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
}

export type UltimateId = 'greve' | 'dissolution' | 'trocadero' | 'censure';

/** News twists: a march against the pension reform, or a rival forcing a text through (49.3). */
export type TwistId = 'manif' | 'force';

/** Endless mode: every ten waves, a themed week changes who turns up. */
export type ThemeId = 'cnews' | 'zucman' | 'greve' | 'smic' | 'agri';

export interface CampDef {
  id: CampId;
  color: string;
  /** Darker shade used for text on light backgrounds. */
  ink: string;
  ultimate: UltimateId;
  /** A substitute the player may field instead of the roster figure in the same slot. */
  bench: string;
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
