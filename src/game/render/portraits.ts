/**
 * Paper-puppet caricatures, generated as SVG strings.
 *
 * One drawing routine serves three consumers: the site (inlined in the HTML),
 * the game canvas (rasterised once per sprite) and the asset scripts (social
 * card, README art). Everything is original artwork built from primitives —
 * no photo, logo or third-party asset is involved.
 *
 * A caricature is a `Look`: a face shape, a hairstyle, a nose, a mouth, an
 * outfit and one signature prop. Likeness comes from the combination, never
 * from a traced image.
 */
import type { CampId } from '../data/types';
import { CAMPS } from '../data/units';

export const INK = '#17203f';
const PAPER = '#fffdf6';
const WOOD = '#c9995a';
const WHITE = '#ffffff';

type Face = 'oval' | 'round' | 'long' | 'square';
type Mouth = 'smile' | 'grin' | 'gap' | 'open' | 'flat' | 'smirk' | 'pout' | 'laugh';
type Nose = 'small' | 'long' | 'round' | 'hook' | 'broad';
type Brows = 'flat' | 'angry' | 'arched' | 'sad';
type Eyes = 'dot' | 'narrow' | 'wide' | 'tired';
type Outfit = 'suit' | 'open' | 'casual' | 'coat' | 'judogi';

interface Look {
  skin: string;
  face: Face;
  hair: string;
  hairColor: string;
  brows: string;
  browStyle?: Brows;
  thickBrows?: boolean;
  eyes?: Eyes;
  eyeColor?: string;
  nose?: Nose;
  mouth: Mouth;
  /** Ear radius (default 5). */
  ears?: number;
  glasses?: 'round' | 'rect' | 'thin';
  stubble?: boolean;
  beard?: string;
  wrinkles?: boolean;
  /** Lighter patches around the eyes (a certain tan). */
  eyePatch?: string;
  blush?: boolean;
  outfit?: Outfit;
  jacket: string;
  shirt: string;
  tie?: string;
  tieTilt?: number;
  longTie?: boolean;
  scarf?: string;
  /** Extra artwork drawn over the head (a beret…). */
  hat?: string;
  prop?: string;
}

const s = (width = 2.6) => `stroke="${INK}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"`;
const thin = (color: string, width = 2) => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

// ───────────────────────────── props ─────────────────────────────

