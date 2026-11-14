/**
 * Cuts the photo heads out of freely licensed pictures from Wikimedia Commons.
 *
 *   npm run heads                 rebuild every head listed in scripts/heads.json
 *   npm run heads -- macron       rebuild one figure (or "macron-angry")
 *   npm run heads -- --review     also write .cache/heads/review.jpg (the heads on one sheet)
 *
 * For each entry: download the picture (a 960 px rendition, cached in .cache/heads),
 * crop around the head (`box` = left, top, right and chin as fractions of the picture),
 * and separate the head from the background with GrabCut: two colour models (head and
 * background, Gaussian mixtures) and a minimum cut over the pixel graph, refined a few
 * times. The face's core is always kept and everything far from the head always goes,
 * so that the whole face stays visible. The outline is then smoothed, so that the cut
 * looks like scissors went round it, and given a thin ink line. Finally the head is
 * moved so that its chin sits on the collar and its middle over the tie, whatever the
 * framing of the photo. The white sticker edge
 * is added by the SVG filter of the puppet (see portraits.ts).
 *
 * Optional per-entry tweaks: `rx`/`ry` widen or narrow the head oval (default 1.08 / 1.1),
 * `dx`/`dy` move it (fractions of the crop), `neck` lowers the cut under the chin,
 * `core`/`coreY` enlarge or move the part that is always kept (hair the colour of the wall).
 *
 * Outputs public/heads/<id>-<expression>.<hash>.webp (committed: the build never needs
 * the network; the hash of the content is in the name, so that a new photo is never
 * hidden by a cached old one) and src/game/data/photos.ts (the file of each face, and
 * the credits shown in the legal notice). The faces are never retouched: an "angry" or "hurt" head is
 * another real photo, chosen for its expression.
 *
 * `sharp` comes with Astro (its image service), so it is not listed separately.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';

interface Entry {
  id: string;
  expr: 'neutral' | 'angry' | 'hurt';
  file: string;
  box: [number, number, number, number];
  rx?: number;
  ry?: number;
  dx?: number;
  dy?: number;
  neck?: number;
  /** Size of the part that is always kept (1 = eyes, nose and mouth), and its vertical shift (negative: up, towards the hair). */
  core?: number;
  coreY?: number;
  /**
   * Where the eyes are on the finished cut-out (left x, y, right x, y, as fractions of the picture),
   * for the glow of a levelled-up figure. Placed by hand: check them on the review sheet after a new cut.
   */
  eyes?: [number, number, number, number];
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
/** Size of the cut-out (without its padding); the output keeps the HEAD_BOX ratio of portraits.ts. */
const OUT_W = 320;
const OUT_H = 400;
const PAD = 20;
/** Share of the width taken by the head, ear to ear. */
const HEAD_SHARE = 0.72;
const INK = [23, 32, 63];
const INK_R = 3.5;
/** GrabCut works on a half-size copy (fast enough, and the outline is smoothed anyway). */
const WORK = 2;

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

// ───────────────────────────── geometry helpers ─────────────────────────────

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

/** Keeps the biggest blob and fills its holes (eyes, teeth or glasses the cut may have missed). */
function cleanBlob(mask: Uint8Array, w: number, h: number): void {
  const label = new Int32Array(w * h);
  let best = 0;
  let bestSize = 0;
  let n = 0;
  const flood = (start: number, value: number, wanted: number, out: Int32Array): number => {
    let size = 0;
    const stack = [start];
    out[start] = value;
    while (stack.length) {
      const p = stack.pop()!;
      size++;
      const x = p % w;
      for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
        if (q >= 0 && q < w * h && mask[q] === wanted && !out[q]) {
          out[q] = value;
          stack.push(q);
        }
      }
    }
    return size;
  };
  for (let p = 0; p < w * h; p++) {
    if (!mask[p] || label[p]) continue;
    const size = flood(p, ++n, 1, label);
    if (size > bestSize) {
      bestSize = size;
      best = n;
    }
  }
  for (let p = 0; p < w * h; p++) mask[p] = label[p] === best ? 1 : 0;
  // Holes: background pixels that cannot reach the border.
  const outside = new Int32Array(w * h);
  for (let x = 0; x < w; x++) {
    for (const p of [x, (h - 1) * w + x]) if (!mask[p] && !outside[p]) flood(p, 1, 0, outside);
  }
  for (let y = 0; y < h; y++) {
    for (const p of [y * w, y * w + w - 1]) if (!mask[p] && !outside[p]) flood(p, 1, 0, outside);
  }
  for (let p = 0; p < w * h; p++) if (!mask[p] && !outside[p]) mask[p] = 1;
}

