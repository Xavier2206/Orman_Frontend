import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../core/notifications/orman-notification.service';
import type { PagoResponse } from '../../contratos/models/contrato.model';
import type { PageResponse } from '../../personas/models/persona.model';
import type { CuotaListado } from '../models/cuota-listado.model';
import { PagosListComponent } from './pagos-list/pagos-list.component';

describe('PagosListComponent annulment flow', () => {
  let fixture: ComponentFixture<PagosListComponent>;
  let http: HttpTestingController;
  let notification: { success: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notification = { success: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [PagosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PagosListComponent);
    fixture.detectChanges();
    flushCatalogRequests();
    cuotaListRequest(0).flush(pageWithQuota(0, 2));
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('annuls the selected payment, reloads history and cuota data, and preserves filters and page', async () => {
    const monthFilter = fixture.nativeElement.querySelector('#payment-period') as HTMLInputElement;
    monthFilter.value = '2026-09';
    monthFilter.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    cuotaListRequest(0).flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    const nextPage = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Siguiente'),
    ) as HTMLButtonElement;
    nextPage.click();
    fixture.detectChanges();
    cuotaListRequest(1).flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    const historyButton = fixture.nativeElement.querySelector(
      '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 102"]',
    ) as HTMLButtonElement;
    historyButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    http.expectOne('/api/v1/cuotas/102/pagos').flush([payment()]);
    fixture.detectChanges();

    const annulButton = fixture.nativeElement.querySelector(
      '.desktop-history .annul-payment-button',
    ) as HTMLButtonElement;
    annulButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = fixture.nativeElement.querySelector('#annul-reason') as HTMLTextAreaElement;
    textarea.value = '  Registro equivocado  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-annul-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const annulRequest = http.expectOne('/api/v1/pagos/25/anular');
    expect(annulRequest.request.method).toBe('PATCH');
    expect(annulRequest.request.body).toEqual({ motivo: 'Registro equivocado' });
    annulRequest.flush(payment({ estado: 'ANULADO', motivoAnulacion: 'Registro equivocado' }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(notification.success).toHaveBeenCalledWith('Pago anulado correctamente.');

    const historyRefresh = http.expectOne('/api/v1/cuotas/102/pagos');
    expect(historyRefresh.request.method).toBe('GET');
    historyRefresh.flush([payment({ estado: 'ANULADO', motivoAnulacion: 'Registro equivocado' })]);

    const cuotaRefresh = cuotaListRequest(1);
    expect(cuotaRefresh.request.params.get('periodo')).toBe('2026-09-01');
    expect(cuotaRefresh.request.params.get('page')).toBe('1');
    expect(cuotaRefresh.request.params.get('size')).toBe('20');
    cuotaRefresh.flush(
      pageWithQuota(1, 2, {
        montoConfirmado: 0,
        saldo: 2500,
        estado: 'PENDIENTE',
      }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Anulado');
    expect(fixture.nativeElement.textContent).toContain('Motivo: Registro equivocado');
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="25"] .annul-payment-button',
      ),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Bs 2.500,00');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(monthFilter.value).toBe('2026-09');
  });
});

function cuotaListRequest(page: number) {
  return TestBed.inject(HttpTestingController).expectOne(
    (request) =>
      request.url === '/api/v1/cuotas' &&
      request.params.get('page') === String(page) &&
      request.params.get('size') === '20',
  );
}

function flushCatalogRequests(): void {
  TestBed.inject(HttpTestingController)
    .expectOne('/api/v1/contratos/inquilinos')
    .flush([{ codper: 15, nombreCompleto: 'Valeria Mendoza', ci: '1234567' }]);
  TestBed.inject(HttpTestingController)
    .expectOne((request) => request.url === '/api/v1/propiedades')
    .flush({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
}

function pageWithQuota(
  page: number,
  totalPages: number,
  overrides: Partial<CuotaListado> = {},
): PageResponse<CuotaListado> {
  return {
    content: [
      {
        codcuo: page + 101,
        codcon: 77,
        periodo: '2026-09',
        fechaVencimiento: '2026-09-05',
        monto: 2500,
        montoConfirmado: 500,
        saldo: 2000,
        montoPendienteRevision: 0,
        estado: 'PARCIAL',
        codperInquilino: 15,
        nombreCompleto: 'Valeria Mendoza',
        ci: '1234567',
        codprop: 3,
        nombrePropiedad: 'Edificio Tarija',
        coduni: 8,
        nombreUnidad: 'Departamento 3B',
        situacionVencimiento: 'VENCIDA',
        ...overrides,
      },
    ],
    page,
    size: 20,
    totalElements: 21,
    totalPages,
    first: page === 0,
    last: page === totalPages - 1,
  };
}

function payment(overrides: Partial<PagoResponse> = {}): PagoResponse {
  return {
    codpag: 25,
    codcuo: 102,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO' as const,
    fechaPago: '2026-09-26T12:00:00',
    fechaRegistro: '2026-09-26T12:00:00',
    estado: 'CONFIRMADO' as const,
    origenRegistro: 'PROPIETARIA' as const,
    registradoPor: 'owner',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}
