import { Component, computed, inject } from '@angular/core';

import { THEME_LABELS } from '../../../core/theme/theme.constants';
import { ThemeService } from '../../../core/theme/theme.service';
import { ThemeSelectorComponent } from '../../../shared/components/theme-selector/theme-selector.component';

@Component({
  selector: 'app-landing',
  imports: [ThemeSelectorComponent],
  templateUrl: './landing.component.html',
})
export class LandingComponent {
  private readonly themeService = inject(ThemeService);

  protected readonly activeThemeLabel = computed(
    () => THEME_LABELS[this.themeService.activeTheme()],
  );
}
