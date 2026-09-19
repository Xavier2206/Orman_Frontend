import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Contrato, ContratoEstado, CuotaResponse } from '../../models/contrato.model';
import { ContratoDetailComponent } from './contrato-detail.component';

describe('ContratoDetailComponent', () => {
  let fixture: ComponentFixture<ContratoDetailComponent>;
  let http: HttpTestingController;

  const contract: Contrato = {
    codcon: 42,
    coduni: 25,
    codperInquilino: 31,
    fechaInicio: '2026-10-01',
    fechaFin: '2027-10-01',
    montoMensual: 2500,
    moneda: 'BOB',
    garantia: 1500,
    estado: 'VIGENTE',
    fechaRegistro: '2026-09-16T12:00:00',
    fechaRescision: null,
    motivoRescision: null,
    inquilino: { codper: 31, nombreCompleto: 'Juan Pérez', ci: '1234567' },
    propiedad: { codprop: 10, nombre: 'Edificio Central' },
    unidad: {
      coduni: 25,
      nombre: 'Departamento 2A',
      tipoUnidad: 'DEPARTAMENTO',
      descripcion: null,
      piso: 2,
    },
    cuotas: {
      totalCuotas: 12,
      cuotasPagadas: 8,
      cuotasPendientes: 4,
      saldoPendiente: 10000,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ codcon: '42' })) },
        },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratoDetailComponent);
  });

  afterEach(() => http.verify());

  it('loads document metadata when the Documents tab is selected without downloading PDF contents', () => {
    fixture.detectChanges();

    const contractRequest = http.expectOne('/api/v1/contratos/42');
    expect(contractRequest.request.method).toBe('GET');
    contractRequest.flush(contract);
    fixture.detectChanges();

    const installmentsRequest = http.expectOne('/api/v1/contratos/42/cuotas');
    expect(installmentsRequest.request.method).toBe('GET');
    installmentsRequest.flush([
      {
        codcuo: 1,
        codcon: 42,
        periodo: '2026-10-01',
        fechaVencimiento: '2026-10-01',
        monto: 2500,
        montoConfirmado: 2500,
        saldo: 0,
        montoPendienteRevision: 0,
        estado: 'PAGADA',
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('PAGADA');
    expect(fixture.nativeElement.querySelector('.contract-detail-sidebar')).toBeNull();
    const documentsTab = fixture.nativeElement.querySelectorAll('[role="tab"]')[1] as
      HTMLButtonElement;
    documentsTab.click();
    fixture.detectChanges();

    const filesRequest = http.expectOne('/api/v1/contratos/42/archivos');
    expect(filesRequest.request.method).toBe('GET');
    filesRequest.flush([
      {
        codarc: 8,
        codcon: 42,
        nombreArchivo: 'contrato-2026.pdf',
        tipoContenido: 'application/pdf',
        tamanoOriginal: 2500,
        tamanoFinal: 1800,
        fechaSubida: '2026-09-16T12:00:00',
        subidoPor: 'propietario',
        orden: 0,
        almacenadoInternamente: true,
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Juan Pérez');
    expect(fixture.nativeElement.textContent).toContain('Edificio Central');
    expect(fixture.nativeElement.textContent).toContain('Departamento 2A');
    expect(fixture.nativeElement.textContent).toContain('Documentos del contrato');
    expect(fixture.nativeElement.textContent).toContain('contrato-2026.pdf');
    expect(fixture.nativeElement.textContent).toContain('Tipo PDF');
    expect(fixture.nativeElement.textContent).toContain('Subido 16/09/2026');
    expect(fixture.nativeElement.textContent).toContain('Cuotas y pagos');
    expect(fixture.nativeElement.textContent).toContain('Valor total contrato');
    expect(fixture.nativeElement.textContent).toContain('Bs 30.000,00');
    expect(fixture.nativeElement.querySelector('[role="progressbar"]')).toBeTruthy();
    expect(http.match((request) => request.url.includes('/download'))).toHaveLength(0);
  });

  it('renders partial and pending installments with the correct visual action', () => {
    fixture.detectChanges();
    http.expectOne('/api/v1/contratos/42').flush(contract);
    fixture.detectChanges();

    const installments: CuotaResponse[] = [
      {
        codcuo: 1,
        codcon: 42,
        periodo: '2026-10-01',
        fechaVencimiento: '2026-10-01',
        monto: 2500,
        montoConfirmado: 1000,
        saldo: 1500,
        montoPendienteRevision: 0,
        estado: 'PARCIAL',
      },
      {
        codcuo: 2,
        codcon: 42,
        periodo: '2026-11-01',
        fechaVencimiento: '2026-11-01',
        monto: 2500,
        montoConfirmado: 0,
        saldo: 2500,
        montoPendienteRevision: 0,
        estado: 'PENDIENTE',
      },
    ];
    http.expectOne('/api/v1/contratos/42/cuotas').flush(installments);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('PARCIAL');
    expect(fixture.nativeElement.textContent).toContain('PENDIENTE');
    expect(fixture.nativeElement.querySelectorAll('.installment-action-disabled')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Registrar pago');
  });

  it.each(['PROGRAMADO', 'VIGENTE', 'FINALIZADO', 'RESCINDIDO'] as ContratoEstado[])(
    'renders the %s contract badge',
    (status) => {
      fixture.detectChanges();
      http.expectOne('/api/v1/contratos/42').flush({ ...contract, estado: status });
      fixture.detectChanges();
      http.expectOne('/api/v1/contratos/42/cuotas').flush([]);
      fixture.detectChanges();
      const statusBadge = fixture.nativeElement.querySelector('.contract-status') as HTMLElement;
      expect(statusBadge.textContent?.trim()).toBe(status);
      expect(statusBadge.classList.contains(`contract-status-${status.toLowerCase()}`)).toBe(true);
    },
  );

  it('loads payments on demand for a paid installment', () => {
    fixture.detectChanges();
    http.expectOne('/api/v1/contratos/42').flush(contract);
    fixture.detectChanges();
    http.expectOne('/api/v1/contratos/42/cuotas').flush([
      {
        codcuo: 1,
        codcon: 42,
        periodo: '2026-10-01',
        fechaVencimiento: '2026-10-01',
        monto: 2500,
        montoConfirmado: 2500,
        saldo: 0,
        montoPendienteRevision: 0,
        estado: 'PAGADA',
      },
    ]);
    fixture.detectChanges();
    const viewPaymentsButton = fixture.nativeElement.querySelector(
      '.installment-action',
    ) as HTMLButtonElement;
    viewPaymentsButton.click();
    fixture.detectChanges();

    const paymentsRequest = http.expectOne('/api/v1/cuotas/1/pagos');
    expect(paymentsRequest.request.method).toBe('GET');
    paymentsRequest.flush([
      {
        codpag: 7,
        codcuo: 1,
        codcta: null,
        monto: 2500,
        metodo: 'QR',
        referenciaExterna: 'QR-001',
        fechaPago: '2026-10-01T12:00:00',
        fechaRegistro: '2026-10-01T12:01:00',
        estado: 'CONFIRMADO',
        origenRegistro: 'PROPIETARIO',
        registradoPor: 'propietario',
        revisadoPor: 'admin',
        fechaRevision: '2026-10-01T12:05:00',
        motivoRechazo: null,
        motivoAnulacion: null,
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pagos registrados');
    expect(fixture.nativeElement.textContent).toContain('QR');
    expect(fixture.nativeElement.textContent).toContain('CONFIRMADO');
  });
});