const PROPS: Record<string, string> = {
  // Hollande: it always rains on him.
  rain: `<g transform="translate(16 -17)"><path d="M70 14c-7 0-12 4-13 9-6 0-10 4-10 9s4 9 10 9h34c6 0 11-4 11-10s-5-10-11-10c-2-5-8-8-14-7z" fill="#aab6cc" ${s(2.4)}/>
    <path d="M84 47l-3 8M95 46l-3 8M88 62l-3 8M99 60l-3 8" ${thin('#4d8fe0', 2.6)}/></g>`,
  // Macron: "en même temps".
  arrows: `<g fill="#f6aa1c" ${s(2.2)}><path d="M88 108h14v-6l12 10-12 10v-6H88z"/><path d="M32 108H18v-6L6 112l12 10v-6h14z"/></g>`,
  // Mélenchon: the fist of the tribune.
  fist: `<g><path d="M94 96c-4 0-7 3-7 7v13c0 5 4 9 10 9h6c6 0 10-4 10-9v-12c0-3-2-5-5-5s-4 1-4 3v-3c0-3-2-5-5-5s-5 1-5 2z" fill="#f0bf9a" ${s(2.4)}/>
    <path d="M99 99v8M104 101v7" fill="none" ${s(2)}/></g>`,
  // Le Pen: certified cat breeder.
  cat: `<g><path d="M8 124c0-11 7-18 16-18s16 7 16 18v10H8z" fill="#f2a65a" ${s(2.4)}/>
    <path d="M10 112l-2-12 10 6zM38 112l2-12-10 6z" fill="#f2a65a" ${s(2.4)}/>
    <circle cx="18" cy="120" r="2" fill="${INK}"/><circle cx="30" cy="120" r="2" fill="${INK}"/>
    <path d="M22 125l2 2 2-2M12 124H5M12 128l-6 2M36 124h7M36 128l6 2" fill="none" ${s(1.6)}/></g>`,
  // Bardella: one selfie, one like.
  phone: `<g transform="rotate(12 100 108)"><rect x="89" y="88" width="24" height="40" rx="5" fill="${INK}"/>
    <rect x="92" y="92" width="18" height="30" rx="2" fill="#dff1ff"/>
    <path d="M101 114c-6-4-8-7-8-10 0-2 2-4 4-4 2 0 3 1 4 2 1-1 2-2 4-2 2 0 4 2 4 4 0 3-2 6-8 10z" fill="#ff4d6d"/></g>`,
  // Zemmour: a book a year, a controversy a week.
  book: `<g transform="rotate(-10 100 110)"><path d="M86 94h28v34H86z" fill="#8b2f2f" ${s(2.4)}/>
    <path d="M86 94h5v34h-5z" fill="#5e1c1c" ${s(2)}/><path d="M96 104h13M96 110h13" ${thin(PAPER, 2.2)}/></g>`,
  // Roussel: good meat, good wine, good cheese.
  steak: `<g><path d="M104 132V98" fill="none" ${s(3)}/>
    <path d="M90 82c8-6 22-5 27 3 4 7-1 15-11 16-11 1-20-3-21-9-1-4 1-7 5-10z" fill="#c0392b" ${s(2.4)}/>
    <path d="M97 87c4-2 10-2 13 1" ${thin('#f6c9c0', 2.4)}/></g>`,
  // Ruffin: the documentary maker.
  camera: `<g><rect x="84" y="98" width="32" height="24" rx="4" fill="#3a3f4b" ${s(2.4)}/>
    <rect x="92" y="92" width="10" height="7" rx="2" fill="#3a3f4b" ${s(2.2)}/>
    <circle cx="100" cy="110" r="7.5" fill="#8fd3ff" ${s(2.2)}/><circle cx="111" cy="103" r="1.8" fill="#e5383b"/></g>`,
  // Tondelier: zone 30.
  zone30: `<g><path d="M102 132v-18" fill="none" ${s(3)}/><circle cx="102" cy="100" r="15" fill="${PAPER}" stroke="#e5383b" stroke-width="5"/>
    <text x="102" y="105.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="14" fill="${INK}">30</text></g>`,
  // Poutou: the debate punchline.
  megaphone: `<g transform="rotate(-18 98 108)"><path d="M82 102h12l20-11v36l-20-11H82z" fill="#e5383b" ${s(2.4)}/>
    <path d="M86 116l3 12h7l-2-12z" fill="#3a3f4b" ${s(2.2)}/></g><path d="M112 86l5-6M117 96l7-2M116 106l7 3" ${thin(INK, 2.2)}/>`,
  // Bayrou: the sponsorship bank.
  bank: `<g ${s(2)}><path d="M83 106l18-13 18 13z" fill="#f6aa1c"/><path d="M84 124h34v7H84z" fill="#f6aa1c"/>
    <path d="M87 106h6v18h-6zM98 106h6v18h-6zM109 106h6v18h-6z" fill="${PAPER}"/></g>`,
  // Attal: top of the class.
  pencil: `<g transform="rotate(28 102 108)"><path d="M97 84h10v36l-5 10-5-10z" fill="#ffd23f" ${s(2.2)}/>
    <path d="M97 84h10v7H97z" fill="#ff8fa3" ${s(2)}/><path d="M99 124l3 6 3-6z" fill="${INK}"/></g>`,
  // Philippe: the boxer from Le Havre.
  gloves: `<g fill="#e5383b" ${s(2.4)}><path d="M6 108c0-8 6-13 13-13s12 5 12 12v9c0 5-4 9-9 9h-7c-5 0-9-4-9-9z"/>
    <path d="M89 108c0-8 6-13 13-13s12 5 12 12v9c0 5-4 9-9 9h-7c-5 0-9-4-9-9z"/></g>
    <path d="M9 119h20M92 119h20" fill="none" stroke="${PAPER}" stroke-width="2.4"/>`,
  // Borne: article 49.3.
  sign493: `<g transform="rotate(6 100 104)"><path d="M100 132v-16" fill="none" ${s(3)}/>
    <rect x="80" y="90" width="40" height="26" rx="3" fill="${PAPER}" ${s(2.4)}/>
    <text x="100" y="109" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#e5383b">49.3</text></g>`,
  // Le Maire: the budget freeze.
  ice: `<g><path d="M88 100l12-6 12 6v16l-12 6-12-6z" fill="#bfe8ff" ${s(2.2)}/>
    <path d="M88 100l12 6 12-6M100 106v16" fill="none" ${s(1.8)}/><path d="M92 106v6" ${thin('#fff', 2)}/></g>`,
  // Sarkozy: work more to earn more.
  coin: `<g><circle cx="102" cy="108" r="15" fill="#ffd23f" ${s(2.4)}/><circle cx="102" cy="108" r="10.5" fill="none" stroke="#c98a00" stroke-width="1.6"/>
    <text x="102" y="114" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="16" fill="#8a5300">€</text></g>`,
  // Ciotti: locked inside HQ.
  lock: `<g><path d="M92 104v-7c0-6 4-10 10-10s10 4 10 10v7" fill="none" ${s(4)}/>
    <rect x="86" y="103" width="32" height="25" rx="4" fill="#ffd23f" ${s(2.4)}/>
    <circle cx="102" cy="113" r="3.2" fill="${INK}"/><path d="M102 114v7" fill="none" ${s(2.6)}/></g>`,
  // Retailleau: order, order, order.
  order: `<g fill="none" stroke="#2f5fe0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M90 96l9 12-9 12"/><path d="M100 96l9 12-9 12"/><path d="M110 96l9 12-9 12"/></g>`,
  // Glucksmann: the European.
  stars: `<g><circle cx="101" cy="108" r="17" fill="#1c3fa8" ${s(2.4)}/>
    ${Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<circle cx="${(101 + Math.cos(a) * 11).toFixed(1)}" cy="${(108 + Math.sin(a) * 11).toFixed(1)}" r="2.3" fill="#ffd23f"/>`;
    }).join('')}</g>`,
  // Royal: "bravitude", a word of her own.
  dictionary: `<g transform="rotate(8 100 108)"><path d="M84 92h32v36H84z" fill="#fffdf6" ${s(2.4)}/><path d="M84 92h6v36h-6z" fill="#e5383b" ${s(2)}/>
    <text x="103" y="108" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="${INK}">A–Z</text>
    <path d="M94 115h18M94 121h12" ${thin('#9aa3b8', 2)}/></g>`,
  // Brigitte Macron: the yellow coins.
  coins: `<g ${s(2)}><ellipse cx="100" cy="124" rx="15" ry="6" fill="#ffd23f"/><ellipse cx="100" cy="117" rx="15" ry="6" fill="#ffd23f"/>
    <ellipse cx="100" cy="110" rx="15" ry="6" fill="#ffd23f"/><ellipse cx="100" cy="103" rx="15" ry="6" fill="#ffe680"/></g>
    <path d="M118 92l2-6M124 99l6-2" ${thin('#c98a00', 2.2)}/>`,
  // Villepin: the speech.
  lectern: `<g><path d="M82 104h36l-4 28H86z" fill="#8a5a3c" ${s(2.4)}/><path d="M80 98h40v7H80z" fill="#a8744e" ${s(2.2)}/>
    <path d="M100 98V86" fill="none" ${s(2.4)}/><circle cx="100" cy="83" r="4.5" fill="#3a3f4b" ${s(2)}/></g>`,
  // Lassalle: the shepherd's crook.
  crook: `<path d="M106 134V88c0-12 14-12 14-1" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <path d="M106 134V88c0-12 14-12 14-1" fill="none" stroke="${WOOD}" stroke-width="3.4" stroke-linecap="round"/>`,
  // Riner: gold, again.
  medal: `<g><path d="M50 96l10 18 10-18" fill="none" stroke="#2f5fe0" stroke-width="5" stroke-linejoin="round"/>
    <path d="M52 96l8 15 8-15" fill="none" stroke="#e5383b" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="60" cy="119" r="8.5" fill="#ffd23f" ${s(2.2)}/><path d="M60 114.500l1.500 3h3l-2.300 2.200.800 3.300-3-1.800-3 1.800.800-3.300-2.300-2.200h3z" fill="#c98a00"/></g>`,
  // Squeezie: a story, and the followers turn up.
  story: `<g transform="rotate(10 100 108)"><rect x="88" y="86" width="26" height="42" rx="5" fill="${INK}"/><rect x="91" y="90" width="20" height="32" rx="2" fill="#fff"/>
    <circle cx="101" cy="104" r="7" fill="none" stroke="#e1306c" stroke-width="3"/><circle cx="101" cy="104" r="3.200" fill="#f6aa1c"/><path d="M95 116h12" ${thin('#9aa3b8', 2)}/></g>`,
  // HugoDécrypte: one question for everybody.
  mic: `<g transform="rotate(-22 100 110)"><rect x="96" y="102" width="9" height="30" rx="3" fill="#3a3f4b" ${s(2.2)}/>
    <circle cx="100.500" cy="95" r="9.500" fill="#aab6cc" ${s(2.4)}/><path d="M93 95h15M100.500 87.500v15" ${thin('rgba(23,32,63,.35)', 1.6)}/></g>`,
  // Élise Lucet: the microphone held out at the door, and the file on the money.
  doorstep: `<g transform="rotate(-10 22 114)"><path d="M4 100h12l3 4h17v28H4z" fill="#f2d98b" ${s(2.2)}/><path d="M4 106h32" fill="none" ${s(1.8)}/>
    <text x="20" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="13" fill="#8a5300">€</text></g>
    <g transform="rotate(-26 100 110)"><rect x="96" y="104" width="9" height="30" rx="3" fill="#3a3f4b" ${s(2.2)}/>
    <rect x="90.500" y="99" width="20" height="13" rx="2" fill="#e5383b" ${s(2.2)}/>
    <text x="100.500" y="109.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="${PAPER}">?</text>
    <circle cx="100.500" cy="90" r="9" fill="#aab6cc" ${s(2.4)}/><path d="M93 90h15M100.500 82.500v15" ${thin('rgba(23,32,63,.35)', 1.6)}/></g>`,
  // David Lisnard: the mayor's tricolour sash, and the red carpet rolled under his arm.
  mayor: `<path d="M38 97l54 36" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="butt"/>
    <path d="M40.500 93.300l54 36" fill="none" stroke="#2f5fe0" stroke-width="5"/><path d="M38 97l54 36" fill="none" stroke="${PAPER}" stroke-width="5"/>
    <path d="M35.500 100.700l54 36" fill="none" stroke="#e5383b" stroke-width="5"/>
    <circle cx="90" cy="131" r="4.500" fill="#ffd23f" ${s(1.8)}/><path d="M87 135l-2 7M90 136v7M93 135l2 7" ${thin('#c98a00', 2)}/>
    <g transform="rotate(-62 104 108)"><rect x="84" y="99" width="42" height="17" rx="8" fill="#c62f3a" ${s(2.4)}/>
    <ellipse cx="124" cy="107.500" rx="4.500" ry="8.500" fill="#e5383b" ${s(2)}/><path d="M124 103.500a3 4 0 0 1 0 8" ${thin('#8b1c24', 1.6)}/></g>`,
  // Bernard Cazeneuve: the method — a notebook and a fountain pen.
  notebook: `<g transform="rotate(-8 100 110)"><rect x="84" y="90" width="30" height="38" rx="3" fill="#2a3566" ${s(2.4)}/>
    <path d="M88 90v38" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/><path d="M93 102h16M93 109h16M93 116h11" ${thin('#dfe6f5', 2)}/></g>
    <g transform="rotate(32 112 96)"><rect x="108" y="74" width="7" height="34" rx="3" fill="#17203f" ${s(1.8)}/><path d="M108.500 108l3 7 3-7z" fill="#ffd23f" ${s(1.4)}/></g>`,
  // Sébastien Lecornu: no 49.3 — the sign, crossed out.
  no493: `<g transform="rotate(-6 100 104)"><path d="M100 132v-16" fill="none" ${s(3)}/>
    <rect x="80" y="90" width="40" height="26" rx="3" fill="${PAPER}" ${s(2.4)}/>
    <text x="100" y="109" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="15" fill="#9aa3b8">49.3</text>
    <path d="M84 113l32-20" fill="none" stroke="#e5383b" stroke-width="4" stroke-linecap="round"/></g>`,
  // Xavier Bertrand: fully comprehensive cover — an umbrella.
  umbrella: `<g transform="rotate(-14 100 104)"><path d="M100 84v40c0 5 7 5 7 0" fill="none" ${s(3)}/>
    <path d="M76 88c4-14 14-20 24-20s20 6 24 20c-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0-4-3-8-3-12 0z" fill="#2f5fe0" ${s(2.4)}/>
    <path d="M100 68v20M88 72l-2 16M112 72l2 16" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1.800"/></g>`,
  // Nathalie Arthaud: the party paper.
  paper: `<g transform="rotate(10 100 108)"><rect x="82" y="86" width="36" height="42" rx="2" fill="${PAPER}" ${s(2.4)}/>
    <rect x="82" y="86" width="36" height="12" fill="#e5383b" ${s(2)}/>
    <text x="100" y="95.500" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="9" fill="${PAPER}">LO</text>
    <path d="M87 104h26M87 110h26M87 116h18M87 122h22" ${thin('#9aa3b8', 2)}/></g>`,
  // Sylvain Durif: the pan flute.
  panflute: `<g transform="rotate(-8 100 108)" ${s(2.2)}>${[0, 1, 2, 3, 4].map((i) => `<rect x="${84 + i * 7}" y="${92 + i * 2}" width="6.500" height="${34 - i * 4}" rx="2" fill="#d9b382"/>`).join('')}
    <path d="M82 104h38" fill="none" stroke="#8a5a3c" stroke-width="4"/></g><path d="M118 88c3-3 6-1 5 2s-5 3-5-2zM124 100c3-2 5 0 4 2" ${thin(INK, 2)}/>`,
  // Trump: tariffs.
  pricetag: `<g transform="rotate(-10 100 106)"><path d="M82 96l8-8h28v28H90l-8-8z" fill="${PAPER}" ${s(2.4)}/><circle cx="90" cy="102" r="2.600" fill="${INK}"/>
    <text x="104" y="107" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="11" fill="#e5383b">+25%</text></g>`,
};