// ───────────────────────────── GrabCut ─────────────────────────────

const K = 5;

/** A Gaussian mixture over RGB colours (0…1). */
interface Gmm {
  weight: Float64Array;
  mean: Float64Array;
  inv: Float64Array;
  logNorm: Float64Array;
}

function fitGmm(rgb: Float32Array, pixels: number[], comp: Uint8Array): Gmm {
  const weight = new Float64Array(K);
  const mean = new Float64Array(K * 3);
  const cov = new Float64Array(K * 9);
  const count = new Float64Array(K);
  for (const p of pixels) {
    const k = comp[p];
    count[k]++;
    for (let c = 0; c < 3; c++) mean[k * 3 + c] += rgb[p * 3 + c];
  }
  for (let k = 0; k < K; k++) for (let c = 0; c < 3; c++) mean[k * 3 + c] /= Math.max(1, count[k]);
  for (const p of pixels) {
    const k = comp[p];
    const d0 = rgb[p * 3] - mean[k * 3];
    const d1 = rgb[p * 3 + 1] - mean[k * 3 + 1];
    const d2 = rgb[p * 3 + 2] - mean[k * 3 + 2];
    const dv = [d0, d1, d2];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cov[k * 9 + i * 3 + j] += dv[i] * dv[j];
  }
  const inv = new Float64Array(K * 9);
  const logNorm = new Float64Array(K);
  for (let k = 0; k < K; k++) {
    weight[k] = count[k] / Math.max(1, pixels.length);
    const c = Array.from({ length: 9 }, (_, i) => cov[k * 9 + i] / Math.max(1, count[k]) + (i % 4 === 0 ? 1e-4 : 0));
    const det = c[0] * (c[4] * c[8] - c[5] * c[7]) - c[1] * (c[3] * c[8] - c[5] * c[6]) + c[2] * (c[3] * c[7] - c[4] * c[6]);
    const id = 1 / det;
    const m = [
      c[4] * c[8] - c[5] * c[7], c[2] * c[7] - c[1] * c[8], c[1] * c[5] - c[2] * c[4],
      c[5] * c[6] - c[3] * c[8], c[0] * c[8] - c[2] * c[6], c[2] * c[3] - c[0] * c[5],
      c[3] * c[7] - c[4] * c[6], c[1] * c[6] - c[0] * c[7], c[0] * c[4] - c[1] * c[3],
    ];
    for (let i = 0; i < 9; i++) inv[k * 9 + i] = m[i] * id;
    logNorm[k] = weight[k] > 0 ? Math.log(weight[k]) - 0.5 * Math.log(Math.pow(2 * Math.PI, 3) * Math.max(det, 1e-30)) : -Infinity;
  }
  return { weight, mean, inv, logNorm };
}

/** Log-likelihood of a colour under each component (written into `out`), and of the whole mixture. */
function logLikelihood(g: Gmm, rgb: Float32Array, p: number, out?: Float64Array): number {
  let max = -Infinity;
  const terms = out ?? new Float64Array(K);
  for (let k = 0; k < K; k++) {
    if (g.logNorm[k] === -Infinity) {
      terms[k] = -Infinity;
      continue;
    }
    const d0 = rgb[p * 3] - g.mean[k * 3];
    const d1 = rgb[p * 3 + 1] - g.mean[k * 3 + 1];
    const d2 = rgb[p * 3 + 2] - g.mean[k * 3 + 2];
    const i = g.inv.subarray(k * 9, k * 9 + 9);
    const q = d0 * (i[0] * d0 + i[1] * d1 + i[2] * d2) + d1 * (i[3] * d0 + i[4] * d1 + i[5] * d2) + d2 * (i[6] * d0 + i[7] * d1 + i[8] * d2);
    terms[k] = g.logNorm[k] - 0.5 * q;
    if (terms[k] > max) max = terms[k];
  }
  let sum = 0;
  for (let k = 0; k < K; k++) if (terms[k] > -Infinity) sum += Math.exp(terms[k] - max);
  return max + Math.log(sum);
}

