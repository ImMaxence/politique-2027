/**
 * Paper puppets, generated as SVG strings.
 *
 * One drawing routine serves three consumers: the site (inlined in the HTML),
 * the game canvas (rasterised once per sprite) and the asset scripts (social
 * card, README art). Bodies and anonymous extras are original artwork built
 * from primitives.
 *
 * Every named figure has the same body — a dark suit on a stick — and a real
 * photo of their head (freely licensed, cut out by scripts/build-heads.ts; the
 * credits are in the legal notice). The colour of the tie is the family of the
 * card: yellow for votes, red for attack, purple for effect, blue for defence.
 * Guests, who are never played, come without a tie.
 */
import { HEAD_FILES, PHOTOS, type Expression } from '../data/photos';
import type { Category } from '../data/types';
import { EXTRAS, GUESTS, REINFORCEMENTS, UNITS, categoryOf } from '../data/units';

export const INK = '#17203f';
const PAPER = '#fffdf6';
const WOOD = '#c9995a';
const WHITE = '#ffffff';
const GOLD = '#ffd23f';

const s = (width = 2.6) => `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
const thin = (color: string, width = 2) => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

// ───────────────────────────── named figures ─────────────────────────────

/** Tie colours: the four card families, as on the cards' labels. */
export const ROLE_TIE: Record<Category, string> = { money: '#ffd23f', attack: '#e5383b', effect: '#9a7be0', defence: '#3f7be8' };
const JACKET = '#2b3147';
const LAPEL = '#1f2436';

/** Every named figure: the four line-ups and the guests. */
const FIGURES = new Set([...Object.values(UNITS).filter((u) => u.camp !== 'neutre').map((u) => u.id), ...GUESTS]);

/** Where a photo head sits on a puppet (viewBox units): the face is about 66 units wide, chin on the collar. Same ratio as the cut-outs of scripts/build-heads.ts (360 × 440). */
export const HEAD_BOX = { x: 8, y: -16, w: 104, h: 127.1 };

/** The suit: jacket, shirt and, for a playable figure, a tie in the colour of its card family. */
function suit(id: string): string {
  const unit = UNITS[id];
  const tie = unit && unit.camp !== 'neutre' ? ROLE_TIE[categoryOf(unit)] : null;
  return `<path d="M20 134c0-26 13-39 30-41h20c17 2 30 15 30 41z" fill="${JACKET}" ${s()}/>
    <path d="M47 92l13 26 13-26z" fill="${WHITE}" ${s(2.2)}/>
    <path d="M47 92l13 26-10 6-9-22z" fill="${LAPEL}" ${s(2.2)}/>
    <path d="M73 92l-13 26 10 6 9-22z" fill="${LAPEL}" ${s(2.2)}/>
    ${tie
      ? `<path d="M55 96h10l-1.500 7h-7z" fill="${tie}" ${s(2)}/><path d="M56.500 103h7l4 23-7.500 8-7.500-8z" fill="${tie}" ${s(2)}/>`
      : `<path d="M52 93l8 10 8-10" fill="none" ${s(2)}/>`}`;
}

function figure(id: string, photo: string | null): string {
  const b = HEAD_BOX;
  const head = photo
    ? `<image href="${photo}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" preserveAspectRatio="none"/>`
    : // No photo at hand (offline, first visit): a plain head stands in.
      `<ellipse cx="60" cy="50" rx="28" ry="33" fill="#d8c3ab" ${s()}/>`;
  return `<rect x="56" y="126" width="8" height="24" rx="2" fill="${WOOD}" ${s(2.2)}/>
    ${suit(id)}
    ${head}`;
}

// ───────────────────────────── extras ─────────────────────────────

const stick = `<rect x="56" y="126" width="8" height="24" rx="2" fill="${WOOD}" ${s(2.2)}/>`;

function plainBody(jacket: string, skin = '#f0bf9a'): string {
  return `${stick}
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="${jacket}" ${s()}/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="${skin}" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="25" ry="27" fill="${skin}" ${s()}/>
    <ellipse cx="50" cy="61" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="70" cy="61" rx="2.800" ry="3.600" fill="${INK}"/>`;
}

/** Anonymous campaigners: one look per kind, whichever camp sends them. */
function campExtra(kind: string): string {
  const color = '#e8e2d2';
  const cap = '#4a5263';
  if (kind === 'militant') {
    return `${plainBody(color)}
      <path d="M34 50c0-14 11-23 26-23s26 9 26 23z" fill="${cap}" ${s()}/><path d="M30 50h46c8 0 14 2 18 6H30z" fill="${cap}" ${s()}/>
      <path d="M51 74q9 6 18 0" fill="none" ${s(2.4)}/>
      <g transform="rotate(-12 28 108)"><path d="M12 96h26v30H12z" fill="${PAPER}" ${s(2.2)}/><path d="M17 104h16M17 110h16M17 116h10" ${thin('#e5383b', 2.2)}/></g>`;
  }
  if (kind === 'placard') {
    return `${plainBody('#4a5263')}
      <path d="M35 52c-2-15 9-26 25-26s27 11 25 26c-4-9-13-14-25-14s-21 5-25 14z" fill="#5c4634" ${s()}/>
      <path d="M52 76h16" fill="none" ${s(2.4)}/>
      <path d="M60 148V92" fill="none" ${s(4)}/>
      <rect x="20" y="84" width="80" height="48" rx="4" fill="${PAPER}" ${s(3)}/>
      <text x="60" y="119" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="24" fill="#e5383b">NON</text>`;
  }
  if (kind === 'pundit') {
    return `${plainBody('#7d8597')}
      <path d="M57 98h6l2 24-5 5-5-5z" fill="#e5383b" ${s(2)}/>
      <path d="M34 52c-3-16 9-27 26-27s29 11 26 27c-3-9-12-15-26-15s-23 6-26 15z" fill="#2a2422" ${s()}/>
      <path d="M33 62c-4-22 8-36 27-36s31 14 27 36" fill="none" ${s(3.4)}/>
      <rect x="27" y="56" width="9" height="15" rx="4" fill="${INK}"/><rect x="84" y="56" width="9" height="15" rx="4" fill="${INK}"/>
      <path d="M31 70q2 12 18 12" fill="none" ${s(2.4)}/><circle cx="51" cy="82" r="4" fill="${INK}"/>
      <ellipse cx="62" cy="76" rx="6" ry="5" fill="#5b1220" ${s(2.2)}/>`;
  }
  return '';
}

/** Street figures and public services: they wear their own colours. */
const STREET: Record<string, () => string> = {
  // An electric scooter rider: helmet, earphones, and the phone held out in front.
  trottinette: () => `
    <path d="M18 146h70" fill="none" ${s(5)}/><path d="M18 146h70" fill="none" stroke="#2fb3a3" stroke-width="2"/>
    <path d="M24 146l14-62" fill="none" ${s(4.5)}/><path d="M28 84h22" fill="none" ${s(4)}/>
    <g ${s(2.6)}><circle cx="20" cy="146" r="7" fill="${INK}"/><circle cx="88" cy="146" r="7" fill="${INK}"/></g>
    <path d="M48 140l6-30h16l6 30z" fill="#3a4466" ${s(2.4)}/>
    <path d="M36 118c0-20 10-30 24-30s24 10 24 30z" fill="#ff8a3d" ${s()}/>
    <path d="M40 98l-8-10" fill="none" ${s(5)}/><path d="M40 98l-8-10" fill="none" stroke="#ff8a3d" stroke-width="2.4"/>
    <rect x="52" y="76" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="58" rx="22" ry="24" fill="#f0bf9a" ${s()}/>
    <path d="M36 54c0-18 10-28 24-28s24 10 24 28c-6-6-14-8-24-8s-18 2-24 8z" fill="#f2f3f6" ${s()}/>
    <path d="M44 34l32 0" ${thin('#2fb3a3', 4)}/>
    <ellipse cx="51" cy="60" rx="2.600" ry="3.400" fill="${INK}"/><ellipse cx="69" cy="60" rx="2.600" ry="3.400" fill="${INK}"/>
    <path d="M53 70q7 5 14 0" fill="none" ${s(2.4)}/>
    <circle cx="38" cy="62" r="3.500" fill="#f2f3f6" ${s(1.8)}/><circle cx="82" cy="62" r="3.500" fill="#f2f3f6" ${s(1.8)}/>`,
  // High-school student on a blockade.
  lyceen: () => `${stick}
    <path d="M30 70c-4-22 10-40 30-40s34 18 30 40c-2 10-8 14-12 14H42c-4 0-10-4-12-14z" fill="#6f58a8" ${s()}/>
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="#7d65b8" ${s()}/>
    <path d="M38 100v34M82 100v34" fill="none" stroke="#3a3f4b" stroke-width="6"/>
    <path d="M55 98v12M65 98v12" ${thin(PAPER, 2.2)}/>
    <ellipse cx="60" cy="61" rx="22" ry="24" fill="#f3c9a5" ${s()}/>
    <path d="M40 55c-1-13 8-21 20-21s21 8 20 21c-5-6-12-9-20-9s-15 3-20 9z" fill="#3b2a20" ${s(2.4)}/>
    <ellipse cx="52" cy="62" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="68" cy="62" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M53 73q7 6 14 0z" fill="${WHITE}" ${s(2.2)}/>
    <g transform="rotate(10 96 100)"><path d="M96 134V104" fill="none" ${s(3.4)}/><rect x="72" y="82" width="48" height="26" rx="2" fill="#d9b382" ${s(2.6)}/>
    <text x="96" y="100.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="${INK}">BLOCUS</text></g>`,

  // Yellow vest: hi-vis over a jumper, straight from the roundabout.
  gilet: () => `${stick}
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="#4a5263" ${s()}/>
    <path d="M36 100c4-3 9-5 15-5l9 12 9-12c6 0 11 2 15 5l4 34H32z" fill="#f7e11b" ${s(2.6)}/>
    <path d="M60 107v27" fill="none" ${s(2.2)}/>
    <path d="M33 118h54M32 127h56" fill="none" stroke="#c9ccd3" stroke-width="4.500"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#efbf98" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="25" ry="27" fill="#efbf98" ${s()}/>
    <path d="M35 54c-3-17 9-28 25-28s28 11 25 28c-4-9-12-14-25-14s-21 5-25 14z" fill="#5c4634" ${s()}/>
    <ellipse cx="50" cy="61" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="70" cy="61" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M43 52l12 2M65 54l12-2" ${thin('#3a2c20', 3)}/>
    <ellipse cx="60" cy="76" rx="7" ry="5" fill="#5b1220" ${s(2.2)}/>
    <path d="M40 68q20 26 40 0" fill="rgba(60,45,35,.2)"/>`,

  // Trade unionist (no union in particular): red bib, cap and a strike flag.
  syndicat: () => `${stick}
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="#4a5263" ${s()}/>
    <path d="M36 100c4-3 9-5 15-5l9 12 9-12c6 0 11 2 15 5l4 34H32z" fill="#e5383b" ${s(2.6)}/>
    <path d="M60 107v27" fill="none" ${s(2.2)}/><path d="M38 116h44" fill="none" stroke="${PAPER}" stroke-width="4"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0c7a4" ${s(2.4)}/>
    <ellipse cx="60" cy="61" rx="24" ry="26" fill="#f0c7a4" ${s()}/>
    <path d="M36 52c0-14 10-23 24-23s24 9 24 23z" fill="#e5383b" ${s()}/><path d="M60 52h30c3 0 5 2 5 4H60z" fill="#e5383b" ${s(2.4)}/>
    <ellipse cx="51" cy="62" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M44 56l11 1M65 57l11-1" ${thin('#4a3626', 2.8)}/>
    <ellipse cx="60" cy="76" rx="7" ry="5.500" fill="#5b1220" ${s(2.2)}/>
    <path d="M40 68q20 24 40 0" fill="rgba(60,45,35,.18)"/>
    <path d="M104 142V58" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M104 142V58" fill="none" stroke="${WOOD}" stroke-width="2.800" stroke-linecap="round"/>
    <path d="M104 60h14c-3 7-3 14 0 21h-14z" fill="#e5383b" ${s(2.4)}/>
    <g transform="rotate(-8 92 78)"><rect x="70" y="60" width="44" height="22" rx="3" fill="#e5383b" ${s(2.4)}/>
    <text x="92" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="${PAPER}">GRÈVE</text></g>`,

  // Minimum-wage worker: work jacket, lunchbox, and the pay slip that does not stretch to the end of the month.
  smicard: () => `${stick}
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="#2f4a7a" ${s()}/>
    <path d="M49 96l11 14 11-14" fill="#d9d2c2" ${s(2.2)}/><path d="M60 110v24" fill="none" ${s(2)}/>
    <rect x="66" y="114" width="14" height="10" rx="2" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#e9b48f" ${s(2.4)}/>
    <ellipse cx="60" cy="61" rx="24" ry="26" fill="#e9b48f" ${s()}/>
    <path d="M35 54c-1-15 10-25 25-25s26 10 25 25c-8-4-16-6-25-6s-17 2-25 6z" fill="#5b6270" ${s()}/>
    <path d="M36 52h48" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2.400"/>
    <ellipse cx="51" cy="62" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M46 68q5 3 10 0M64 68q5 3 10 0" fill="none" stroke="rgba(23,32,63,.4)" stroke-width="1.800" stroke-linecap="round"/>
    <path d="M52 77q8 4 16-1" fill="none" ${s(2.4)}/>
    <g transform="rotate(-6 22 116)"><rect x="4" y="104" width="34" height="24" rx="5" fill="#aab6cc" ${s(2.4)}/><path d="M4 112h34" fill="none" ${s(2)}/><path d="M14 104v-5h14v5" fill="none" ${s(2.4)}/></g>
    <g transform="rotate(10 100 104)"><path d="M84 84h32v40H84z" fill="${PAPER}" ${s(2.4)}/>
    <text x="100" y="97" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9.500" fill="${INK}">SMIC</text>
    <path d="M89 104h22M89 110h22M89 116h14" ${thin('#9aa3b8', 2)}/></g>`,

  // Farmer: straw hat, overalls and a pitchfork (a prop, nobody gets hurt).
  agriculteur: () => `${stick}
    <path d="M24 134c0-24 12-36 27-38h18c15 2 27 14 27 38z" fill="#c0392b" ${s()}/>
    <path d="M30 104l-4 30M90 104l4 30M40 98l-8 36M80 98l8 36" ${thin('rgba(255,255,255,.35)', 2)}/>
    <path d="M42 108h36v26H42z" fill="#3c7a4a" ${s(2.4)}/><path d="M46 108l-6-12M74 108l6-12" fill="none" stroke="#3c7a4a" stroke-width="6" stroke-linecap="round"/>
    <circle cx="47" cy="110" r="2.200" fill="#ffd23f"/><circle cx="73" cy="110" r="2.200" fill="#ffd23f"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#e2a878" ${s(2.4)}/>
    <ellipse cx="60" cy="62" rx="24" ry="25" fill="#e2a878" ${s()}/>
    <ellipse cx="51" cy="62" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M49 73q5-5 11-1 6-4 11 1-5 5-11 2-6 3-11-2z" fill="#6b4a2f" ${s(1.8)}/>
    <path d="M26 44c6-4 18-6 34-6s28 2 34 6c-6 5-18 7-34 7s-28-2-34-7z" fill="#e6c15a" ${s()}/>
    <path d="M40 42c0-14 9-22 20-22s20 8 20 22c-6 3-13 4-20 4s-14-1-20-4z" fill="#f0d27a" ${s()}/>
    <path d="M40 40q20 6 40 0" ${thin('#8a5a3c', 3)}/>
    <path d="M102 142V74" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M102 142V74" fill="none" stroke="${WOOD}" stroke-width="3.400" stroke-linecap="round"/>
    <path d="M90 74h24M90 74V54M102 74V50M114 74V54" fill="none" stroke="${INK}" stroke-width="4.600" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M90 74h24M90 74V54M102 74V50M114 74V54" fill="none" stroke="#c9ccd3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,

  // Tax inspector: withholding at source.
  impots: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#5b6270" ${s()}/>
    <path d="M49 95l11 20 11-20z" fill="#fff" ${s(2.2)}/><path d="M57 101h6l3 24-6 6-6-6z" fill="#232733" ${s(2)}/>
    <path d="M49 95l11 20-9 6-8-20z" fill="rgba(0,0,0,.22)" ${s(2.2)}/><path d="M71 95l-11 20 9 6 8-20z" fill="rgba(0,0,0,.22)" ${s(2.2)}/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0c7a4" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="24" ry="27" fill="#f0c7a4" ${s()}/>
    <path d="M35 56C31 34 44 22 61 22c18 0 28 12 25 34-2-9-7-15-14-17-10-3-18 1-25-2-5 4-9 10-12 19z" fill="#4b4f58" ${s()}/>
    <ellipse cx="50" cy="60" rx="2.600" ry="3.200" fill="${INK}"/><ellipse cx="70" cy="60" rx="2.600" ry="3.200" fill="${INK}"/>
    <g fill="rgba(255,255,255,.35)" ${s(1.8)}><rect x="41" y="54" width="16" height="11" rx="3"/><rect x="63" y="54" width="16" height="11" rx="3"/><path d="M57 59h6" fill="none"/></g>
    <path d="M43 51l12 1M65 52l12-1" ${thin('#3a3f4b', 2.6)}/>
    <path d="M53 76h14" fill="none" ${s(2.4)}/>
    <g><rect x="2" y="106" width="36" height="26" rx="4" fill="#8a5a3c" ${s(2.4)}/><path d="M13 106v-5c0-3 2-5 5-5h4c3 0 5 2 5 5v5" fill="none" ${s(2.6)}/><rect x="16" y="114" width="8" height="6" rx="1.500" fill="#ffd23f" ${s(1.6)}/></g>
    <g transform="rotate(8 100 104)"><path d="M82 84h36v42H82z" fill="${PAPER}" ${s(2.4)}/>
    <text x="100" y="97" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8.500" fill="${INK}">IMPÔTS</text>
    <path d="M88 104h24M88 110h24M88 116h14" ${thin('#9aa3b8', 2)}/><text x="110" y="122" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="#e5383b">%</text></g>`,

  // A CAC 40 boss, nobody in particular: pinstripes, gold tie and a well-filled briefcase.
  patron: () => `${stick}
    <path d="M20 134c0-26 13-38 30-40h20c17 2 30 14 30 40z" fill="#1c2233" ${s()}/>
    <path d="M32 104v30M42 98v36M78 98v36M88 104v30" ${thin('rgba(255,255,255,.22)', 1.6)}/>
    <path d="M49 94l11 20 11-20z" fill="#fff" ${s(2.2)}/><path d="M57 100h6l3 26-6 6-6-6z" fill="#ffd23f" ${s(2)}/>
    <path d="M49 94l11 20-9 6-8-20z" fill="rgba(0,0,0,.3)" ${s(2.2)}/><path d="M71 94l-11 20 9 6 8-20z" fill="rgba(0,0,0,.3)" ${s(2.2)}/>
    <rect x="52" y="80" width="16" height="15" rx="4" fill="#f0c7a4" ${s(2.4)}/>
    <ellipse cx="60" cy="58" rx="27" ry="28" fill="#f0c7a4" ${s()}/>
    <path d="M32 54C27 30 42 16 61 16s34 14 28 38c-2-10-7-17-17-19-8-2-18-2-26 0-7 2-12 9-14 19z" fill="#c9ccd3" ${s()}/>
    <ellipse cx="50" cy="58" rx="2.800" ry="3.400" fill="${INK}"/><ellipse cx="70" cy="58" rx="2.800" ry="3.400" fill="${INK}"/>
    <path d="M43 50l12-1M65 49l12 1" ${thin('#8d9199', 3)}/>
    <path d="M60 60c-2 5-3 8 1 9" fill="none" ${s(2.2)}/>
    <path d="M50 76q11 7 21-3" fill="none" ${s(2.6)}/>
    <g transform="rotate(-6 96 112)"><rect x="76" y="100" width="42" height="30" rx="4" fill="#8a5a3c" ${s(2.4)}/><path d="M89 100v-5c0-3 2-5 5-5h6c3 0 5 2 5 5v5" fill="none" ${s(2.6)}/>
    <rect x="80" y="108" width="34" height="13" rx="2" fill="${PAPER}" ${s(1.6)}/>
    <text x="97" y="118" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8.500" fill="${INK}">CAC 40</text></g>`,

  // Riot police: holds the line.
  crs: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#1c2a4a" ${s()}/>
    <rect x="52" y="104" width="38" height="10" rx="2" fill="${PAPER}" ${s(1.8)}/>
    <text x="71" y="112.200" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="8.500" fill="#1c2a4a">POLICE</text>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="62" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <path d="M52 76h16" fill="none" ${s(2.4)}/>
    <path d="M32 60C28 34 42 20 60 20s32 14 28 40c-3-5-6-8-9-9H41c-3 1-6 4-9 9z" fill="#22335c" ${s()}/>
    <path d="M38 50h44c3 4 4 9 3 15H35c-1-6 0-11 3-15z" fill="rgba(170,215,255,.55)" ${s(2.2)}/>
    <ellipse cx="50" cy="59" rx="2.600" ry="3.200" fill="${INK}"/><ellipse cx="70" cy="59" rx="2.600" ry="3.200" fill="${INK}"/>
    <path d="M36 66q24 22 48 0" fill="none" ${s(2.6)}/>
    <rect x="2" y="74" width="42" height="64" rx="8" fill="#bfe0fb" ${s(3)}/>
    <path d="M10 84v44" ${thin('rgba(255,255,255,.9)', 3)}/>
    <text x="25" y="111" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="#1c2a4a">CRS</text>`,

  // The speed camera: a grey box on a pole, its flash and the speed-limit sign.
  radar: () => `
    <rect x="55" y="70" width="10" height="80" rx="2" fill="#7d8597" ${s(2.4)}/>
    <rect x="22" y="22" width="76" height="54" rx="8" fill="#5b6270" ${s(3)}/>
    <rect x="28" y="28" width="64" height="16" rx="3" fill="#dfe3ea" ${s(2)}/>
    <text x="60" y="40.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="12" fill="#17203f">RADAR</text>
    <circle cx="44" cy="60" r="10" fill="#17203f" ${s(2.4)}/><circle cx="44" cy="60" r="5" fill="#6fc3ff"/>
    <rect x="62" y="52" width="26" height="16" rx="4" fill="#fffdf6" ${s(2.2)}/>
    <path d="M66 60h18" fill="none" stroke="#e5383b" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 56l-12-6M18 64l-14 2M20 72l-12 8" ${thin('#ffd23f', 3.4)}/>
    <rect x="36" y="96" width="48" height="26" rx="4" fill="#fffdf6" ${s(2.4)}/>
    <circle cx="60" cy="109" r="9" fill="#fffdf6" stroke="#e5383b" stroke-width="3"/>
    <text x="60" y="113" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#17203f">80</text>`,

  // Paramedic: orange and white, a stethoscope and a first-aid bag.
  samu: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#f2f3f6" ${s()}/>
    <path d="M22 118h76v10H22z" fill="#ff7a1a"/>
    <rect x="36" y="100" width="18" height="12" rx="2" fill="#e5383b" ${s(1.6)}/><path d="M45 102v8M41 106h8" ${thin('#fffdf6', 2.4)}/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <path d="M36 54c0-18 10-28 24-28s24 10 24 28c-6-6-14-8-24-8s-18 2-24 8z" fill="#3b2a20" ${s()}/>
    <ellipse cx="51" cy="62" rx="2.600" ry="3.200" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.600" ry="3.200" fill="${INK}"/>
    <path d="M52 72q8 6 16 0" fill="none" ${s(2.4)}/>
    <path d="M50 92c-4 10-2 18 6 20M70 92c4 10 2 18-6 20" ${thin(INK, 2.2)}/><circle cx="60" cy="114" r="3" fill="#aab6cc" ${s(1.6)}/>
    <rect x="78" y="108" width="36" height="28" rx="5" fill="#e5383b" ${s(2.6)}/>
    <path d="M88 108v-5h16v5" fill="none" ${s(2.4)}/><path d="M96 114v16M88 122h16" ${thin('#fffdf6', 4)}/>`,

  // The baker: an apron, flour on the cheek and a baguette under the arm.
  boulangere: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#f2f3f6" ${s()}/>
    <path d="M38 98h44l4 36H34z" fill="#3c6fd0" ${s(2.2)}/><path d="M44 98v-4h32v4" fill="none" ${s(2)}/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <path d="M34 62c-4-22 8-38 26-38s30 16 26 38c-2-12-10-20-26-20s-24 8-26 20z" fill="#7a4a2a" ${s()}/>
    <circle cx="60" cy="22" r="9" fill="#7a4a2a" ${s(2.4)}/>
    <ellipse cx="51" cy="62" rx="2.600" ry="3.200" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.600" ry="3.200" fill="${INK}"/>
    <path d="M50 72q10 8 20 0" fill="none" ${s(2.4)}/>
    <circle cx="44" cy="70" r="4" fill="#fffdf6" opacity=".85"/>
    <g transform="rotate(-38 86 104)"><rect x="56" y="98" width="62" height="13" rx="6.500" fill="#e0a54a" ${s(2.4)}/>
    <path d="M68 100l-4 8M80 100l-4 8M92 100l-4 8M104 100l-4 8" ${thin('#a86a1f', 2.2)}/></g>`,

  // A teacher: glasses, a cardigan, a marked paper and the red pen.
  profs: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#8a5a3c" ${s()}/>
    <path d="M50 95l10 18 10-18z" fill="#f2f3f6" ${s(2)}/>
    <circle cx="52" cy="118" r="2" fill="${INK}"/><circle cx="52" cy="127" r="2" fill="${INK}"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <path d="M34 58c-2-20 10-32 26-32s28 12 26 32c-4-10-12-16-26-16s-22 6-26 16z" fill="#9aa0aa" ${s()}/>
    <g fill="rgba(255,255,255,.35)" ${s(2.2)}><circle cx="50" cy="62" r="7"/><circle cx="70" cy="62" r="7"/><path d="M57 62h6" fill="none"/></g>
    <circle cx="50" cy="62" r="2" fill="${INK}"/><circle cx="70" cy="62" r="2" fill="${INK}"/>
    <path d="M52 76h16" fill="none" ${s(2.4)}/>
    <g transform="rotate(10 30 110)"><rect x="8" y="96" width="42" height="32" rx="2" fill="#fffdf6" ${s(2.4)}/>
    <path d="M10 104h30M10 111h30M10 118h18" ${thin('#9aa3b8', 2)}/>
    <text x="36" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="11" fill="#e5383b">3/20</text></g>
    <g transform="rotate(30 100 100)"><rect x="96" y="82" width="7" height="36" rx="2" fill="#e5383b" ${s(1.8)}/><path d="M96.500 118l3 6 3-6z" fill="${INK}"/></g>`,

  // The Constitutional Council: one of its members, nobody in particular, and the CENSURÉ stamp.
  conseil: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#232733" ${s()}/>
    <path d="M49 95l11 20 11-20z" fill="#fffdf6" ${s(2)}/><path d="M57 100h6l2 18-5 5-5-5z" fill="#2f5fe0" ${s(1.8)}/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="60" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <path d="M36 56c-1-14 6-24 14-26 4-2 16-2 20 0 8 2 15 12 14 26-3-6-6-10-10-11-6 2-16 2-28 0-4 1-7 5-10 11z" fill="#dfe2e7" ${s()}/>
    <ellipse cx="51" cy="62" rx="2.600" ry="3.200" fill="${INK}"/><ellipse cx="69" cy="62" rx="2.600" ry="3.200" fill="${INK}"/>
    <path d="M44 54l12 2M64 56l12-2" ${thin('#9aa3b8', 3)}/>
    <path d="M52 76h16" fill="none" ${s(2.4)}/>
    <g transform="rotate(-10 90 104)"><rect x="64" y="94" width="50" height="20" rx="3" fill="#fffdf6" stroke="#e5383b" stroke-width="3"/>
    <text x="89" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="10" fill="#e5383b">CENSURÉ</text></g>`,

  // Firefighter: the only one everybody applauds.
  pompiers: () => `${stick}
    <path d="M22 134c0-25 12-37 28-39h20c16 2 28 14 28 39z" fill="#1c2a4a" ${s()}/>
    <path d="M32 100c8-5 18-6 28-6s20 1 28 6v8H32z" fill="#e5383b" ${s(2.2)}/>
    <path d="M24 120h72M24 127h72" fill="none" stroke="#ffd23f" stroke-width="4"/>
    <path d="M24 123.500h72" fill="none" stroke="#c9ccd3" stroke-width="2.400"/>
    <rect x="52" y="82" width="16" height="14" rx="4" fill="#f0bf9a" ${s(2.4)}/>
    <ellipse cx="60" cy="62" rx="24" ry="25" fill="#f0bf9a" ${s()}/>
    <ellipse cx="50" cy="62" rx="2.800" ry="3.600" fill="${INK}"/><ellipse cx="70" cy="62" rx="2.800" ry="3.600" fill="${INK}"/>
    <path d="M51 74q9 7 18 0z" fill="${WHITE}" ${s(2.2)}/>
    <path d="M31 56C28 32 42 17 60 17s32 15 29 39c-9-6-19-8-29-8s-20 2-29 8z" fill="#dfe3ea" ${s()}/>
    <path d="M60 17v31" fill="none" stroke="#9aa3b8" stroke-width="5"/>
    <path d="M36 46c8-4 16-5 24-5s16 1 24 5l2 8c-9-4-17-6-26-6s-17 2-26 6z" fill="#ffd23f" ${s(2.2)}/>
    <path d="M30 56l-4 20h8l2-16zM90 56l4 20h-8l-2-16z" fill="#1c2a4a" ${s(2.2)}/>
    <g transform="rotate(-8 100 106)"><rect x="80" y="100" width="30" height="12" rx="4" fill="#3a3f4b" ${s(2.4)}/><path d="M110 98h8v16h-8z" fill="#ffd23f" ${s(2.2)}/>
    <path d="M80 106c-10 0-12 12-12 26" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M80 106c-10 0-12 12-12 26" fill="none" stroke="#e5383b" stroke-width="3.400" stroke-linecap="round"/></g>`,
};

