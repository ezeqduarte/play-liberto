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
import { LiveMatchService, LiveMatchSpeed } from '../../services/live-match.service';
import { MatchResult, MatchTeam } from '../../models';
import { TeamCrestComponent } from '../team-crest/team-crest.component';

/**
 * Plays a single match minute-by-minute. Takes the two MatchTeams as
 * inputs, emits `finished` with the final MatchResult when the 90'
 * whistle blows.
 */
@Component({
  selector: 'app-live-match',
  imports: [TeamCrestComponent],
  templateUrl: './live-match.component.html',
  styleUrl: './live-match.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveMatchComponent {
  readonly live = inject(LiveMatchService);

  readonly home = input.required<MatchTeam>();
  readonly away = input.required<MatchTeam>();
  readonly isKnockout = input(false);
  readonly finished = output<MatchResult>();

  readonly speeds: LiveMatchSpeed[] = ['slow', 'normal', 'fast', 'instant'];
  readonly speedLabels: Record<LiveMatchSpeed, string> = {
    slow: 'Lento',
    normal: 'Normal',
    fast: 'Rápido',
    instant: 'Saltar',
  };

  /** Triggers a brief CSS flash on the score when a goal lands. */
  private readonly _flashSide = signal<'home' | 'away' | null>(null);
  readonly flashSide = this._flashSide.asReadonly();

  /** Reversed events for the feed (most recent at top). */
  readonly feedEvents = computed(() => [...this.live.displayedEvents()].reverse());

  private lastGoalCount = 0;
  private resultEmitted = false;
  private autoStarted = false;

  constructor() {
    // Bootstrap the match once inputs are ready. Only fires once per
    // (home, away) pair.
    effect(() => {
      const h = this.home();
      const a = this.away();
      const knockout = this.isKnockout();
      if (h && a && !this.autoStarted) {
        this.autoStarted = true;
        this.lastGoalCount = 0;
        this.resultEmitted = false;
        this.live.start(h, a, knockout);
      }
    });

    // Watch for new goals → trigger score flash.
    effect(() => {
      const total = this.live.homeGoals() + this.live.awayGoals();
      if (total > this.lastGoalCount) {
        const evt = this.live.latestGoalEvent();
        if (evt?.side) {
          this._flashSide.set(evt.side);
          setTimeout(() => this._flashSide.set(null), 700);
        }
        this.lastGoalCount = total;
      }
    });

    // Emit `finished` exactly once.
    effect(() => {
      const r = this.live.result();
      if (r && !this.resultEmitted) {
        this.resultEmitted = true;
        this.finished.emit(r);
      }
    });
  }

  setSpeed(s: LiveMatchSpeed): void {
    this.live.setSpeed(s);
  }

  togglePause(): void {
    if (this.live.isPaused()) this.live.resume();
    else this.live.pause();
  }
}