/** k-means seeding of the components of one colour model. */
function seedComponents(rgb: Float32Array, pixels: number[], comp: Uint8Array): void {
  const step = Math.max(1, Math.floor(pixels.length / 4000));
  const sample = pixels.filter((_, i) => i % step === 0);
  const centers: number[][] = [];
  for (let k = 0; k < K; k++) {
    const p = sample[Math.floor(((k + 0.5) / K) * sample.length)];
    centers.push([rgb[p * 3], rgb[p * 3 + 1], rgb[p * 3 + 2]]);
  }
  const nearest = (p: number) => {
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < K; k++) {
      const d = (rgb[p * 3] - centers[k][0]) ** 2 + (rgb[p * 3 + 1] - centers[k][1]) ** 2 + (rgb[p * 3 + 2] - centers[k][2]) ** 2;
      if (d < bd) {
        bd = d;
        best = k;
      }
    }
    return best;
  };
  for (let it = 0; it < 10; it++) {
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (const p of sample) {
      const s = sums[nearest(p)];
      s[0] += rgb[p * 3];
      s[1] += rgb[p * 3 + 1];
      s[2] += rgb[p * 3 + 2];
      s[3]++;
    }
    sums.forEach((s, k) => {
      if (s[3]) centers[k] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    });
  }
  for (const p of pixels) comp[p] = nearest(p);
}

/** Maximum flow (Dinic) on a graph stored as arrays; returns the nodes on the source side of the minimum cut. */
class FlowGraph {
  head: Int32Array;
  next: Int32Array;
  to: Int32Array;
  cap: Float64Array;
  edges = 0;

  constructor(private nodes: number, maxEdges: number) {
    this.head = new Int32Array(nodes).fill(-1);
    this.next = new Int32Array(maxEdges);
    this.to = new Int32Array(maxEdges);
    this.cap = new Float64Array(maxEdges);
  }

  /** u→v with capacity a, and v→u with capacity b. */
  add(u: number, v: number, a: number, b: number): void {
    const e = this.edges;
    this.to[e] = v;
    this.cap[e] = a;
    this.next[e] = this.head[u];
    this.head[u] = e;
    this.to[e + 1] = u;
    this.cap[e + 1] = b;
    this.next[e + 1] = this.head[v];
    this.head[v] = e + 1;
    this.edges += 2;
  }

