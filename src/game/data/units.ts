import type { CampDef, CampId, Category, EnemyDef, UnitDef } from './types';

/**
 * The cast. Every roster figure has a defender sheet (when the player fields
 * them) and an attacker profile (when they march against the player). Names,
 * titles, jokes and catchphrases live in src/i18n/game.ts; this file is numbers only.
 *
 * Five figures per camp, always in the same order: votes, attack, defence,
 * a one-shot "bomb", and the headliner, who marches as a boss with powers.
 */
export const UNITS: Record<string, UnitDef> = {
  // ---------------------------------------------------------------- Gauche
  glucksmann: {
    id: 'glucksmann', camp: 'gauche', slot: 0, cost: 50, hp: 90, recharge: 5,
    // Supporters gather on the public square: slowly, then all at once.
    ability: { kind: 'generator', amount: 50, interval: 15, firstDelay: 9 },
    attacker: { hp: 520, speed: 0.2, dps: 24, threat: 5, leak: 1, trait: { kind: 'summon', what: 'militant', interval: 9 } },
  },
  hollande: {
    id: 'hollande', camp: 'gauche', slot: 1, cost: 100, hp: 100, recharge: 5,
    // "Moi président...": anaphora fired three at a time.
    ability: { kind: 'shooter', damage: 8, interval: 1.55, burst: 3, projectile: 'bubble', speed: 7 },
    attacker: { hp: 560, speed: 0.19, dps: 26, threat: 5, leak: 1, trait: { kind: 'ranged', range: 2.4 } },
  },
  royal: {
    id: 'royal', camp: 'gauche', slot: 2, cost: 75, hp: 620, recharge: 14,
    // "Fraternité !": the neighbours get their strength back.
    ability: { kind: 'wall', healAura: 7 },
    attacker: { hp: 1150, speed: 0.15, dps: 30, threat: 6, leak: 1, resist: 0.4 },
  },
  ruffin: {
    id: 'ruffin', camp: 'gauche', slot: 3, cost: 150, hp: 120, recharge: 30,
    // Camera in hand: the report goes off like a bomb.
    ability: { kind: 'bomb', fuse: 1.1, damage: 650, area: 'square' },
    attacker: { hp: 500, speed: 0.27, dps: 24, threat: 6, leak: 1, trait: { kind: 'blast', damage: 260 } },
  },
  melenchon: {
    id: 'melenchon', camp: 'gauche', slot: 4, cost: 225, hp: 170, recharge: 18, boss: true,
    // A roar that pushes the whole lane back.
    ability: { kind: 'shout', interval: 7, damage: 70, knockback: 1, range: 6 },
    attacker: {
      hp: 2300, speed: 0.15, dps: 42, threat: 16, leak: 2, resist: 0.6,
      powers: [
        { kind: 'roar', interval: 11, warn: 1, range: 3.2, duration: 2.5 },
        { kind: 'hologram', interval: 16, warn: 1.2 },
      ],
    },
  },

  // ---------------------------------------------------------------- Centre
  bayrou: {
    id: 'bayrou', camp: 'centre', slot: 0, cost: 50, hp: 110, recharge: 5,
    // Steady as a metronome: a candidate since 2002.
    ability: { kind: 'generator', amount: 25, interval: 7.5, firstDelay: 5 },
    attacker: { hp: 540, speed: 0.19, dps: 24, threat: 5, leak: 1, trait: { kind: 'summon', what: 'militant', interval: 9 } },
  },
  attal: {
    id: 'attal', camp: 'centre', slot: 1, cost: 100, hp: 90, recharge: 5,
    // Top of the class: small shots, very fast.
    ability: { kind: 'shooter', damage: 7, interval: 0.46, projectile: 'tract', speed: 9 },
    attacker: { hp: 480, speed: 0.26, dps: 24, threat: 5, leak: 1, trait: { kind: 'ranged', range: 2.4 } },
  },
  philippe: {
    id: 'philippe', camp: 'centre', slot: 2, cost: 100, hp: 560, recharge: 14,
    // The boxer: takes the hits and gives them back.
    ability: { kind: 'wall', thorns: 20 },
    attacker: { hp: 1200, speed: 0.15, dps: 34, threat: 6, leak: 1, resist: 0.4 },
  },
  borne: {
    id: 'borne', camp: 'centre', slot: 3, cost: 150, hp: 120, recharge: 34,
    // 49.3: the whole lane is adopted without a vote.
    ability: { kind: 'bomb', fuse: 1.1, damage: 900, area: 'lane' },
    attacker: { hp: 520, speed: 0.25, dps: 24, threat: 6, leak: 1, trait: { kind: 'blast', damage: 260 } },
  },
  macron: {
    id: 'macron', camp: 'centre', slot: 4, cost: 275, hp: 140, recharge: 18, boss: true,
    // "At the same time": the lane above, the lane below and his own, simultaneously.
    ability: { kind: 'shooter', damage: 19, interval: 1.4, projectile: 'bubble', speed: 7.5, lanes: [-1, 0, 1] },
    attacker: {
      hp: 2200, speed: 0.16, dps: 44, threat: 16, leak: 2, resist: 0.6, trait: { kind: 'ranged', range: 2 },
      powers: [
        { kind: 'cross', interval: 10, warn: 0.9 },
        { kind: 'dissolve', interval: 16, warn: 1.6, refund: 0.5 },
      ],
    },
  },

  // ---------------------------------------------------------------- Droite
  sarkozy: {
    id: 'sarkozy', camp: 'droite', slot: 0, cost: 75, hp: 90, recharge: 6,
    // Work more to earn more: pricier, but it pays.
    ability: { kind: 'generator', amount: 40, interval: 8, firstDelay: 5 },
    attacker: { hp: 560, speed: 0.22, dps: 26, threat: 5, leak: 1, trait: { kind: 'summon', what: 'militant', interval: 8 } },
  },
  bardella: {
    id: 'bardella', camp: 'droite', slot: 1, cost: 100, hp: 100, recharge: 5,
    // One selfie, one like.
    ability: { kind: 'shooter', damage: 20, interval: 1.35, projectile: 'heart', speed: 7.5 },
    attacker: { hp: 520, speed: 0.24, dps: 24, threat: 5, leak: 1, trait: { kind: 'ranged', range: 2.4 } },
  },
  retailleau: {
    id: 'retailleau', camp: 'droite', slot: 2, cost: 100, hp: 760, recharge: 16,
    // "L'ordre, l'ordre, l'ordre": whoever comes near slows right down.
    ability: { kind: 'wall', zone: { slow: 0.6, range: 1.6 } },
    attacker: { hp: 1300, speed: 0.14, dps: 28, threat: 6, leak: 1, resist: 0.4 },
  },
  zemmour: {
    id: 'zemmour', camp: 'droite', slot: 3, cost: 150, hp: 120, recharge: 30,
    // The controversy also singes his own side.
    ability: { kind: 'bomb', fuse: 1.1, damage: 760, area: 'square', friendlyFire: 40 },
    attacker: { hp: 500, speed: 0.27, dps: 24, threat: 6, leak: 1, trait: { kind: 'blast', damage: 260 } },
  },
  lepen: {
    id: 'lepen', camp: 'droite', slot: 4, cost: 225, hp: 150, recharge: 18, boss: true,
    // Certified cat breeder: each cat runs through three opponents.
    ability: { kind: 'shooter', damage: 30, interval: 1.9, projectile: 'cat', speed: 5.5, pierce: 2 },
    attacker: {
      hp: 2250, speed: 0.15, dps: 42, threat: 16, leak: 2, resist: 0.6, trait: { kind: 'summon', what: 'cat', interval: 5.5 },
      powers: [
        { kind: 'tag', limit: 3.2, back: 2.5 },
        { kind: 'appeal', share: 0.4 },
      ],
    },
  },

  // ---------------------------------------------------------------- Les Autres
  bmacron: {
    id: 'bmacron', camp: 'autres', slot: 0, cost: 50, hp: 90, recharge: 5,
    // Yellow coins: small change, but it never stops coming.
    ability: { kind: 'generator', amount: 15, interval: 4.6, firstDelay: 4 },
    attacker: { hp: 520, speed: 0.2, dps: 22, threat: 5, leak: 1, trait: { kind: 'silence', interval: 8, duration: 2, range: 2.6 } },
  },
  villepin: {
    id: 'villepin', camp: 'autres', slot: 1, cost: 100, hp: 100, recharge: 5,
    // The UN speech: rare, long, and it lands.
    ability: { kind: 'shooter', damage: 34, interval: 2.3, projectile: 'bubble', speed: 6 },
    attacker: { hp: 540, speed: 0.2, dps: 26, threat: 5, leak: 1, trait: { kind: 'ranged', range: 2.6 } },
  },
  lassalle: {
    id: 'lassalle', camp: 'autres', slot: 2, cost: 100, hp: 600, recharge: 14,
    // The shepherd: weathered, and he recovers on his own.
    ability: { kind: 'wall', regen: 12 },
    attacker: { hp: 1250, speed: 0.15, dps: 30, threat: 6, leak: 1, resist: 0.4 },
  },
  poutou: {
    id: 'poutou', camp: 'autres', slot: 3, cost: 150, hp: 120, recharge: 30,
    // The debate punchline that everybody remembers.
    ability: { kind: 'bomb', fuse: 1.1, damage: 650, area: 'square' },
    attacker: { hp: 500, speed: 0.27, dps: 24, threat: 6, leak: 1, trait: { kind: 'blast', damage: 260 } },
  },
  riner: {
    id: 'riner', camp: 'autres', slot: 4, cost: 250, hp: 560, recharge: 20, boss: true,
    // Ippon: whoever comes within reach flies back across the mat.
    ability: { kind: 'shout', interval: 3.2, damage: 110, knockback: 2.6, range: 1.15 },
    attacker: {
      hp: 2500, speed: 0.15, dps: 46, threat: 16, leak: 2, resist: 0.7,
      powers: [
        { kind: 'ippon', interval: 5, warn: 0.7, share: 0.55 },
        { kind: 'enrage', below: 0.5, speed: 1.5 },
      ],
    },
  },

  // ---------------------------------------------------------------- Reinforcements (any camp)
  crs: {
    id: 'crs', camp: 'neutre', slot: 6, cost: 100, hp: 520, recharge: 14,
    // Holds the line and checks papers: whoever is in contact stands still for a moment.
    ability: { kind: 'wall', checkpoint: { interval: 5, stun: 2.2 } },
  },
  pompiers: {
    id: 'pompiers', camp: 'neutre', slot: 7, cost: 75, hp: 200, recharge: 22,
    // Fire hose: every fire in the lane is out, everyone else is soaked and pushed back.
    ability: { kind: 'hose', fuse: 0.7, damage: 40, knockback: 1.2, slow: { factor: 0.5, duration: 4 } },
  },
};

