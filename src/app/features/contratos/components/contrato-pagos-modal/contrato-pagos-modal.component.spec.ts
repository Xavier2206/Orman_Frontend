import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaResponse } from '../../models/contrato.model';
import { ContratoPagosModalComponent } from './contrato-pagos-modal.component';

describe('ContratoPagosModalComponent', () => {
  let fixture: ComponentFixture<ContratoPagosModalComponent>;
  let http: HttpTestingController;

  const installment: CuotaResponse = {
    codcuo: 1,
    codcon: 42,
    periodo: '2026-10-01',
    fechaVencimiento: '2026-10-01',
    monto: 2500,
    montoConfirmado: 2500,
    saldo: 0,
    montoPendienteRevision: 0,
    estado: 'PAGADA',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoPagosModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratoPagosModalComponent);
  });

  afterEach(() => http.verify());

  it('loads payments only after an installment is selected', () => {
    fixture.detectChanges();
    expect(http.match((request) => request.url.includes('/pagos'))).toHaveLength(0);

    fixture.componentRef.setInput('installment', installment);
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/cuotas/1/pagos');
    request.flush([
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
    expect(fixture.nativeElement.textContent).toContain('Bs 2.500,00');
    expect(fixture.nativeElement.textContent).toContain('QR');
  });
});
