export type ThemeName = 'orman' | 'dark' | 'light';

export interface ThemeOption {
  readonly name: ThemeName;
  readonly label: string;
}
