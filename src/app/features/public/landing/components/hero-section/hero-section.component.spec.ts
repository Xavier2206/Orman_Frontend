import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroSectionComponent } from './hero-section.component';

describe('HeroSectionComponent', () => {
  let fixture: ComponentFixture<HeroSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HeroSectionComponent] }).compileComponents();
    fixture = TestBed.createComponent(HeroSectionComponent);
    fixture.detectChanges();
  });

  it('should render the title and descriptive text', () => {
    const element = fixture.nativeElement as HTMLElement;
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
});
