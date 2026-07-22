import { ThemeName, ThemeOption } from './theme.model';

export const DEFAULT_THEME: ThemeName = 'orman';
export const THEME_STORAGE_KEY = 'orman-theme';

export const THEME_LABELS: Readonly<Record<ThemeName, string>> = {
  orman: 'ORMAN',
  dark: 'Noche',
  light: 'Día',
};

export const AVAILABLE_THEMES: readonly ThemeOption[] = [
  { name: 'orman', label: THEME_LABELS.orman },
  { name: 'dark', label: THEME_LABELS.dark },
  { name: 'light', label: THEME_LABELS.light },
];

export function isThemeName(value: string | null): value is ThemeName {
  return AVAILABLE_THEMES.some((theme) => theme.name === value);
}
