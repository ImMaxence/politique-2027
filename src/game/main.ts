/**
 * Browser entry point: screens (camp → calendar → match → result), HUD, input
 * and the game loop. The canvas is purely visual — every interaction goes
 * through real buttons so the game is playable with a keyboard, a mouse, touch
 * or a screen reader.
 */
import { GAME_STRINGS, fmt, isLang, type GameStrings, type Lang } from '../i18n/game';
import { Audio } from './audio';
import { COLS, LAST_LEVEL, LEVELS, ROWS } from './data/levels';
import { CAMP_IDS, type CampId } from './data/types';
import { CAMPS, UNITS, categoryOf } from './data/units';
import { portraitSvg } from './render/portraits';
import { Renderer, type ViewState } from './render/renderer';
import { SpriteStore } from './render/sprites';
import {
  TICK, ULT_CHARGE_TIME, costOf, createGame, placeUnit, removeUnit, spawnEnemy, starsFor, step, ultimateReady, useUltimate,
  type GameEvent, type GameState, type PlaceError,
} from './sim/engine';
import { loadSave, storeSave, type Save } from './storage';

type ScreenName = 'camp' | 'levels' | 'match';

function $(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function clockText(seconds: number): string {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

class GameApp {
  private lang: Lang;
  private t: GameStrings;
  private save: Save = loadSave();
  private audio = new Audio();
  private sprites = new SpriteStore();
  private renderer: Renderer;
  private state: GameState | null = null;
  private view: ViewState = { hover: null, selected: null, removing: false };
  private paused = false;
  private finished = false;
  private wentFullscreen = false;
  /** A phone held upright: the match is then drawn sideways so that it must be turned. */
  private phonePortrait = window.matchMedia('(orientation: portrait) and (max-width: 44rem) and (pointer: coarse)');
  /** A phone held sideways (or any very short window): the toolbar becomes a side column. */
  private shortLandscape = window.matchMedia('(max-height: 34rem) and (orientation: landscape)');
  private clock = 0;
  private lastFrame = 0;
  private accumulator = 0;
  private ultAnnounced = false;
  private lastTaxNotice = -99;
  private lastCell = { lane: 2, col: 2 };
  private resumeFocus: HTMLElement | null = null;
  private cells: HTMLButtonElement[][] = [];
  private cards = new Map<string, HTMLButtonElement>();
  private shown: Record<string, string | number> = {};

  private screens: Record<ScreenName, HTMLElement>;
  private hud: HTMLElement;
  private stage: HTMLElement;
  private grid: HTMLElement;
  private info: HTMLElement;
  private live: HTMLElement;
  private alert: HTMLElement;

  constructor(private root: HTMLElement) {
    const lang = root.dataset.lang;
    this.lang = isLang(lang) ? lang : 'fr';
    this.t = GAME_STRINGS[this.lang];
    this.screens = {
      camp: $(root, '[data-screen="camp"]'),
      levels: $(root, '[data-screen="levels"]'),
      match: $(root, '[data-screen="match"]'),
    };
    this.hud = $(root, '[data-slot="hud"]');
    this.stage = $(root, '[data-slot="stage"]');
    this.grid = $(root, '[data-slot="grid"]');
    this.info = $(root, '[data-slot="info"]');
    this.live = $(root, '[data-slot="live"]');
    this.alert = $(root, '[data-slot="alert"]');
    this.renderer = new Renderer($(root, '[data-slot="canvas"]') as HTMLCanvasElement, this.sprites, this.t);
  }

  init(): void {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer.reducedMotion = motion.matches;
    motion.addEventListener('change', (e) => (this.renderer.reducedMotion = e.matches));
    this.phonePortrait.addEventListener('change', () => this.syncLayout());
    this.shortLandscape.addEventListener('change', () => this.syncLayout());
    document.addEventListener('fullscreenchange', () => this.syncLayout());

    this.audio.muted = this.save.muted;
    this.collectCells();
    this.bind();
    this.syncToggles();

    // Rasterising ~90 puppets is main-thread work: keep it out of the page load and
    // start it at the first sign of interest. A match awaits the sprites anyway.
    const warmUp = () => void this.sprites.load();
    for (const type of ['pointerdown', 'pointermove', 'keydown', 'focusin'] as const) {
      this.root.addEventListener(type, warmUp, { once: true, passive: true });
    }
    void document.fonts?.load("26px 'Anton'");

    if (this.save.camp) this.pickCamp(this.save.camp, false);
    else this.show('camp', false);
    this.root.dataset.ready = 'true';

    new ResizeObserver(() => this.renderer.resize()).observe(this.stage);
    requestAnimationFrame((now) => this.frame(now));
    this.installTestHook();
  }

  // ───────────────────────────── screens ─────────────────────────────

  private show(name: ScreenName, focus = true): void {
    for (const [key, el] of Object.entries(this.screens)) el.hidden = key !== name;
    this.root.dataset.view = name;
    if (focus) {
      const heading = this.screens[name].querySelector<HTMLElement>('[data-focus]');
      heading?.focus({ preventScroll: name === 'match' });
    }
  }

  private pickCamp(camp: CampId, focus = true): void {
    this.save.camp = camp;
    storeSave(this.save);
    this.root.dataset.camp = camp;
    $(this.root, '[data-slot="camp-name"]').textContent = this.t.camps[camp].name;
    this.renderLevels();
    this.show('levels', focus);
  }

  private renderLevels(): void {
    const camp = this.save.camp;
    if (!camp) return;
    const progress = this.save.progress[camp];
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('[data-level]')) {
      const id = Number(button.dataset.level);
      const locked = id === 0 ? !progress.finished : id > progress.unlocked;
      button.setAttribute('aria-disabled', String(locked));
      button.classList.toggle('is-locked', locked);
      const slot = $(button, '[data-slot="state"]');
      if (locked) {
        slot.textContent = `${this.t.ui.locked} — ${id === 0 ? this.t.ui.endlessLocked : this.t.ui.lockedHint}`;
      } else if (id === 0) {
        slot.textContent = progress.endlessBest ? `${this.t.ui.best} : ${progress.endlessBest} ${this.t.ui.waves}` : this.t.ui.play;
      } else {
        const stars = progress.stars[id] ?? 0;
        slot.textContent = stars ? `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : this.t.ui.play;
        if (stars) slot.setAttribute('aria-label', `${stars} ${this.t.ui.stars}`);
        else slot.removeAttribute('aria-label');
      }
    }
  }

  // ───────────────────────────── match setup ─────────────────────────────

  private collectCells(): void {
    const buttons = [...this.grid.querySelectorAll<HTMLButtonElement>('[data-cell]')];
    for (let lane = 0; lane < ROWS; lane++) this.cells.push(buttons.slice(lane * COLS, lane * COLS + COLS));
  }

  private async startLevel(levelId: number, seed?: number): Promise<void> {
    const camp = this.save.camp;
    if (!camp) return;
    this.audio.unlock();
    this.tryLandscape(); // must run inside the click that started the level
    this.root.classList.add('is-loading');
    await this.sprites.load();
    await document.fonts?.ready;
    this.root.classList.remove('is-loading');

    const state = createGame({ camp, level: levelId, seed: seed ?? Math.floor(Math.random() * 1e9) });
    this.state = state;
    this.view = { hover: null, selected: null, removing: false };
    this.paused = false;
    this.finished = false;
    this.accumulator = 0;
    this.ultAnnounced = false;
    this.lastTaxNotice = -99;
    this.shown = {};
    this.renderer.reset();
    this.overlay('pause', false);
    this.overlay('result', false);

    this.buildCards(state);
    for (let lane = 0; lane < ROWS; lane++) {
      const open = state.level.lanes.includes(lane);
      for (const cell of this.cells[lane]) {
        cell.disabled = !open;
        cell.tabIndex = -1;
      }
    }
    this.lastCell = { lane: state.level.lanes[Math.floor(state.level.lanes.length / 2)], col: 2 };
    this.cells[this.lastCell.lane][this.lastCell.col].tabIndex = 0;

    const ult = this.t.ultimates[state.ult.id];
    $(this.root, '[data-slot="ult-name"]').textContent = ult.name;
    $(this.root, '[data-action="ultimate"]').title = ult.desc;
    this.setInfo(this.t.ui.howTo);
    this.show('match');
    this.syncLayout();
    this.updateHud();
    this.say(fmt(this.t.announce.start, { level: this.t.levels[levelId].name, camp: this.t.camps[camp].name }));
  }

  // ───────────────────────────── phone layout ─────────────────────────────

  private isPhone(): boolean {
    return window.matchMedia('(pointer: coarse)').matches && Math.min(window.screen.width, window.screen.height) <= 600;
  }

  /**
   * On a phone a match is a landscape, fullscreen affair. Where the browser
   * allows it (Android) the screen is locked to landscape for real; elsewhere
   * (iPhone) `syncLayout` draws the match sideways instead.
   */
  private tryLandscape(): void {
    if (!this.save.forceLandscape || !this.isPhone() || document.fullscreenElement || !this.root.requestFullscreen) return;
    const orientation = window.screen.orientation as ScreenOrientation & { lock?: (type: string) => Promise<void> };
    this.root
      .requestFullscreen()
      .then(() => {
        this.wentFullscreen = true;
        if (!orientation?.lock) throw new Error('orientation lock unavailable');
        return orientation.lock('landscape');
      })
      .catch(() => {
        // Fullscreen without the lock would fight the sideways drawing: fall back to it.
        if (document.fullscreenElement && this.phonePortrait.matches) void document.exitFullscreen().catch(() => undefined);
      });
  }

  /**
   * Picks the match layout: a side column on short landscape screens, and the
   * whole match rotated a quarter turn on a phone held upright.
   */
  private syncLayout(): void {
    const inMatch = !!this.state && !this.screens.match.hidden;
    const forced = inMatch && this.save.forceLandscape && this.phonePortrait.matches && !document.fullscreenElement;
    const compact = forced || (inMatch && this.shortLandscape.matches);
    this.root.classList.toggle('is-forced', forced);
    this.root.classList.toggle('is-compact', compact);
    document.documentElement.classList.toggle('game-locked', forced);
    // Bring the board to the top of short screens, then match the canvas to its new box.
    if (compact && !forced) this.screens.match.scrollIntoView({ block: 'start', behavior: 'instant' });
    this.renderer.resize();
  }

  private buildCards(state: GameState): void {
    const holder = $(this.root, '[data-slot="cards"]');
    const descriptions = $(this.root, '[data-slot="descriptions"]');
    holder.replaceChildren();
    descriptions.replaceChildren();
    this.cards.clear();
    state.cards.forEach((card, index) => {
      const text = this.t.figures[card.def.id];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = card.def.camp === 'neutre' ? 'card card--neutral' : 'card';
      button.dataset.unit = card.def.id;
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-keyshortcuts', String(index + 1));
      // The accessible name is the visible surname (WCAG 2.5.3); full name, power,
      // price and effect are the description, kept up to date when tariffs apply.
      const description = document.createElement('span');
      description.id = `card-desc-${card.def.id}`;
      description.textContent = this.describeCard(card.def.id, card.def.cost);
      descriptions.append(description);
      button.setAttribute('aria-describedby', description.id);
      // Shortcut and cost are drawn by CSS from data attributes, the portrait is decorative.
      // The coloured strip names the card's family: money, attack, effect or defence.
      const category = categoryOf(card.def);
      button.dataset.type = category;
      button.innerHTML = `
        <span class="card__key" data-label="${index + 1}" aria-hidden="true"></span>
        <span class="card__art" aria-hidden="true">${portraitSvg(card.def.id, { size: 64, uid: 'card' })}</span>
        <span class="card__name">${text.short}</span>
        <span class="card__type" aria-hidden="true">${this.t.types[category]}</span>
        <span class="card__cost" data-label="${card.def.cost}" aria-hidden="true"></span>
        <span class="card__cd" aria-hidden="true"></span>`;
      const describe = () => this.setInfo(`${text.power} — ${text.desc}`, text.name);
      button.addEventListener('click', () => this.select(card.def.id));
      button.addEventListener('mouseenter', describe);
      button.addEventListener('focus', describe);
      holder.append(button);
      this.cards.set(card.def.id, button);
    });
  }

  private describeCard(unitId: string, cost: number): string {
    const text = this.t.figures[unitId];
    const type = this.t.types[categoryOf(UNITS[unitId])];
    return `${text.name}, ${text.power}. ${this.t.ui.type} : ${type}. ${this.t.ui.cost} ${cost}. ${text.desc}`;
  }

  // ───────────────────────────── input ─────────────────────────────

  private bind(): void {
    const on = (selector: string, handler: (el: HTMLElement) => void) => {
      for (const el of this.root.querySelectorAll<HTMLElement>(selector)) {
        el.addEventListener('click', () => handler(el));
      }
    };

    on('[data-camp]', (el) => {
      this.audio.unlock();
      this.audio.play('click');
      this.pickCamp(el.dataset.camp as CampId);
    });
    on('[data-action="change-camp"]', () => this.show('camp'));
    on('[data-level]', (el) => {
      if (el.getAttribute('aria-disabled') === 'true') {
        this.audio.unlock();
        this.audio.play('error');
        this.say($(el, '[data-slot="state"]').textContent ?? '');
        return;
      }
      void this.startLevel(Number(el.dataset.level));
    });

    on('[data-action="remove"]', () => this.toggleRemove());
    on('[data-action="ultimate"]', () => this.fireUltimate());
    on('[data-action="pause"]', () => this.setPaused(true));
    on('[data-action="resume"]', () => this.setPaused(false));
    on('[data-action="restart"]', () => this.state && void this.startLevel(this.state.level.id));
    on('[data-action="retry"]', () => this.state && void this.startLevel(this.state.level.id));
    on('[data-action="next"]', () => this.state && void this.startLevel(this.state.level.id + 1));
    on('[data-action="quit"]', () => this.backToCalendar());
    on('[data-action="calendar"]', () => this.backToCalendar());
    on('[data-action="speed"]', () => {
      this.save.speed = this.save.speed === 1 ? 2 : 1;
      storeSave(this.save);
      this.syncToggles();
    });
    on('[data-action="mute"]', () => this.toggleMute());
    on('[data-action="orientation"]', () => {
      this.save.forceLandscape = !this.save.forceLandscape;
      storeSave(this.save);
      this.syncToggles();
      this.syncLayout();
      this.say(this.save.forceLandscape ? this.t.announce.landscapeOn : this.t.announce.landscapeOff);
    });
    on('[data-action="fullscreen"]', () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else if (this.isPhone() && this.save.forceLandscape) this.tryLandscape();
      else void this.root.requestFullscreen?.().catch(() => undefined);
    });

    for (let lane = 0; lane < ROWS; lane++) {
      for (let col = 0; col < COLS; col++) {
        const cell = this.cells[lane][col];
        cell.addEventListener('click', () => this.clickCell(lane, col));
        cell.addEventListener('mouseenter', () => (this.view.hover = { lane, col }));
        cell.addEventListener('focus', () => {
          this.view.hover = { lane, col };
          this.rememberCell(lane, col);
          cell.setAttribute('aria-label', this.describeCell(lane, col));
        });
        cell.addEventListener('keydown', (e) => this.moveInGrid(e, lane, col));
      }
    }
    this.grid.addEventListener('mouseleave', () => (this.view.hover = null));

    document.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.playing()) this.setPaused(true);
    });
  }

  private playing(): boolean {
    return !!this.state && this.state.status === 'playing' && !this.screens.match.hidden && !this.paused;
  }

  private rememberCell(lane: number, col: number): void {
    const previous = this.cells[this.lastCell.lane][this.lastCell.col];
    previous.tabIndex = -1;
    this.lastCell = { lane, col };
    this.cells[lane][col].tabIndex = 0;
  }

  private focusGrid(): void {
    this.cells[this.lastCell.lane][this.lastCell.col].focus({ preventScroll: true });
  }

  private moveInGrid(e: KeyboardEvent, lane: number, col: number): void {
    const state = this.state;
    if (!state) return;
    const lanes = state.level.lanes;
    const index = lanes.indexOf(lane);
    let nextLane = lane;
    let nextCol = col;
    switch (e.key) {
      case 'ArrowLeft': nextCol = Math.max(0, col - 1); break;
      case 'ArrowRight': nextCol = Math.min(COLS - 1, col + 1); break;
      case 'ArrowUp': nextLane = lanes[Math.max(0, index - 1)]; break;
      case 'ArrowDown': nextLane = lanes[Math.min(lanes.length - 1, index + 1)]; break;
      case 'Home': nextCol = 0; break;
      case 'End': nextCol = COLS - 1; break;
      default: return;
    }
    e.preventDefault();
    this.cells[nextLane][nextCol].focus({ preventScroll: true });
  }

  /** Single-key shortcuts only work while focus is inside the game (WCAG 2.1.4). */
  private onKey(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey || !this.state || this.screens.match.hidden) return;
    if (!this.root.contains(document.activeElement)) return;
    const key = e.key.toLowerCase();

    if (key === 'escape' || key === 'p') {
      if (this.finished) return;
      e.preventDefault();
      this.setPaused(!this.paused);
      return;
    }
    if (!this.playing()) return;

    if (key >= '1' && key <= '8') {
      const card = this.state.cards[Number(key) - 1];
      if (card) {
        e.preventDefault();
        this.select(card.def.id, true);
        this.focusGrid();
      }
    } else if (key === 'r') {
      e.preventDefault();
      this.toggleRemove();
      this.focusGrid();
    } else if (key === 'u') {
      e.preventDefault();
      this.fireUltimate();
    } else if (key === 'm') {
      this.toggleMute();
    } else if (key === 'f') {
      (this.root.querySelector('[data-action="speed"]') as HTMLElement | null)?.click();
    }
  }

  private select(unitId: string, keepIfSame = false): void {
    if (!this.playing()) return;
    this.audio.play('click');
    const same = this.view.selected === unitId;
    this.view.selected = same && !keepIfSame ? null : unitId;
    this.view.removing = false;
    this.syncSelection();
    if (this.view.selected) {
      const text = this.t.figures[unitId];
      this.setInfo(`${text.power} — ${text.desc}`, text.name);
      this.say(fmt(this.t.announce.selected, { name: text.name, cost: this.state ? costOf(this.state, UNITS[unitId]) : UNITS[unitId].cost }));
    }
  }

  private toggleRemove(): void {
    if (!this.playing()) return;
    this.view.removing = !this.view.removing;
    this.view.selected = null;
    this.syncSelection();
    if (this.view.removing) {
      this.setInfo(this.t.ui.reshuffleHint, this.t.ui.reshuffle);
      this.say(this.t.announce.reshuffleOn);
    }
  }

  private syncSelection(): void {
    for (const [id, button] of this.cards) button.setAttribute('aria-pressed', String(this.view.selected === id));
    $(this.root, '[data-action="remove"]').setAttribute('aria-pressed', String(this.view.removing));
    this.stage.classList.toggle('is-removing', this.view.removing);
  }

  private clickCell(lane: number, col: number): void {
    const state = this.state;
    if (!state || !this.playing()) return;
    this.view.hover = { lane, col };

    if (this.view.removing) {
      const unit = state.grid[lane][col];
      if (unit && removeUnit(state, lane, col)) {
        this.view.removing = false;
        this.syncSelection();
      } else {
        this.audio.play('error');
      }
      return;
    }

    if (!this.view.selected) {
      const unit = state.grid[lane][col];
      this.say(unit ? this.describeCell(lane, col) : this.t.announce.errNothing);
      return;
    }

    const unitId = this.view.selected;
    const error = placeUnit(state, unitId, lane, col);
    if (error) {
      this.audio.play('error');
      this.say(this.errorText(error, unitId), true);
      return;
    }
    this.view.selected = null;
    this.syncSelection();
    this.cells[lane][col].setAttribute('aria-label', this.describeCell(lane, col));
  }

  private errorText(error: PlaceError, unitId: string): string {
    const a = this.t.announce;
    switch (error) {
      case 'cost': return a.errCost;
      case 'cooldown': return fmt(a.errCooldown, { name: this.t.figures[unitId].name });
      case 'occupied': return a.errOccupied;
      default: return a.errLane;
    }
  }

  private fireUltimate(): void {
    const state = this.state;
    if (!state || !this.playing()) return;
    if (!useUltimate(state)) this.audio.play('error');
  }

  private toggleMute(): void {
    this.audio.unlock();
    this.audio.muted = !this.audio.muted;
    this.save.muted = this.audio.muted;
    storeSave(this.save);
    this.syncToggles();
  }

  private syncToggles(): void {
    const mute = this.root.querySelector<HTMLElement>('[data-action="mute"]');
    if (mute) {
      mute.setAttribute('aria-pressed', String(this.audio.muted));
      mute.setAttribute('aria-label', this.audio.muted ? this.t.ui.soundOff : this.t.ui.soundOn);
      mute.title = this.audio.muted ? this.t.ui.soundOff : this.t.ui.soundOn;
    }
    this.root.querySelector('[data-action="speed"]')?.setAttribute('aria-pressed', String(this.save.speed === 2));
    this.root.querySelector('[data-action="orientation"]')?.setAttribute('aria-pressed', String(this.save.forceLandscape));
  }

  // ───────────────────────────── pause / result ─────────────────────────────

  private overlay(name: 'pause' | 'result', visible: boolean): HTMLElement {
    const el = $(this.root, `[data-overlay="${name}"]`);
    el.hidden = !visible;
    const anyOpen = [...this.root.querySelectorAll<HTMLElement>('[data-overlay]')].some((o) => !o.hidden);
    this.hud.inert = anyOpen;
    this.grid.inert = anyOpen;
    return el;
  }

  private setPaused(paused: boolean): void {
    if (!this.state || this.state.status !== 'playing' || this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      this.resumeFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const el = this.overlay('pause', true);
      $(el, '[data-action="resume"]').focus();
      this.say(this.t.announce.paused);
    } else {
      this.overlay('pause', false);
      (this.resumeFocus && this.root.contains(this.resumeFocus) ? this.resumeFocus : this.cells[this.lastCell.lane][this.lastCell.col]).focus({ preventScroll: true });
      this.say(this.t.announce.resumed);
    }
  }

  private backToCalendar(): void {
    this.state = null;
    this.paused = false;
    this.overlay('pause', false);
    this.overlay('result', false);
    if (this.wentFullscreen && document.fullscreenElement) {
      this.wentFullscreen = false;
      void document.exitFullscreen().catch(() => undefined);
    }
    this.syncLayout();
    this.renderLevels();
    this.show('levels');
  }

  private finish(state: GameState): void {
    this.finished = true;
    const camp = state.camp;
    const progress = this.save.progress[camp];
    const won = state.status === 'won';
    const level = state.level;
    const stars = starsFor(state);
    const wavesHeld = level.endless ? Math.max(0, state.wave.next - 1) : state.stats.wavesCleared;
    let unlockedUnit: string | null = null;
    let unlockedReinforcements = false;

    if (level.endless) {
      progress.endlessBest = Math.max(progress.endlessBest, wavesHeld);
    } else if (won) {
      progress.stars[level.id] = Math.max(progress.stars[level.id] ?? 0, stars);
      if (level.id === LAST_LEVEL) progress.finished = true;
      const next = LEVELS.find((l) => l.id === level.id + 1);
      if (next && progress.unlocked < next.id) {
        progress.unlocked = next.id;
        if (next.slots > level.slots) unlockedUnit = CAMPS[camp].roster[next.slots - 1];
        unlockedReinforcements = next.reinforcements && !level.reinforcements;
      }
    }
    storeSave(this.save);

    const pool = level.endless ? this.t.headlines.endless : won ? this.t.headlines.win : this.t.headlines.lose;
    const headline = fmt(pool[Math.floor(Math.random() * pool.length)], { camp: this.t.camps[camp].name, n: wavesHeld });

    const el = this.overlay('result', true);
    el.dataset.outcome = won ? 'won' : 'lost';
    const title = $(el, '[data-slot="headline"]');
    title.textContent = headline;

    const starSlot = $(el, '[data-slot="stars"]');
    starSlot.hidden = !won;
    starSlot.textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
    starSlot.setAttribute('aria-label', `${stars} ${this.t.ui.stars}`);

    const stats: [string, string][] = [
      [this.t.ui.statTime, clockText(state.time)],
      [this.t.ui.statKills, String(state.stats.kills)],
      [this.t.ui.statPlaced, String(state.stats.placed)],
      level.endless ? [this.t.ui.statWaves, String(wavesHeld)] : [this.t.ui.statPolls, `${state.polls}/${level.polls}`],
    ];
    const list = $(el, '[data-slot="stats"]');
    list.replaceChildren(
      ...stats.map(([term, value]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = term;
        dd.textContent = value;
        row.append(dt, dd);
        return row;
      }),
    );

    const unlock = $(el, '[data-slot="unlock"]');
    unlock.hidden = !unlockedUnit && !unlockedReinforcements;
    if (unlockedUnit) {
      const text = this.t.figures[unlockedUnit];
      unlock.innerHTML = `${portraitSvg(unlockedUnit, { size: 72, uid: 'unlock' })}<span><b>${this.t.ui.newUnlock}</b><br>${text.name} — ${text.power}</span>`;
    } else if (unlockedReinforcements) {
      const names = `${this.t.figures.crs.name}, ${this.t.figures.pompiers.name}`;
      unlock.innerHTML = `${portraitSvg('pompiers', { size: 72, uid: 'unlock' })}<span><b>${this.t.ui.newReinforcements}</b><br>${names}</span>`;
    }

    const next = $(el, '[data-action="next"]');
    next.hidden = !(won && !level.endless && level.id < LAST_LEVEL);
    this.audio.play(won ? 'win' : 'lose');
    this.say(`${won ? this.t.announce.won : this.t.announce.lost} ${headline}`, true);
    (next.hidden ? $(el, '[data-action="retry"]') : next).focus();
  }

  // ───────────────────────────── feedback ─────────────────────────────

  /** Speak through the live regions (polite by default, assertive for urgent news). */
  private say(text: string, urgent = false): void {
    const region = urgent ? this.alert : this.live;
    region.textContent = '';
    window.setTimeout(() => (region.textContent = text), 30);
  }

  private setInfo(text: string, title?: string): void {
    this.info.replaceChildren();
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = `${title} · `;
      this.info.append(strong);
    }
    this.info.append(text);
  }

  private describeCell(lane: number, col: number): string {
    const state = this.state;
    const where = fmt(this.t.ui.rowLabel, { row: lane + 1, col: col + 1 });
    if (!state) return where;
    if (!state.level.lanes.includes(lane)) return `${where} : ${this.t.ui.closed}`;
    const unit = state.grid[lane][col];
    const what = unit
      ? `${this.t.figures[unit.def.id].name}, ${this.t.ui.credibility.toLowerCase()} ${Math.round((unit.hp / unit.def.hp) * 100)} %`
      : this.t.ui.empty;
    const rivals = state.enemies.filter((e) => e.lane === lane).length;
    const suffix = rivals ? ` — ${fmt(this.t.ui.rivalsInLane, { n: rivals })}` : '';
    return `${where} : ${what}${suffix}`;
  }

  private enemyName(enemyId: string): string {
    return enemyId.startsWith('star:') ? this.t.figures[enemyId.slice(5)].name : this.t.extras[enemyId];
  }

  private handleEvents(state: GameState, events: GameEvent[]): void {
    const a = this.t.announce;
    for (const e of events) {
      switch (e.type) {
        case 'place': {
          // Screen readers get the figure's signature line along with its position.
          const figure = this.t.figures[e.unitId];
          this.audio.play('place');
          this.say(`${fmt(a.placed, { name: figure.name, row: e.lane + 1, col: e.col + 1 })} « ${figure.lines[0]} »`);
          break;
        }
        case 'remove':
          this.audio.play('click');
          this.say(fmt(a.removed, { name: this.t.figures[e.unitId].name, refund: e.refund }));
          break;
        case 'produce':
          this.audio.play('coin');
          break;
        case 'shoot':
          this.audio.play('shoot');
          break;
        case 'hit':
          this.audio.play('hit');
          break;
        case 'unitDown':
          this.audio.play('down');
          this.say(fmt(a.unitDown, { name: this.t.figures[e.unitId].name }));
          break;
        case 'leak':
          this.audio.play('leak');
          this.say(fmt(a.leak, { name: this.enemyName(e.enemyId), loss: e.loss, polls: state.polls }), true);
          break;
        case 'wave':
          this.audio.play('wave');
          if (e.final) this.say(a.finalWave, true);
          else if (e.big) this.say(a.bigWave, true);
          else this.say(Number.isFinite(e.total) ? fmt(a.wave, { n: e.index + 1, total: e.total }) : fmt(a.waveEndless, { n: e.index + 1 }));
          break;
        case 'spawn':
          if (e.boss) this.say(fmt(a.bossIn, { name: this.enemyName(e.enemyId) }), true);
          break;
        case 'boom':
        case 'blast':
          this.audio.play('boom');
          break;
        case 'shout':
        case 'censure':
          this.audio.play('boom');
          break;
        case 'hose':
          this.audio.play('splash');
          break;
        case 'checkpoint':
          this.audio.play('whistle');
          break;
        case 'tariff':
          if (e.on) this.audio.play('leak');
          this.say(e.on ? a.tariffOn : a.tariffOff, true);
          break;
        case 'tax':
          this.audio.play('error');
          // Withholding repeats every few seconds: announce it now and then, not every time.
          if (state.time - this.lastTaxNotice > 12) {
            this.lastTaxNotice = state.time;
            this.say(fmt(a.taxed, { n: e.amount }));
          }
          break;
        case 'caf':
          if (e.amount > 0) this.audio.play('coin');
          this.say(e.amount > 0 ? fmt(a.cafPaid, { n: e.amount }) : a.cafLate);
          break;
        case 'ultimate':
          this.audio.play('ult');
          this.say(fmt(a.ultUsed, { name: this.t.ultimates[e.id].name }));
          this.ultAnnounced = false;
          break;
        case 'win':
        case 'lose':
          this.finish(state);
          break;
      }
    }
  }

  /** Only touches the DOM when a displayed value actually changed. */
  private put(key: string, value: string | number, apply: () => void): void {
    if (this.shown[key] === value) return;
    this.shown[key] = value;
    apply();
  }

  private updateHud(): void {
    const state = this.state;
    if (!state) return;

    this.put('resources', state.resources, () => {
      $(this.root, '[data-slot="resources"]').textContent = String(state.resources);
    });

    for (const card of state.cards) {
      const button = this.cards.get(card.def.id);
      if (!button) continue;
      const cooldown = Math.ceil((card.cooldown / card.def.recharge) * 20) / 20;
      const cost = costOf(state, card.def);
      const poor = state.resources < cost;
      const blocked = card.cooldown > 0 || poor;
      this.put(`cd:${card.def.id}`, cooldown, () => button.style.setProperty('--cd', String(cooldown)));
      // Tariffs change the price on the card itself.
      this.put(`cost:${card.def.id}`, cost, () => {
        button.querySelector<HTMLElement>('.card__cost')!.dataset.label = String(cost);
        button.classList.toggle('is-taxed', cost > card.def.cost);
        const description = document.getElementById(`card-desc-${card.def.id}`);
        if (description) description.textContent = this.describeCard(card.def.id, cost);
      });
      this.put(`blocked:${card.def.id}`, `${blocked}${poor}`, () => {
        button.setAttribute('aria-disabled', String(blocked));
        button.classList.toggle('is-poor', poor);
      });
    }

    const ultButton = $(this.root, '[data-action="ultimate"]') as HTMLButtonElement;
    const charge = Math.floor((state.ult.charge / ULT_CHARGE_TIME) * 50) / 50;
    const ready = ultimateReady(state);
    this.put('ult', charge, () => ultButton.style.setProperty('--charge', String(charge)));
    this.put('ultReady', String(ready), () => {
      ultButton.setAttribute('aria-disabled', String(!ready));
      ultButton.classList.toggle('is-ready', ready);
      $(this.root, '[data-slot="ult-state"]').textContent = ready ? this.t.ui.ready : this.t.ui.charging;
    });
    if (ready && !this.ultAnnounced) {
      this.ultAnnounced = true;
      this.say(fmt(this.t.announce.ultReady, { name: this.t.ultimates[state.ult.id].name }));
    }

    this.put('polls', state.polls, () => {
      const holder = $(this.root, '[data-slot="polls"]');
      holder.setAttribute('aria-label', `${this.t.ui.polls} : ${state.polls}/${state.level.polls}`);
      [...holder.children].forEach((pip, i) => pip.classList.toggle('is-lost', i >= state.polls));
    });

    const waveNumber = Math.max(1, state.wave.next);
    this.put('wave', `${waveNumber}`, () => {
      const total = state.level.waves;
      $(this.root, '[data-slot="wave-label"]').textContent = Number.isFinite(total)
        ? `${this.t.ui.wave} ${Math.min(waveNumber, total)}/${total}`
        : `${this.t.ui.wave} ${waveNumber}`;
      const ratio = Number.isFinite(total) ? Math.min(1, state.wave.next / total) : 1;
      $(this.root, '[data-slot="wave-bar"]').style.setProperty('--progress', String(ratio));
    });
  }

  // ───────────────────────────── loop ─────────────────────────────

  private frame(now: number): void {
    const dt = Math.min(0.1, (now - (this.lastFrame || now)) / 1000);
    this.lastFrame = now;
    const state = this.state;

    if (state && !this.screens.match.hidden) {
      if (!this.paused && state.status === 'playing') {
        this.clock += dt;
        this.accumulator += dt * this.save.speed;
        while (this.accumulator >= TICK && state.status === 'playing') {
          step(state);
          this.accumulator -= TICK;
        }
      } else if (state.status !== 'playing') {
        this.clock += dt; // let the last confetti fall
      }
      if (state.events.length) {
        const events = state.events.splice(0);
        this.renderer.consume(events, state);
        this.handleEvents(state, events);
      }
      this.updateHud();
      this.renderer.draw(state, this.view, this.clock);
    }
    requestAnimationFrame((next) => this.frame(next));
  }

  // ───────────────────────────── tests ─────────────────────────────

  /** `?e2e=1` exposes a small handle so browser tests can drive a match quickly. */
  private installTestHook(): void {
    if (!new URLSearchParams(location.search).has('e2e')) return;
    const api = {
      state: () => this.state,
      start: async (camp: CampId, level: number, seed = 2027) => {
        if (!CAMP_IDS.includes(camp)) throw new Error('unknown camp');
        this.pickCamp(camp, false);
        await this.startLevel(level, seed);
      },
      /** Fast-forwards the simulation, optionally letting the reference bot play. */
      advance: async (seconds: number, bot = false) => {
        const state = this.state;
        if (!state) return;
        const { botAct } = await import('./sim/bot');
        for (let i = 0; i < seconds / TICK && state.status === 'playing'; i++) {
          if (bot && i % 20 === 0) botAct(state);
          step(state);
          // Keep the outcome events (handled by the next frame); drop the chatter.
          state.events = state.events.filter((e) => e.type === 'win' || e.type === 'lose');
        }
      },
      /** Drops an opponent on the board (tests only). */
      spawn: (enemyId: string, lane: number, x: number) => {
        if (this.state) spawnEnemy(this.state, enemyId, lane, 'gauche', x);
      },
      unlockAll: () => {
        for (const camp of CAMP_IDS) this.save.progress[camp] = { unlocked: LAST_LEVEL, stars: {}, endlessBest: 0, finished: true };
        this.renderLevels();
      },
    };
    (window as unknown as { __P2027__: typeof api }).__P2027__ = api;
  }
}

export function boot(): void {
  const root = document.getElementById('game');
  if (root) new GameApp(root).init();
}
