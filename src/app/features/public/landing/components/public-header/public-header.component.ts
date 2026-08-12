import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AuthService } from '../../../../../core/auth/auth.service';
import { LoginModalComponent } from '../../../../auth/login-modal/login-modal.component';
import { QuickMenuComponent } from '../../../../auth/quick-menu/quick-menu.component';
import { ThemeSelectorComponent } from '../../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-public-header',
  imports: [ThemeSelectorComponent, QuickMenuComponent, LoginModalComponent],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.css',
})
export class PublicHeaderComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly isMenuOpen = signal(false);
  protected readonly isQuickMenuOpen = signal(false);
  protected readonly isLoginModalOpen = signal(false);
  protected readonly loginTrigger = signal<HTMLElement | null>(null);
  protected readonly loginOrigin = signal<'desktop' | 'mobile'>('desktop');
  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);

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

  handleAuthenticated(): void {
    this.isLoginModalOpen.set(false);
    void this.router.navigateByUrl('/app/inicio');
  }

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.logoutError.set(null);
    this.auth
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoggingOut.set(false)),
      )
      .subscribe({
        error: () => this.logoutError.set('No fue posible confirmar el cierre de sesión.'),
      });
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