function busSvg(): string {
  const color = '#8a63c9';
  return `
    <path d="M12 44c0-9 7-16 16-16h118c13 0 22 10 22 22v52H12z" fill="${color}" ${s(3)}/>
    <path d="M12 84h156v18H12z" fill="rgba(0,0,0,.2)"/>
    <g fill="#dff1ff" ${s(2.4)}><rect x="24" y="42" width="26" height="24" rx="3"/><rect x="58" y="42" width="26" height="24" rx="3"/><rect x="92" y="42" width="26" height="24" rx="3"/><path d="M126 42h22c6 0 10 5 10 11v13h-32z"/></g>
    <path d="M26 76h100" fill="none" stroke="${PAPER}" stroke-width="6" stroke-linecap="round"/>
    <g ${s(3)}><circle cx="48" cy="104" r="14" fill="${INK}"/><circle cx="48" cy="104" r="5" fill="#aab6cc"/><circle cx="132" cy="104" r="14" fill="${INK}"/><circle cx="132" cy="104" r="5" fill="#aab6cc"/></g>
    <g transform="rotate(-14 60 18)"><path d="M40 12h14l22-9v26l-22-9H40z" fill="${PAPER}" ${s(2.6)}/></g>`;
}

/** A small hatchback, nose to the left, with a very empty fuel gauge. */
function autoSvg(): string {
  return `
    <path d="M8 74c0-8 5-13 12-14l20-4 16-22c3-4 7-6 12-6h44c6 0 11 3 14 8l12 22 8 2c6 1 10 6 10 12v14H8z" fill="#8fa3b8" ${s(3)}/>
    <path d="M8 78h148v8H8z" fill="rgba(0,0,0,.18)"/>
    <path d="M48 56l12-18c2-3 4-4 7-4h17v22z" fill="#dff1ff" ${s(2.4)}/><path d="M90 34h20c4 0 6 2 8 5l9 17H90z" fill="#dff1ff" ${s(2.4)}/>
    <circle cx="72" cy="47" r="8" fill="#f0bf9a" ${s(2.2)}/><path d="M64 44c1-6 5-8 9-8s7 3 8 8c-5-3-11-3-17 0z" fill="#3b2a20" ${s(1.8)}/>
    <path d="M68 50l8-1" fill="none" ${s(1.8)}/>
    <path d="M10 70h10" fill="none" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/>
    <g ${s(3)}><circle cx="42" cy="88" r="13" fill="${INK}"/><circle cx="42" cy="88" r="5" fill="#aab6cc"/><circle cx="124" cy="88" r="13" fill="${INK}"/><circle cx="124" cy="88" r="5" fill="#aab6cc"/></g>
    <g><rect x="92" y="60" width="32" height="18" rx="4" fill="${PAPER}" ${s(2.2)}/>
    <text x="108" y="73.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="12" fill="#e5383b">2 €/L</text></g>
    <path d="M150 82c6-2 10-1 13 2" ${thin('#9aa3b8', 3)}/>`;
}

