/**
 * Cuts the photo heads out of freely licensed pictures from Wikimedia Commons.
 *
 *   npm run heads            rebuild every head listed in scripts/heads.json
 *   npm run heads -- macron  rebuild one figure (or "macron-angry")
 *   npm run heads -- --review   also write .cache/heads/review.jpg (all heads on one sheet)
 *
 * For each entry: download the picture (a 960 px rendition, cached in .cache/heads),
 * crop an oval around the head (`box` = left, top, right and chin as fractions of the
 * picture), remove a plain background by flooding in from the edge of the oval
 * (`tol` = colour tolerance, 0 to keep the oval as is; `grad` = edges the flood may
 * not cross), keep the biggest blob, and draw an ink outline around it. The white
 * sticker edge is added by the SVG filter of the puppet (see portraits.ts).
 *
 * Outputs public/heads/<id>-<expression>.webp (committed: the build never needs the
 * network) and src/game/data/photos.ts (which faces exist, and the credits shown in
 * the legal notice). The faces are never retouched: an "angry" or "hurt" head is
 * another real photo, chosen for its expression.
 *
 * `sharp` comes with Astro (its image service), so it is not listed separately.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';

interface Entry {
  id: string;
  expr: 'neutral' | 'angry' | 'hurt';
  file: string;
  box: [number, number, number, number];
  tol?: number;
  grad?: number;
  rx?: number;
  ry?: number;
  dx?: number;
  dy?: number;
  side?: number;
  sampleTo?: number;
  floodBottom?: number;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const ROOT = process.cwd();
const CONFIG = path.join(ROOT, 'scripts/heads.json');
const CACHE = path.join(ROOT, '.cache/heads');
const OUT = path.join(ROOT, 'public/heads');
const MANIFEST = path.join(ROOT, 'src/game/data/photos.ts');
const UA = 'politique2027-asset-script/1.0';
const OUT_W = 256;
const OUT_H = 320;
const PAD = 16;
const INK = [23, 32, 63];
const INK_R = 6.5;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url: string): Promise<Response> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res;
    await wait(4000 * (i + 1)); // Wikimedia rate-limits bursts
  }
  throw new Error(`Download failed: ${url}`);
}

async function download(title: string): Promise<string> {
  const clean = title.replace(/^File:/, '').replace(/[^\w.-]+/g, '_');
  const name = clean.length > 80 ? `${clean.slice(0, 60)}_${Buffer.from(clean).toString('base64url').slice(-12)}${path.extname(clean)}` : clean;
  const file = path.join(CACHE, name);
  try {
    await fs.access(file);
    return file;
  } catch {
    // not cached yet
  }
  const api = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ action: 'query', titles: title, prop: 'imageinfo', iiprop: 'url', iiurlwidth: '960', format: 'json' })}`;
  const data = (await (await fetchRetry(api)).json()) as { query: { pages: Record<string, { imageinfo?: { thumburl?: string; url: string }[] }> } };
  const info = Object.values(data.query.pages)[0].imageinfo?.[0];
  if (!info) throw new Error(`Not on Commons: ${title}`);
  const buffer = Buffer.from(await (await fetchRetry(info.thumburl ?? info.url)).arrayBuffer());
  await fs.mkdir(CACHE, { recursive: true });
  await fs.writeFile(file, buffer);
  return file;
}

/** Squared Euclidean distance to the nearest set pixel (Felzenszwalb & Huttenlocher). */
function edt(mask: ArrayLike<number>, w: number, h: number): Float64Array {
  const INF = 1e12;
  const n = Math.max(w, h);
  const f = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const grid = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) grid[i] = mask[i] ? 0 : INF;
  const pass = (len: number, get: (q: number) => number, set: (q: number, value: number) => void) => {
    for (let q = 0; q < len; q++) f[q] = get(q);
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    for (let q = 0; q < len; q++) set(q, d[q]);
  };
  for (let x = 0; x < w; x++) pass(h, (y) => grid[y * w + x], (y, value) => (grid[y * w + x] = value));
  for (let y = 0; y < h; y++) pass(w, (x) => grid[y * w + x], (x, value) => (grid[y * w + x] = value));
  return grid;
}

