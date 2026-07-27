import { Component, ElementRef, inject, signal } from '@angular/core';

import { LoginModalComponent } from '../../../../auth/login-modal/login-modal.component';
import { QuickMenuComponent } from '../../../../auth/quick-menu/quick-menu.component';
import { ThemeSelectorComponent } from '../../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-public-header',
  imports: [ThemeSelectorComponent, QuickMenuComponent, LoginModalComponent],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly isMenuOpen = signal(false);
  protected readonly isQuickMenuOpen = signal(false);
  protected readonly isLoginModalOpen = signal(false);
  protected readonly loginTrigger = signal<HTMLElement | null>(null);
  protected readonly loginOrigin = signal<'desktop' | 'mobile'>('desktop');

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected toggleQuickMenu(event: Event, fromMobileMenu = false): void {
    if (this.isQuickMenuOpen()) {
      this.closeQuickMenu();
      return;
    }

    if (event.currentTarget instanceof HTMLElement) {
      this.loginTrigger.set(event.currentTarget);
    }

    this.loginOrigin.set(fromMobileMenu ? 'mobile' : 'desktop');

    if (fromMobileMenu) {
      this.closeMenu();
    }

    this.isLoginModalOpen.set(false);
    this.isQuickMenuOpen.set(true);
  }

  protected closeQuickMenu(): void {
    this.isQuickMenuOpen.set(false);
    this.restoreLoginTriggerFocus();
  }

  protected openLoginModal(): void {
    this.isQuickMenuOpen.set(false);
    this.isLoginModalOpen.set(true);
  }

  protected closeLoginModal(): void {
    this.isLoginModalOpen.set(false);
    this.restoreLoginTriggerFocus();
  }

  private restoreLoginTriggerFocus(): void {
    const trigger = this.loginTrigger();

    queueMicrotask(() => {
      if (trigger?.isConnected) {
        trigger.focus();
      } else {
        this.hostElement.nativeElement
          .querySelector<HTMLElement>('[aria-controls="mobile-navigation"]')
          ?.focus();
      }

      this.loginTrigger.set(null);
    });
  }
}
