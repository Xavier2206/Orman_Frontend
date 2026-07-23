import { Component, signal } from '@angular/core';

import { ThemeSelectorComponent } from '../../../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-public-header',
  imports: [ThemeSelectorComponent],
  templateUrl: './public-header.component.html',
})
export class PublicHeaderComponent {
  protected readonly isMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.isMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMenu(): void {
    this.isMenuOpen.set(false);
  }
}
