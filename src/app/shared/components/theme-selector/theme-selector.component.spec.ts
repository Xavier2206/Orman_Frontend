import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeService } from '../../../core/theme/theme.service';
import { ThemeSelectorComponent } from './theme-selector.component';

describe('ThemeSelectorComponent', () => {
  let fixture: ComponentFixture<ThemeSelectorComponent>;
  let service: ThemeService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSelectorComponent);
    service = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should render the three theme buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons).toHaveLength(3);
    expect(
      [...buttons].map((button) =>
        button.textContent?.replace(/\s+/g, ' ').trim(),
      ),
    ).toEqual(['ORMAN (activo)', 'Noche', 'Día']);
  });

  it('should mark the active theme with aria-pressed', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('should change the theme when a button is clicked', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button');

    buttons[1].click();
    fixture.detectChanges();

    expect(service.activeTheme()).toBe('dark');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
  });
});
