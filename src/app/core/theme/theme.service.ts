import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

import { DEFAULT_THEME, THEME_STORAGE_KEY, isThemeName } from './theme.constants';
import { ThemeName } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly activeThemeState = signal<ThemeName>(DEFAULT_THEME);

  readonly activeTheme = this.activeThemeState.asReadonly();

  initializeTheme(): void {
    const storedTheme = this.readStoredTheme();
    this.applyTheme(storedTheme ?? DEFAULT_THEME);
  }

  setTheme(theme: ThemeName): void {
    this.applyTheme(theme);

    try {
      this.document.defaultView?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee localStorage.
    }
  }

  private readStoredTheme(): ThemeName | null {
    try {
      const storedTheme =
        this.document.defaultView?.localStorage.getItem(THEME_STORAGE_KEY) ?? null;
      return isThemeName(storedTheme) ? storedTheme : null;
    } catch {
      return null;
    }
  }

  private applyTheme(theme: ThemeName): void {
    this.activeThemeState.set(theme);
    this.document.documentElement.setAttribute('data-theme', theme);
  }
}