/** A green tractor, nose to the left. Its engine is loud enough to cut every microphone. */
function tracteurSvg(): string {
  return `
    <path d="M78 22v-14" fill="none" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M78 22v-14" fill="none" stroke="#5b6270" stroke-width="4" stroke-linecap="round"/>
    <path d="M70 2c-6-2-10 2-9 6M60 0c-5 1-7 5-5 9" ${thin('#9aa3b8', 3)}/>
    <path d="M14 58c0-8 5-14 13-14h66v44H14z" fill="#3c8a57" ${s(3)}/>
    <path d="M14 66h10M14 74h10M14 82h10" ${thin(INK, 2.4)}/>
    <path d="M92 88V24c0-4 3-7 7-7h42c5 0 9 3 10 8l6 63z" fill="#2f6a45" ${s(3)}/>
    <path d="M100 26h36c3 0 5 2 6 5l4 29h-46z" fill="#dff1ff" ${s(2.4)}/>
    <circle cx="120" cy="44" r="9" fill="#e2a878" ${s(2.2)}/><path d="M108 40c2-5 7-8 12-8s10 3 12 8c-8 2-16 2-24 0z" fill="#e6c15a" ${s(1.8)}/>
    <path d="M14 88h82v10H14z" fill="rgba(0,0,0,.2)"/>
    <g ${s(3)}><circle cx="38" cy="98" r="18" fill="${INK}"/><circle cx="38" cy="98" r="8" fill="#ffd23f"/>
    <circle cx="128" cy="86" r="32" fill="${INK}"/><circle cx="128" cy="86" r="14" fill="#ffd23f"/></g>
    <circle cx="38" cy="98" r="2.600" fill="${INK}"/><circle cx="128" cy="86" r="4" fill="${INK}"/>
    <path d="M96 52c14-6 30-2 40 8" fill="none" stroke="#2f6a45" stroke-width="9" stroke-linecap="round"/>`;
}

