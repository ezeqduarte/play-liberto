import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import confetti from 'canvas-confetti';
import { TournamentService } from '../../services/tournament.service';
import { DraftService } from '../../services/draft.service';

@Component({
  selector: 'app-victory',
  templateUrl: './victory.component.html',
  styleUrl: './victory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VictoryComponent implements AfterViewInit, OnDestroy {
  private readonly tournament = inject(TournamentService);
  private readonly draft = inject(DraftService);
  private readonly router = inject(Router);

  readonly userTeam = this.tournament.userTeam;

  private confettiInterval: ReturnType<typeof setInterval> | null = null;

  ngAfterViewInit(): void {
    // Big initial burst.
    this.fireBurst();
    // Repeated bursts for ~6 seconds.
    let bursts = 0;
    this.confettiInterval = setInterval(() => {
      this.fireBurst();
      bursts++;
      if (bursts >= 6) this.stopConfetti();
    }, 800);
  }

  ngOnDestroy(): void {
    this.stopConfetti();
  }

  playAgain(): void {
    this.tournament.reset();
    this.draft.reset();
    this.router.navigate(['/draft/formation']);
  }

  private fireBurst(): void {
    const greens = ['#00d165', '#00b358', '#7fffae'];
    const golds = ['#ffb547', '#ffd784', '#ffe0a3'];
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { x: 0.2, y: 0.6 },
      colors: greens,
    });
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { x: 0.8, y: 0.6 },
      colors: golds,
    });
  }

  private stopConfetti(): void {
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
      this.confettiInterval = null;
    }
  }
}
