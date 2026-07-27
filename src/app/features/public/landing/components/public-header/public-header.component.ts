import { Component, ElementRef, inject, signal } from '@angular/core';

import { LoginModalComponent } from '../../../../auth/login-modal/login-modal.component';
import { ThemeSelectorComponent } from '../../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-public-header',
  imports: [ThemeSelectorComponent, LoginModalComponent],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private loginTrigger: HTMLElement | null = null;

  protected readonly isMenuOpen = signal(false);
  protected readonly isLoginModalOpen = signal(false);

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  protected openLoginModal(event: Event, fromMobileMenu = false): void {
    if (event.currentTarget instanceof HTMLElement) {
      this.loginTrigger = event.currentTarget;
    }

    if (fromMobileMenu) {
      this.closeMenu();
    }

    this.isLoginModalOpen.set(true);
  }

  protected closeLoginModal(): void {
    this.isLoginModalOpen.set(false);
    const trigger = this.loginTrigger;

    queueMicrotask(() => {
      if (trigger?.isConnected) {
        trigger.focus();
      } else {
        this.hostElement.nativeElement
          .querySelector<HTMLElement>('[aria-controls="mobile-navigation"]')
          ?.focus();
      }

      this.loginTrigger = null;
    });
  }
}
