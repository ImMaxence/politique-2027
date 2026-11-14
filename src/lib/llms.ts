/**
 * Builds /llms.txt and /llms-full.txt: plain-Markdown descriptions of the site
 * for AI assistants and answer engines (https://llmstxt.org). Generated from the
 * same data as the pages, so they cannot drift from what visitors see.
 */
import { SITE } from '../config/site';
import { LEVELS } from '../game/data/levels';
import { CAMP_IDS } from '../game/data/types';
import { CAMPS, EXTRAS, GUESTS, REINFORCEMENTS, UNITS, categoryOf } from '../game/data/units';
import { GAME_STRINGS, type Lang } from '../i18n/game';
import { absolute, path } from '../i18n/routes';
import { SITE_STRINGS } from '../i18n/site';

const SUMMARY =
  'Politique 2027 is a free, open-source satirical lane-defense (tower defense) browser game about the 2027 French presidential race. ' +
  'The player picks one of four camps — the Left, the Centre, the Right or "the Others" — and places caricatures of French public figures (real photos of their heads, freely licensed, on drawn cardboard bodies), each with a power and catchphrases based on their famous lines. ' +
  'Every night has a theme and a goal the crowd wants to carry off: farmers after the farm subsidies at the Agricultural Show, pupils after their confiscated phones during a school blockade, the 17 October 2026 protests against the cost of living after a full trolley, pundits after the speaking time, everybody after the ballot boxes. ' +
  'Each camp\'s headliner turns up as a boss against the others, with powers drawn from French political memes: Marine Le Pen\'s appeal to the Court of Cassation, Emmanuel Macron crossing the street and dissolving, Jean-Luc Mélenchon\'s hologram, Teddy Riner\'s ippon. Five guests join in: Donald Trump and his tariffs, Xavier Niel taking the network down (a nod to his "1v1" outside a Lidl), HugoDécrypte, Élise Lucet and Squeezie. ' +
  'It is available in French and English, needs no account, has no ads, cookies or trackers, and is playable with a mouse, touch, keyboard or screen reader.';

function links(): string {
  const page = (lang: Lang, route: Parameters<typeof path>[1], note: string) =>
    `- [${SITE_STRINGS[lang].meta[route].title}](${absolute(path(lang, route))}): ${note}`;
  return [
    '## Pages (English)',
    page('en', 'home', 'what the game is, the four camps, how to play, FAQ'),
    page('en', 'play', 'the game itself, plus controls and rules'),
    page('en', 'characters', 'all 20 characters and 5 guests with powers, boss powers, catchphrases and stats (each also has a page of its own)'),
    '',
    '## Pages (français)',
    page('fr', 'home', 'présentation du jeu, des quatre camps, règles et FAQ'),
    page('fr', 'play', 'le jeu, les commandes et les règles'),
    page('fr', 'characters', 'les 20 personnages et 5 invités, leurs pouvoirs, leurs pouvoirs de boss, leurs répliques et leurs statistiques (chacun a aussi sa page)'),
    '',
    '## Legal',
    page('en', 'legal', 'publisher, hosting, satire framework, licence'),
    page('en', 'privacy', 'no cookies, no analytics, local storage only'),
    page('en', 'terms', 'terms of use'),
    page('en', 'accessibility', 'accessibility statement (RGAA 4.1.2 / WCAG 2.2 AA, partially compliant)'),
    '',
    '## Optional',
    `- [Source code](${SITE.repo}): MIT-licensed repository (Astro, TypeScript, Canvas)`,
    `- [Full description](${SITE.url}/llms-full.txt): every character, level and rule in one file`,
    `- [Author](${SITE.author.url}): ${SITE.author.name}, full-stack developer`,
  ].join('\n');
}

const FACTS = [
  '## Key facts',
  `- Name: ${SITE.name}`,
  '- Type: browser game, single player, lane defense / tower defense, political satire',
  `- URL: ${SITE.url}`,
  '- Languages: French (default) and English',
  '- Price: free. No sign-up, no ads, no in-app purchases',
  '- Platforms: any recent desktop or mobile browser; nothing to install. On phones the match is played in landscape',
  '- Content: 4 camps, 20 playable characters (each camp\'s headliner is also a boss with powers), 2 shared reinforcements, 5 guests, 9 themed campaign nights (including the 17 October 2026 protests and a TV debate with soundbites to send back), 1 endless mode with themed weeks',
  '- Card types: Votes, Attack, Effect, Defence',
  '- Modes: a nine-night campaign (normal or hard), the endless "Cohabitation" mode, a daily challenge (the same match for everybody each day), a turn-based duel shared by link, and a two-player mode on one screen (defender with the mouse or touch, attacker with the keyboard or side buttons)',
  '- Extras: 15 achievements, background music, a slow speed for accessibility, a one-key board summary for screen readers',
  '- Installable on the home screen and playable offline; results can be shared as a picture',
  `- Author: ${SITE.author.name} (${SITE.author.url})`,
  `- Licence: MIT (code, texts and drawings); the photo heads keep their own free licences (credited in the legal notice). Source: ${SITE.repo}`,
  `- Version: ${SITE.version} (updated ${SITE.updated})`,
  '- Privacy: no cookies, no analytics, no data sent; progress is saved in the browser (localStorage)',
  '- Nature: satire and parody. Characters are caricatures of public figures (obvious photomontages: real photos of their heads on drawn bodies, never retouched); powers and situations are made up. Some speech bubbles are famous public catchphrases, the others are invented. Not affiliated with any party, candidate or institution; not a poll and not a call to vote.',
].join('\n');

