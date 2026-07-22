import { TestBed } from '@angular/core/testing';

import { DEFAULT_THEME, THEME_STORAGE_KEY } from './theme.constants';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME);
  });

  it('should use ORMAN as the default theme', () => {
    expect(service.activeTheme()).toBe('orman');
  });

  it('should apply the default theme to documentElement', () => {
    service.initializeTheme();

    expect(document.documentElement.getAttribute('data-theme')).toBe('orman');
  });

  it.each(['dark', 'light'] as const)('should change to %s', (theme) => {
    service.setTheme(theme);

    expect(service.activeTheme()).toBe(theme);
    expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
  });

  it('should persist the selected theme', () => {
    service.setTheme('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('should restore a valid stored theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');

    service.initializeTheme();

    expect(service.activeTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should fall back to ORMAN when the stored value is invalid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');

    service.initializeTheme();

    expect(service.activeTheme()).toBe('orman');
    expect(document.documentElement.getAttribute('data-theme')).toBe('orman');
  });
});
