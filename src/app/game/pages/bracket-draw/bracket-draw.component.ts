import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { KnockoutTie, MatchTeam } from '../../models';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

export type DrawSpeed = 'slow' | 'normal' | 'fast' | 'instant';

interface DrawSlot {
  /** 0-7, which tie this slot belongs to. */
  tieIndex: number;
  /** 'A' is teamA (home in leg 1), 'B' is teamB. */
  position: 'A' | 'B';
  team: MatchTeam | null;
  /** True for one tick when a team just landed here — drives the pop animation. */
  justFilled: boolean;
}

const SPEED_MS: Record<DrawSpeed, number> = {
  slow: 1100,
  normal: 550,
  fast: 220,
  instant: 50,
};

@Component({
  selector: 'app-bracket-draw',
  imports: [PageNavComponent],
  templateUrl: './bracket-draw.component.html',
  styleUrl: './bracket-draw.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BracketDrawComponent {
  private readonly tournament = inject(TournamentService);
  private readonly router = inject(Router);

  readonly userTeam = this.tournament.userTeam;

  readonly speeds: DrawSpeed[] = ['slow', 'normal', 'fast', 'instant'];
  readonly speedLabels: Record<DrawSpeed, string> = {
    slow: 'Lento',
    normal: 'Normal',
    fast: 'Rápido',
    instant: 'Saltar',
  };

  /** Remaining teams that haven't been drawn yet. */
  readonly pool = signal<MatchTeam[]>([]);
  /** 16 slot positions (2 per tie × 8 ties), filled progressively. */
  readonly slots = signal<DrawSlot[]>([]);
  readonly started = signal(false);
  readonly speed = signal<DrawSpeed>('normal');
  readonly isDrawing = signal(false);

  /** Tie cards rendered in the grid (8 of them, paired from the slots). */
  readonly tieRows = computed(() => {
    const slots = this.slots();
    const rows: { tieIndex: number; a: DrawSlot; b: DrawSlot }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = slots.find((s) => s.tieIndex === i && s.position === 'A')!;
      const b = slots.find((s) => s.tieIndex === i && s.position === 'B')!;
      rows.push({ tieIndex: i, a, b });
    }
    return rows;
  });

  readonly drawnCount = computed(
    () => this.slots().filter((s) => s.team !== null).length,
  );

  readonly allDrawn = computed(() => this.drawnCount() >= 16);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (!this.tournament.groupsCompleted()) {
        // Group stage wasn't played → can't draw the bracket.
        this.router.navigate(['/']);
        return;
      }
      if (this.pool().length === 0 && this.slots().length === 0) {
        this.initDraw();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  setSpeed(s: DrawSpeed): void {
    this.speed.set(s);
    // If a draw is mid-flight, reschedule the next tick with the new delay.
    if (this.isDrawing() && !this.allDrawn()) {
      this.stopTimer();
      this.scheduleNext();
    }
  }

  startDraw(): void {
    if (this.started()) return;
    this.started.set(true);
    this.isDrawing.set(true);
    this.scheduleNext();
  }

  goToPlayoffs(): void {
    this.router.navigate(['/tournament/playoffs']);
  }

  isUserTeam(team: MatchTeam | null): boolean {
    return !!team && team.id === this.userTeam()?.id;
  }

  /**
   * Slot contains the user's team — used to highlight that tie throughout
   * the rest of the draw.
   */
  isUserTie(tieIndex: number): boolean {
    const user = this.userTeam();
    if (!user) return false;
    return this.slots().some(
      (s) => s.tieIndex === tieIndex && s.team?.id === user.id,
    );
  }

  trackTieRow(_: number, row: { tieIndex: number }): number {
    return row.tieIndex;
  }

  trackTeamChip(_: number, t: MatchTeam): string {
    return t.id;
  }

  private initDraw(): void {
    const qualified = this.tournament.getQualifiedTeams();
    this.pool.set([...qualified]);
    const fresh: DrawSlot[] = [];
    for (let i = 0; i < 8; i++) {
      fresh.push({ tieIndex: i, position: 'A', team: null, justFilled: false });
      fresh.push({ tieIndex: i, position: 'B', team: null, justFilled: false });
    }
    this.slots.set(fresh);
  }

  private scheduleNext(): void {
    if (this.allDrawn()) {
      this.finishDraw();
      return;
    }
    const delay = SPEED_MS[this.speed()];
    this.timer = setTimeout(() => this.drawOne(), delay);
  }

  private drawOne(): void {
    const pool = this.pool();
    if (pool.length === 0) {
      this.finishDraw();
      return;
    }
    const teamIdx = Math.floor(Math.random() * pool.length);
    const team = pool[teamIdx];
    const remaining = pool.filter((_, i) => i !== teamIdx);

    // Clear any previous justFilled flags and pick a random empty slot.
    const slots = this.slots().map((s) => ({ ...s, justFilled: false }));
    const emptyIndices = slots
      .map((s, i) => (s.team === null ? i : -1))
      .filter((i) => i >= 0);
    const targetIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    slots[targetIdx] = { ...slots[targetIdx], team, justFilled: true };

    this.pool.set(remaining);
    this.slots.set(slots);

    this.scheduleNext();
  }

  private finishDraw(): void {
    this.isDrawing.set(false);
    this.stopTimer();
    // Build KnockoutTies from the filled slots and commit to the tournament.
    const slots = this.slots();
    const ties: KnockoutTie[] = [];
    for (let i = 0; i < 8; i++) {
      const a = slots.find((s) => s.tieIndex === i && s.position === 'A')!.team!;
      const b = slots.find((s) => s.tieIndex === i && s.position === 'B')!.team!;
      ties.push({
        id: `R16-${i + 1}`,
        teamA: a,
        teamB: b,
        leg1: null,
        leg2: null,
        isFinal: false,
        winner: null,
        aggregateA: 0,
        aggregateB: 0,
      });
    }
    this.tournament.commitBracket(ties);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