  sourceSide(s: number, t: number): Uint8Array {
    const n = this.nodes;
    const level = new Int32Array(n);
    const it = new Int32Array(n);
    const queue = new Int32Array(n);
    const stack = new Int32Array(n);
    const eps = 1e-9;
    const bfs = (): boolean => {
      level.fill(-1);
      level[s] = 0;
      let qh = 0;
      let qt = 0;
      queue[qt++] = s;
      while (qh < qt) {
        const u = queue[qh++];
        for (let e = this.head[u]; e !== -1; e = this.next[e]) {
          const v = this.to[e];
          if (this.cap[e] > eps && level[v] < 0) {
            level[v] = level[u] + 1;
            queue[qt++] = v;
          }
        }
      }
      return level[t] >= 0;
    };
    while (bfs()) {
      for (let u = 0; u < n; u++) it[u] = this.head[u];
      // Iterative depth-first search for blocking flows.
      let depth = 0;
      let u = s;
      for (;;) {
        if (u === t) {
          let push = Infinity;
          for (let i = 0; i < depth; i++) push = Math.min(push, this.cap[stack[i]]);
          let cut = depth;
          for (let i = 0; i < depth; i++) {
            const e = stack[i];
            this.cap[e] -= push;
            this.cap[e ^ 1] += push;
            if (this.cap[e] <= eps && cut === depth) cut = i;
          }
          depth = cut;
          u = depth === 0 ? s : this.to[stack[depth - 1]];
          continue;
        }
        let e = it[u];
        while (e !== -1 && !(this.cap[e] > eps && level[this.to[e]] === level[u] + 1)) e = this.next[e];
        it[u] = e;
        if (e !== -1) {
          stack[depth++] = e;
          u = this.to[e];
        } else {
          if (u === s) break;
          level[u] = -1; // dead end
          depth--;
          u = depth === 0 ? s : this.to[stack[depth - 1]];
          it[u] = this.next[it[u]];
        }
      }
    }
    // Source side of the cut: reachable through unsaturated edges.
    const side = new Uint8Array(n);
    let qh = 0;
    let qt = 0;
    queue[qt++] = s;
    side[s] = 1;
    while (qh < qt) {
      const u = queue[qh++];
      for (let e = this.head[u]; e !== -1; e = this.next[e]) {
        const v = this.to[e];
        if (this.cap[e] > eps && !side[v]) {
          side[v] = 1;
          queue[qt++] = v;
        }
      }
    }
    return side;
  }
}

/**
 * trimap: 0 surely background, 1 probably background, 2 probably head, 3 surely head.
 * Returns 1 for the head.
 */
function grabCut(rgb: Float32Array, w: number, h: number, trimap: Uint8Array, rounds = 5): Uint8Array {
  const n = w * h;
  const fg = new Uint8Array(n);
  for (let p = 0; p < n; p++) fg[p] = trimap[p] >= 2 ? 1 : 0;
  // Smoothness: neighbours of similar colour want the same side.
  // Each pixel with its right, lower and two lower diagonal neighbours: [p, q, distance, colour difference²].
  const pairs: [number, number, number, number][] = [];
  let sum = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const around: [number, number][] = [];
      if (x + 1 < w) around.push([p + 1, 1]);
      if (y + 1 < h) around.push([p + w, 1]);
      if (x + 1 < w && y + 1 < h) around.push([p + w + 1, Math.SQRT2]);
      if (x > 0 && y + 1 < h) around.push([p + w - 1, Math.SQRT2]);
      for (const [q, dist] of around) {
        const d = (rgb[p * 3] - rgb[q * 3]) ** 2 + (rgb[p * 3 + 1] - rgb[q * 3 + 1]) ** 2 + (rgb[p * 3 + 2] - rgb[q * 3 + 2]) ** 2;
        sum += d;
        pairs.push([p, q, dist, d]);
      }
    }
  }
  const beta = 1 / (2 * (sum / pairs.length) || 1);
  const gamma = 50;
  const smooth = pairs.map(([p, q, dist, d]) => [p, q, (gamma / dist) * Math.exp(-beta * d)] as [number, number, number]);
  const SURE = 1e6;
  const comp = new Uint8Array(n);
  const terms = new Float64Array(K);
  for (let round = 0; round < rounds; round++) {
    const fgPx: number[] = [];
    const bgPx: number[] = [];
    for (let p = 0; p < n; p++) (fg[p] ? fgPx : bgPx).push(p);
    if (!fgPx.length || !bgPx.length) break;
    if (round === 0) {
      seedComponents(rgb, fgPx, comp);
      seedComponents(rgb, bgPx, comp);
    }
    let fgModel = fitGmm(rgb, fgPx, comp);
    let bgModel = fitGmm(rgb, bgPx, comp);
    // Each pixel joins its most likely component, then the models are refitted.
    for (const p of fgPx) {
      logLikelihood(fgModel, rgb, p, terms);
      comp[p] = terms.indexOf(Math.max(...terms));
    }
    for (const p of bgPx) {
      logLikelihood(bgModel, rgb, p, terms);
      comp[p] = terms.indexOf(Math.max(...terms));
    }
    fgModel = fitGmm(rgb, fgPx, comp);
    bgModel = fitGmm(rgb, bgPx, comp);

    const graph = new FlowGraph(n + 2, smooth.length * 2 + n * 2);
    const S = n;
    const T = n + 1;
    for (let p = 0; p < n; p++) {
      let toS: number;
      let toT: number;
      if (trimap[p] === 3) {
        toS = SURE;
        toT = 0;
      } else if (trimap[p] === 0) {
        toS = 0;
        toT = SURE;
      } else {
        toS = -logLikelihood(bgModel, rgb, p); // the cost of calling it background
        toT = -logLikelihood(fgModel, rgb, p); // the cost of calling it head
      }
      const common = Math.min(toS, toT);
      toS -= common;
      toT -= common;
      if (toS > 0) graph.add(S, p, toS, 0);
      if (toT > 0) graph.add(p, T, toT, 0);
    }
    for (const [p, q, wgt] of smooth) graph.add(p, q, wgt, wgt);
    const side = graph.sourceSide(S, T);
    let changed = 0;
    for (let p = 0; p < n; p++) {
      const v = side[p];
      if (v !== fg[p]) changed++;
      fg[p] = v;
    }
    if (changed < n * 0.001) break;
  }
  return fg;
}

