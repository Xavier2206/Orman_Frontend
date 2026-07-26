import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeService } from '../../../core/theme/theme.service';
import { ThemeSelectorComponent } from './theme-selector.component';

describe('ThemeSelectorComponent', () => {
  let fixture: ComponentFixture<ThemeSelectorComponent>;
  let service: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [ThemeSelectorComponent] }).compileComponents();
    fixture = TestBed.createComponent(ThemeSelectorComponent);
    service = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should render three accessible theme buttons in the compact order', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    expect(buttons).toHaveLength(3);
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'Usar tema ORMAN',
      'Usar modo día',
      'Usar modo noche',
    ]);
    expect(buttons.map((button) => button.getAttribute('aria-pressed'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('should use the official ORMAN SVG for the ORMAN control', () => {
    const logo = fixture.nativeElement.querySelector(
      'button[aria-label="Usar tema ORMAN"] img',
    ) as HTMLImageElement | null;

    expect(logo?.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo?.getAttribute('alt')).toBe('');
  });

  it('should change to each selected theme', () => {
    const buttons = [...fixture.nativeElement.querySelectorAll('button')] as HTMLButtonElement[];

    buttons[1].click();
    fixture.detectChanges();
    expect(service.activeTheme()).toBe('light');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');

    buttons[2].click();
    fixture.detectChanges();
    expect(service.activeTheme()).toBe('dark');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');

    buttons[0].click();
    fixture.detectChanges();
    expect(service.activeTheme()).toBe('orman');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
  });
});