/** Crop around the head, resized to OUT_W × OUT_H, as raw RGBA. */
async function crop(src: string, entry: Entry): Promise<{ raw: Buffer; scale: number; hw: number; hh: number }> {
  const meta = await sharp(src).metadata();
  const W = meta.width!;
  const H = meta.height!;
  const [l, t, r, b] = entry.box;
  const hw = (r - l) * W;
  const hh = (b - t) * H;
  const scale = (OUT_W * 0.8) / hw; // ear to ear fills 80% of the width
  const cropW = OUT_W / scale;
  const cropH = OUT_H / scale;
  const ext = Math.ceil(Math.max(cropW, cropH));
  const extended = await sharp(src).ensureAlpha().extend({ top: ext, bottom: ext, left: ext, right: ext, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const { data, info } = await sharp(extended)
    .extract({
      left: Math.round(((l + r) / 2) * W - cropW / 2 + ext),
      top: Math.round(((t + b) / 2) * H - cropH / 2 + ext),
      width: Math.round(cropW),
      height: Math.round(cropH),
    })
    .resize(OUT_W, OUT_H)
    .modulate({ saturation: 1.08 })
    .linear(1.04, -4)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== OUT_W || info.height !== OUT_H || info.channels !== 4) throw new Error(`Unexpected crop ${JSON.stringify(info)}`);
  return { raw: data, scale, hw, hh };
}

/** Pixels of the oval that are not background: a flood from the oval's edge through background-like colours. */
function mask(raw: Buffer, entry: Entry, scale: number, hw: number, hh: number): Uint8Array {
  const w = OUT_W;
  const h = OUT_H;
  const ecx = w / 2 + (entry.dx ?? 0) * w;
  const ecy = h / 2 + (entry.dy ?? 0) * h;
  const erx = ((hw * scale) / 2) * (entry.rx ?? 1.06);
  const ery = ((hh * scale) / 2) * (entry.ry ?? 1.1);
  const inside = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - ecx) / erx;
      const ny = (y - ecy) / ery;
      if (nx * nx + ny * ny <= 1 && raw[(y * w + x) * 4 + 3] > 0) inside[y * w + x] = 1;
    }
  }
  const fg = new Uint8Array(inside);
  const tol = entry.tol ?? 0;
  if (tol > 0) {
    // Background colours: the outer columns and the top band of the crop, outside the oval.
    const samples: number[][] = [];
    const side = entry.side ?? 0.1;
    for (let y = 0; y < h * (entry.sampleTo ?? 0.5); y += 2) {
      for (let x = 0; x < w; x += 2) {
        const outer = x < w * side || x > w * (1 - side) || y < h * 0.05;
        const i = (y * w + x) * 4;
        if (outer && !inside[y * w + x] && raw[i + 3] > 0) samples.push([raw[i], raw[i + 1], raw[i + 2]]);
      }
    }
    // k-means down to a handful of colours.
    let centers = samples.filter((_, i) => i % Math.max(1, Math.floor(samples.length / 8)) === 0).slice(0, 8);
    for (let it = 0; it < 8; it++) {
      const sums = centers.map(() => [0, 0, 0, 0]);
      for (const c of samples) {
        let bi = 0;
        let bd = Infinity;
        centers.forEach((k, j) => {
          const dd = (c[0] - k[0]) ** 2 + (c[1] - k[1]) ** 2 + (c[2] - k[2]) ** 2;
          if (dd < bd) {
            bd = dd;
            bi = j;
          }
        });
        const sm = sums[bi];
        sm[0] += c[0];
        sm[1] += c[1];
        sm[2] += c[2];
        sm[3]++;
      }
      centers = sums.filter((sm) => sm[3] > samples.length * 0.03).map((sm) => [sm[0] / sm[3], sm[1] / sm[3], sm[2] / sm[3]]);
    }
    // The flood stops at sharp edges (hair against a wall of the same colour).
    const lum = new Float32Array(w * h);
    for (let p = 0; p < w * h; p++) lum[p] = raw[p * 4] * 0.3 + raw[p * 4 + 1] * 0.59 + raw[p * 4 + 2] * 0.11;
    const grad = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const p = y * w + x;
        const gx = lum[p + 1 - w] + 2 * lum[p + 1] + lum[p + 1 + w] - lum[p - 1 - w] - 2 * lum[p - 1] - lum[p - 1 + w];
        const gy = lum[p + w - 1] + 2 * lum[p + w] + lum[p + w + 1] - lum[p - w - 1] - 2 * lum[p - w] - lum[p - w + 1];
        grad[p] = Math.sqrt(gx * gx + gy * gy) / 4;
      }
    }
    const gradTol = entry.grad ?? 40;
    const near = (p: number) => {
      if (grad[p] > gradTol) return false;
      const i = p * 4;
      let best = Infinity;
      for (const [r2, g2, b2] of centers) best = Math.min(best, (raw[i] - r2) ** 2 + (raw[i + 1] - g2) ** 2 + (raw[i + 2] - b2) ** 2);
      return Math.sqrt(best) < tol;
    };
    const bottom = h * (entry.floodBottom ?? 0.7);
    const seen = new Uint8Array(w * h);
    const queue: number[] = [];
    for (let y = 0; y < bottom; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (!inside[p]) continue;
        const edge = !inside[p - 1] || !inside[p + 1] || !inside[p - w] || !inside[p + w];
        if (edge && near(p)) {
          seen[p] = 1;
          queue.push(p);
        }
      }
    }
    while (queue.length) {
      const p = queue.pop()!;
      fg[p] = 0;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q] || !inside[q] || Math.floor(q / w) > bottom + 20) continue;
        seen[q] = 1;
        if (near(q)) queue.push(q);
      }
    }
    // Opening (radius 2): drop thin leftovers of background.
    const dOut = edt(fg.map((v) => (v ? 0 : 1)), w, h);
    for (let p = 0; p < w * h; p++) if (fg[p] && dOut[p] <= 4) fg[p] = 0;
    const dIn = edt(fg, w, h);
    for (let p = 0; p < w * h; p++) if (dIn[p] <= 4 && inside[p]) fg[p] = 1;
  }
  // Keep the biggest blob only.
  const label = new Int32Array(w * h);
  let best = 0;
  let bestSize = 0;
  let n = 0;
  for (let p0 = 0; p0 < w * h; p0++) {
    if (!fg[p0] || label[p0]) continue;
    n++;
    let size = 0;
    const stack = [p0];
    label[p0] = n;
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q >= 0 && q < w * h && fg[q] && !label[q]) {
          label[q] = n;
          stack.push(q);
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = n;
    }
  }
  for (let p = 0; p < w * h; p++) if (fg[p] && label[p] !== best) fg[p] = 0;
  return fg;
}

