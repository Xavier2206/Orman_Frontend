import { Component, inject, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuthContextService } from '../../../../core/auth/auth-context.service';

@Component({
  selector: 'app-private-sidebar',
  imports: [MatIconModule],
  templateUrl: './private-sidebar.component.html',
  styleUrl: './private-sidebar.component.css',
})
export class PrivateSidebarComponent {
  private readonly authContext = inject(AuthContextService);
  private readonly router = inject(Router);

  protected readonly context = this.authContext.context;
  protected readonly selectedRole = this.authContext.selectedRole;
  protected readonly selectedMenus = this.authContext.selectedMenus;
  protected readonly isLoading = this.authContext.loading;
  protected readonly contextError = this.authContext.error;
  readonly open = input(false);
  readonly collapsed = input(false);
  readonly closed = output<void>();
  readonly toggleCollapsed = output<void>();

  protected navigate(enlace: string): void {
    const normalized = enlace.trim().replace(/^\/+/, '');
    if (!normalized) return;
    void this.router.navigate(['/app', ...normalized.split('/')]);
    this.closed.emit();
  }
}
