import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicHeaderComponent } from './public-header.component';

describe('PublicHeaderComponent', () => {
  let fixture: ComponentFixture<PublicHeaderComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [PublicHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(PublicHeaderComponent);
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('should render the ORMAN brand and navigation', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('ORMAN');
    expect(element.querySelector('nav[aria-label="Navegación principal"]')).toBeTruthy();
    expect(element.textContent).toContain('Propiedades');
    expect(element.textContent).toContain('Cómo funciona');
  });

  it('should render the official logo linked to the landing start', () => {
    const logo = fixture.nativeElement.querySelector(
      'a[href="#inicio"] img',
    ) as HTMLImageElement | null;

    expect(logo).toBeTruthy();
    expect(logo?.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo?.getAttribute('alt')).toBe('ORMAN - Gestión de propiedades');
    expect(logo?.closest('a')?.getAttribute('aria-label')).toBe('Ir al inicio de ORMAN');
  });

  it('should render the theme selector', () => {
    expect(fixture.nativeElement.querySelector('app-theme-selector')).toBeTruthy();
  });

  it('should preserve the visual login action', () => {
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    expect(
      fixture.nativeElement.querySelector('[aria-label="Iniciar sesión, disponible próximamente"]'),
    ).toBeTruthy();
  });

  it('should expose the mobile menu state with aria-expanded', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open and close the mobile menu', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('app-theme-selector')).toHaveLength(2);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeFalsy();
  });

  it('should close the mobile menu when a navigation option is selected', () => {
    const button = fixture.nativeElement.querySelector('[aria-controls="mobile-navigation"]');
    button.click();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('#mobile-navigation a[href="#propiedades"]');
    link.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('#mobile-navigation')).toBeFalsy();
  });
});
