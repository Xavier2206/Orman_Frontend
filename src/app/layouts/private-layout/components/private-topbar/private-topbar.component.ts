import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../../core/auth/auth.service';
import { ThemeSelectorComponent } from '../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-private-topbar',
  imports: [RouterLink, ThemeSelectorComponent],
  templateUrl: './private-topbar.component.html',
})
export class PrivateTopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sidebarOpen = input(false);
  readonly toggleSidebar = output<void>();
  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly loginName = this.auth.loginName;

  protected logout(): void {
    if (this.isLoggingOut()) return;

    this.isLoggingOut.set(true);
    this.logoutError.set(null);
    this.auth.logout().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.isLoggingOut.set(false))).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => {
        this.logoutError.set('No fue posible confirmar el cierre de sesión.');
        void this.router.navigateByUrl('/');
      },
    });
  }
}
