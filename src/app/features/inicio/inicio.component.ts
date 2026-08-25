import { Component, inject } from '@angular/core';

import { AuthContextService } from '../../core/auth/auth-context.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
})
export class InicioComponent {
  private readonly authContext = inject(AuthContextService);
  protected readonly roles = this.authContext.roles;
  protected readonly selectedRole = this.authContext.selectedRole;
}