/** A rolling news channel's broadcast van, nose to the left, dish up: on air around the clock. */
function cnewsSvg(): string {
  return `
    <path d="M126 30l6-14" fill="none" ${s(3)}/>
    <g transform="rotate(-24 132 14)"><path d="M114 12a18 9 0 0 0 36 0z" fill="#dfe3ea" ${s(2.6)}/><path d="M132 16v-9" fill="none" ${s(2.2)}/><circle cx="132" cy="6" r="2.600" fill="#e5383b" ${s(1.6)}/></g>
    <path d="M10 72c0-6 4-11 9-13l13-4 13-21c2-3 5-5 9-5h104c6 0 10 4 10 10v67H10z" fill="#f2f3f6" ${s(3)}/>
    <path d="M38 56l12-19c1-2 3-3 5-3h14v22z" fill="#dff1ff" ${s(2.4)}/>
    <circle cx="57" cy="47" r="7" fill="#f0bf9a" ${s(2)}/><path d="M50 44c1-5 4-7 7-7s7 2 8 7c-5-2-10-2-15 0z" fill="#3b2a20" ${s(1.6)}/>
    <rect x="76" y="40" width="88" height="24" rx="2" fill="#17203f" ${s(2.2)}/>
    <text x="120" y="57.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="16" letter-spacing="1" fill="${PAPER}">CNEWS</text>
    <rect x="88" y="69" width="64" height="15" rx="4" fill="#e5383b" ${s(2)}/>
    <circle cx="97" cy="76.500" r="3" fill="${PAPER}"/>
    <text x="124" y="80.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="10" fill="${PAPER}">DIRECT</text>
    <path d="M10 88h160v10H10z" fill="rgba(0,0,0,.16)"/>
    <path d="M12 74h9" fill="none" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/>
    <g ${s(3)}><circle cx="44" cy="100" r="13" fill="${INK}"/><circle cx="44" cy="100" r="5" fill="#aab6cc"/><circle cx="138" cy="100" r="13" fill="${INK}"/><circle cx="138" cy="100" r="5" fill="#aab6cc"/></g>`;
}

