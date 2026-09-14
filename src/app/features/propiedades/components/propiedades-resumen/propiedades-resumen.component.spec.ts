import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PropiedadResumen } from '../../models/propiedad-resumen.model';
import { PropiedadesResumenComponent } from './propiedades-resumen.component';

describe('PropiedadesResumenComponent', () => {
  let fixture: ComponentFixture<PropiedadesResumenComponent>;

  const summary: PropiedadResumen = {
    inversionTotal: 3500,
    propiedadesActivas: 2,
    casasActivas: 1,
    edificiosActivos: 1,
    unidadesTotales: 7,
    unidadesHabilitadas: 6,
    unidadesNoHabilitadas: 1,
    unidadesOcupadas: 2,
    ocupacionGlobal: 33.33,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadesResumenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropiedadesResumenComponent);
  });

  function renderSummary(value: PropiedadResumen = summary): HTMLElement {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', null);
    fixture.componentRef.setInput('resumen', value);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('renders four skeleton cards while the summary is loading', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.summary-card-skeleton')).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.summary-card')).toHaveLength(4);
  });

  it('renders the received metrics and an accessible progress bar', () => {
    const element = renderSummary();

    expect(element.textContent).toContain('Bs 3.500');
    expect(element.textContent).toContain('2 Inmuebles');
    expect(element.textContent).toContain('1 Edificio');
    expect(element.textContent).toContain('1 Casa');
    expect(element.textContent).toContain('7 Unidades');
    expect(element.textContent).toContain('6 Habilitadas');
    expect(element.textContent).toContain('1 No habilitada');
    expect(element.textContent).toContain('33,33%');
    expect(element.textContent).toContain('2 de 6 unidades habilitadas ocupadas');

    const progress = element.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-valuemin')).toBe('0');
    expect(progress?.getAttribute('aria-valuemax')).toBe('100');
    expect(progress?.getAttribute('aria-valuenow')).toBe('33.33');
    expect((element.querySelector('.summary-progress-value') as HTMLElement).style.width).toBe(
      '33.33%',
    );
  });

  it('renders singular labels and an empty progress bar', () => {
    const element = renderSummary({
      ...summary,
      propiedadesActivas: 1,
      casasActivas: 1,
      edificiosActivos: 0,
      unidadesTotales: 1,
      unidadesHabilitadas: 1,
      unidadesNoHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacionGlobal: 0,
    });

    expect(element.textContent).toContain('1 Inmueble');
    expect(element.textContent).toContain('1 Casa');
    expect(element.textContent).toContain('1 Unidad');
    expect(element.textContent).toContain('1 Habilitada');
    expect(element.textContent).toContain('0 No habilitadas');
    expect(element.textContent).toContain('0%');
    expect((element.querySelector('.summary-progress-value') as HTMLElement).style.width).toBe(
      '0%',
    );
  });

  it('renders a full progress bar for one hundred percent occupancy', () => {
    const element = renderSummary({
      ...summary,
      unidadesHabilitadas: 2,
      unidadesOcupadas: 2,
      ocupacionGlobal: 100,
    });

    const progress = element.querySelector('[role="progressbar"]');
    expect(progress?.getAttribute('aria-valuenow')).toBe('100');
    expect((element.querySelector('.summary-progress-value') as HTMLElement).style.width).toBe(
      '100%',
    );
  });

  it('shows a summary error without rendering metric cards', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('resumen', null);
    fixture.componentRef.setInput('error', 'No se pudo cargar el resumen de propiedades.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar el resumen de propiedades.',
    );
    expect(fixture.nativeElement.querySelectorAll('.summary-card')).toHaveLength(0);
  });
});
