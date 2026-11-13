/**
 * Browser entry point: screens (camp → calendar → match → result), HUD, input
 * and the game loop. The canvas is purely visual — every interaction goes
 * through real buttons so the game is playable with a keyboard, a mouse, touch
 * or a screen reader.
 */
import { GAME_STRINGS, fmt, isLang, type GameStrings, type Lang } from '../i18n/game';
import { Audio } from './audio';
import { unlockAchievements } from './achievements';
import { dailySetup, duelCode, parseDuel, today, type Mode, type Setup } from './modes';
import { COLS, LAST_LEVEL, LEVELS, ROWS, VERSUS } from './data/levels';
import { CAMP_IDS, type CampId } from './data/types';
import { CAMPS, EXTRAS, UNITS, categoryOf, lineupOf } from './data/units';
import { enemySvg, portraitSvg } from './render/portraits';
import { Renderer, type ViewState } from './render/renderer';
import { SpriteStore } from './render/sprites';
import {
  TICK, ULT_CHARGE_TIME, VERSUS_KINDS, catchPunchline, costOf, createGame, placeUnit, removeUnit, scoreFor, spawnEnemy, starsFor, step,
  ultimateReady, useUltimate, versusSend, type GameEvent, type GameState, type PlaceError, type VersusKind,
} from './sim/engine';
import { registerServiceWorker, setupInstallTip } from './pwa';
import { resultPicture } from './share';
import { loadSave, storeSave, type Save } from './storage';

type ScreenName = 'camp' | 'levels' | 'match';