/** The star of the Agricultural Show, nose to the left: a big Normande with a rosette. */
function vacheSvg(): string {
  const spot = '#5a3b2a';
  return `
    <path d="M150 52q14 4 12 26" fill="none" ${s(3)}/><path d="M160 76l4 8-6-2z" fill="${INK}"/>
    <path d="M44 50c0-10 8-16 18-16h74c12 0 18 8 18 18v30c0 10-6 16-16 16H62c-10 0-18-6-18-16z" fill="${PAPER}" ${s(3)}/>
    <path d="M76 36c8 8 6 20-6 24-8 2-12-6-10-14 1-6 8-12 16-10zM118 58c10-2 18 6 16 16-2 8-12 10-18 4-6-6-6-18 2-20zM142 36c6 4 10 12 6 18-6 0-10-8-6-18z" fill="${spot}"/>
    <g ${s(3)}><path d="M60 92v20h10V94M84 96v16h10V96M120 96v16h10V96M140 92v20h10V94" fill="${PAPER}"/></g>
    <path d="M60 110h10M84 110h10M120 110h10M140 110h10" fill="none" stroke="${INK}" stroke-width="5"/>
    <path d="M98 98c0 6 6 10 12 10s12-4 12-10z" fill="#ffb3c1" ${s(2.4)}/>
    <path d="M8 46c0-14 10-22 24-22s22 8 22 20v14c0 10-8 16-20 16H22c-8 0-14-6-14-14z" fill="${PAPER}" ${s(3)}/>
    <path d="M18 18c-6-6-12-4-14 0 4 2 8 4 12 8zM44 18c6-6 12-4 14 0-4 2-8 4-12 8z" fill="#e6d3a3" ${s(2.4)}/>
    <path d="M30 24c4-6 12-6 16 0" fill="${spot}"/>
    <rect x="6" y="52" width="34" height="22" rx="10" fill="#ffb3c1" ${s(2.6)}/>
    <circle cx="16" cy="63" r="2.600" fill="${INK}"/><circle cx="30" cy="63" r="2.600" fill="${INK}"/>
    <ellipse cx="22" cy="40" rx="3" ry="4" fill="${INK}"/><ellipse cx="40" cy="40" rx="3" ry="4" fill="${INK}"/>
    <g transform="translate(54 66)"><circle r="9" fill="#2f5fe0" ${s(2)}/><circle r="4" fill="${GOLD}"/><path d="M-4 8l-3 12 5-3 2 5 2-13z" fill="#e5383b" ${s(1.6)}/></g>`;
}

