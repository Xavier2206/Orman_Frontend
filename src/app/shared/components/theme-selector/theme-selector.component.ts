import { Component, inject } from '@angular/core';

import { ThemeName } from '../../../core/theme/theme.model';
import { ThemeService } from '../../../core/theme/theme.service';

interface ThemeControl {
  name: ThemeName;
  ariaLabel: string;
  title: string;
}

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
})
export class ThemeSelectorComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly themes: readonly ThemeControl[] = [
    { name: 'orman', ariaLabel: 'Usar tema ORMAN', title: 'Tema ORMAN' },
    { name: 'light', ariaLabel: 'Usar modo día', title: 'Usar modo día' },
    { name: 'dark', ariaLabel: 'Usar modo noche', title: 'Usar modo noche' },
  ];
  protected readonly activeTheme = this.themeService.activeTheme;

  protected selectTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);
  }
}
