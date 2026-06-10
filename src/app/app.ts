import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AudioService } from './game/services/audio.service';
import { MuteButtonComponent } from './game/components/mute-button/mute-button.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MuteButtonComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly audio = inject(AudioService);

  ngOnInit(): void {
    // Default loop while the user is browsing menus / standings.
    // LiveMatchService swaps this for the crowd ambience when a match
    // starts and switches it back when the match ends.
    this.audio.playMusic('anthem');
  }
}