/** A wheelie bin on fire. The canvas adds the flicker. */
function poubelleSvg(): string {
  return `
    <path d="M44 34c-8-12-2-22 6-30 0 9 6 11 10 18 2-8 0-14 6-20 8 10 16 20 8 34z" fill="#ff7b1c" ${s(2.6)}/>
    <path d="M50 36c-4-8-1-13 4-18 1 6 4 7 6 12 3-5 3-9 6-12 4 7 7 12 3 18z" fill="#ffd23f"/>
    <path d="M20 30l52-10 3 10-52 10z" fill="#2f6a45" ${s(2.6)}/>
    <path d="M22 44h52l-6 62H28z" fill="#3c8a57" ${s(3)}/>
    <path d="M22 44h52l-1 10H23z" fill="#2f6a45" ${s(2.4)}/>
    <path d="M36 62v34M48 62v34M60 62v34" ${thin('rgba(23,32,63,.3)', 2.4)}/>
    <g ${s(2.6)}><circle cx="32" cy="108" r="7" fill="${INK}"/><circle cx="64" cy="108" r="7" fill="${INK}"/></g>`;
}

function catSvg(): string {
  return `
    <path d="M62 44q16-22 4-34" fill="none" stroke="#f2a65a" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="42" cy="46" rx="26" ry="16" fill="#f2a65a" ${s(2.6)}/>
    <path d="M10 38c0-10 7-17 16-17s16 7 16 17-7 15-16 15-16-5-16-15z" fill="#f2a65a" ${s(2.6)}/>
    <path d="M12 28l-3-13 11 6zM40 28l3-13-11 6z" fill="#f2a65a" ${s(2.4)}/>
    <circle cx="20" cy="36" r="2.200" fill="${INK}"/><circle cx="32" cy="36" r="2.200" fill="${INK}"/>
    <path d="M23 42l3 3 3-3" fill="none" ${s(1.8)}/>
    <path d="M26 60v8M38 61v8M52 61v8M62 58v8" fill="none" ${s(4)}/>`;
}

