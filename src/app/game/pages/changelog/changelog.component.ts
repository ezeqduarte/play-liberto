import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CHANGELOG } from '../../data/changelog';
import { PageNavComponent } from '../../components/page-nav/page-nav.component';

@Component({
  selector: 'app-changelog',
  imports: [PageNavComponent],
  templateUrl: './changelog.component.html',
  styleUrl: './changelog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogComponent {
  readonly entries = CHANGELOG;
}
