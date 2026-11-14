import { PHOTOS, type Expression } from '../data/photos';
import { EXTRAS, VEHICLES } from '../data/units';
import { PORTRAIT_IDS, extraSvg, headUrl, portraitSvg } from './portraits';

export interface Sprite {
  image: HTMLCanvasElement;
  /** Same silhouette in solid white, used for the hit flash. */
  flash: HTMLCanvasElement;
  /** Logical size in canvas units. */
  w: number;
  h: number;
}

/**
 * Bitmap resolution of the puppets. A big, dense screen (a Retina laptop, a 4K
 * monitor) shows them much larger than a phone does: rasterise them finer there,
 * and keep phones on the lighter setting.
 */
const RASTER_SCALE =
  typeof window !== 'undefined' && (window.devicePixelRatio || 1) * Math.max(window.screen.width, window.screen.height) > 2600 ? 3 : 2;

/** Logical sprite widths; heights follow each SVG's aspect ratio. */
const WIDTH: Record<string, number> = { bus: 184, tracteur: 172, cnews: 176, auto: 150, cat: 62, poubelle: 76, vache: 176 };
const FIGURE_WIDTH = 104;

function rasterise(svg: string): Promise<Sprite> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const image = document.createElement('canvas');
      image.width = w * RASTER_SCALE;
      image.height = h * RASTER_SCALE;
      const ctx = image.getContext('2d')!;
      ctx.drawImage(img, 0, 0, image.width, image.height);

      const flash = document.createElement('canvas');
      flash.width = image.width;
      flash.height = image.height;
      const fctx = flash.getContext('2d')!;
      fctx.drawImage(image, 0, 0);
      fctx.globalCompositeOperation = 'source-in';
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flash.width, flash.height);

      resolve({ image, flash, w, h });
    };
    img.onerror = () => reject(new Error('Sprite failed to decode'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

/**
 * An SVG drawn as an image cannot fetch anything: the photo of the head is
 * handed to it as a data: URI instead.
 */
async function inlineHead(url: string): Promise<string | undefined> {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined; // offline and not cached: the drawn face stands in
  }
}

/** Rasterises every puppet once so the game loop only ever blits bitmaps. */
export class SpriteStore {
  private sprites = new Map<string, Sprite>();
  private loading: Promise<void> | null = null;

  /**
   * Resolves once every figure has its everyday face; the angry and hurt photos
   * follow in the background (until then the everyday face is used).
   */
  load(): Promise<void> {
    if (this.loading) return this.loading;
    const jobs: Promise<void>[] = [];
    const later: (() => Promise<void>)[] = [];
    const add = (key: string, svg: string) => rasterise(svg).then((sprite) => void this.sprites.set(key, sprite));
    const figure = async (id: string, expression: Expression) => {
      const url = headUrl(id, expression);
      const headHref = url ? await inlineHead(url) : undefined;
      if (url && !headHref && expression !== 'neutral') return;
      await add(`star:${id}:${expression}`, portraitSvg(id, { size: FIGURE_WIDTH, expression, headHref }));
    };
    for (const id of PORTRAIT_IDS) {
      jobs.push(figure(id, 'neutral'));
      for (const expression of PHOTOS[id] ?? []) if (expression !== 'neutral') later.push(() => figure(id, expression));
    }
    for (const kind of Object.keys(EXTRAS)) {
      if (EXTRAS[kind].portrait) continue;
      const size = WIDTH[kind] ?? FIGURE_WIDTH;
      jobs.push(add(kind, extraSvg(kind, { size })));
    }
    this.loading = Promise.all(jobs).then(() => {
      void (async () => {
        for (const job of later) await job().catch(() => undefined);
      })();
    });
    return this.loading;
  }

  /** A figure's puppet, with the requested face when it is available. */
  unit(id: string, expression: Expression = 'neutral'): Sprite | undefined {
    return this.sprites.get(`star:${id}:${expression}`) ?? this.sprites.get(`star:${id}:neutral`);
  }

  enemy(enemyId: string, expression: Expression = 'neutral'): Sprite | undefined {
    if (enemyId.startsWith('star:')) return this.unit(enemyId.slice(5), expression);
    const portrait = EXTRAS[enemyId]?.portrait;
    if (portrait) return this.unit(portrait, expression);
    return this.sprites.get(enemyId);
  }

  static isVehicle(enemyId: string): boolean {
    return VEHICLES.includes(enemyId);
  }
}
