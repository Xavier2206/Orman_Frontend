import { Component, inject } from '@angular/core';

import { AVAILABLE_THEMES } from '../../../core/theme/theme.constants';
import { ThemeName } from '../../../core/theme/theme.model';
import { ThemeService } from '../../../core/theme/theme.service';

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
})
export class ThemeSelectorComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly themes = AVAILABLE_THEMES;
  protected readonly activeTheme = this.themeService.activeTheme;

  protected selectTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);
  }
}
