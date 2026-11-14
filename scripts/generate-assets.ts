/**
 * Renders the static artwork that cannot be produced at build time, straight
 * from the same SVG puppets the game uses:
 *
 *   public/og.png                 1200×630 social card (Open Graph / Twitter)
 *   public/favicon-32.png         PNG fallbacks of public/favicon.svg
 *   public/apple-touch-icon.png
 *   public/icon-192.png, icon-512.png
 *   docs/cast.png                 the full cast, used by the README
 *   public/og/<figure>.jpg        one social card per named figure (their page)
 *
 *   PW_CHANNEL=msedge npm run assets
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAMP_IDS } from '../src/game/data/types';
import { CAMPS, UNITS } from '../src/game/data/units';
import { FIGURE_IDS, figureSlug } from '../src/lib/pages';
import { extraSvg, headUrl, portraitSvg, type PortraitOptions } from '../src/game/render/portraits';
import { GAME_STRINGS } from '../src/i18n/game';
import { fontFaces, launch } from './browser';

const root = resolve(import.meta.dirname, '..');
const g = GAME_STRINGS.en;
mkdirSync(resolve(root, 'docs'), { recursive: true });
mkdirSync(resolve(root, 'public/og'), { recursive: true });
const fr = GAME_STRINGS.fr;

/** A puppet with its photo head inlined: the pages below are rendered from a string, with no server to fetch /heads from. */
function puppet(id: string, options: PortraitOptions): string {
  const url = headUrl(id);
  const headHref = url ? `data:image/webp;base64,${readFileSync(resolve(root, 'public', url.slice(1))).toString('base64')}` : undefined;
  return portraitSvg(id, { ...options, headHref });
}

const BASE_CSS = `${fontFaces()}
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Public Sans', sans-serif; color: #f3ecdd; }
  .display { font-family: Anton, sans-serif; font-weight: 400; text-transform: uppercase; line-height: 1; }`;