// ───────────────────────────── one head ─────────────────────────────

/** Crop around the head, resized to OUT_W × OUT_H, as raw RGBA. */
async function crop(src: string, entry: Entry): Promise<{ raw: Buffer; scale: number; hw: number; hh: number }> {
  const meta = await sharp(src).metadata();
  const W = meta.width!;
  const H = meta.height!;
  const [l, t, r, b] = entry.box;
  const hw = (r - l) * W;
  const hh = (b - t) * H;
  const scale = (OUT_W * HEAD_SHARE) / hw;
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
    .modulate({ saturation: 1.06 })
    .linear(1.03, -3)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== OUT_W || info.height !== OUT_H || info.channels !== 4) throw new Error(`Unexpected crop ${JSON.stringify(info)}`);
  return { raw: data, scale, hw, hh };
}

/** The head's mask at full size (soft alpha, 0…255). */
async function headMask(raw: Buffer, entry: Entry, scale: number, hw: number, hh: number): Promise<Buffer> {
  const w = OUT_W / WORK;
  const h = OUT_H / WORK;
  const small = await sharp(raw, { raw: { width: OUT_W, height: OUT_H, channels: 4 } }).resize(w, h).removeAlpha().raw().toBuffer();
  const rgb = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h * 3; i++) rgb[i] = small[i] / 255;
  const alphaSmall = await sharp(raw, { raw: { width: OUT_W, height: OUT_H, channels: 4 } }).extractChannel(3).resize(w, h).raw().toBuffer();

  // The head's oval, in work pixels.
  const cx = w / 2 + (entry.dx ?? 0) * w;
  const cy = h / 2 + (entry.dy ?? 0) * h;
  const rx = ((hw * scale) / 2 / WORK) * (entry.rx ?? 1.08);
  const ry = ((hh * scale) / 2 / WORK) * (entry.ry ?? 1.1);
  const chin = cy + ((hh * scale) / 2 / WORK) * (1 + (entry.neck ?? 0.14));
  const trimap = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = Math.sqrt(nx * nx + ny * ny);
      // The face's core: eyes, nose and mouth always stay.
      const fx = (x - cx) / (rx * 0.5 * (entry.core ?? 1));
      const fy = (y - (cy + ry * (0.12 + (entry.coreY ?? 0)))) / (ry * 0.55 * (entry.core ?? 1));
      if (alphaSmall[p] < 128 || d > 1.18 || y > chin) trimap[p] = 0;
      else if (fx * fx + fy * fy <= 1) trimap[p] = 3;
      else if (d <= 1) trimap[p] = 2;
      else trimap[p] = 1;
    }
  }
  const cut = grabCut(rgb, w, h, trimap);
  cleanBlob(cut, w, h);

  // Back to full size, with a smooth outline: blur the mask and cut it again at half height.
  const up = await sharp(Buffer.from(cut.map((v) => v * 255)), { raw: { width: w, height: h, channels: 1 } })
    .resize(OUT_W, OUT_H, { kernel: 'cubic' })
    .blur(3.2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const hard = Buffer.alloc(OUT_W * OUT_H);
  for (let i = 0; i < hard.length; i++) hard[i] = up[i] >= 128 ? 255 : 0;
  // A soft edge one pixel wide.
  return sharp(hard, { raw: { width: OUT_W, height: OUT_H, channels: 1 } }).blur(0.7).extractChannel(0).raw().toBuffer();
}

