import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardMonthlyChartComponent } from './dashboard-monthly-chart.component';

describe('DashboardMonthlyChartComponent', () => {
  let fixture: ComponentFixture<DashboardMonthlyChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardMonthlyChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardMonthlyChartComponent);
    fixture.componentRef.setInput('scopeLabel', 'Todas tus propiedades');
  });

  it('shows the monthly series, monetary axis, month labels, data points and shaded area', () => {
    fixture.componentRef.setInput('series', [
      { periodo: '2026-09', monto: 0 },
      { periodo: '2026-10', monto: 400 },
      { periodo: '2026-11', monto: 0 },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.monthly-chart-grid-line').length).toBe(6);
    expect(fixture.nativeElement.querySelectorAll('.monthly-chart-point').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('.monthly-chart-month-label').length).toBe(3);
    expect(fixture.nativeElement.querySelector('.monthly-chart-area')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresos confirmados por fecha de revisión',
    );
    expect(fixture.nativeElement.textContent).toContain('Bs 400,00');
  });

  it('keeps real zero months and reports when the full series contains no confirmed income', () => {
    fixture.componentRef.setInput('series', [
      { periodo: '2026-09', monto: 0 },
      { periodo: '2026-10', monto: 0 },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.monthly-chart-point').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain(
      'No hay ingresos confirmados en los 12 meses mostrados.',
    );
  });
});