// ───────────────────────────── the cast ─────────────────────────────

const SUIT = '#232d55';
const NAVY = '#1a2247';
const CHARCOAL = '#343844';

const LOOKS: Record<string, Look> = {
  // ── Gauche
  glucksmann: { skin: '#efc19c', face: 'oval', hair: 'tousled', hairColor: '#2e2420', brows: '#241c18', thickBrows: true, nose: 'long', mouth: 'smile', stubble: true, outfit: 'open', jacket: NAVY, shirt: WHITE, prop: 'stars' },
  hollande: { skin: '#f3c9a5', face: 'round', hair: 'thin', hairColor: '#35302e', brows: '#35302e', browStyle: 'arched', nose: 'round', mouth: 'smile', glasses: 'round', jacket: SUIT, shirt: WHITE, tie: '#2f5fe0', tieTilt: 14, prop: 'rain' },
  roussel: { skin: '#eeb990', face: 'square', hair: 'short', hairColor: '#3f342d', brows: '#2e2520', thickBrows: true, nose: 'broad', mouth: 'laugh', jacket: CHARCOAL, shirt: WHITE, outfit: 'open', prop: 'steak' },
  royal: { skin: '#f4cfae', face: 'oval', hair: 'shoulder', hairColor: '#4a2f22', brows: '#3a251a', browStyle: 'arched', nose: 'small', mouth: 'grin', blush: true, outfit: 'coat', jacket: '#fbfaf5', shirt: WHITE, prop: 'dictionary' },
  ruffin: { skin: '#efbf98', face: 'long', hair: 'short', hairColor: '#4a3a2c', brows: '#3a2c20', nose: 'long', mouth: 'smirk', stubble: true, outfit: 'casual', jacket: '#6b5a48', shirt: '#d9d2c2', prop: 'camera' },
  melenchon: { skin: '#f0bf9a', face: 'round', hair: 'tuft', hairColor: '#c9ccd3', brows: '#4b4f58', browStyle: 'angry', thickBrows: true, nose: 'round', mouth: 'open', glasses: 'rect', wrinkles: true, jacket: '#2b2f3a', shirt: WHITE, tie: '#e5383b', scarf: '#e5383b', prop: 'fist' },

  // ── Centre
  bayrou: { skin: '#f3c9a5', face: 'oval', hair: 'side', hairColor: '#d5d8de', brows: '#9aa0aa', nose: 'long', mouth: 'smile', ears: 7.5, wrinkles: true, jacket: SUIT, shirt: WHITE, tie: '#f08a1c', prop: 'bank' },
  attal: { skin: '#f6d2b3', face: 'oval', hair: 'slick', hairColor: '#3b2a20', brows: '#2e2018', nose: 'small', mouth: 'smile', eyes: 'wide', eyeColor: '#5b4030', jacket: SUIT, shirt: WHITE, tie: '#6fa8ff', prop: 'pencil' },
  philippe: { skin: '#f0bf9a', face: 'long', hair: 'bald', hairColor: '#000', brows: '#c9c4bb', nose: 'long', mouth: 'smirk', glasses: 'thin', jacket: '#4a5263', shirt: WHITE, tie: '#1c3fa8', prop: 'gloves' },
  lemaire: { skin: '#f3c9a5', face: 'long', hair: 'side', hairColor: '#8b8478', brows: '#6b655c', eyes: 'wide', eyeColor: '#4d8fe0', nose: 'long', mouth: 'flat', jacket: SUIT, shirt: '#dfeaff', tie: NAVY, prop: 'ice' },
  borne: { skin: '#f6d2b3', face: 'oval', hair: 'bob', hairColor: '#6a4a36', brows: '#4e3626', nose: 'small', mouth: 'flat', glasses: 'rect', outfit: 'coat', jacket: '#3a6fd8', shirt: WHITE, prop: 'sign493' },
  macron: { skin: '#f3c9a5', face: 'oval', hair: 'macron', hairColor: '#6b5140', brows: '#4e3a2c', eyes: 'wide', eyeColor: '#4d8fe0', nose: 'long', mouth: 'gap', jacket: NAVY, shirt: WHITE, tie: '#1c3fa8', prop: 'arrows' },

  // ── Droite
  sarkozy: { skin: '#e8b08a', face: 'long', hair: 'wavy', hairColor: '#5a5552', brows: '#2a2422', browStyle: 'angry', thickBrows: true, nose: 'hook', mouth: 'smirk', ears: 6.5, jacket: NAVY, shirt: WHITE, tie: SUIT, prop: 'coin' },
  bardella: { skin: '#f3c9a5', face: 'square', hair: 'quiff', hairColor: '#1f1a18', brows: '#1f1a18', thickBrows: true, nose: 'small', mouth: 'grin', jacket: NAVY, shirt: WHITE, tie: '#2f5fe0', prop: 'phone' },
  ciotti: { skin: '#eeb990', face: 'round', hair: 'bald', hairColor: '#000', brows: '#3a302a', thickBrows: true, nose: 'hook', mouth: 'flat', jacket: SUIT, shirt: '#dfeaff', tie: '#8b2f2f', prop: 'lock' },
  retailleau: { skin: '#f6d2b3', face: 'long', hair: 'side', hairColor: '#b9bcc4', brows: '#8d9199', browStyle: 'angry', nose: 'long', mouth: 'flat', glasses: 'thin', wrinkles: true, jacket: CHARCOAL, shirt: WHITE, tie: '#1c3fa8', prop: 'order' },
  zemmour: { skin: '#e9b48f', face: 'long', hair: 'balding', hairColor: '#2a2422', brows: '#2a2422', browStyle: 'sad', thickBrows: true, eyes: 'tired', nose: 'hook', mouth: 'open', ears: 7.5, jacket: CHARCOAL, shirt: WHITE, tie: '#5e1c1c', prop: 'book' },
  lepen: { skin: '#f6d2b3', face: 'square', hair: 'boblong', hairColor: '#f1d27a', brows: '#b8963c', browStyle: 'arched', nose: 'small', mouth: 'laugh', blush: true, outfit: 'coat', jacket: '#1c3fa8', shirt: WHITE, prop: 'cat' },

  // ── Substitutes
  cazeneuve: { skin: '#efc19c', face: 'long', hair: 'balding', hairColor: '#9aa0aa', brows: '#6b655c', nose: 'long', mouth: 'flat', glasses: 'rect', wrinkles: true, jacket: CHARCOAL, shirt: WHITE, tie: '#8b2f2f', prop: 'notebook' },
  lecornu: { skin: '#f3c9a5', face: 'oval', hair: 'short', hairColor: '#3b2a20', brows: '#2e2018', nose: 'small', mouth: 'smile', stubble: true, jacket: NAVY, shirt: WHITE, tie: '#1c3fa8', prop: 'no493' },
  bertrand: { skin: '#f0bf9a', face: 'round', hair: 'side', hairColor: '#d5d8de', brows: '#9aa0aa', nose: 'round', mouth: 'smile', glasses: 'thin', ears: 6, jacket: SUIT, shirt: WHITE, tie: '#2f5fe0', prop: 'umbrella' },
  arthaud: { skin: '#f4cfae', face: 'oval', hair: 'bob', hairColor: '#3b2a20', brows: '#2e2018', nose: 'small', mouth: 'open', outfit: 'casual', jacket: '#8b2f2f', shirt: '#e9e2d0', prop: 'paper' },

  // ── Les Autres
  bmacron: { skin: '#f4cfae', face: 'oval', hair: 'bobfringe', hairColor: '#f3dc96', brows: '#b89a4c', browStyle: 'arched', eyes: 'wide', eyeColor: '#4d8fe0', nose: 'small', mouth: 'smile', blush: true, outfit: 'coat', jacket: '#8fc1ee', shirt: WHITE, prop: 'coins' },
  villepin: { skin: '#e6b088', face: 'long', hair: 'mane', hairColor: '#dfe2e7', brows: '#8d9199', browStyle: 'arched', nose: 'long', mouth: 'smirk', wrinkles: true, jacket: NAVY, shirt: WHITE, tie: '#5e1c1c', prop: 'lectern' },
  lassalle: { skin: '#e9b48f', face: 'long', hair: 'wavy', hairColor: '#b9bcc4', brows: '#7d8088', thickBrows: true, nose: 'broad', mouth: 'laugh', ears: 6.5, wrinkles: true, outfit: 'open', jacket: '#5a4a3a', shirt: '#e9e2d0', hat: 'beret', prop: 'crook' },
  tondelier: { skin: '#f6d2b3', face: 'oval', hair: 'long', hairColor: '#b98a4e', brows: '#8a6234', nose: 'small', mouth: 'smile', blush: true, outfit: 'coat', jacket: '#2e9e5b', shirt: WHITE, prop: 'zone30' },
  poutou: { skin: '#efbf98', face: 'oval', hair: 'messy', hairColor: '#6b4a2f', brows: '#4a321f', nose: 'round', mouth: 'grin', stubble: true, outfit: 'casual', jacket: '#5a7d5a', shirt: '#e9e2d0', prop: 'megaphone' },
  riner: { skin: '#8d5a3c', face: 'square', hair: 'crop', hairColor: '#1c1512', brows: '#1c1512', thickBrows: true, nose: 'broad', mouth: 'laugh', beard: '#1c1512', outfit: 'judogi', jacket: '#f6f5ef', shirt: '#f6f5ef', prop: 'medal' },

  // ── The guests
  squeezie: { skin: '#f3c9a5', face: 'oval', hair: 'quiff', hairColor: '#5a3d2b', brows: '#3f2a1c', nose: 'small', mouth: 'grin', stubble: true, outfit: 'casual', jacket: '#2b2f3a', shirt: '#e5383b', prop: 'story' },
  durif: { skin: '#efc19c', face: 'long', hair: 'long', hairColor: '#6b5a4a', brows: '#4a3d30', nose: 'long', mouth: 'smile', beard: '#6b5a4a', outfit: 'coat', jacket: '#fbfaf5', shirt: '#e9e2d0', prop: 'panflute' },
  lisnard: { skin: '#efc19c', face: 'long', hair: 'side', hairColor: '#3b2e26', brows: '#2e2520', nose: 'long', mouth: 'smile', ears: 5.5, outfit: 'open', jacket: NAVY, shirt: WHITE, prop: 'mayor' },
  lucet: { skin: '#f4cfae', face: 'oval', hair: 'swept', hairColor: '#e8d29c', brows: '#a88a50', browStyle: 'arched', nose: 'small', mouth: 'smirk', outfit: 'open', jacket: '#232733', shirt: WHITE, prop: 'doorstep' },
  hugo: { skin: '#f4cfae', face: 'oval', hair: 'side', hairColor: '#4a3626', brows: '#3a2a1c', eyes: 'wide', eyeColor: '#5b4030', nose: 'small', mouth: 'smile', stubble: true, outfit: 'open', jacket: '#3a4a6b', shirt: WHITE, prop: 'mic' },
  trump: { skin: '#f3a96b', face: 'square', hair: 'swoop', hairColor: '#f6cf62', brows: '#e9c46a', browStyle: 'angry', eyes: 'narrow', eyePatch: '#fbe0c6', nose: 'round', mouth: 'pout', wrinkles: true, jacket: NAVY, shirt: WHITE, tie: '#e5383b', longTie: true, prop: 'pricetag' },
};