/** Where the bottom of every cut-out (the chin) ends up: on the collar of the puppet (see HEAD_BOX in portraits.ts). */
const CHIN = 0.945;

/**
 * Moves the photo and its mask so that every head sits the same way on its body:
 * the bottom of the cut-out on the collar, the middle of the head on the tie.
 */
function align(raw: Buffer, soft: Buffer): { raw: Buffer; soft: Buffer } {
  const w = OUT_W;
  const h = OUT_H;
  let minX = w;
  let maxX = -1;
  let minY = h;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (soft[y * w + x] < 128) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxY < 0) return { raw, soft };
  let dy = Math.round(h * CHIN) - maxY;
  let dx = Math.round(w / 2 - (minX + maxX) / 2);
  // Never push the head out of the picture.
  dy = Math.max(2 - minY, Math.min(h - 2 - maxY, dy));
  dx = Math.max(2 - minX, Math.min(w - 2 - maxX, dx));
  const raw2 = Buffer.alloc(raw.length);
  const soft2 = Buffer.alloc(soft.length);
  for (let y = 0; y < h; y++) {
    const sy = y - dy;
    if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x - dx;
      if (sx < 0 || sx >= w) continue;
      soft2[y * w + x] = soft[sy * w + sx];
      raw.copy(raw2, (y * w + x) * 4, (sy * w + sx) * 4, (sy * w + sx) * 4 + 4);
    }
  }
  return { raw: raw2, soft: soft2 };
}

async function cut(entry: Entry): Promise<string> {
  const src = await download(entry.file);
  const cropped = await crop(src, entry);
  const { raw, soft } = align(cropped.raw, await headMask(cropped.raw, entry, cropped.scale, cropped.hw, cropped.hh));
  const w = OUT_W;
  const h = OUT_H;
  // Ink line around the cut-out, then the photo.
  const OW = w + PAD * 2;
  const OH = h + PAD * 2;
  const solid = new Uint8Array(OW * OH);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (soft[y * w + x] > 127) solid[(y + PAD) * OW + x + PAD] = 1;
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
  await sharp(out, { raw: { width: OW, height: OH, channels: 4 } }).webp({ quality: 84, alphaQuality: 95, effort: 6 }).toFile(file);
  return file;
}

/**
 * Gives every head a name that carries the hash of its content (a freshly cut
 * <id>-<expression>.webp is renamed; older versions of the same face are deleted).
 * Returns the file name of each face.
 */
async function fingerprint(entries: Entry[]): Promise<Record<string, string>> {
  const files = await fs.readdir(OUT);
  const names: Record<string, string> = {};
  for (const e of entries) {
    const base = `${e.id}-${e.expr}`;
    const fresh = `${base}.webp`;
    const versions = files.filter((f) => f.startsWith(`${base}.`) && f.endsWith('.webp') && f !== fresh);
    if (files.includes(fresh)) {
      const hash = createHash('sha1').update(await fs.readFile(path.join(OUT, fresh))).digest('hex').slice(0, 8);
      const name = `${base}.${hash}.webp`;
      for (const old of versions) if (old !== name) await fs.unlink(path.join(OUT, old));
      await fs.rename(path.join(OUT, fresh), path.join(OUT, name));
      names[base] = name;
    } else if (versions.length) {
      names[base] = versions.sort()[versions.length - 1];
    } else {
      throw new Error(`No file for ${base}: run npm run heads -- ${base}`);
    }
  }
  return names;
}