/** Public-service reinforcements, available to every camp once a level allows them. */
export const REINFORCEMENTS = ['crs', 'pompiers'];

export const CAMPS: Record<CampId, CampDef> = {
  gauche: {
    id: 'gauche', color: '#e5383b', ink: '#b0191f', ultimate: 'greve',
    roster: ['glucksmann', 'hollande', 'royal', 'ruffin', 'melenchon'],
  },
  centre: {
    id: 'centre', color: '#f6aa1c', ink: '#8a5300', ultimate: 'dissolution',
    roster: ['bayrou', 'attal', 'philippe', 'borne', 'macron'],
  },
  droite: {
    id: 'droite', color: '#2f5fe0', ink: '#1c3fa8', ultimate: 'trocadero',
    roster: ['sarkozy', 'bardella', 'retailleau', 'zemmour', 'lepen'],
  },
  autres: {
    id: 'autres', color: '#2e9e5b', ink: '#17653a', ultimate: 'censure',
    roster: ['bmacron', 'villepin', 'lassalle', 'poutou', 'riner'],
  },
};

/**
 * Extras: anonymous opponents (every kind has one look, whoever sends it), street
 * events that belong to nobody, and named guests.
 */
export const EXTRAS: Record<string, EnemyDef> = {
  militant: { id: 'militant', hp: 190, speed: 0.21, dps: 22, threat: 1, leak: 1 },
  placard: { id: 'placard', hp: 430, speed: 0.19, dps: 22, threat: 2, leak: 1 },
  pundit: { id: 'pundit', hp: 150, speed: 0.42, dps: 18, threat: 2, leak: 1 },
  bus: { id: 'bus', hp: 1350, speed: 0.13, dps: 70, threat: 7, leak: 2, resist: 1 },
  cat: { id: 'cat', hp: 55, speed: 0.6, dps: 14, threat: 1, leak: 1 },
  // The street
  lyceen: { id: 'lyceen', hp: 110, speed: 0.5, dps: 14, threat: 1, leak: 1 },
  // An electric scooter: weaves through traffic at full speed, and folds at the first push.
  trottinette: { id: 'trottinette', hp: 120, speed: 0.78, dps: 14, threat: 2, leak: 1 },
  poubelle: { id: 'poubelle', hp: 300, speed: 0.17, dps: 0, threat: 3, leak: 1, fire: true, resist: 0.5, trait: { kind: 'burn', dps: 16, radius: 1.15 } },
  auto: { id: 'auto', hp: 460, speed: 0.6, dps: 40, threat: 4, leak: 1, resist: 0.5, trait: { kind: 'fuel', range: 4.6, slowSpeed: 0.09 } },
  // Yellow vests: tougher than an activist, and they do not leave the roundabout easily.
  gilet: { id: 'gilet', hp: 260, speed: 0.2, dps: 24, threat: 2, leak: 1, resist: 0.3 },
  // The farmers: pitchforks on foot, and tractors whose engines drown out every speech.
  agriculteur: { id: 'agriculteur', hp: 330, speed: 0.2, dps: 30, threat: 2, leak: 1 },
  tracteur: { id: 'tracteur', hp: 1100, speed: 0.14, dps: 60, threat: 6, leak: 2, resist: 1, trait: { kind: 'silence', interval: 6, duration: 1.6, range: 2.4 } },
  // The star of the Agricultural Show: slow, enormous, and not one for being pushed about.
  vache: { id: 'vache', hp: 950, speed: 0.12, dps: 22, threat: 5, leak: 1, resist: 0.8 },
  // A union marcher (no union in particular): whoever he debates with downs tools.
  syndicat: { id: 'syndicat', hp: 320, speed: 0.2, dps: 20, threat: 2, leak: 1, resist: 0.3, trait: { kind: 'picket' } },
  // A minimum-wage worker everybody courts: he crosses the courtyard to vote, debates with no one,
  // and is worth ballots to whoever convinces him on the way.
  smicard: { id: 'smicard', hp: 240, speed: 0.24, dps: 0, threat: 2, leak: 1, trait: { kind: 'undecided', reward: 15 } },
  // The tax office: withholding at source.
  impots: { id: 'impots', hp: 380, speed: 0.17, dps: 20, threat: 3, leak: 1, trait: { kind: 'tax', interval: 4, amount: 10 } },
  // A CAC 40 boss (nobody in particular): slow, well padded, and he brings his own pundits.
  patron: { id: 'patron', hp: 700, speed: 0.16, dps: 26, threat: 5, leak: 1, resist: 0.3, trait: { kind: 'summon', what: 'pundit', interval: 9 } },
  // A rolling news channel's broadcast van: slow, unmoved by roaring, and a fresh pundit for every debate.
  cnews: { id: 'cnews', hp: 1000, speed: 0.13, dps: 30, threat: 7, leak: 2, resist: 1, trait: { kind: 'summon', what: 'pundit', interval: 4.5 } },
  // A hologram of a certain tribune (he held meetings that way in 2017): see-through, and it never stops talking.
  hologram: { id: 'hologram', portrait: 'melenchon', ghost: true, hp: 320, speed: 0.17, dps: 12, threat: 3, leak: 1, resist: 0.6 },
  // The guests
  trump: {
    id: 'trump', portrait: 'trump', boss: true, hp: 2600, speed: 0.14, dps: 40, threat: 16, leak: 2, resist: 0.6, trait: { kind: 'tariff', factor: 1.25 },
    powers: [{ kind: 'hike', below: 0.5, factor: 1.5 }],
  },
  // The founder of an internet provider, who once turned up at a supermarket car park for a "1v1"
  // with a gamer who blamed him for his lag: when he is around, the network goes down.
  niel: {
    id: 'niel', portrait: 'niel', boss: true, hp: 1150, speed: 0.19, dps: 22, threat: 9, leak: 1, resist: 0.4,
    powers: [{ kind: 'lag', interval: 9, warn: 1.2, duration: 2.2 }],
  },
  // The video maker publicly called to vote against the far right in 2024: he only shows up
  // against the Right, and his story brings his followers along.
  squeezie: { id: 'squeezie', portrait: 'squeezie', onlyAgainst: 'droite', hp: 900, speed: 0.18, dps: 20, threat: 8, leak: 1, resist: 0.3, trait: { kind: 'summon', what: 'lyceen', interval: 5 } },
  // The news explainer interviews everybody: one question and the nearest figures are lost for words.
  hugo: { id: 'hugo', portrait: 'hugo', hp: 850, speed: 0.19, dps: 18, threat: 8, leak: 1, resist: 0.3, trait: { kind: 'silence', interval: 5, duration: 2, range: 3 } },
  // The investigative reporter questions every camp the same way: she follows the money, walks past
  // everyone else and keeps the money-makers busy until she gets an answer.
  lucet: { id: 'lucet', portrait: 'lucet', hp: 800, speed: 0.21, dps: 20, threat: 8, leak: 1, resist: 0.3, trait: { kind: 'investigate' } },
};