// ───────────────────────────── anatomy ─────────────────────────────

const FACE: Record<Face, { rx: number; ry: number }> = {
  oval: { rx: 27, ry: 31 },
  round: { rx: 30, ry: 30 },
  long: { rx: 25, ry: 33 },
  square: { rx: 28, ry: 31 },
};

function head(look: Look): string {
  const { rx, ry } = FACE[look.face];
  const cy = 56;
  if (look.face === 'square') {
    // A wider jaw than the ellipse gives.
    return `<path d="M${60 - rx} ${cy - 4}C${60 - rx} ${cy - ry - 8} ${60 + rx} ${cy - ry - 8} ${60 + rx} ${cy - 4}L${60 + rx - 1} ${cy + 12}C${60 + rx - 4} ${cy + ry + 3} ${60 - rx + 4} ${cy + ry + 3} ${60 - rx + 1} ${cy + 12}Z" fill="${look.skin}" ${s()}/>`;
  }
  return `<ellipse cx="60" cy="${cy}" rx="${rx}" ry="${ry}" fill="${look.skin}" ${s()}/>`;
}

interface HairParts {
  back?: string;
  front?: string;
}

/** Hairstyles. `f` is the fill + outline attributes for the hair colour. */
function hair(look: Look): HairParts {
  const f = `fill="${look.hairColor}" ${s()}`;
  const strand = (d: string, color = 'rgba(255,255,255,.45)') => `<path d="${d}" ${thin(color, 2)}/>`;
  switch (look.hair) {
    case 'side':
      return { front: `<path d="M31 55C26 30 40 16 62 16c21 0 32 14 27 39-2-10-7-18-15-21-12-4-22 1-30-3-6 5-11 14-13 24z" ${f}/>` };
    case 'macron':
      // Side parting, a little length over the ears and proper sideburns.
      return {
        front: `<path d="M30 62C23 32 38 12 62 12c23 0 35 18 28 50l-4-2c1-12-3-22-12-26-12-5-23 2-31-4-6 5-9 14-9 28z" ${f}/>
          ${strand('M46 27c7-6 17-8 28-5', 'rgba(255,255,255,.3)')}`,
      };
    case 'slick':
      return { front: `<path d="M31 53C25 26 42 11 61 11s36 15 28 42c-2-11-7-18-17-20-8-2-18-2-26 0-8 2-13 9-15 20z" ${f}/>` };
    case 'quiff':
      // Short sides, volume brushed up and back.
      return {
        front: `<path d="M31 54C23 21 44 4 65 7c19 2 31 20 24 47-2-11-7-19-16-21-11-4-23-3-29 1-7 4-11 10-13 20z" ${f}/>
          ${strand('M45 21c9-8 23-9 34-2', 'rgba(255,255,255,.28)')}`,
      };
    case 'thin':
      // A thin dark cap over a high forehead.
      return {
        front: `<path d="M33 48c-1-18 11-28 27-28s28 10 27 28c-4-11-13-19-27-19s-23 8-27 19z" ${f}/>
          <path d="M32 60c-5-8-4-17 1-23-1 8 0 15 1 23z" ${f}/><path d="M88 60c5-8 4-17-1-23 1 8 0 15-1 23z" ${f}/>`,
      };
    case 'balding':
      return {
        front: `<path d="M32 60c-6-8-4-21 4-27-1 9-1 18 0 27z" ${f}/><path d="M88 60c6-8 4-21-4-27 1 9 1 18 0 27z" ${f}/>
          ${strand('M44 28q16-8 32 0', look.hairColor)}${strand('M48 33q12-5 24 0', look.hairColor)}`,
      };
    case 'bob':
      return {
        back: `<path d="M28 52C22 24 44 10 61 10s39 14 33 42l1 22c-2 6-10 6-13 1V50H40v25c-3 5-11 5-13-1z" ${f}/>`,
        front: `<path d="M33 48c1-19 15-28 29-28s24 9 25 28c-7-10-17-15-27-13-10-2-20 3-27 13z" ${f}/>`,
      };
    case 'boblong':
      // Straight, to the shoulders, with a side-swept fringe.
      return {
        back: `<path d="M27 52C21 22 44 9 61 9s40 13 34 43l3 38c-4 7-13 6-15 0V50H39v40c-2 6-11 7-15 0z" ${f}/>`,
        front: `<path d="M33 50c0-20 14-30 28-30s26 10 26 30c-4-9-9-14-16-16-8 4-22 2-30 6-4 2-6 6-8 10z" ${f}/>`,
      };
    case 'bobfringe':
      // A full blonde fringe and a neat bob.
      return {
        back: `<path d="M26 52C20 22 44 8 61 8s41 14 35 44l2 26c-3 8-13 7-15 1V50H39v29c-2 6-12 7-15-1z" ${f}/>`,
        front: `<path d="M32 53c-2-23 13-34 29-34s30 11 27 34c-2-6-5-10-9-12-6 3-12 4-18 4s-13-1-19-4c-5 2-8 6-10 12z" ${f}/>
          ${strand('M50 26v13M60 25v15M70 26v13', 'rgba(23,32,63,.18)')}`,
      };
    case 'swept':
      // Light and layered, down to the jaw, with a long fringe swept to one side.
      return {
        back: `<path d="M27 52C21 23 43 9 61 9s40 14 34 43l2 24c-3 7-12 7-14 1V50H39v27c-2 6-11 6-14-1z" ${f}/>`,
        front: `<path d="M32 57c-4-25 10-37 29-37s33 12 28 37c-2-9-6-15-11-18-13 1-27 4-38 11-4 2-6 4-8 7z" ${f}/>
          ${strand('M44 29c10-6 24-6 35 1', 'rgba(255,255,255,.4)')}${strand('M40 45c9-5 20-7 32-7', 'rgba(23,32,63,.16)')}`,
      };
    case 'shoulder':
      // Dark, shoulder length, parted on the side.
      return {
        back: `<path d="M27 52C21 22 44 9 61 9s40 13 34 43l3 36c-4 7-13 6-15 0V50H39v38c-2 6-11 7-15 0z" ${f}/>`,
        front: `<path d="M33 50c0-20 13-31 28-31s27 11 27 31c-3-9-8-15-15-18-9 2-18 0-26 4-7 3-11 8-14 14z" ${f}/>`,
      };
    case 'long':
      return {
        back: `<path d="M26 52C20 20 44 8 61 8s41 12 35 44l4 50c-8 7-19 5-19-3V52H41v49c0 8-11 10-19 3z" ${f}/>`,
        front: `<path d="M33 50c0-20 15-31 27-31s27 11 27 31c-5-12-15-19-27-20-12 1-22 8-27 20z" ${f}/>`,
      };
    case 'wavy':
    case 'tousled':
      return { front: `<path d="M30 55c-6-20 4-38 20-40 6-5 18-5 24 0 14 2 22 20 16 40-2-10-6-16-12-20-6 2-12-3-18-1-6-2-14 3-18 0-6 5-10 13-12 21z" ${f}/>` };
    case 'messy':
      return { front: `<path d="M30 53l-2-17 7 4 1-16 9 7 5-15 8 11 8-13 5 13 11-8v14l10-1-4 12 2 9c-4-12-12-20-30-21-16 1-26 9-30 21z" ${f}/>` };
    case 'short':
      return { front: `<path d="M32 51c-2-20 12-31 28-31s30 11 28 31c-4-12-14-20-28-20s-24 8-28 20z" ${f}/>` };
    case 'crop':
      return { front: `<path d="M33 47c-1-18 11-27 27-27s28 9 27 27c-5-10-14-15-27-15s-22 5-27 15z" ${f}/>` };
    case 'tuft':
      return {
        front: `<path d="M31 55c-4-18 5-32 21-34-4 6-6 10-5 14-7 2-13 10-16 20z" ${f}/><path d="M89 55c4-18-5-32-21-34 4 6 6 10 5 14 7 2 13 10 16 20z" ${f}/><path d="M50 22c6-4 14-4 20 0-6 2-14 2-20 0z" ${f}/>`,
      };
    case 'mane':
      // A silver mane swept back, falling behind the ears.
      return {
        back: `<path d="M31 70c-9-10-9-28-1-40l7 36z" ${f}/><path d="M89 70c9-10 9-28 1-40l-7 36z" ${f}/>`,
        front: `<path d="M28 56C22 24 40 7 62 7c23 0 37 17 30 49-3-12-9-20-19-22-10-3-21-1-28 1-8 3-14 9-17 21z" ${f}/>
          ${strand('M38 26c9-10 24-12 38-5', 'rgba(23,32,63,.25)')}${strand('M34 36c6-8 15-11 24-11', 'rgba(23,32,63,.25)')}${strand('M62 15c8 1 15 5 20 11', 'rgba(23,32,63,.25)')}`,
      };
    case 'swoop':
      // The famous golden swoop.
      return {
        back: `<path d="M27 62c-7-11-5-26 2-34l5 32z" ${f}/><path d="M93 62c7-11 5-26-2-34l-5 32z" ${f}/>`,
        front: `<path d="M26 50C20 24 40 7 67 7c21 0 32 14 27 38-4-7-10-11-18-12-17-9-35-4-43 10-2 2-5 5-7 7z" ${f}/>
          ${strand('M36 36c10-13 31-17 49-8', '#d9a93a')}${strand('M42 28c10-9 26-11 40-5', '#d9a93a')}`,
      };
    default:
      return {};
  }
}

