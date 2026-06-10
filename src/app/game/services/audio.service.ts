import { Injectable, signal } from '@angular/core';

export type MusicTrack = 'anthem' | 'crowd';
export type SfxName = 'kickoff' | 'halftime' | 'fulltime' | 'goal';

const MUTE_KEY = 'liberto.muted';

const MUSIC_URLS: Record<MusicTrack, string> = {
  anthem: 'sounds/anthem.mp3',
  crowd: 'sounds/crowd.mp3',
};

const SFX_URLS: Record<SfxName, string> = {
  kickoff: 'sounds/whistle-kickoff.mp3',
  halftime: 'sounds/whistle-half.mp3',
  fulltime: 'sounds/whistle-end.mp3',
  goal: 'sounds/goal.mp3',
};

const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.7;

/**
 * Centralised audio playback. The browser may block autoplay until the
 * user interacts with the page, so we install a one-shot document
 * click listener that retries the current music whenever that
 * happens. All play() calls swallow rejections so missing files don't
 * blow up the runtime.
 */
@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly _muted = signal(this.readPersistedMute());
  readonly muted = this._muted.asReadonly();

  private currentTrack: MusicTrack | null = null;
  private musicEl: HTMLAudioElement | null = null;

  constructor() {
    if (typeof document === 'undefined') return;
    document.addEventListener(
      'click',
      () => {
        if (this.musicEl && !this._muted()) {
          this.musicEl.play().catch(() => {});
        }
      },
      { once: true },
    );
  }

  /**
   * Switches the looping background music. Pass null to silence.
   * No-op if the requested track is already playing.
   */
  playMusic(track: MusicTrack | null): void {
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    if (track === null) return;

    const el = new Audio(MUSIC_URLS[track]);
    el.loop = true;
    el.volume = MUSIC_VOLUME;
    this.musicEl = el;
    if (!this._muted()) {
      el.play().catch(() => {});
    }
  }

  /**
   * Fires a one-shot sound effect. Doesn't queue or block — if it
   * fails (file missing, autoplay blocked, etc.) we just skip it.
   */
  playSfx(name: SfxName): void {
    if (this._muted()) return;
    const el = new Audio(SFX_URLS[name]);
    el.volume = SFX_VOLUME;
    el.play().catch(() => {});
  }

  toggleMute(): void {
    const next = !this._muted();
    this._muted.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MUTE_KEY, String(next));
    }
    if (next) {
      this.musicEl?.pause();
    } else if (this.musicEl) {
      this.musicEl.play().catch(() => {});
    }
  }

  private stopMusic(): void {
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.src = '';
    }
    this.musicEl = null;
  }

  private readPersistedMute(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(MUTE_KEY) === 'true';
  }
}