// ───────────────────────────── public API ─────────────────────────────

/** Everything the board shows as a figure: the roster, the guests and every reinforcement (each one needs its sprite). */
export const PORTRAIT_IDS = [...FIGURES, ...REINFORCEMENTS];

/** Public path of a photo head (or null when the figure has no photo, or not that expression). */
export function headUrl(id: string, expression: Expression = 'neutral'): string | null {
  const file = PHOTOS[id]?.includes(expression) ? HEAD_FILES[`${id}-${expression}`] : undefined;
  return file ? `/heads/${file}` : null;
}

export interface PortraitOptions {
  /** Rendered width in CSS pixels; height follows the drawing's ratio. */
  size?: number;
  /** White die-cut border, like a sticker (default true). */
  sticker?: boolean;
  /** Makes filter ids unique when the same portrait appears twice on a page. */
  uid?: string;
  /** Accessible name; omit for a decorative portrait. */
  label?: string;
  /** Which photo of the head (default: neutral). */
  expression?: Expression;
  /** Overrides the photo's address (the game passes a data: URI so the SVG can be rasterised). */
  headHref?: string;
}

function wrap(inner: string, viewBox: [number, number], key: string, options: PortraitOptions): string {
  const [vw, vh] = viewBox;
  const size = options.size ?? 120;
  const height = Math.round((size * vh) / vw);
  const sticker = options.sticker ?? true;
  const filterId = `st-${key}${options.uid ? `-${options.uid}` : ''}`;
  const a11y = options.label
    ? `role="img" aria-label="${options.label.replace(/"/g, '&quot;')}"`
    : 'aria-hidden="true" focusable="false"';
  const pad = 8;
  const defs = sticker
    ? `<defs><filter id="${filterId}" x="-15%" y="-15%" width="130%" height="130%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3.500" result="grown"/>
        <feFlood flood-color="${PAPER}"/><feComposite in2="grown" operator="in" result="edge"/>
        <feMerge><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${vw + pad * 2} ${vh + pad * 2}" width="${size}" height="${height}" ${a11y}>${defs}<g${sticker ? ` filter="url(#${filterId})"` : ''}>${inner}</g></svg>`;
}