function nose(kind: Nose): string {
  switch (kind) {
    case 'long':
      return `<path d="M61 55c-3 8-6 13-1 16 2 1 4 0 5-1" fill="none" ${s(2.2)}/>`;
    case 'round':
      return `<path d="M60 58v5" fill="none" ${s(2.2)}/><path d="M55.500 67a4.800 4.800 0 0 0 9 0" fill="none" ${s(2.2)}/>`;
    case 'hook':
      return `<path d="M59 54c4 6 7 12 2 16-2 1-5 0-6-2" fill="none" ${s(2.3)}/>`;
    case 'broad':
      return `<path d="M60 58v6" fill="none" ${s(2.2)}/><path d="M54 68q6 5 12 0" fill="none" ${s(2.3)}/>`;
    default:
      return `<path d="M60 60c-2 5-3 8 1 9" fill="none" ${s(2.2)}/>`;
  }
}

function mouth(kind: Mouth): string {
  switch (kind) {
    case 'smile':
      return `<path d="M50 76q10 8 20 0" fill="none" ${s(2.6)}/>`;
    case 'grin':
      return `<path d="M48 74q12 13 24 0z" fill="${WHITE}" ${s(2.4)}/>`;
    case 'gap':
      // A confident grin with the gap between the front teeth.
      return `<path d="M48 74q12 13 24 0z" fill="${WHITE}" ${s(2.4)}/><path d="M60 74.500v5" fill="none" ${s(1.8)}/>`;
    case 'laugh':
      return `<path d="M46 73q14 18 28 0z" fill="#5b1220" ${s(2.4)}/><path d="M48.500 74.500h23l-2 4h-19z" fill="${WHITE}"/>`;
    case 'open':
      return `<ellipse cx="60" cy="78" rx="8" ry="6.500" fill="#5b1220" ${s(2.4)}/><path d="M55 81q5-3 10 0-5 4-10 0z" fill="#ff7a8a"/>`;
    case 'flat':
      return `<path d="M52 77h16" fill="none" ${s(2.6)}/>`;
    case 'smirk':
      return `<path d="M51 77q11 5 19-4" fill="none" ${s(2.6)}/>`;
    case 'pout':
      return `<path d="M53 77q7-5 14 0q-7 5-14 0z" fill="#e58f76" ${s(2.2)}/>`;
  }
}

