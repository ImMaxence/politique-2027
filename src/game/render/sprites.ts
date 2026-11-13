import { CAMP_IDS, type CampId } from '../data/types';
import { EXTRAS, NEUTRAL_EXTRAS } from '../data/units';
import { PORTRAIT_IDS, extraSvg, portraitSvg } from './portraits';

export interface Sprite {
  image: HTMLCanvasElement;
  /** Same silhouette in solid white, used for the hit flash. */
  flash: HTMLCanvasElement;
  /** Logical size in canvas units. */
  w: number;
  h: number;
}

const RASTER_SCALE = 2;

/** Logical sprite widths; heights follow each SVG's aspect ratio. */
const WIDTH: Record<string, number> = { bus: 184, tracteur: 172, cnews: 176, auto: 150, cat: 62, poubelle: 76 };
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

/** Rasterises every puppet once so the game loop only ever blits bitmaps. */
export class SpriteStore {
  private sprites = new Map<string, Sprite>();
  private loading: Promise<void> | null = null;

  load(): Promise<void> {
    if (this.loading) return this.loading;
    const jobs: Promise<void>[] = [];
    const add = (key: string, svg: string) => {
      jobs.push(rasterise(svg).then((sprite) => void this.sprites.set(key, sprite)));
    };
    // Named figures, the guest and the reinforcements.
    for (const id of PORTRAIT_IDS) add(`star:${id}`, portraitSvg(id, { size: FIGURE_WIDTH }));
    for (const kind of Object.keys(EXTRAS)) {
      if (EXTRAS[kind].portrait) continue;
      const size = WIDTH[kind] ?? FIGURE_WIDTH;
      if (NEUTRAL_EXTRAS.includes(kind)) {
        add(kind, extraSvg(kind, 'droite', { size }));
        continue;
      }
      for (const camp of CAMP_IDS) add(`${kind}:${camp}`, extraSvg(kind, camp, { size }));
    }
    this.loading = Promise.all(jobs).then(() => undefined);
    return this.loading;
  }

  unit(id: string): Sprite | undefined {
    return this.sprites.get(`star:${id}`);
  }

  enemy(enemyId: string, camp: CampId): Sprite | undefined {
    if (enemyId.startsWith('star:')) return this.sprites.get(enemyId);
    const portrait = EXTRAS[enemyId]?.portrait;
    if (portrait) return this.sprites.get(`star:${portrait}`);
    if (NEUTRAL_EXTRAS.includes(enemyId)) return this.sprites.get(enemyId);
    return this.sprites.get(`${enemyId}:${camp}`);
  }
}