export function llmsTxt(): string {
  return [`# ${SITE.name}`, '', `> ${SUMMARY}`, '', FACTS, '', links(), ''].join('\n');
}

export function llmsFullTxt(): string {
  const g = GAME_STRINGS.en;
  const s = SITE_STRINGS.en;
  const out: string[] = [`# ${SITE.name} — full description`, '', `> ${SUMMARY}`, '', FACTS, ''];
  const sheet = (id: string) => {
    const unit = UNITS[id];
    const text = g.figures[id];
    return (
      `- **${text.name}** (${text.party}), "${text.title}". Power — ${text.power}: ${text.desc} ` +
      `Says: ${text.lines.map((line) => `"${line}"`).join(' / ')}. ` +
      `${text.boss ? `As a boss: ${text.boss} ` : ''}Type: ${g.types[categoryOf(unit)]}. Cost: ${unit.cost} votes. Credibility: ${unit.hp}. Recharge: ${unit.recharge} s.`
    );
  };

  out.push('## How the game works', '');
  out.push(
    'A match takes place on a grid of 5 lanes and 9 columns, drawn as a paper puppet theatre. ' +
      'Opponents enter on the right and walk left towards the night\'s goal, one piece of which stands at the end of every row.',
    '',
    ...s.play.rules.map((rule) => `- ${rule}`),
    '- Ballots ("bulletins") are the currency.',
    '- "Credibility" is a figure\'s health. Nobody is hurt: a figure that runs out of credibility "resigns" and leaves the stage in a burst of confetti.',
    '- Each camp has a "campaign trump card" that charges over time (about 75 seconds).',
    '- "Remove" takes a placed figure off the field and refunds 25% of its cost.',
    '- Figures speak: speech bubbles show their catchphrases during the match.',
    '',
  );

  out.push('## Controls', '');
  out.push(...s.play.mouse.map((line) => `- ${line}`));
  out.push(...s.play.keys.map(([key, action]) => `- ${key}: ${action}`), '');

  out.push('## Campaign', '');
  for (const level of LEVELS) {
    const text = g.levels[level.id];
    out.push(`- Level ${level.id} — ${text.name} (${text.date}): ${text.blurb} Goal: ${g.goals[level.goal].name}. ${level.waves} waves, ${level.lanes.length} lanes.`);
  }
  out.push(`- Endless mode — ${g.levels[0].name}: ${g.levels[0].blurb} Unlocked by finishing level ${LEVELS.length}.`, '');

  out.push('## The four camps and their characters', '');
  for (const camp of CAMP_IDS) {
    const ultimate = g.ultimates[CAMPS[camp].ultimate];
    out.push(`### ${g.camps[camp].name}`, '', `Motto: "${g.camps[camp].motto}"`, `Campaign trump card — ${ultimate.name}: ${ultimate.desc}`, '');
    for (const id of CAMPS[camp].roster) out.push(sheet(id));
    out.push('');
  }

  out.push('### Reinforcements (available to every camp)', '');
  for (const id of REINFORCEMENTS) out.push(sheet(id));
  out.push('');

  out.push('### The guests', '');
  for (const id of GUESTS) {
    const guest = g.figures[id];
    out.push(`- **${guest.name}**, "${guest.title}". ${guest.power}: ${guest.desc}${guest.boss ? ` ${guest.boss}` : ''} Says: ${guest.lines.map((l) => `"${l}"`).join(' / ')}.`);
  }
  out.push('');

  out.push('### Extras (anonymous opponents and street events)', '');
  for (const kind of Object.keys(EXTRAS)) {
    if (EXTRAS[kind].portrait) continue;
    out.push(`- **${g.extras[kind]}**: ${s.characters.extras[kind]}`);
  }
  out.push('');

  out.push('## Frequently asked questions', '');
  for (const item of s.home.faq) out.push(`### ${item.q}`, '', item.a, '');

  out.push('## Questions fréquentes (français)', '');
  for (const item of SITE_STRINGS.fr.home.faq) out.push(`### ${item.q}`, '', item.a, '');

  out.push(links(), '');
  return out.join('\n');
}