function eyes(look: Look): string {
  const kind = look.eyes ?? 'dot';
  const at = (x: number) => {
    if (kind === 'wide') {
      return `<ellipse cx="${x}" cy="57" rx="5" ry="5.400" fill="${WHITE}" ${s(1.8)}/><circle cx="${x + 0.6}" cy="57.400" r="3" fill="${look.eyeColor ?? INK}"/><circle cx="${x + 0.6}" cy="57.400" r="1.400" fill="${INK}"/><circle cx="${x + 1.6}" cy="56" r=".900" fill="#fff"/>`;
    }
    if (kind === 'narrow') {
      return `<path d="M${x - 4.5} 57.500q4.500-4 9 0" fill="none" ${s(2.4)}/><circle cx="${x}" cy="57.800" r="1.700" fill="${INK}"/>`;
    }
    const bag = kind === 'tired' ? `<path d="M${x - 5} 63q5 3 10 0" fill="none" stroke="rgba(23,32,63,.45)" stroke-width="1.800" stroke-linecap="round"/>` : '';
    return `<ellipse cx="${x}" cy="57" rx="3" ry="3.800" fill="${INK}"/><circle cx="${x + 1}" cy="55.500" r="1" fill="#fff"/>${bag}`;
  };
  return at(49) + at(71);
}

