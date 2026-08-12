import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  let fixture: ComponentFixture<InicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InicioComponent] }).compileComponents();
    fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
  });

  it('should show the private area construction state', () => {
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Área privada ORMAN');
    expect(fixture.nativeElement.textContent).toContain('Contenido en construcción');
  });
});
