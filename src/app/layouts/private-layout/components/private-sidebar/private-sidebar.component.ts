import { Component, inject, input, output } from '@angular/core';

import { AuthContextMenu } from '../../../../core/auth/auth-context.model';
import { AuthContextService } from '../../../../core/auth/auth-context.service';

@Component({
  selector: 'app-private-sidebar',
  templateUrl: './private-sidebar.component.html',
  styleUrl: './private-sidebar.component.css',
})
export class PrivateSidebarComponent {
  private readonly authContext = inject(AuthContextService);

  protected readonly context = this.authContext.context;
  protected readonly selectedRole = this.authContext.selectedRole;
  protected readonly selectedMenus = this.authContext.selectedMenus;
  protected readonly isLoading = this.authContext.loading;
  protected readonly contextError = this.authContext.error;
  readonly open = input(false);
  readonly collapsed = input(false);
  readonly closed = output<void>();
  readonly toggleCollapsed = output<void>();

  protected menuIcon(menu: AuthContextMenu): string {
    switch (menu.icono?.toLowerCase()) {
      case 'users':
      case 'user':
        return '♙';
      case 'home':
        return '⌂';
      case 'report':
      case 'reports':
        return '▥';
      case 'payments':
      case 'payment':
        return '$';
      default:
        return '▦';
    }
  }
}
