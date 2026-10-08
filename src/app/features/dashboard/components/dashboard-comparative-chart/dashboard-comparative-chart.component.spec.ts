import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardComparativeChartComponent } from './dashboard-comparative-chart.component';
import { DashboardPropiedadFinanciera } from '../../models/dashboard-financiero.model';

const PROPERTIES: DashboardPropiedadFinanciera[] = [
  {
    codprop: 11,
    nombre: 'Edificio Central Tarija',
    inversionInicial: 1000,
    ingresosConfirmadosAcumulados: 2500,
    porcentajeRecuperacion: 250,
    ingresosConfirmadosPorMes: [],
  },
];

describe('DashboardComparativeChartComponent', () => {
  let fixture: ComponentFixture<DashboardComparativeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComparativeChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComparativeChartComponent);
    fixture.componentRef.setInput('properties', PROPERTIES);
    fixture.componentRef.setInput('scopeLabel', 'Todas tus propiedades');
    fixture.detectChanges();
  });

  it('renders vertical grouped columns with real amount labels and a horizontal overflow region', () => {
    const svg = fixture.nativeElement.querySelector('svg') as SVGSVGElement;
    const bars = fixture.nativeElement.querySelectorAll('.comparison-bar');
    const scrollRegion = fixture.nativeElement.querySelector('.comparative-chart-scroll');

    expect(bars.length).toBe(2);
    expect(bars[0].getAttribute('height')).not.toBe('0');
    expect(bars[1].getAttribute('height')).not.toBe('0');
    expect(fixture.nativeElement.textContent).toContain('Inversión inicial');
    expect(fixture.nativeElement.textContent).toContain('Ingresos confirmados');
    expect(scrollRegion).toBeTruthy();
    expect(svg.getAttribute('viewBox')).toContain('720');
    expect(fixture.nativeElement.querySelector('rect title').textContent).toContain('Bs 1.000,00');
  });

  it('selects a property from an accessible chart column group', () => {
    const output = vi.spyOn(fixture.componentInstance.propertySelected, 'emit');
    const group = fixture.nativeElement.querySelector('.comparison-bar-group') as SVGGElement;

    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(group.getAttribute('tabindex')).toBe('0');
    expect(output).toHaveBeenCalledWith(11);
  });
});
