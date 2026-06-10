import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AudioService } from '../../services/audio.service';

/**
 * Tiny fixed chip in the top-right that mirrors the Inicio chip in the
 * top-left. Toggles the global mute flag (persisted in localStorage).
 */
@Component({
  selector: 'app-mute-button',
  template: `
    <button
      type="button"
      class="mute"
      [attr.aria-label]="audio.muted() ? 'Activar sonido' : 'Silenciar'"
      [attr.aria-pressed]="audio.muted()"
      (click)="audio.toggleMute()"
    >
      {{ audio.muted() ? '🔇' : '🔊' }}
    </button>
  `,
  styleUrl: './mute-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuteButtonComponent {
  readonly audio = inject(AudioService);
}
