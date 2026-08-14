import { Component, HostListener, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { PrivateSidebarComponent } from './components/private-sidebar/private-sidebar.component';
import { PrivateTopbarComponent } from './components/private-topbar/private-topbar.component';

@Component({
  selector: 'app-private-layout',
  imports: [RouterOutlet, PrivateTopbarComponent, PrivateSidebarComponent],
  templateUrl: './private-layout.component.html',
  styleUrl: './private-layout.component.css',
})
export class PrivateLayoutComponent {
  private readonly document = inject(DOCUMENT);
  protected readonly isSidebarOpen = signal(false);
  protected readonly isSidebarCollapsed = signal(false);

  protected toggleSidebar(): void {
    this.isSidebarOpen.update((isOpen) => !isOpen);
  }

  protected closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  protected toggleSidebarCollapsed(): void {
    const matchMedia = this.document.defaultView?.matchMedia;
    const isMobile = typeof matchMedia === 'function' && matchMedia.call(this.document.defaultView, '(max-width: 1023px)').matches;
    if (isMobile) {
      this.isSidebarOpen.update((open) => !open);
      return;
    }
    this.isSidebarCollapsed.update((collapsed) => !collapsed);
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isSidebarOpen()) {
      event.preventDefault();
      this.closeSidebar();
    }
  }
}
