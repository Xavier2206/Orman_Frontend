import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { PrivateSidebarComponent } from './components/private-sidebar/private-sidebar.component';
import { PrivateTopbarComponent } from './components/private-topbar/private-topbar.component';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, PrivateTopbarComponent, PrivateSidebarComponent],
  templateUrl: './private-layout.component.html',
})
export class PrivateLayoutComponent {
  protected readonly isSidebarOpen = signal(false);

  protected toggleSidebar(): void {
    this.isSidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}
