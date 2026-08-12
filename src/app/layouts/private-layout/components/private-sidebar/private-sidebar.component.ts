import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-private-sidebar',
  templateUrl: './private-sidebar.component.html',
})
export class PrivateSidebarComponent {
  readonly open = input(false);
  readonly closed = output<void>();
}
