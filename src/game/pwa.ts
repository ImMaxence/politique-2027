/**
 * Home screen and offline play: the "add to home screen" tip shown on phones, and
 * the service worker that keeps a copy of the game on the device.
 */
import type { GameStrings } from '../i18n/game';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const testing = () => new URLSearchParams(location.search).has('e2e');

/** On a phone, outside the installed app: how to put the game on the home screen. */
export function setupInstallTip(tip: HTMLElement, t: GameStrings, dismissed: boolean, onDismiss: () => void): void {
  const text = tip.querySelector<HTMLElement>('[data-slot="install-text"]')!;
  const install = tip.querySelector<HTMLElement>('[data-action="install"]')!;
  let prompt: InstallPrompt | null = null;
  tip.querySelector('[data-action="dismiss-install"]')?.addEventListener('click', () => {
    tip.hidden = true;
    onDismiss();
  });
  install.addEventListener('click', () => {
    if (!prompt) return;
    const asked = prompt;
    void asked.prompt().then(() => asked.userChoice).then((choice) => {
      if (choice.outcome === 'accepted') tip.hidden = true;
    }).catch(() => undefined);
  });
  const nav = navigator as Navigator & { standalone?: boolean };
  const installed = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || nav.standalone === true;
  const touch = window.matchMedia('(pointer: coarse)').matches;
  if (installed || !touch || dismissed || testing()) return;
  const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  text.textContent = apple ? t.ui.installIos : t.ui.installGeneric;
  tip.hidden = false;
  // Chrome and Edge on Android offer their own install dialog: put it behind a button.
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    prompt = event as InstallPrompt;
    text.textContent = t.ui.installAndroid;
    install.hidden = false;
  });
  window.addEventListener('appinstalled', () => (tip.hidden = true));
}

/** Keeps a copy of the game on the device so that it opens, and plays, offline. */
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator) || testing()) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}