function html(body: string, css: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

function socialCard(): string {
  const posters = CAMP_IDS.map((camp, i) => {
    const leader = CAMPS[camp].roster[CAMPS[camp].roster.length - 1];
    const on = camp === 'centre' ? '#17203f' : '#fffdf6';
    return `<div class="poster p${i}">${puppet(leader, { size: 150, uid: 'og' })}
      <span class="display camp" style="background:${CAMPS[camp].color};color:${on}">${g.camps[camp].short}</span></div>`;
  }).join('');
  return html(
    `<main>
      <div class="copy">
        <span class="kicker">Free satirical game · FR / EN</span>
        <h1 class="display">Politique<br><span>2027</span></h1>
        <p>Left, Centre, Right or the Others: pick your camp and hold the steps of the Élysée.</p>
        <span class="url">politique2027.mbonnici.fr</span>
      </div>
      <div class="board">${posters}</div>
      <i class="flag"></i>
    </main>`,
    `main { position: relative; width: 1200px; height: 630px; display: flex; align-items: center; gap: 40px; padding: 0 64px;
        background-color: #141a36; background-image: radial-gradient(rgba(243,236,221,.16) 2px, transparent 2.2px); background-size: 16px 16px; overflow: hidden; }
      .copy { flex: 1; }
      .kicker { display: inline-block; padding: 7px 14px; background: #f3ecdd; color: #141a36; font-weight: 800; font-size: 19px;
        letter-spacing: .06em; text-transform: uppercase; transform: rotate(-1.5deg); }
      h1 { margin: 18px 0 0; font-size: 150px; letter-spacing: .01em; }
      h1 span { display: inline-block; margin-top: 10px; padding: 6px 24px 0; background: #d62b30; color: #fffdf6;
        border: 6px solid #f3ecdd; box-shadow: 9px 9px 0 #05081a; transform: rotate(-2.5deg); }
      p { max-width: 520px; margin: 34px 0 18px; font-size: 29px; font-weight: 600; line-height: 1.3; }
      .url { font-weight: 800; font-size: 22px; color: #ffd23f; }
      .board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 14px; background: #262f5c; border: 5px solid #f3ecdd; border-radius: 12px;
        box-shadow: 9px 9px 0 #05081a; transform: rotate(2deg); color: #17203f; }
      .poster { display: flex; flex-direction: column; align-items: center; width: 190px; padding: 8px 6px 6px;
        background: #fffdf6; border: 3px solid #17203f; }
      .poster svg { height: 196px; width: auto; }
      .p0 { transform: rotate(-2deg); } .p3 { transform: rotate(1.5deg); }
      .camp { width: 100%; margin-top: 4px; padding: 5px 0 1px; font-size: 26px; text-align: center; }
      .flag { position: absolute; left: 0; right: 0; bottom: 0; height: 18px; border-top: 5px solid #05081a;
        background: linear-gradient(90deg, #2f5fe0 0 33.3%, #fffdf6 33.3% 66.6%, #e5383b 66.6%); }`,
  );
}

function castSheet(): string {
  const rows = CAMP_IDS.map((camp) => {
    const on = camp === 'centre' ? '#17203f' : '#fffdf6';
    const figures = CAMPS[camp].roster
      .map(
        (id) => `<figure>${puppet(id, { size: 122, uid: 'sheet' })}
          <figcaption><b>${g.figures[id].name}</b><i>${g.figures[id].power}</i></figcaption></figure>`,
      )
      .join('');
    return `<section><h2 class="display"><span style="background:${CAMPS[camp].color};color:${on}">${g.camps[camp].name}</span>
      <small>${g.camps[camp].motto}</small></h2><div class="row">${figures}</div></section>`;
  }).join('');
  const width: Record<string, number> = { bus: 170, tracteur: 160, cnews: 164, auto: 150, cat: 70, poubelle: 84, vache: 170 };
  const sheet = (ids: string[]) =>
    ids
      .map(
        (kind) =>
          `<figure>${g.figures[kind] ? puppet(kind, { size: 112, uid: 'sheet' }) : extraSvg(kind, { size: width[kind] ?? 112, uid: 'sheet' })}
          <figcaption><b>${g.figures[kind]?.name ?? g.extras[kind]}</b></figcaption></figure>`,
      )
      .join('');
  return html(
    `<main>${rows}<section><h2 class="display"><span style="background:#f3ecdd;color:#141a36">Guests, reinforcements and extras</span></h2>
      <div class="row extras">${sheet(['trump', 'niel', 'hugo', 'lucet', 'squeezie'])}</div>
      <div class="row extras">${sheet(['crs', 'pompiers', 'radar', 'samu', 'boulangere', 'profs', 'conseil'])}</div>
      <div class="row extras">${sheet(['lyceen', 'trottinette', 'gilet', 'syndicat', 'smicard', 'agriculteur', 'impots'])}</div>
      <div class="row extras">${sheet(['patron', 'militant', 'placard', 'pundit', 'auto', 'poubelle', 'cat'])}</div>
      <div class="row extras">${sheet(['cnews', 'tracteur', 'vache', 'bus'])}</div></section></main>`,
    `main { width: 1280px; padding: 36px 40px 28px; background-color: #141a36;
        background-image: radial-gradient(rgba(243,236,221,.13) 1.6px, transparent 1.8px); background-size: 14px 14px; }
      section { margin-bottom: 26px; }
      h2 { display: flex; align-items: center; gap: 18px; margin: 0 0 10px; font-size: 40px; }
      h2 span { padding: 6px 14px 0; border: 4px solid #f3ecdd; transform: rotate(-1.5deg); }
      h2 small { font: italic 600 19px 'Public Sans', sans-serif; text-transform: none; }
      .row { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; align-items: end; }
      .extras { display: flex; justify-content: flex-start; gap: 34px; margin-bottom: 14px; }
      figure { margin: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
      figcaption b { display: block; font-size: 16px; }
      figcaption i { display: block; font-size: 13.5px; color: #b9c0dc; }`,
  );
}

/** A figure's social card: the puppet, the name, the title and the power (in French, the site's default). */
function figureCard(id: string): string {
  const text = fr.figures[id];
  const unit = UNITS[id];
  const camp = unit && unit.camp !== 'neutre' ? unit.camp : null;
  const color = camp ? CAMPS[camp].color : '#ffd23f';
  const on = camp && camp !== 'centre' ? '#fffdf6' : '#17203f';
  const label = camp ? fr.camps[camp].name : text.party;
  return html(
    `<main>
      <div class="art" style="--c:${color}">${puppet(id, { size: 360, uid: 'card' })}</div>
      <div class="copy">
        <span class="display camp" style="background:${color};color:${on}">${label}</span>
        <h1 class="display">${text.name}</h1>
        <p class="title">« ${text.title} »</p>
        <p class="power">${text.power}</p>
        <span class="url">Politique 2027 · politique2027.mbonnici.fr</span>
      </div>
      <i class="flag"></i>
    </main>`,
    `main { position: relative; width: 1200px; height: 630px; display: flex; align-items: center; gap: 56px; padding: 0 70px;
        background-color: #141a36; background-image: radial-gradient(rgba(243,236,221,.16) 2px, transparent 2.2px); background-size: 16px 16px; overflow: hidden; }
      .art { flex: none; display: grid; place-items: center; width: 430px; height: 430px; border-radius: 50%;
        background: radial-gradient(circle, var(--c) 0 62%, transparent 63%); }
      .art svg { width: 360px; height: auto; }
      .copy { flex: 1; min-width: 0; }
      .camp { display: inline-block; padding: 8px 16px 2px; border: 4px solid #f3ecdd; font-size: 30px; transform: rotate(-1.5deg); }
      h1 { margin: 22px 0 0; font-size: 88px; letter-spacing: .01em; }
      .title { margin: 14px 0 0; font: italic 600 32px 'Public Sans', sans-serif; color: #b9c0dc; }
      .power { margin: 18px 0 30px; font-weight: 800; font-size: 34px; color: #ffd23f; }
      .url { font-weight: 800; font-size: 22px; color: #f3ecdd; }
      .flag { position: absolute; left: 0; right: 0; bottom: 0; height: 18px; border-top: 5px solid #05081a;
        background: linear-gradient(90deg, #2f5fe0 0 33.3%, #fffdf6 33.3% 66.6%, #e5383b 66.6%); }`,
  );
}

function icon(size: number, padded = false): string {
  const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');
  const inner = padded ? Math.round(size * 0.8) : size;
  return html(
    `<main>${svg}</main>`,
    `main { width: ${size}px; height: ${size}px; display: grid; place-items: center; background: ${padded ? '#f3ecdd' : 'transparent'}; }
     svg { width: ${inner}px; height: ${inner}px; }`,
  );
}

const browser = await launch();
try {
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  async function shoot(markup: string, file: string, transparent = false): Promise<void> {
    await page.setContent(markup, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('main').screenshot({ path: resolve(root, file), omitBackground: transparent });
    console.log(file);
  }

  await page.setViewportSize({ width: 1300, height: 1000 });
  await shoot(socialCard(), 'public/og.png');
  await shoot(castSheet(), 'docs/cast.png');
  for (const id of FIGURE_IDS) {
    await page.setContent(figureCard(id), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const file = `public/og/${figureSlug(id)}.jpg`;
    await page.locator('main').screenshot({ path: resolve(root, file), type: 'jpeg', quality: 82 });
    console.log(file);
  }
  await shoot(icon(32), 'public/favicon-32.png', true);
  await shoot(icon(180, true), 'public/apple-touch-icon.png');
  await shoot(icon(192, true), 'public/icon-192.png');
  await shoot(icon(512, true), 'public/icon-512.png');
} finally {
  await browser.close();
}
