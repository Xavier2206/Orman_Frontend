import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ContratoResumen } from '../../models/contrato.model';
import { ContratosResumenComponent } from './contratos-resumen.component';

describe('ContratosResumenComponent', () => {
  let fixture: ComponentFixture<ContratosResumenComponent>;

  const resumen: ContratoResumen = {
    vigentes: 4,
    programados: 2,
    finalizados: 7,
    rescindidos: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratosResumenComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratosResumenComponent);
  });

  it('renders four skeleton cards while loading', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.contract-summary-skeleton')).toHaveLength(4);
  });

  it('renders the received counts and descriptive labels', () => {
    fixture.componentRef.setInput('resumen', resumen);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.contract-summary-card')).toHaveLength(4);
    expect(element.textContent).toContain('VIGENTES');
    expect(element.textContent).toContain('4');
    expect(element.textContent).toContain('Actualmente en curso');
    expect(element.textContent).toContain('PROGRAMADOS');
    expect(element.textContent).toContain('Inicios confirmados');
    expect(element.textContent).toContain('FINALIZADOS');
    expect(element.textContent).toContain('Cumplidos sin deuda');
    expect(element.textContent).toContain('RESCINDIDOS');
    expect(element.textContent).toContain('Conclusión anticipada');
  });

  it('keeps the cards visible with zero values when the summary request fails', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('error', 'No fue posible cargar el resumen de contratos.');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No fue posible cargar el resumen de contratos.',
    );
    expect(element.querySelectorAll('.contract-summary-card')).toHaveLength(4);
    expect(element.textContent).toContain('0');
  });
});
