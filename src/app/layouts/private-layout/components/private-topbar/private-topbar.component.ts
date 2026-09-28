import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../../core/auth/auth.service';
import { AuthContextService } from '../../../../core/auth/auth-context.service';
import { NotificacionesBellComponent } from '../../../../features/notificaciones/components/notificaciones-bell/notificaciones-bell.component';
import { ThemeSelectorComponent } from '../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-private-topbar',
  imports: [MatIconModule, NotificacionesBellComponent, RouterLink, ThemeSelectorComponent],
  templateUrl: './private-topbar.component.html',
  styleUrl: './private-topbar.component.css',
})
export class PrivateTopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly authContext = inject(AuthContextService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly profileButton = viewChild<ElementRef<HTMLButtonElement>>('profileButton');

  readonly hasSidebarNavigation = input(false);
  readonly isSidebarOpen = input(false);
  readonly sidebarRequested = output<void>();

  protected readonly isLoggingOut = signal(false);
  protected readonly logoutError = signal<string | null>(null);
  protected readonly loginName = this.auth.loginName;
  protected readonly persona = this.authContext.persona;
  protected readonly roles = this.authContext.roles;
  protected readonly selectedRoleId = this.authContext.selectedRoleId;
  protected readonly selectedRole = this.authContext.selectedRole;
  protected readonly profileImageFailed = signal(false);
  protected readonly visibleName = computed(() => {
    const persona = this.persona();
    if (!persona) {
      return null;
    }

    return [persona.nombre, persona.ap, persona.am]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');
  });
  protected readonly shortName = computed(() => {
    const firstName = this.persona()?.nombre?.trim();

    return firstName || this.loginName()?.trim() || 'Usuario';
  });
  protected readonly profileImageUrl = computed(() => {
    const reference = this.persona()?.foto?.trim();

    if (!reference || this.profileImageFailed()) {
      return null;
    }

    try {
      const url = new URL(reference);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
      return null;
    }
  });
  protected readonly isProfileOpen = signal(false);
  private readonly currentDateValue = new Date();
  protected readonly currentDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(this.currentDateValue);
  protected readonly shortCurrentDate = this.formatShortDate(this.currentDateValue);

  protected logout(): void {
    if (this.isLoggingOut()) return;

    this.isLoggingOut.set(true);
    this.logoutError.set(null);
    this.auth
      .logout()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoggingOut.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl('/'),
        error: () => {
          this.logoutError.set('No fue posible confirmar el cierre de sesión.');
          void this.router.navigateByUrl('/');
        },
      });
  }

  protected toggleProfile(): void {
    this.isProfileOpen.update((isOpen) => !isOpen);
  }

  protected useProfileFallback(): void {
    this.profileImageFailed.set(true);
  }

  protected selectRole(event: Event): void {
    const codr = Number((event.target as HTMLSelectElement).value);

    if (Number.isFinite(codr)) {
      this.authContext.selectRole(codr);
    }
  }

  private formatShortDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).formatToParts(date);
    const day = parts.find((part) => part.type === 'day')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;

    return `${day} ${month?.replace('.', '')}. ${year}`;
  }

  protected closeProfile(restoreFocus = true): void {
    if (!this.isProfileOpen()) {
      return;
    }

    this.isProfileOpen.set(false);
    if (restoreFocus) {
      queueMicrotask(() => this.profileButton()?.nativeElement.focus());
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerdown(event: PointerEvent): void {
    if (
      this.isProfileOpen() &&
      event.target instanceof Node &&
      !this.hostElement.nativeElement.contains(event.target)
    ) {
      this.closeProfile(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isProfileOpen()) {
      event.preventDefault();
      this.closeProfile();
    }
  }
}