function $(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

/** Opponents that get a "New!" card the first time they turn up: every special extra and guest. */
const INTRODUCED = new Set(Object.keys(EXTRAS).filter((id) => id !== 'militant' && id !== 'cat'));

interface LastResult {
  headline: string;
  won: boolean;
  stars: number;
  stats: [string, string][];
  notes: string[];
  /** A duel's link, shared along with the picture. */
  link?: { text: string; url: string };
}

/** The attacker's keys, by physical position (the same on AZERTY and QWERTY). */
const KIND_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT'];
const LANE_CODES = ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'];
const VERSUS_ORDER = Object.keys(VERSUS_KINDS) as VersusKind[];

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
  /**
   * Any window wider than it is tall — a phone held sideways, a laptop, a monitor:
   * the cards become a side column and the board fills the rest of the screen.
   * (Upright windows keep the toolbar above the board.)
   */
  private shortLandscape = window.matchMedia('(orientation: landscape)');
  private clock = 0;
  private lastFrame = 0;
  private accumulator = 0;
  private ultAnnounced = false;
  /** "New!" cards waiting to be shown, and whether one is on screen (the match stops meanwhile). */
  private introQueue: { id: string; camp: CampId }[] = [];
  private introOpen = false;
  private introFocus: HTMLElement | null = null;
  /** Browser tests drive matches themselves: the cards stay out of their way unless asked for. */
  private introsEnabled = !new URLSearchParams(location.search).has('e2e');
  private setup: Setup | null = null;
  /** A duel opened from a link, waiting on the calendar. */
  private incomingDuel: Setup | null = null;
  private versusKind: VersusKind = 'militant';
  private lastScore = 0;
  private lastResult: LastResult | null = null;
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

    this.incomingDuel = parseDuel(new URLSearchParams(location.search).get('duel') ?? '');
    setupInstallTip($(this.root, '[data-slot="install-tip"]'), this.t, this.save.installTipDismissed, () => {
      this.save.installTipDismissed = true;
      storeSave(this.save);
    });
    registerServiceWorker();
    new ResizeObserver(() => this.renderer.resize()).observe(this.stage);
    window.addEventListener('resize', () => this.syncPageWidth());
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
    this.renderModes();
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

  /** Daily challenge, duel banner and achievements, on the calendar. */
  private renderModes(): void {
    const camp = this.save.camp;
    if (camp) {
      const bench = CAMPS[camp].bench;
      const starter = CAMPS[camp].roster.find((id) => UNITS[id].slot === UNITS[bench].slot)!;
      $(this.root, '[data-slot="bench-text"]').textContent = fmt(this.t.ui.benchSwap, { bench: this.t.figures[bench].short, starter: this.t.figures[starter].short });
      this.root.querySelector('[data-action="bench"]')?.setAttribute('aria-pressed', String(this.save.bench[camp]));
    }
    const daily = dailySetup();
    const [, month, day] = today().split('-');
    $(this.root, '[data-slot="daily-date"]').textContent = `${day}/${month}`;
    $(this.root, '[data-slot="daily-blurb"]').textContent = fmt(this.t.ui.dailyBlurb, { level: this.t.levels[daily.level].name, camp: this.t.camps[daily.camp].name });
    const best = this.save.daily[today()];
    $(this.root, '[data-slot="daily-state"]').textContent = best !== undefined ? fmt(this.t.ui.dailyBest, { n: best }) : this.t.ui.play;

    const banner = $(this.root, '[data-slot="duel-banner"]');
    const duel = this.incomingDuel;
    banner.hidden = !duel;
    if (duel) {
      $(banner, '[data-slot="duel-text"]').textContent = fmt(this.t.ui.duelReceived, {
        score: duel.rival ?? 0, camp: this.t.camps[duel.camp].name, level: this.t.levels[duel.level].name,
      });
    }

    const earned = new Set(this.save.achievements);
    for (const item of this.root.querySelectorAll<HTMLElement>('[data-achievement]')) {
      item.classList.toggle('is-earned', earned.has(item.dataset.achievement as never));
    }
    $(this.root, '[data-slot="achievements-title"]').textContent = fmt(this.t.ui.achievementsTitle, {
      n: earned.size, total: this.root.querySelectorAll('[data-achievement]').length,
    });
  }

  // ───────────────────────────── match setup ─────────────────────────────

  private collectCells(): void {
    const buttons = [...this.grid.querySelectorAll<HTMLButtonElement>('[data-cell]')];
    for (let lane = 0; lane < ROWS; lane++) this.cells.push(buttons.slice(lane * COLS, lane * COLS + COLS));
  }

  private async startLevel(levelId: number, seed?: number): Promise<void> {
    const camp = this.save.camp;
    if (!camp) return;
    await this.startMatch({ mode: 'campaign', level: levelId, camp, seed: seed ?? Math.floor(Math.random() * 1e9) });
  }

  private async startMatch(setup: Setup): Promise<void> {
    const camp = setup.camp;
    const levelId = setup.level;
    this.setup = setup;
    this.audio.unlock();
    this.tryLandscape(); // must run inside the click that started the level
    this.root.classList.add('is-loading');
    await this.sprites.load();
    await document.fonts?.ready;
    this.root.classList.remove('is-loading');

    // Daily challenges and duels keep the camp's own line-up, so that everybody plays the same match.
    const personal = setup.mode === 'campaign' || setup.mode === 'versus';
    const state = createGame({
      camp, level: levelId, seed: setup.seed, hard: setup.mode === 'campaign' && this.save.hard,
      roster: personal ? lineupOf(camp, this.save.bench[camp]) : undefined,
    });
    this.root.dataset.camp = camp;
    this.root.dataset.mode = setup.mode;
    $(this.root, '[data-slot="versus"]').hidden = setup.mode !== 'versus';
    this.selectKind('militant');
    this.state = state;
    this.view = { hover: null, selected: null, removing: false };
    this.paused = false;
    this.finished = false;
    this.accumulator = 0;
    this.ultAnnounced = false;
    this.introQueue = [];
    this.closeIntro(false);
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
    // The toolbar and the board are sized to fit the window together: if the board
    // starts below the fold, bring the game to the top (the phone layout does its own).
    if (!this.root.classList.contains('is-compact')) {
      const board = this.stage.getBoundingClientRect();
      if (board.bottom > window.innerHeight || board.top < 0) this.root.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
    this.updateHud();
    const name = setup.mode === 'versus' ? this.t.ui.versusName : this.t.levels[levelId].name;
    const extra = setup.mode === 'versus' ? this.t.announce.versusStart : state.hard ? this.t.announce.hardMode : '';
    this.say(`${fmt(this.t.announce.start, { level: name, camp: this.t.camps[camp].name })} ${extra}`.trim());
    this.audio.music(this.save.music);
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
    this.syncPageWidth();
    this.renderer.setCompact(compact);
    // The match takes the whole screen (see game.css): bring it into view, then match the canvas to its new box.
    if (compact && !forced) this.root.scrollIntoView({ block: 'start', behavior: 'instant' });
    this.renderer.resize();
  }

  /**
   * The side layout spans the whole page, edge to edge. CSS viewport units count the
   * scrollbar of a desktop browser, so the usable width is measured here instead.
   */
  private syncPageWidth(): void {
    this.root.style.setProperty('--page-w', `${document.documentElement.clientWidth}px`);
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
        <span class="card__art" aria-hidden="true">${portraitSvg(card.def.id, { size: 96, sticker: false })}</span>
        <span class="card__name">${text.short}</span>
        <span class="card__type" aria-hidden="true">${this.t.types[category]}</span>
        <span class="card__cost" data-label="${card.def.cost}" aria-hidden="true"></span>
        <span class="card__cd" aria-hidden="true"></span>`;
      const describe = () => this.setInfo(`${text.power} — ${text.desc}`, text.name);
      // A long press on a touch screen opens the full card instead of picking the figure.
      let press = 0;
      let longPressed = false;
      button.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') return;
        longPressed = false;
        window.clearTimeout(press);
        press = window.setTimeout(() => {
          longPressed = true;
          this.showCardSheet(card.def.id);
        }, 450);
      });
      for (const type of ['pointerup', 'pointerleave', 'pointercancel'] as const) {
        button.addEventListener(type, () => window.clearTimeout(press));
      }
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      button.addEventListener('click', () => {
        if (longPressed) {
          longPressed = false;
          return;
        }
        this.select(card.def.id);
      });
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
    on('[data-action="restart"]', () => this.setup && void this.startMatch({ ...this.setup }));
    on('[data-action="retry"]', () => this.setup && void this.startMatch({ ...this.setup }));
    on('[data-mode="daily"]', () => void this.startMatch(dailySetup()));
    on('[data-mode="duel"]', () => {
      const camp = this.save.camp;
      if (camp) void this.startMatch({ mode: 'duel', level: 3 + Math.floor(Math.random() * (LAST_LEVEL - 2)), camp, seed: Math.floor(Math.random() * 1e9) });
    });
    on('[data-mode="versus"]', () => {
      const camp = this.save.camp;
      if (camp) void this.startMatch({ mode: 'versus', level: VERSUS.id, camp, seed: Math.floor(Math.random() * 1e9) });
    });
    on('[data-action="duel-accept"]', () => this.incomingDuel && void this.startMatch(this.incomingDuel));
    on('[data-action="duel-pass"]', () => {
      if (this.setup?.mode === 'duel') void this.startMatch({ ...this.setup, rival: this.lastScore });
    });
    on('[data-action="bench"]', () => {
      const camp = this.save.camp;
      if (!camp) return;
      this.save.bench[camp] = !this.save.bench[camp];
      storeSave(this.save);
      this.renderModes();
    });
    on('[data-kind]', (el) => this.selectKind(el.dataset.kind as VersusKind));
    on('[data-lane]', (el) => this.sendTo(Number(el.dataset.lane)));
    on('[data-action="music"]', () => {
      this.save.music = !this.save.music;
      storeSave(this.save);
      this.audio.music(this.save.music && !!this.state && !this.finished);
      this.syncToggles();
    });
    on('[data-action="next"]', () => this.state && void this.startLevel(this.state.level.id + 1));
    on('[data-action="quit"]', () => this.backToCalendar());
    on('[data-action="calendar"]', () => this.backToCalendar());
    on('[data-action="speed"]', () => {
      this.save.speed = this.save.speed === 1 ? 2 : this.save.speed === 2 ? 0.5 : 1;
      storeSave(this.save);
      this.syncToggles();
    });
    on('[data-action="mute"]', () => this.toggleMute());
    on('[data-action="difficulty"]', (el) => {
      this.save.hard = el.dataset.value === 'hard';
      storeSave(this.save);
      this.syncToggles();
    });
    on('[data-action="intro-ok"]', () => this.closeIntro(true));
    on('[data-action="share"]', () => void this.shareResult());
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
    return !!this.state && this.state.status === 'playing' && !this.screens.match.hidden && !this.paused && !this.introOpen;
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

    if (this.introOpen) {
      if (key === 'escape') {
        e.preventDefault();
        this.closeIntro(true);
      }
      return;
    }
    if (key === 'escape' || key === 'p') {
      if (this.finished) return;
      e.preventDefault();
      this.setPaused(!this.paused);
      return;
    }
    if (!this.playing()) return;

    // Two players: the left-hand keys belong to the attacker.
    if (this.setup?.mode === 'versus') {
      const kind = KIND_CODES.indexOf(e.code);
      const lane = LANE_CODES.indexOf(e.code);
      if (kind >= 0) {
        e.preventDefault();
        this.selectKind(VERSUS_ORDER[kind]);
        return;
      }
      if (lane >= 0) {
        e.preventDefault();
        this.sendTo(lane);
        return;
      }
    }

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
    } else if (key === 's') {
      e.preventDefault();
      this.summarise();
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
    } else {
      this.setInfo(this.t.ui.howTo);
      this.say(this.t.announce.reshuffleOff);
    }
  }

  private syncSelection(): void {
    for (const [id, button] of this.cards) button.setAttribute('aria-pressed', String(this.view.selected === id));
    $(this.root, '[data-action="remove"]').setAttribute('aria-pressed', String(this.view.removing));
    this.stage.classList.toggle('is-removing', this.view.removing);
    this.root.classList.toggle('is-removing', this.view.removing);
  }

  private clickCell(lane: number, col: number): void {
    const state = this.state;
    if (!state || !this.playing()) return;
    this.view.hover = { lane, col };
    // The debate: a soundbite on this square is sent back, whatever else was selected.
    if (catchPunchline(state, lane, col)) return;

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
    const speed = this.root.querySelector<HTMLElement>('[data-action="speed"]');
    if (speed) {
      const badge = this.save.speed === 0.5 ? '×½' : `×${this.save.speed}`;
      const name = this.save.speed === 0.5 ? this.t.ui.speedSlow : this.save.speed === 2 ? this.t.ui.speedFast : this.t.ui.speedNormal;
      speed.setAttribute('aria-pressed', String(this.save.speed !== 1));
      speed.setAttribute('aria-label', fmt(this.t.ui.speedIs, { badge, speed: name }));
      speed.title = speed.getAttribute('aria-label')!;
      $(speed, '[data-slot="speed-badge"]').textContent = badge;
    }
    this.root.querySelector('[data-action="orientation"]')?.setAttribute('aria-pressed', String(this.save.forceLandscape));
    this.root.querySelector('[data-action="music"]')?.setAttribute('aria-pressed', String(this.save.music));
    for (const option of this.root.querySelectorAll<HTMLElement>('[data-action="difficulty"]')) {
      option.setAttribute('aria-pressed', String((option.dataset.value === 'hard') === this.save.hard));
    }
  }

  // ───────────────────────────── pause / result ─────────────────────────────

  private overlay(name: 'pause' | 'result' | 'intro', visible: boolean): HTMLElement {
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
      this.audio.music(false);
      $(el, '[data-action="resume"]').focus();
      this.say(this.t.announce.paused);
    } else {
      this.overlay('pause', false);
      this.audio.music(this.save.music);
      (this.resumeFocus && this.root.contains(this.resumeFocus) ? this.resumeFocus : this.cells[this.lastCell.lane][this.lastCell.col]).focus({ preventScroll: true });
      this.say(this.t.announce.resumed);
    }
  }

  private backToCalendar(): void {
    this.introQueue = [];
    this.closeIntro(false);
    this.audio.music(false);
    unlockAchievements(this.save);
    storeSave(this.save);
    if (this.save.camp) this.root.dataset.camp = this.save.camp;
    delete this.root.dataset.mode;
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
    this.introQueue = [];
    this.closeIntro(false);
    this.audio.music(false);
    const setup = this.setup ?? { mode: 'campaign' as Mode, level: state.level.id, camp: state.camp, seed: state.seed };
    const campaign = setup.mode === 'campaign';
    const camp = state.camp;
    const progress = campaign ? this.save.progress[camp] : { ...this.save.progress[camp], stars: { ...this.save.progress[camp].stars } };
    const won = state.status === 'won';
    const level = state.level;
    const score = scoreFor(state);
    this.lastScore = score;
    const stars = starsFor(state);
    const wavesHeld = level.endless ? Math.max(0, state.wave.next - 1) : state.stats.wavesCleared;
    let unlockedUnit: string | null = null;
    let unlockedReinforcements = false;

    const previousBest = progress.endlessBest;
    if (level.endless) {
      progress.endlessBest = Math.max(progress.endlessBest, wavesHeld);
    } else if (won) {
      progress.stars[level.id] = Math.max(progress.stars[level.id] ?? 0, stars);
      if (level.id === LAST_LEVEL) progress.finished = true;
      const next = LEVELS.find((l) => l.id === level.id + 1);
      if (next && progress.unlocked < next.id) {
        progress.unlocked = next.id;
        if (next.slots > level.slots) unlockedUnit = lineupOf(camp, this.save.bench[camp])[next.slots - 1];
        unlockedReinforcements = next.reinforcements && !level.reinforcements;
      }
    }
    if (setup.mode === 'daily') {
      this.save.counters.dailies++;
      this.save.daily[today()] = Math.max(this.save.daily[today()] ?? 0, score);
    }
    if (setup.mode === 'versus') this.save.counters.versus++;
    if (campaign && won && state.hard && level.id === LAST_LEVEL) this.save.counters.hardRunoff++;
    const fresh = unlockAchievements(this.save);
    storeSave(this.save);

    const pool = level.endless ? this.t.headlines.endless : won ? this.t.headlines.win : this.t.headlines.lose;
    const headline = setup.mode === 'versus'
      ? won ? this.t.ui.versusDefender : this.t.ui.versusAttacker
      : fmt(pool[Math.floor(Math.random() * pool.length)], { camp: this.t.camps[camp].name, n: wavesHeld });

    const el = this.overlay('result', true);
    el.dataset.outcome = won ? 'won' : 'lost';
    const title = $(el, '[data-slot="headline"]');
    title.textContent = headline;

    const starSlot = $(el, '[data-slot="stars"]');
    starSlot.hidden = !won || setup.mode === 'versus';
    starSlot.textContent = `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
    starSlot.setAttribute('aria-label', `${stars} ${this.t.ui.stars}`);

    const scored = setup.mode === 'daily' || setup.mode === 'duel';
    const stats: [string, string][] = [
      scored ? [this.t.ui.statScore, String(score)] : [this.t.ui.statTime, clockText(state.time)],
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

    // Hard mode and a new endless record get a line of their own.
    const notes: string[] = [];
    if (state.hard) notes.push(this.t.ui.hardBadge);
    if (level.endless && wavesHeld > previousBest) notes.push(this.t.ui.newRecord);
    let link: LastResult['link'];
    if (setup.mode === 'daily') notes.push(this.t.ui.dailyName);
    if (setup.mode === 'duel') {
      notes.push(fmt(this.t.ui.duelYou, { score }));
      if (setup.rival !== undefined) {
        notes.push(fmt(this.t.ui.duelBeat, { score: setup.rival }), score > setup.rival ? this.t.ui.duelWon : this.t.ui.duelLost);
      }
      const code = duelCode(setup, score);
      notes.push(fmt(this.t.ui.duelCode, { code }));
      link = { text: fmt(this.t.ui.duelShareText, { headline, score }), url: `${location.origin}${location.pathname}?duel=${code}` };
    }
    for (const id of fresh) notes.push(fmt(this.t.ui.achievementNew, { name: this.t.achievements[id].name }));
    const noteSlot = $(el, '[data-slot="notes"]');
    noteSlot.hidden = !notes.length;
    noteSlot.textContent = notes.join(' · ');
    this.lastResult = { headline, won, stars: won && setup.mode !== 'versus' ? stars : 0, stats, notes, link };

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
    next.hidden = !(campaign && won && !level.endless && level.id < LAST_LEVEL);
    $(el, '[data-action="duel-pass"]').hidden = !(setup.mode === 'duel' && setup.rival === undefined);
    this.audio.play(won ? 'win' : 'lose');
    this.say(`${won ? this.t.announce.won : this.t.announce.lost} ${headline} ${notes.join('. ')}`.trim(), true);
    (next.hidden ? $(el, '[data-action="retry"]') : next).focus();
  }

  // ───────────────────────────── two players ─────────────────────────────

  private selectKind(kind: VersusKind): void {
    this.versusKind = kind;
    for (const button of this.root.querySelectorAll<HTMLElement>('[data-kind]')) {
      button.setAttribute('aria-pressed', String(button.dataset.kind === kind));
    }
  }

  /** The attacker sends the chosen opponent down a lane. */
  private sendTo(lane: number): void {
    const state = this.state;
    if (!state?.versus || !this.playing()) return;
    const error = versusSend(state, this.versusKind, lane);
    if (error === 'budget') {
      this.audio.play('error');
      this.say(this.t.announce.budgetLow);
    } else if (!error) {
      this.audio.play('click');
      const name = this.versusKind === 'star' ? this.t.ui.star : this.t.extras[this.versusKind];
      this.say(fmt(this.t.announce.sent, { name, lane: lane + 1 }));
    }
  }

  // ───────────────────────────── "New!" cards ─────────────────────────────

  /** Queues a short introduction the first time a special opponent turns up. */
  private introduce(enemyId: string, camp: CampId): void {
    if (!this.introsEnabled || !INTRODUCED.has(enemyId) || this.save.seen.includes(enemyId)) return;
    if (this.introQueue.some((q) => q.id === enemyId)) return;
    this.introQueue.push({ id: enemyId, camp });
    if (!this.introOpen) this.showNextIntro();
  }

  private showNextIntro(): void {
    const next = this.introQueue.shift();
    const state = this.state;
    if (!next || !state || state.status !== 'playing') return;
    const guest = this.t.figures[next.id];
    const el = this.overlay('intro', true);
    $(el, '[data-slot="intro-tag"]').textContent = this.t.ui.newOpponent;
    $(el, '[data-slot="intro-art"]').innerHTML = enemySvg(next.id, next.camp, { size: 150, uid: 'intro' });
    $(el, '[data-slot="intro-name"]').textContent = guest ? guest.name : this.t.extras[next.id];
    const power = $(el, '[data-slot="intro-power"]');
    power.hidden = !guest;
    power.textContent = guest ? `${guest.title} · ${guest.power}` : '';
    $(el, '[data-slot="intro-desc"]').textContent = guest ? guest.desc : (this.t.about[next.id] ?? '');
    if (!this.introOpen) this.introFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.introOpen = true;
    this.save.seen.push(next.id);
    storeSave(this.save);
    $(el, '[data-action="intro-ok"]').focus({ preventScroll: true });
  }

  /** The full card of a figure, opened by a long press (the match waits meanwhile). */
  private showCardSheet(unitId: string): void {
    const state = this.state;
    if (!state || state.status !== 'playing' || this.introOpen || this.paused) return;
    const text = this.t.figures[unitId];
    const def = UNITS[unitId];
    const el = this.overlay('intro', true);
    $(el, '[data-slot="intro-tag"]').textContent = this.t.ui.cardSheet;
    $(el, '[data-slot="intro-art"]').innerHTML = portraitSvg(unitId, { size: 150, uid: 'sheet' });
    $(el, '[data-slot="intro-name"]').textContent = text.name;
    const power = $(el, '[data-slot="intro-power"]');
    power.hidden = false;
    power.textContent = `${this.t.types[categoryOf(def)]} · ${this.t.ui.cost} ${costOf(state, def)} · ${text.power}`;
    $(el, '[data-slot="intro-desc"]').textContent = text.desc;
    this.introFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.introOpen = true;
    $(el, '[data-action="intro-ok"]').focus({ preventScroll: true });
  }

  /** "S": the state of the board in one sentence, for screen-reader users. */
  private summarise(): void {
    const state = this.state;
    if (!state) return;
    const a = this.t.announce;
    const lanes = state.level.lanes.map((lane) => {
      const marching = state.enemies.filter((e) => e.lane === lane && e.x <= COLS);
      if (!marching.length) return fmt(a.summaryClear, { lane: lane + 1 });
      const nearest = Math.max(0, Math.round(Math.min(...marching.map((e) => e.x))));
      return fmt(a.summaryLane, { lane: lane + 1, n: marching.length, cells: nearest });
    });
    this.say(fmt(a.summary, { res: Math.floor(state.resources), polls: state.polls, max: state.level.polls, lanes: lanes.join('. ') }));
  }

  /** Closes the card; with `resume`, shows the next one or gives the match back. */
  private closeIntro(resume: boolean): void {
    if (!this.introOpen) return;
    if (resume && this.introQueue.length) {
      this.showNextIntro();
      return;
    }
    this.introOpen = false;
    this.overlay('intro', false);
    if (resume) {
      const back = this.introFocus && this.root.contains(this.introFocus) ? this.introFocus : this.cells[this.lastCell.lane][this.lastCell.col];
      back.focus({ preventScroll: true });
    }
    this.introFocus = null;
  }

  // ───────────────────────────── share ─────────────────────────────

  /**
   * Draws the front page of the result as a picture and hands it to the system share
   * sheet; where files cannot be shared, the picture is downloaded instead. Nothing
   * leaves the device unless the player sends it somewhere.
   */
  private async shareResult(): Promise<void> {
    const result = this.lastResult;
    const camp = this.save.camp;
    if (!result || !camp) return;
    const blob = await resultPicture(result, camp, this.t, this.sprites.unit(CAMPS[camp].roster[5]));
    if (!blob) return;
    const file = new File([blob], 'politique-2027.png', { type: 'image/png' });
    const text = result.link?.text ?? fmt(this.t.ui.shareText, { headline: result.headline });
    const url = result.link?.url ?? `${location.origin}${location.pathname}`;
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Politique 2027', text: result.link ? `${text} ${url}` : text });
        return;
      }
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return;
    }
    // No file sharing here: save the picture, and put the headline and the link on the clipboard.
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      this.say(`${this.t.announce.shareSaved} ${this.t.announce.shareCopied}`);
    } catch {
      this.say(this.t.announce.shareSaved);
    }
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
    const soundbite = state.punchlines.some((p) => p.lane === lane && p.col === col) ? `${this.t.ui.punchline} — ` : '';
    return `${soundbite}${where} : ${what}${suffix}`;
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
          this.introduce(e.enemyId, e.camp);
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
        case 'zucman':
          if (e.adopted) this.audio.play('coin');
          this.save.counters.exiled += e.exiles.length;
          this.say(e.adopted ? fmt(a.zucmanPassed, { n: e.amount }) : a.zucmanOff);
          break;
        case 'wonOver':
          this.audio.play('coin');
          this.save.counters.wonOver++;
          break;
        case 'enemyDown':
          if (e.enemyId === 'syndicat') this.save.counters.unionists++;
          if (e.enemyId === 'lucet') this.save.counters.lucet++;
          if (e.enemyId === 'lisnard') this.save.counters.lisnard++;
          break;
        case 'punchline':
          this.audio.play('whistle');
          this.say(fmt(a.punchlineIn, { row: e.lane + 1, col: e.col + 1 }));
          break;
        case 'riposte':
          this.audio.play('coin');
          this.save.counters.ripostes++;
          break;
        case 'punchlineLanded':
          this.audio.play('error');
          break;
        case 'twist':
          this.audio.play('wave');
          this.say(e.id === 'manif' ? a.twist_manif : a.twist_force, true);
          break;
        case 'theme':
          this.audio.play('wave');
          this.say(a[`theme_${e.id}`], true);
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

    if (state.versus) {
      const versus = state.versus;
      const budget = Math.floor(versus.budget);
      this.put('vs-budget', budget, () => {
        $(this.root, '[data-slot="vs-budget"]').textContent = String(budget);
        for (const button of this.root.querySelectorAll<HTMLElement>('[data-kind]')) {
          button.setAttribute('aria-disabled', String(VERSUS_KINDS[button.dataset.kind as VersusKind] > budget));
        }
      });
      const left = Math.ceil(versus.timeLeft);
      this.put('wave', `t${left}`, () => {
        $(this.root, '[data-slot="wave-label"]').textContent = `${this.t.ui.versusTime} ${clockText(left)}`;
        $(this.root, '[data-slot="wave-bar"]').style.setProperty('--progress', String(1 - versus.timeLeft / VERSUS.versus!.duration));
      });
      return;
    }
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
      if (!this.paused && !this.introOpen && state.status === 'playing') {
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
      /** Lets a test see the "New!" cards (they are off by default under ?e2e). */
      intros: (on: boolean) => {
        this.introsEnabled = on;
        if (on) this.save.seen = [];
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
