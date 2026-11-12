/**
 * Renders the static artwork that cannot be produced at build time, straight
 * from the same SVG puppets the game uses:
 *
 *   public/og.png                 1200×630 social card (Open Graph / Twitter)
 *   public/favicon-32.png         PNG fallbacks of public/favicon.svg
 *   public/apple-touch-icon.png
 *   public/icon-192.png, icon-512.png
 *   docs/cast.png                 the full cast, used by the README
 *
 *   PW_CHANNEL=msedge npm run assets
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAMP_IDS } from '../src/game/data/types';
import { CAMPS } from '../src/game/data/units';
import { extraSvg, portraitSvg } from '../src/game/render/portraits';
import { GAME_STRINGS } from '../src/i18n/game';
import { fontFaces, launch } from './browser';

const root = resolve(import.meta.dirname, '..');
const g = GAME_STRINGS.en;
mkdirSync(resolve(root, 'docs'), { recursive: true });

const BASE_CSS = `${fontFaces()}
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Public Sans', sans-serif; color: #17203f; }
  .display { font-family: Anton, sans-serif; font-weight: 400; text-transform: uppercase; line-height: 1; }`;

function html(body: string, css: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

function socialCard(): string {
  const posters = CAMP_IDS.map((camp, i) => {
    const leader = CAMPS[camp].roster[5];
    const on = camp === 'centre' ? '#17203f' : '#fffdf6';
    return `<div class="poster p${i}">${portraitSvg(leader, { size: 150, uid: 'og' })}
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
        background-color: #f3ecdd; background-image: radial-gradient(rgba(23,32,63,.2) 2px, transparent 2.2px); background-size: 16px 16px; overflow: hidden; }
      .copy { flex: 1; }
      .kicker { display: inline-block; padding: 7px 14px; background: #17203f; color: #f3ecdd; font-weight: 800; font-size: 19px;
        letter-spacing: .06em; text-transform: uppercase; transform: rotate(-1.5deg); }
      h1 { margin: 18px 0 0; font-size: 150px; letter-spacing: .01em; }
      h1 span { display: inline-block; margin-top: 10px; padding: 6px 24px 0; background: #e5383b; color: #fffdf6;
        border: 6px solid #17203f; box-shadow: 9px 9px 0 #17203f; transform: rotate(-2.5deg); }
      p { max-width: 520px; margin: 34px 0 18px; font-size: 29px; font-weight: 600; line-height: 1.3; }
      .url { font-weight: 800; font-size: 22px; }
      .board { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 14px; background: #9aa3b8; border: 5px solid #17203f; border-radius: 12px;
        box-shadow: 9px 9px 0 #17203f; transform: rotate(2deg); }
      .poster { display: flex; flex-direction: column; align-items: center; width: 190px; padding: 8px 6px 6px;
        background: #fffdf6; border: 3px solid #17203f; }
      .poster svg { height: 196px; width: auto; }
      .p0 { transform: rotate(-2deg); } .p3 { transform: rotate(1.5deg); }
      .camp { width: 100%; margin-top: 4px; padding: 5px 0 1px; font-size: 26px; text-align: center; }
      .flag { position: absolute; left: 0; right: 0; bottom: 0; height: 18px; border-top: 5px solid #17203f;
        background: linear-gradient(90deg, #2f5fe0 0 33.3%, #fffdf6 33.3% 66.6%, #e5383b 66.6%); }`,
  );
}

function castSheet(): string {
  const rows = CAMP_IDS.map((camp) => {
    const on = camp === 'centre' ? '#17203f' : '#fffdf6';
    const figures = CAMPS[camp].roster
      .map(
        (id) => `<figure>${portraitSvg(id, { size: 132, uid: 'sheet' })}
          <figcaption><b>${g.figures[id].name}</b><i>${g.figures[id].power}</i></figcaption></figure>`,
      )
      .join('');
    return `<section><h2 class="display"><span style="background:${CAMPS[camp].color};color:${on}">${g.camps[camp].name}</span>
      <small>${g.camps[camp].motto}</small></h2><div class="row">${figures}</div></section>`;
  }).join('');
  const width: Record<string, number> = { bus: 170, tracteur: 160, auto: 150, cat: 70, poubelle: 84 };
  const sheet = (ids: string[]) =>
    ids
      .map(
        (kind, i) =>
          `<figure>${extraSvg(kind, CAMP_IDS[i % 3], { size: width[kind] ?? 112, uid: 'sheet' })}
          <figcaption><b>${g.figures[kind]?.name ?? g.extras[kind]}</b></figcaption></figure>`,
      )
      .join('');
  return html(
    `<main>${rows}<section><h2 class="display"><span style="background:#17203f;color:#f3ecdd">Guests, reinforcements and extras</span></h2>
      <div class="row extras">${sheet(['trump', 'hugo', 'squeezie', 'durif', 'crs', 'pompiers'])}</div>
      <div class="row extras">${sheet(['lyceen', 'gilet', 'agriculteur', 'impots', 'patron', 'auto', 'poubelle'])}</div>
      <div class="row extras">${sheet(['militant', 'placard', 'pundit', 'tracteur', 'bus', 'cat'])}</div></section></main>`,
    `main { width: 1280px; padding: 36px 40px 28px; background-color: #f3ecdd;
        background-image: radial-gradient(rgba(23,32,63,.16) 1.6px, transparent 1.8px); background-size: 14px 14px; }
      section { margin-bottom: 26px; }
      h2 { display: flex; align-items: center; gap: 18px; margin: 0 0 10px; font-size: 40px; }
      h2 span { padding: 6px 14px 0; border: 4px solid #17203f; transform: rotate(-1.5deg); }
      h2 small { font: italic 600 19px 'Public Sans', sans-serif; text-transform: none; }
      .row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; align-items: end; }
      .extras { display: flex; justify-content: flex-start; gap: 34px; margin-bottom: 14px; }
      figure { margin: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
      figcaption b { display: block; font-size: 16px; }
      figcaption i { display: block; font-size: 13.5px; color: #485070; }`,
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
  await shoot(icon(32), 'public/favicon-32.png', true);
  await shoot(icon(180, true), 'public/apple-touch-icon.png');
  await shoot(icon(192, true), 'public/icon-192.png');
  await shoot(icon(512, true), 'public/icon-512.png');
} finally {
  await browser.close();
}