async function writeManifest(entries: Entry[]): Promise<void> {
  const faces: Record<string, string[]> = {};
  for (const e of entries) (faces[e.id] ??= []).push(e.expr);
  const files = await fingerprint(entries);
  const eyes = Object.fromEntries(entries.filter((e) => e.eyes).map((e) => [`${e.id}-${e.expr}`, e.eyes]));
  const credits = entries.map(({ id, expr, file, author, license, licenseUrl, source }) => ({ id, expression: expr, title: file.replace(/^File:/, ''), author, license, licenseUrl, source }));
  const body = `/**
 * Generated by scripts/build-heads.ts from scripts/heads.json: do not edit by hand.
 * Which photo heads exist, their files in public/heads (named after their content), and where each photo comes from.
 */
export type Expression = 'neutral' | 'angry' | 'hurt';

/** File of each face in public/heads, by "<id>-<expression>". */
export const HEAD_FILES: Record<string, string> = ${JSON.stringify(files, null, 2)};

export const PHOTOS: Record<string, Expression[]> = ${JSON.stringify(faces, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"/g, "'")};

/** Where the eyes are on each cut-out (left x, y, right x, y, as fractions of the picture), by "<id>-<expression>". */
export const EYES: Record<string, number[]> = ${JSON.stringify(eyes)};

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
const only = args.filter((a) => !a.startsWith('--'));
const all = JSON.parse(await fs.readFile(CONFIG, 'utf8')) as Entry[];
const todo = all.filter((e) => !only.length || only.includes(e.id) || only.includes(`${e.id}-${e.expr}`));
const made: { entry: Entry; file: string }[] = [];
for (const entry of todo) {
  try {
    const started = Date.now();
    made.push({ entry, file: await cut(entry) });
    console.log('ok', entry.id, entry.expr, `${Date.now() - started} ms`);
  } catch (error) {
    console.error('FAILED', entry.id, entry.expr, (error as Error).message);
    process.exitCode = 1;
  }
}
await writeManifest(all);

if (review && made.length) {
  const TW = 240;
  const TH = Math.round((240 * (OUT_H + PAD * 2)) / (OUT_W + PAD * 2)) + 24;
  const cols = 6;
  const tiles: OverlayOptions[] = [];
  const written = await fs.readdir(OUT);
  for (const [i, m] of made.entries()) {
    const file = path.join(OUT, written.find((f) => f.startsWith(`${m.entry.id}-${m.entry.expr}.`))!);
    tiles.push({ input: await sharp(file).resize(TW).png().toBuffer(), left: (i % cols) * TW, top: Math.floor(i / cols) * TH });
    const e = m.entry.eyes;
    const th = TH - 24;
    if (e) tiles.push({ input: Buffer.from(`<svg width="${TW}" height="${th}"><circle cx="${e[0] * TW}" cy="${e[1] * th}" r="4" fill="none" stroke="#ffe000" stroke-width="2"/><circle cx="${e[2] * TW}" cy="${e[3] * th}" r="4" fill="none" stroke="#ffe000" stroke-width="2"/></svg>`), left: (i % cols) * TW, top: Math.floor(i / cols) * TH });
    tiles.push({ input: Buffer.from(`<svg width="${TW}" height="24"><text x="6" y="18" font-size="16" font-family="Arial" fill="#fff">${m.entry.id}-${m.entry.expr}</text></svg>`), left: (i % cols) * TW, top: Math.floor(i / cols) * TH + TH - 24 });
  }
  await sharp({ create: { width: TW * Math.min(cols, made.length), height: TH * Math.ceil(made.length / cols), channels: 3, background: '#26305e' } })
    .composite(tiles)
    .jpeg({ quality: 85 })
    .toFile(path.join(CACHE, 'review.jpg'));
}
console.log(`${made.length}/${todo.length} heads written to public/heads`);
