import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroSectionComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroSectionComponent);
    fixture.detectChanges();
  });

  it('should render one title and the descriptive text', () => {
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain(
      'Encuentra el espacio ideal para ti',
    );
    expect(element.textContent).toContain('Explora casas, departamentos, tiendas');
  });

  it('should render both action links', () => {
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('#propiedades');
    expect(links[1].getAttribute('href')).toBe('#contacto');
  });

  it('should render the official logo and hero property labels', () => {
    const element = fixture.nativeElement as HTMLElement;
    const logo = element.querySelector('img');

    expect(logo?.getAttribute('src')).toBe('/images/brand/orman-logo.svg');
    expect(logo?.getAttribute('alt')).toBe('Logotipo oficial de ORMAN');
    expect(element.textContent).toContain('Gestión familiar de propiedades');
    expect(element.textContent).toContain('Casas y edificios');
    expect(element.textContent).toContain('Departamentos y tiendas');
    expect(element.textContent).not.toContain('Edificio ORMAN');
  });
});
