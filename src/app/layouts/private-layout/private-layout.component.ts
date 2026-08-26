import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthContextService } from '../../core/auth/auth-context.service';
import { PrivateSidebarComponent } from './components/private-sidebar/private-sidebar.component';
import { PrivateTopbarComponent } from './components/private-topbar/private-topbar.component';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, PrivateTopbarComponent, PrivateSidebarComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css',
})
export class PrivateLayoutComponent {
  private readonly authContext = inject(AuthContextService);
  protected readonly isSidebarOpen = signal(false);
  protected readonly hasSidebarNavigation = computed(
    () => this.authContext.selectedMenus().length > 0,
  );

  protected toggleSidebar(): void {
    this.isSidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isSidebarOpen()) {
      event.preventDefault();
      this.closeSidebar();
    }
  }
}
