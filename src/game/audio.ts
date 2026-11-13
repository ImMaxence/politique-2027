/**
 * Tiny synthesised sound set (Web Audio). No audio file is downloaded, and no
 * sound plays before the first user gesture.
 */
export type Sfx =
  | 'click' | 'place' | 'error' | 'shoot' | 'hit' | 'coin' | 'down' | 'leak'
  | 'wave' | 'boom' | 'splash' | 'whistle' | 'ult' | 'win' | 'lose';

export class Audio {
  muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private lastPlayed = new Map<Sfx, number>();

  /** Must be called from a user gesture (browsers block audio otherwise). */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  private tone(freq: number, start: number, duration: number, type: OscillatorType, volume: number, slideTo?: number): void {
    const ctx = this.ctx!;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(this.master!);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  private noise(start: number, duration: number, volume: number): void {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter).connect(gain).connect(this.master!);
    source.start(ctx.currentTime + start);
  }

  // ───────────────────────────── music ─────────────────────────────

  private musicGain: GainNode | null = null;
  private musicTimer = 0;
  private musicNext = 0;
  private musicStep = 0;

  /**
   * A light campaign march, synthesised like the sound effects: four chords
   * (C, G, A minor, F), a bass and a tune, scheduled a little ahead of time.
   * It follows the mute button, and has its own switch in the pause menu.
   */
  music(on: boolean): void {
    if (!on) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = 0;
      return;
    }
    if (this.musicTimer || !this.ctx || !this.master) return;
    if (!this.musicGain) {
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.2;
      this.musicGain.connect(this.master);
    }
    this.musicNext = this.ctx.currentTime + 0.15;
    this.musicStep = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 120);
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const eighth = 60 / 116 / 2;
    while (this.musicNext < ctx.currentTime + 0.4) {
      if (!this.muted && ctx.state === 'running') this.musicNotes(this.musicStep, this.musicNext, eighth);
      this.musicNext += eighth;
      this.musicStep = (this.musicStep + 1) % 32;
    }
  }

  private musicNotes(step: number, at: number, eighth: number): void {
    const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);
    // C, G, A minor, F: root, third, fifth (MIDI note numbers).
    const chords = [[48, 52, 55], [43, 47, 50], [45, 48, 52], [41, 45, 48]];
    const chord = chords[Math.floor(step / 8)];
    const beat = step % 8;
    if (beat % 2 === 0) this.voice(midi(chord[beat % 4 === 0 ? 0 : 2] - 12), at, eighth * 1.6, 'triangle', 0.5);
    // The tune: chord tones an octave and a half up, with a rest now and then.
    const pattern = [2, 1, 0, 1, 2, -1, 1, 0];
    const index = pattern[beat];
    if (index >= 0) this.voice(midi(chord[index] + 24), at, eighth * 0.9, 'square', 0.16);
    if (beat === 4) this.voice(midi(chord[0] + 12), at, eighth * 3, 'triangle', 0.18);
  }

  private voice(freq: number, at: number, duration: number, type: OscillatorType, volume: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain).connect(this.musicGain!);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  play(name: Sfx): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    // Rate-limit the chatty ones so a full courtyard stays pleasant.
    const now = this.ctx.currentTime;
    const gap = name === 'shoot' ? 0.09 : name === 'hit' ? 0.07 : 0.03;
    if (now - (this.lastPlayed.get(name) ?? -1) < gap) return;
    this.lastPlayed.set(name, now);

    switch (name) {
      case 'click': this.tone(520, 0, 0.06, 'triangle', 0.18); break;
      case 'place': this.tone(300, 0, 0.1, 'triangle', 0.3, 620); break;
      case 'error': this.tone(170, 0, 0.14, 'square', 0.12, 120); break;
      case 'shoot': this.tone(760, 0, 0.05, 'triangle', 0.07, 520); break;
      case 'hit': this.tone(210, 0, 0.05, 'square', 0.05, 150); break;
      case 'coin': this.tone(990, 0, 0.08, 'triangle', 0.16); this.tone(1320, 0.07, 0.14, 'triangle', 0.16); break;
      case 'down': this.tone(420, 0, 0.3, 'sawtooth', 0.12, 110); break;
      case 'leak': this.tone(180, 0, 0.4, 'sawtooth', 0.2, 70); break;
      case 'wave': this.tone(196, 0, 0.5, 'sawtooth', 0.14, 294); this.tone(294, 0.25, 0.5, 'sawtooth', 0.12); break;
      case 'boom': this.noise(0, 0.5, 0.5); this.tone(110, 0, 0.4, 'sine', 0.4, 40); break;
      case 'splash': this.noise(0, 0.7, 0.35); this.tone(700, 0, 0.5, 'sine', 0.08, 180); break;
      case 'whistle': this.tone(1900, 0, 0.12, 'square', 0.07, 2300); this.tone(2300, 0.1, 0.2, 'square', 0.07, 1900); break;
      case 'ult': this.tone(220, 0, 0.5, 'sawtooth', 0.14, 880); this.tone(440, 0.2, 0.5, 'triangle', 0.16, 1320); break;
      case 'win': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * 0.13, 0.3, 'triangle', 0.22)); break;
      case 'lose': [392, 370, 349, 262].forEach((f, i) => this.tone(f, i * 0.22, 0.34, 'sawtooth', 0.12)); break;
    }
  }
}