async function cut(entry: Entry): Promise<string> {
  const src = await download(entry.file);
  const { raw, scale, hw, hh } = await crop(src, entry);
  const fg = mask(raw, entry, scale, hw, hh);
  const w = OUT_W;
  const h = OUT_H;
  const alpha = Buffer.alloc(w * h);
  for (let p = 0; p < w * h; p++) alpha[p] = fg[p] ? 255 : 0;
  const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer();

  // Ink outline around the cut-out, then the photo.
  const OW = w + PAD * 2;
  const OH = h + PAD * 2;
  const solid = new Uint8Array(OW * OH);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (soft[y * w + x] > 110) solid[(y + PAD) * OW + x + PAD] = 1;
  const dist = edt(solid, OW, OH);
  const out = Buffer.alloc(OW * OH * 4);
  for (let y = 0; y < OH; y++) {
    for (let x = 0; x < OW; x++) {
      const p = y * OW + x;
      const d = Math.sqrt(dist[p]);
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      if (d <= INK_R + 0.5) {
        a = Math.min(1, INK_R + 0.5 - d);
        [r, g, b] = INK;
      }
      const ix = x - PAD;
      const iy = y - PAD;
      if (ix >= 0 && iy >= 0 && ix < w && iy < h) {
        const pa = soft[iy * w + ix] / 255;
        const si = (iy * w + ix) * 4;
        r = r * (1 - pa) + raw[si] * pa;
        g = g * (1 - pa) + raw[si + 1] * pa;
        b = b * (1 - pa) + raw[si + 2] * pa;
        a = Math.max(a, pa);
      }
      out[p * 4] = r;
      out[p * 4 + 1] = g;
      out[p * 4 + 2] = b;
      out[p * 4 + 3] = Math.round(a * 255);
    }
  }
  await fs.mkdir(OUT, { recursive: true });
  const file = path.join(OUT, `${entry.id}-${entry.expr}.webp`);
  await sharp(out, { raw: { width: OW, height: OH, channels: 4 } }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(file);
  return file;
}

async function writeManifest(entries: Entry[]): Promise<void> {
  const faces: Record<string, string[]> = {};
  for (const e of entries) (faces[e.id] ??= []).push(e.expr);
  const credits = entries.map(({ id, expr, file, author, license, licenseUrl, source }) => ({ id, expression: expr, title: file.replace(/^File:/, ''), author, license, licenseUrl, source }));
  const body = `/**
 * Generated by scripts/build-heads.ts from scripts/heads.json: do not edit by hand.
 * Which photo heads exist (public/heads/<id>-<expression>.webp), and where each photo comes from.
 */
export type Expression = 'neutral' | 'angry' | 'hurt';

export const PHOTOS: Record<string, Expression[]> = ${JSON.stringify(faces, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};

export interface PhotoCredit {
  id: string;
  expression: Expression;
  /** File name on Wikimedia Commons. */
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  /** The file's page on Wikimedia Commons. */
  source: string;
}

export const CREDITS: PhotoCredit[] = ${JSON.stringify(credits, null, 2)};
`;
  await fs.writeFile(MANIFEST, body);
}

const args = process.argv.slice(2);
const review = args.includes('--review');
const only = args.find((a) => !a.startsWith('--'));
const all = JSON.parse(await fs.readFile(CONFIG, 'utf8')) as Entry[];
const todo = all.filter((e) => !only || e.id === only || `${e.id}-${e.expr}` === only);
const made: { entry: Entry; file: string }[] = [];
for (const entry of todo) {
  try {
    made.push({ entry, file: await cut(entry) });
    console.log('ok', entry.id, entry.expr);
  } catch (error) {
    console.error('FAILED', entry.id, entry.expr, (error as Error).message);
    process.exitCode = 1;
  }
}
await writeManifest(all);

if (review && made.length) {
  const TW = 288;
  const TH = 352 + 24;
  const cols = 6;
  const tiles: OverlayOptions[] = [];
  for (const [i, m] of made.entries()) {
    tiles.push({ input: await sharp(m.file).png().toBuffer(), left: (i % cols) * TW, top: Math.floor(i / cols) * TH });
    tiles.push({ input: Buffer.from(`<svg width="${TW}" height="24"><text x="6" y="18" font-size="16" font-family="Arial" fill="#fff">${m.entry.id}-${m.entry.expr}</text></svg>`), left: (i % cols) * TW, top: Math.floor(i / cols) * TH + 352 });
  }
  await sharp({ create: { width: TW * Math.min(cols, made.length), height: TH * Math.ceil(made.length / cols), channels: 3, background: '#26305e' } })
    .composite(tiles)
    .jpeg({ quality: 85 })
    .toFile(path.join(CACHE, 'review.jpg'));
}
console.log(`${made.length}/${todo.length} heads written to public/heads`);
