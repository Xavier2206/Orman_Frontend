import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumenFinancieroComponent } from './resumen-financiero.component';
import { DashboardResumenFinancieroResponse } from '../../models/dashboard-financiero.model';

const REPORT_WITH_PROPERTIES: DashboardResumenFinancieroResponse = {
  moneda: 'BOB',
  resumenGeneral: {
    cantidadPropiedades: 2,
    inversionInicialTotal: 1500,
    ingresosConfirmadosAcumulados: 1800,
    porcentajeRecuperacion: 120,
  },
  propiedades: [
    {
      codprop: 11,
      nombre: 'Edificio Central',
      inversionInicial: 1000,
      ingresosConfirmadosAcumulados: 2500,
      porcentajeRecuperacion: 250,
      ingresosConfirmadosPorMes: [
        { periodo: '2026-09', monto: 500 },
        { periodo: '2026-10', monto: 2000 },
      ],
    },
    {
      codprop: 12,
      nombre: 'Residencia San Luis',
      inversionInicial: 500,
      ingresosConfirmadosAcumulados: 0,
      porcentajeRecuperacion: 0,
      ingresosConfirmadosPorMes: [
        { periodo: '2026-09', monto: 0 },
        { periodo: '2026-10', monto: 0 },
      ],
    },
  ],
  ingresosConfirmadosPorMes: [
    { periodo: '2026-09', monto: 500 },
    { periodo: '2026-10', monto: 2000 },
  ],
};

const REPORT_WITH_ZERO_INVESTMENT: DashboardResumenFinancieroResponse = {
  ...REPORT_WITH_PROPERTIES,
  resumenGeneral: {
    cantidadPropiedades: 1,
    inversionInicialTotal: 0,
    ingresosConfirmadosAcumulados: 0,
    porcentajeRecuperacion: null,
  },
  propiedades: [
    {
      ...REPORT_WITH_PROPERTIES.propiedades[1],
      inversionInicial: 0,
      porcentajeRecuperacion: null,
    },
  ],
};

describe('ResumenFinancieroComponent', () => {
  let fixture: ComponentFixture<ResumenFinancieroComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumenFinancieroComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResumenFinancieroComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function loadReport(report: DashboardResumenFinancieroResponse): void {
    http.expectOne('/api/v1/dashboard/resumen-financiero').flush(report);
    fixture.detectChanges();
  }

  it('loads and presents general indicators and property comparisons from the backend response', () => {
    loadReport(REPORT_WITH_PROPERTIES);

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Resumen financiero');
    expect(text).toContain('Indicadores financieros por propiedad');
    expect(text).toContain('Bs 1.500,00');
    expect(text).toContain('Bs 1.800,00');
    expect(text).toContain('120,00 %');
    expect(text).toContain('Edificio Central');
    expect(text).toContain('Sin ingresos confirmados acumulados');
    expect(fixture.nativeElement.querySelector('.monthly-chart polyline')).toBeTruthy();
  });

  it('changes property indicators and charts from loaded data without another request', () => {
    loadReport(REPORT_WITH_PROPERTIES);

    const propertyMode = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: Element) => button.textContent?.trim() === 'Por propiedad',
    ) as HTMLButtonElement;
    propertyMode.click();
    fixture.detectChanges();

    const propertySelect = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    propertySelect.value = '12';
    propertySelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
    expect(fixture.nativeElement.textContent).toContain('0,00 %');
    expect(fixture.nativeElement.textContent).toContain('Residencia San Luis');
    expect(fixture.nativeElement.textContent).toContain(
      'No hay ingresos confirmados en los 12 meses mostrados.',
    );
    http.expectNone('/api/v1/dashboard/resumen-financiero');
  });

  it('preserves the real recovery percentage above 100 percent while limiting the radial drawing', () => {
    loadReport(REPORT_WITH_PROPERTIES);

    const propertyMode = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: Element) => button.textContent?.trim() === 'Por propiedad',
    ) as HTMLButtonElement;
    propertyMode.click();
    fixture.detectChanges();

    const propertySelect = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    propertySelect.value = '11';
    propertySelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('250,00 %');
    const progress = fixture.nativeElement.querySelector(
      'app-dashboard-recovery-chart .recovery-ring-progress',
    ) as SVGCircleElement;
    expect(progress.getAttribute('stroke-dashoffset')).toBe('0');
  });

  it('shows no calculable and does not draw a recovery percentage for zero investment', () => {
    loadReport(REPORT_WITH_ZERO_INVESTMENT);

    expect(fixture.nativeElement.textContent).toContain('No calculable');
    expect(
      fixture.nativeElement.querySelector('app-dashboard-recovery-chart .recovery-ring-progress'),
    ).toBeNull();
  });

  it('shows the no-properties state when the backend returns an empty collection', () => {
    loadReport({
      moneda: 'BOB',
      resumenGeneral: {
        cantidadPropiedades: 0,
        inversionInicialTotal: 0,
        ingresosConfirmadosAcumulados: 0,
        porcentajeRecuperacion: null,
      },
      propiedades: [],
      ingresosConfirmadosPorMes: [],
    });

    expect(fixture.nativeElement.textContent).toContain('Sin propiedades para mostrar');
  });

  it('shows a denied state when the Backend rejects the owner-only endpoint', () => {
    http
      .expectOne('/api/v1/dashboard/resumen-financiero')
      .flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Acceso denegado');
  });

  it('shows a session-expired state after an unauthorized response', () => {
    http
      .expectOne('/api/v1/dashboard/resumen-financiero')
      .flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La sesión expiró');
  });
});
