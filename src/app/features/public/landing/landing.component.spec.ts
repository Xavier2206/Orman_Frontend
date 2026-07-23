import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the hero', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-hero-section')).toBeTruthy();
    expect(element.querySelector('h1')?.textContent).toContain(
      'Encuentra el espacio ideal para ti',
    );
  });

  it('should render the temporary sections and expected text', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#propiedades')).toBeTruthy();
    expect(element.querySelector('#como-funciona')).toBeTruthy();
    expect(element.querySelector('#contacto')).toBeTruthy();
    expect(element.textContent).toContain('Espacios disponibles');
    expect(element.textContent).toContain('¿Cómo funciona ORMAN?');
    expect(element.textContent).toContain('El formulario de contacto se incorporará');
  });
});
