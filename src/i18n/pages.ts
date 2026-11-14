import type { Lang } from './game';

/** Copy of the per-figure and per-night pages, in French and English. */
export interface PageStrings {
  figure: {
    metaTitle: string;
    metaDescription: string;
    guest: string;
    boss: string;
    photo: string;
    photoNote: string;
    unlocked: string;
    guestOf: string;
    onlyAgainst: string;
    stats: string;
    cost: string;
    credibility: string;
    recharge: string;
    seconds: string;
    lines: string;
    camp: string;
    trump: string;
    others: string;
    play: string;
    satire: string;
    legal: string;
  };
  night: {
    metaTitle: string;
    metaDescription: string;
    lanes: string;
    waves: string;
    endless: string;
    cast: string;
    guests: string;
    play: string;
    all: string;
    sceneAlt: string;
    listTitle: string;
    listLead: string;
  };
}

const fr: PageStrings = {
  figure: {
    metaTitle: '{name}, « {title} » — Politique 2027',
    metaDescription: '{name} dans Politique 2027, le jeu satirique de la présidentielle : {power}. {desc}',
    guest: 'Invité',
    boss: 'Boss de fin de soirée',
    photo: 'Photo :',
    photoNote: '(Wikimedia Commons, recadrée et détourée)',
    unlocked: 'Jouable dès la soirée « {night} »',
    guestOf: 'Apparaît lors de : {nights}',
    onlyAgainst: 'seulement face à {camp}',
    stats: 'En jeu',
    cost: 'Coût',
    credibility: 'Crédibilité',
    recharge: 'Recharge',
    seconds: 's',
    lines: 'Ses répliques',
    camp: 'Camp',
    trump: 'Atout du camp',
    others: 'Les autres figures',
    play: 'Jouer avec {camp}',
    satire: 'Caricature satirique d’une personnalité publique : le pouvoir et la plupart des répliques sont inventés pour rire',
    legal: 'Satire et mentions légales',
  },
  night: {
    metaTitle: '{date} · {name} — Politique 2027',
    metaDescription: '{name}, une soirée de Politique 2027, le jeu satirique de la présidentielle : {blurb}',
    lanes: '{n} couloirs',
    waves: '{n} vagues',
    endless: 'Vagues sans fin',
    cast: 'Au programme',
    guests: 'Invités',
    play: 'Jouer cette soirée',
    all: 'Toutes les soirées',
    sceneAlt: 'La soirée « {name} » en cours de partie',
    listTitle: 'Les soirées de la campagne',
    listLead: 'Neuf soirées à thème, de la chasse aux parrainages au second tour en passant par le 17 octobre, puis la Cohabitation sans fin',
  },
};

const en: PageStrings = {
  figure: {
    metaTitle: '{name}, "{title}" — Politique 2027',
    metaDescription: '{name} in Politique 2027, the satirical French election game: {power}. {desc}',
    guest: 'Guest',
    boss: 'End-of-night boss',
    photo: 'Photo:',
    photoNote: '(Wikimedia Commons, cropped and cut out)',
    unlocked: 'Playable from the night "{night}"',
    guestOf: 'Turns up on: {nights}',
    onlyAgainst: 'only against {camp}',
    stats: 'In the game',
    cost: 'Cost',
    credibility: 'Credibility',
    recharge: 'Recharge',
    seconds: 's',
    lines: 'Catchphrases',
    camp: 'Camp',
    trump: "Camp's trump card",
    others: 'The other figures',
    play: 'Play with {camp}',
    satire: 'A satirical caricature of a public figure: the power and most of the lines are made up for laughs',
    legal: 'Satire and legal notice',
  },
  night: {
    metaTitle: '{date} · {name} — Politique 2027',
    metaDescription: '{name}, a night of Politique 2027, the satirical French election game: {blurb}',
    lanes: '{n} lanes',
    waves: '{n} waves',
    endless: 'Endless waves',
    cast: 'On the bill',
    guests: 'Guests',
    play: 'Play this night',
    all: 'Every night',
    sceneAlt: 'The night "{name}" during a match',
    listTitle: 'The campaign nights',
    listLead: 'Nine themed nights, from the hunt for endorsements to the run-off by way of 17 October, then the endless Cohabitation',
  },
};

export const PAGE_STRINGS: Record<Lang, PageStrings> = { fr, en };