function brows(look: Look): string {
  const width = look.thickBrows ? 4.2 : 2.6;
  const d = {
    flat: 'M43 48.500l12-2M65 46.500l12 2',
    angry: 'M42 45.500l13 4.500M65 50l13-4.500',
    arched: 'M42 49q6-6 13-2M65 47q7-4 13 2',
    sad: 'M42 50.500l13-5M65 45.500l13 5',
  }[look.browStyle ?? 'flat'];
  return `<path d="${d}" fill="none" stroke="${look.brows}" stroke-width="${width}" stroke-linecap="round"/>`;
}

function glasses(kind: NonNullable<Look['glasses']>): string {
  if (kind === 'round') {
    return `<g fill="rgba(255,255,255,.35)" ${s(2.4)}><circle cx="48.500" cy="57" r="8.500"/><circle cx="71.500" cy="57" r="8.500"/><path d="M57 57h6" fill="none"/></g>`;
  }
  if (kind === 'rect') {
    return `<g fill="rgba(255,255,255,.35)" ${s(2.6)}><rect x="39.500" y="50.500" width="17" height="12" rx="3"/><rect x="63.500" y="50.500" width="17" height="12" rx="3"/><path d="M56.500 56h7" fill="none"/></g>`;
  }
  return `<g fill="rgba(255,255,255,.3)" ${s(1.6)}><rect x="40" y="51" width="16" height="11" rx="5"/><rect x="64" y="51" width="16" height="11" rx="5"/><path d="M56 56h8" fill="none"/></g>`;
}

const HATS: Record<string, string> = {
  // The Béarn beret.
  beret: `<path d="M29 34c1-15 15-24 32-24s31 7 32 20c-11 6-22 8-33 8s-23-1-31-4z" fill="#232733" ${s()}/><path d="M61 10V5" fill="none" ${s(3)}/>`,
};

function torso(look: Look): string {
  const base = `<path d="M22 134c0-26 12-38 28-40h20c16 2 28 14 28 40z" fill="${look.jacket}" ${s()}/>`;
  const dark = 'rgba(0,0,0,.22)';
  switch (look.outfit ?? 'suit') {
    case 'casual':
      return `${base}<path d="M49 94q11 12 22 0z" fill="${look.shirt}" ${s(2.2)}/>`;
    case 'open':
      // Jacket, open collar, no tie.
      return `${base}<path d="M49 94l11 22 11-22z" fill="${look.shirt}" ${s(2.2)}/>
        <path d="M49 94l11 22-9 4-8-20z" fill="${dark}" ${s(2.2)}/><path d="M71 94l-11 22 9 4 8-20z" fill="${dark}" ${s(2.2)}/>
        <path d="M54 96l6 8 6-8" fill="none" ${s(2)}/>`;
    case 'coat':
      // A neat tailored jacket with a round neckline.
      return `${base}<path d="M48 94q12 12 24 0l3 5q-15 13-30 0z" fill="${look.shirt}" ${s(2.2)}/>
        <path d="M60 106v28" fill="none" stroke="rgba(23,32,63,.35)" stroke-width="2"/>
        <circle cx="60" cy="114" r="2.200" fill="#ffd23f" ${s(1.4)}/><circle cx="60" cy="125" r="2.200" fill="#ffd23f" ${s(1.4)}/>`;
    case 'judogi':
      return `<path d="M18 134c0-27 13-39 30-41h24c17 2 30 14 30 41z" fill="${look.jacket}" ${s()}/>
        <path d="M49 93l15 31M71 93l-19 31" fill="none" ${s(2.6)}/><path d="M49 93l11 14 11-14" fill="${look.skin}" ${s(2.2)}/>
        <path d="M20 121h80v10H20z" fill="#17181d" ${s(2.2)}/>`;
    default: {
      const tie = look.tie
        ? look.longTie
          ? `<path d="M57 100h6l4 36h-14z" fill="${look.tie}" ${s(2)}/>`
          : `<path d="M57 100h6l3 26-6 6-6-6z" fill="${look.tie}" ${s(2)} transform="rotate(${look.tieTilt ?? 0} 60 100)"/>`
        : '';
      return `${base}<path d="M49 94l11 20 11-20z" fill="${look.shirt}" ${s(2.2)}/>${tie}
        <path d="M49 94l11 20-9 6-8-20z" fill="${dark}" ${s(2.2)}/><path d="M71 94l-11 20 9 6 8-20z" fill="${dark}" ${s(2.2)}/>`;
    }
  }
}