/** Named guests, in the order the characters page lists them. */
export const GUESTS = ['trump', 'niel', 'hugo', 'lucet', 'squeezie'];

/** Extras drawn wider than a puppet. */
export const VEHICLES = ['bus', 'auto', 'tracteur', 'cnews', 'vache'];

/** Which of the four families a card belongs to: votes, attack, effect or defence. */
export function categoryOf(def: UnitDef): Category {
  const ability = def.ability;
  switch (ability.kind) {
    case 'generator':
      return 'money';
    case 'wall':
      return 'defence';
    case 'hose':
      return 'effect';
    case 'shooter':
      return ability.slow || ability.stun ? 'effect' : 'attack';
    case 'shout':
      // A short-range thrower holds a square; a long-range roar is an attack.
      return ability.range < 2 ? 'defence' : 'attack';
    default:
      return 'attack';
  }
}

export function unitsOf(camp: CampId): UnitDef[] {
  return CAMPS[camp].roster.map((id) => UNITS[id]);
}

export function rivalsOf(camp: CampId): CampId[] {
  return (Object.keys(CAMPS) as CampId[]).filter((c) => c !== camp);
}

export function campOf(unitId: string): CampId | 'neutre' {
  return UNITS[unitId].camp;
}

/** Enemy definition for a roster politician marching against the player. */
export function starEnemy(unitId: string): EnemyDef {
  const u = UNITS[unitId];
  if (!u.attacker || u.camp === 'neutre') throw new Error(`${unitId} cannot march`);
  return { ...u.attacker, id: `star:${u.id}`, unitId: u.id, camp: u.camp, boss: u.boss };
}

export function enemyDef(id: string): EnemyDef {
  if (id.startsWith('star:')) return starEnemy(id.slice(5));
  const def = EXTRAS[id];
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}

/** The figure whose photo an enemy wears, if any (a roster politician or a named guest). */
export function figureOf(def: EnemyDef): string | undefined {
  return def.unitId ?? def.portrait;
}
