import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPropertyRecoveryChartComponent } from './dashboard-property-recovery-chart.component';
import { DashboardPropiedadFinanciera } from '../../models/dashboard-financiero.model';

const PROPERTIES: DashboardPropiedadFinanciera[] = [
  {
    codprop: 1,
    nombre: 'Recuperación baja',
    inversionInicial: 1000,
    ingresosConfirmadosAcumulados: 100,
    porcentajeRecuperacion: 10,
    ingresosConfirmadosPorMes: [],
  },
  {
    codprop: 2,
    nombre: 'Recuperación alta',
    inversionInicial: 500,
    ingresosConfirmadosAcumulados: 1250,
    porcentajeRecuperacion: 250,
    ingresosConfirmadosPorMes: [],
  },
  {
    codprop: 3,
    nombre: 'Sin inversión',
    inversionInicial: 0,
    ingresosConfirmadosAcumulados: 0,
    porcentajeRecuperacion: null,
    ingresosConfirmadosPorMes: [],
  },
];

describe('DashboardPropertyRecoveryChartComponent', () => {
  let fixture: ComponentFixture<DashboardPropertyRecoveryChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPropertyRecoveryChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPropertyRecoveryChartComponent);
    fixture.componentRef.setInput('properties', PROPERTIES);
    fixture.detectChanges();
  });

  it('sorts calculable recoveries from highest to lowest without changing displayed percentages', () => {
    const rows = [...fixture.nativeElement.querySelectorAll('[role="listitem"]')];
    const text = rows.map((row) => (row.textContent as string).trim());

    expect(text[0]).toContain('Recuperación alta');
    expect(text[0]).toContain('250,00 %');
    expect(text[1]).toContain('Recuperación baja');
    expect(text[1]).toContain('10,00 %');
    expect(text[2]).toContain('Sin inversión');
    expect(text[2]).toContain('No calculable');
    expect(rows[2].querySelector('.recovery-bar-track')).toBeNull();
  });

  it('provides an accessible full-width reference track for calculable properties', () => {
    const track = fixture.nativeElement.querySelector('.recovery-bar-track') as HTMLElement;

    expect(track.getAttribute('role')).toBe('img');
    expect(track.getAttribute('aria-label')).toContain('Recuperación alta');
    expect(fixture.nativeElement.querySelector('.recovery-bar')).toBeTruthy();
  });
});
