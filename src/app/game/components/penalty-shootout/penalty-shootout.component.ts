import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatchTeam, PenaltyShootout } from '../../models';
import { TeamCrestComponent } from '../team-crest/team-crest.component';
import { AudioService } from '../../services/audio.service';

type ShootoutSpeed = 'slow' | 'normal' | 'fast' | 'instant';

const SPEED_MS: Record<ShootoutSpeed, number> = {
  slow: 1500,
  normal: 800,
  fast: 350,
  instant: 80,
};

/**
 * Animates a pre-computed penalty shoot-out one kick at a time. Same
 * speed-pill UX as the live-match component. Emits `finished` once
 * the last kick is revealed.
 */
@Component({
  selector: 'app-penalty-shootout',
  imports: [TeamCrestComponent],
  templateUrl: './penalty-shootout.component.html',
  styleUrl: './penalty-shootout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PenaltyShootoutComponent {
  private readonly audio = inject(AudioService);

  readonly home = input.required<MatchTeam>();
  readonly away = input.required<MatchTeam>();
  readonly shootout = input.required<PenaltyShootout>();
  readonly finished = output<void>();

  readonly speeds: ShootoutSpeed[] = ['slow', 'normal', 'fast', 'instant'];
  readonly speedLabels: Record<ShootoutSpeed, string> = {
    slow: 'Lento',
    normal: 'Normal',
    fast: 'Rápido',
    instant: 'Saltar',
  };
  readonly speed = signal<ShootoutSpeed>('normal');

  /** How many kicks have been revealed so far. */
  readonly revealed = signal(0);

  readonly displayedKicks = computed(() =>
    this.shootout().kicks.slice(0, this.revealed()),
  );

  readonly homeScore = computed(
    () => this.displayedKicks().filter((k) => k.side === 'home' && k.scored).length,
  );
  readonly awayScore = computed(
    () => this.displayedKicks().filter((k) => k.side === 'away' && k.scored).length,
  );

  readonly isFinished = computed(
    () => this.revealed() >= this.shootout().kicks.length,
  );

  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private emittedFinish = false;

  constructor() {
    effect(() => {
      if (this.shootout() && !this.started) {
        this.started = true;
        this.scheduleNext();
      }
    });

    effect(() => {
      if (this.isFinished() && !this.emittedFinish) {
        this.emittedFinish = true;
        this.finished.emit();
      }
    });
  }

  setSpeed(s: ShootoutSpeed): void {
    this.speed.set(s);
    if (!this.isFinished()) {
      this.stopTimer();
      this.scheduleNext();
    }
  }

  private scheduleNext(): void {
    if (this.isFinished()) return;
    const delay = SPEED_MS[this.speed()];
    this.timer = setTimeout(() => this.revealNext(), delay);
  }

  private revealNext(): void {
    if (this.isFinished()) return;
    this.revealed.update((n) => n + 1);
    const last = this.displayedKicks()[this.displayedKicks().length - 1];
    this.audio.playSfx(last?.scored ? 'goal' : 'kickoff');
    this.scheduleNext();
  }

  private stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