function figure(look: Look): string {
  const { rx, ry } = FACE[look.face];
  const ear = look.ears ?? 5;
  const parts = hair(look);

  return `
    <rect x="56" y="126" width="8" height="24" rx="2" fill="${WOOD}" ${s(2.2)}/>
    ${parts.back ?? ''}
    ${torso(look)}
    ${look.scarf ? `<path d="M44 92q16 12 32 0l3 8q-19 13-38 0z" fill="${look.scarf}" ${s(2.2)}/><path d="M68 100l8 22-9 3-5-22z" fill="${look.scarf}" ${s(2.2)}/>` : ''}
    <rect x="52" y="80" width="16" height="15" rx="4" fill="${look.skin}" ${s(2.4)}/>
    <circle cx="${60 - rx}" cy="59" r="${ear}" fill="${look.skin}" ${s(2.4)}/><circle cx="${60 + rx}" cy="59" r="${ear}" fill="${look.skin}" ${s(2.4)}/>
    ${head(look)}
    ${look.beard ? `<path d="M${60 - rx + 2} 62c1 18 9 28 ${rx - 2} 28s${rx - 3}-10 ${rx - 2}-28c-3 8-8 11-14 9-4-3-18-3-22 0-6 2-11-1-14-9z" fill="${look.beard}" opacity=".92"/>` : ''}
    ${look.stubble ? `<path d="M${60 - rx + 3} 66q${rx - 3} ${ry - 2} ${2 * rx - 6} 0q-${rx - 3} ${ry - 12}-${2 * rx - 6} 0z" fill="rgba(60,45,35,.22)"/>` : ''}
    ${look.blush ? `<circle cx="42" cy="69" r="5.500" fill="#ff7f8f" opacity=".45"/><circle cx="78" cy="69" r="5.500" fill="#ff7f8f" opacity=".45"/>` : look.beard ? '' : `<circle cx="42" cy="69" r="5" fill="#ff8f8f" opacity=".28"/><circle cx="78" cy="69" r="5" fill="#ff8f8f" opacity=".28"/>`}
    ${look.eyePatch ? `<ellipse cx="49" cy="57" rx="8.500" ry="7" fill="${look.eyePatch}"/><ellipse cx="71" cy="57" rx="8.500" ry="7" fill="${look.eyePatch}"/>` : ''}
    ${look.wrinkles ? `<path d="M50 38q10-3 20 0M52 43q8-2 16 0" ${thin('rgba(23,32,63,.3)', 1.6)}/><path d="M45 69q-2 5 0 9M75 69q2 5 0 9" ${thin('rgba(23,32,63,.3)', 1.6)}/>` : ''}
    ${parts.front ?? ''}
    ${look.hat ? HATS[look.hat] : ''}
    ${eyes(look)}
    ${brows(look)}
    ${nose(look.nose ?? 'small')}
    ${mouth(look.mouth)}
    ${look.glasses ? glasses(look.glasses) : ''}
    ${look.prop ? PROPS[look.prop] : ''}`;
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

/** Anonymous campaigners, tinted with the camp that sends them. */
function campExtra(kind: string, camp: CampId): string {
  const color = CAMPS[camp].color;
  if (kind === 'militant') {
    return `${plainBody(color)}
      <path d="M34 50c0-14 11-23 26-23s26 9 26 23z" fill="${color}" ${s()}/><path d="M30 50h46c8 0 14 2 18 6H30z" fill="${color}" ${s()}/>
      <path d="M51 74q9 6 18 0" fill="none" ${s(2.4)}/>
      <g transform="rotate(-12 28 108)"><path d="M12 96h26v30H12z" fill="${PAPER}" ${s(2.2)}/><path d="M17 104h16M17 110h16M17 116h10" ${thin(color, 2.2)}/></g>`;
  }
  if (kind === 'placard') {
    return `${plainBody('#4a5263')}
      <path d="M35 52c-2-15 9-26 25-26s27 11 25 26c-4-9-13-14-25-14s-21 5-25 14z" fill="#5c4634" ${s()}/>
      <path d="M52 76h16" fill="none" ${s(2.4)}/>
      <path d="M60 148V92" fill="none" ${s(4)}/>
      <rect x="20" y="84" width="80" height="48" rx="4" fill="${color}" ${s(3)}/>
      <path d="M60 94v20" fill="none" stroke="${PAPER}" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="123" r="4" fill="${PAPER}"/>`;
  }
  if (kind === 'pundit') {
    return `${plainBody('#7d8597')}
      <path d="M57 98h6l2 24-5 5-5-5z" fill="${color}" ${s(2)}/>
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

function busSvg(camp: CampId): string {
  const color = CAMPS[camp].color;
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

/** Everything `portraitSvg` can draw: the 24 roster figures, the guest and the two reinforcements. */
export const PORTRAIT_IDS = [...Object.keys(LOOKS), 'crs', 'pompiers'];

export interface PortraitOptions {
  /** Rendered width in CSS pixels; height follows the drawing's ratio. */
  size?: number;
  /** White die-cut border, like a sticker (default true). */
  sticker?: boolean;
  /** Makes filter ids unique when the same portrait appears twice on a page. */
  uid?: string;
  /** Accessible name; omit for a decorative portrait. */
  label?: string;
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

/** Caricature of a named figure, or of one of the two reinforcements. */
export function portraitSvg(id: string, options: PortraitOptions = {}): string {
  const street = STREET[id];
  if (street) return wrap(street(), [120, 150], id, options);
  const look = LOOKS[id];
  if (!look) throw new Error(`No portrait for ${id}`);
  return wrap(figure(look), [120, 150], id, options);
}

/** Extras. Campaigners take the colour of the camp that sends them; street figures have their own. */
export function extraSvg(kind: string, camp: CampId, options: PortraitOptions = {}): string {
  if (kind === 'bus') return wrap(busSvg(camp), [180, 124], `bus-${camp}`, options);
  if (kind === 'auto') return wrap(autoSvg(), [164, 104], 'auto', options);
  if (kind === 'tracteur') return wrap(tracteurSvg(), [166, 120], 'tracteur', options);
  if (kind === 'cnews') return wrap(cnewsSvg(), [172, 114], 'cnews', options);
  if (kind === 'poubelle') return wrap(poubelleSvg(), [96, 118], 'poubelle', options);
  if (kind === 'cat') return wrap(catSvg(), [80, 72], 'cat', options);
  if (STREET[kind] || LOOKS[kind]) return portraitSvg(kind, options);
  return wrap(campExtra(kind, camp), [120, 150], `${kind}-${camp}`, options);
}

/** SVG for any enemy id used by the simulation ("militant", "star:macron", "trump"…). */
export function enemySvg(enemyId: string, camp: CampId, options: PortraitOptions = {}): string {
  return enemyId.startsWith('star:') ? portraitSvg(enemyId.slice(5), options) : extraSvg(enemyId, camp, options);
}