/** A named figure (photo head on a drawn body), or one of the two reinforcements. */
export function portraitSvg(id: string, options: PortraitOptions = {}): string {
  const street = STREET[id];
  if (street) return wrap(street(), [120, 150], id, options);
  if (!FIGURES.has(id)) throw new Error(`No portrait for ${id}`);
  const photo = options.headHref ?? headUrl(id, options.expression) ?? headUrl(id);
  return wrap(figure(id, photo), [120, 150], `${id}${options.expression && options.expression !== 'neutral' ? `-${options.expression}` : ''}`, options);
}

/** Extras: every kind has a single look. */
export function extraSvg(kind: string, options: PortraitOptions = {}): string {
  if (kind === 'bus') return wrap(busSvg(), [180, 124], 'bus', options);
  if (kind === 'vache') return wrap(vacheSvg(), [168, 116], 'vache', options);
  if (kind === 'auto') return wrap(autoSvg(), [164, 104], 'auto', options);
  if (kind === 'tracteur') return wrap(tracteurSvg(), [166, 120], 'tracteur', options);
  if (kind === 'cnews') return wrap(cnewsSvg(), [172, 114], 'cnews', options);
  if (kind === 'poubelle') return wrap(poubelleSvg(), [96, 118], 'poubelle', options);
  if (kind === 'cat') return wrap(catSvg(), [80, 72], 'cat', options);
  if (STREET[kind] || FIGURES.has(kind)) return portraitSvg(kind, options);
  const portrait = EXTRAS[kind]?.portrait;
  if (portrait) return portraitSvg(portrait, options);
  return wrap(campExtra(kind), [120, 150], kind, options);
}

/** SVG for any enemy id used by the simulation ("militant", "star:macron", "trump"…). */
export function enemySvg(enemyId: string, options: PortraitOptions = {}): string {
  return enemyId.startsWith('star:') ? portraitSvg(enemyId.slice(5), options) : extraSvg(enemyId, options);
}
