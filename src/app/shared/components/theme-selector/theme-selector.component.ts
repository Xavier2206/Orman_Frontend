import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { ThemeName } from '../../../core/theme/theme.model';
import { ThemeService } from '../../../core/theme/theme.service';

interface ThemeControl {
  name: ThemeName;
  ariaLabel: string;
  title: string;
  label: string;
}

@Component({
  selector: 'app-theme-selector',
  templateUrl: './theme-selector.component.html',
  styleUrl: './theme-selector.component.css',
})
export class ThemeSelectorComponent {
  private readonly themeService = inject(ThemeService);
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly compactButton = viewChild<ElementRef<HTMLButtonElement>>('compactButton');

  readonly compact = input(false);

  protected readonly themes: readonly ThemeControl[] = [
    { name: 'orman', ariaLabel: 'Usar tema ORMAN', title: 'Tema ORMAN', label: 'ORMAN' },
    { name: 'light', ariaLabel: 'Usar modo día', title: 'Usar modo día', label: 'Día' },
    { name: 'dark', ariaLabel: 'Usar modo noche', title: 'Usar modo noche', label: 'Noche' },
  ];
  protected readonly activeTheme = this.themeService.activeTheme;
  protected readonly isCompactOpen = signal(false);
  protected readonly activeThemeControl = computed(
    () => this.themes.find((theme) => theme.name === this.activeTheme()) ?? this.themes[0],
  );

  protected selectTheme(theme: ThemeName): void {
    this.themeService.setTheme(theme);

    if (this.compact()) {
      this.closeCompactTheme();
    }
  }

  protected toggleCompactTheme(): void {
    this.isCompactOpen.update((isOpen) => !isOpen);
  }

  protected closeCompactTheme(restoreFocus = true): void {
    if (!this.isCompactOpen()) {
      return;
    }

    this.isCompactOpen.set(false);
    if (restoreFocus) {
      queueMicrotask(() => this.compactButton()?.nativeElement.focus());
    }
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerdown(event: PointerEvent): void {
    if (
      this.compact() &&
      this.isCompactOpen() &&
      event.target instanceof Node &&
      !this.hostElement.nativeElement.contains(event.target)
    ) {
      this.closeCompactTheme(false);
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (this.compact() && event.key === 'Escape' && this.isCompactOpen()) {
      event.preventDefault();
      this.closeCompactTheme();
    }
  }
}
