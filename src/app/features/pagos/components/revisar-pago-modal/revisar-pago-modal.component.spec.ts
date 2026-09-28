import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PagoResponse } from '../../../contratos/models/contrato.model';
import type { CuotaListado } from '../../models/cuota-listado.model';
import { RevisarPagoModalComponent } from './revisar-pago-modal.component';

describe('RevisarPagoModalComponent', () => {
  let fixture: ComponentFixture<RevisarPagoModalComponent>;
  let http: HttpTestingController;
  let createObjectUrl: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:payment-receipt');
    revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [RevisarPagoModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RevisarPagoModalComponent);
    fixture.componentRef.setInput('cuota', quota());
    fixture.componentRef.setInput('codpag', 801);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('loads the actual payment, metadata, and authenticated receipt blob', async () => {
    flushReviewData();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('review-payment-title');
    expect(fixture.nativeElement.textContent).toContain('Christopher Adam Bumstead');
    expect(fixture.nativeElement.textContent).toContain('Octubre 2026');
    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
    expect(fixture.nativeElement.textContent).toContain('QR');
    expect(fixture.nativeElement.textContent).toContain('27/09/2026 10:00');
    expect(fixture.nativeElement.textContent).toContain('comprobante-inquilino.png');
    expect(fixture.nativeElement.textContent).toContain('image/png');
    expect(fixture.nativeElement.querySelector('.receipt-image')?.getAttribute('src')).toBe(
      'blob:payment-receipt',
    );
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.review-close-button'),
    );
  });

  it('keeps confirm disabled until a valid receipt image has loaded', () => {
    http.expectOne('/api/v1/pagos/801').flush(pendingPayment());
    fixture.detectChanges();
    const confirmButton = fixture.nativeElement.querySelector(
      '.confirm-payment-action',
    ) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(true);

    http.expectOne('/api/v1/pagos/801/comprobante/metadata').flush(receiptMetadata());
    http
      .expectOne('/api/v1/pagos/801/comprobante')
      .flush(new Blob(['receipt'], { type: 'image/gif' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el comprobante.');
    expect(confirmButton.disabled).toBe(true);
    expect(createObjectUrl).not.toHaveBeenCalled();
  });

  it('shows an ORMAN confirmation step and confirms with PATCH without a body', () => {
    flushReviewData();
    fixture.detectChanges();
    const reviewedPayments: PagoResponse[] = [];
    fixture.componentInstance.reviewed.subscribe((payment) => reviewedPayments.push(payment));

    (fixture.nativeElement.querySelector('.confirm-payment-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('¿Confirmar este pago de Bs 500,00?');
    expect(fixture.nativeElement.textContent).toContain(
      'Al confirmar, el monto se aplicará financieramente a la cuota.',
    );

    const finalConfirm = fixture.nativeElement.querySelector(
      '.review-primary-button',
    ) as HTMLButtonElement;
    finalConfirm.click();
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/pagos/801/confirmar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toBeNull();
    expect(finalConfirm.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Confirmando...');

    const confirmed = pendingPayment({ estado: 'CONFIRMADO' });
    request.flush(confirmed);
    fixture.detectChanges();
    expect(reviewedPayments).toEqual([confirmed]);
  });

  it('requires a trimmed rejection reason no longer than 500 characters', () => {
    flushReviewData();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.reject-payment-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    const textarea = fixture.nativeElement.querySelector(
      '#payment-rejection-reason',
    ) as HTMLTextAreaElement;
    const rejectButton = fixture.nativeElement.querySelector(
      '.review-danger-button',
    ) as HTMLButtonElement;
    expect(rejectButton.disabled).toBe(true);
    expect(document.activeElement).toBe(textarea);

    setRejectionReason(textarea, '   ');
    fixture.detectChanges();
    expect(rejectButton.disabled).toBe(true);

    setRejectionReason(textarea, 'x'.repeat(501));
    fixture.detectChanges();
    expect(rejectButton.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('501 / 500');

    setRejectionReason(textarea, '  Comprobante ilegible  ');
    fixture.detectChanges();
    expect(rejectButton.disabled).toBe(false);
  });

  it('sends only the trimmed motivo and emits successful rejection', () => {
    flushReviewData();
    fixture.detectChanges();
    const reviewedPayments: PagoResponse[] = [];
    fixture.componentInstance.reviewed.subscribe((payment) => reviewedPayments.push(payment));
    (fixture.nativeElement.querySelector('.reject-payment-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    setRejectionReason(
      fixture.nativeElement.querySelector('#payment-rejection-reason') as HTMLTextAreaElement,
      '  Comprobante ilegible  ',
    );
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.review-danger-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const request = http.expectOne('/api/v1/pagos/801/rechazar');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ motivo: 'Comprobante ilegible' });
    expect(Object.keys(request.request.body)).toEqual(['motivo']);

    const rejected = pendingPayment({ estado: 'RECHAZADO', motivoRechazo: 'Comprobante ilegible' });
    request.flush(rejected);
    fixture.detectChanges();
    expect(reviewedPayments).toEqual([rejected]);
  });

  it('shows the backend ProblemDetail on a 422 and refreshes the quota state', () => {
    flushReviewData();
    fixture.detectChanges();
    const refreshRequested = vi.fn();
    fixture.componentInstance.refreshRequested.subscribe(refreshRequested);
    (fixture.nativeElement.querySelector('.reject-payment-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    setRejectionReason(
      fixture.nativeElement.querySelector('#payment-rejection-reason') as HTMLTextAreaElement,
      'Pago duplicado',
    );
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.review-danger-button') as HTMLButtonElement).click();

    http
      .expectOne('/api/v1/pagos/801/rechazar')
      .flush(
        { detail: 'El pago ya fue revisado en otra sesión.' },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('El pago ya fue revisado en otra sesión.');
    expect(fixture.nativeElement.textContent).toContain('Pago actualizado');
    expect(refreshRequested).toHaveBeenCalledOnce();
    expect(
      (fixture.nativeElement.querySelector('.review-danger-button') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('shows the required receipt error and disables confirmation when the blob request fails', () => {
    http.expectOne('/api/v1/pagos/801').flush(pendingPayment());
    fixture.detectChanges();
    http.expectOne('/api/v1/pagos/801/comprobante/metadata').flush(receiptMetadata());
    http
      .expectOne('/api/v1/pagos/801/comprobante')
      .error(new ProgressEvent('error'), { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el comprobante.');
    expect(
      (fixture.nativeElement.querySelector('.confirm-payment-action') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('revokes the object URL when the modal closes and when it is destroyed', () => {
    flushReviewData();
    fixture.detectChanges();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    (fixture.nativeElement.querySelector('.review-close-button') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:payment-receipt');

    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(1);
  });

  it('revokes the previous object URL when the selected payment changes', () => {
    flushReviewData();
    fixture.detectChanges();

    fixture.componentRef.setInput('codpag', 802);
    fixture.detectChanges();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:payment-receipt');

    http.expectOne('/api/v1/pagos/802').flush(pendingPayment({ codpag: 802 }));
    fixture.detectChanges();
    http.expectOne('/api/v1/pagos/802/comprobante/metadata').flush(receiptMetadata());
    http
      .expectOne('/api/v1/pagos/802/comprobante')
      .flush(new Blob(['new receipt'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    expect(createObjectUrl).toHaveBeenCalledTimes(2);
  });

  function flushReviewData(): void {
    const paymentRequest = http.expectOne('/api/v1/pagos/801');
    expect(paymentRequest.request.method).toBe('GET');
    paymentRequest.flush(pendingPayment());
    fixture.detectChanges();

    const metadataRequest = http.expectOne('/api/v1/pagos/801/comprobante/metadata');
    expect(metadataRequest.request.method).toBe('GET');
    metadataRequest.flush(receiptMetadata());

    const receiptRequest = http.expectOne('/api/v1/pagos/801/comprobante');
    expect(receiptRequest.request.method).toBe('GET');
    expect(receiptRequest.request.responseType).toBe('blob');
    receiptRequest.flush(new Blob(['receipt'], { type: 'image/png' }));
  }

  function setRejectionReason(textarea: HTMLTextAreaElement, value: string): void {
    textarea.value = value;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

function quota(): CuotaListado {
  return {
    codcuo: 101,
    codcon: 77,
    periodo: '2026-10',
    fechaVencimiento: '2026-10-01',
    monto: 2500,
    montoConfirmado: 0,
    saldo: 2500,
    montoPendienteRevision: 500,
    estado: 'PENDIENTE',
    codperInquilino: 15,
    nombreCompleto: 'Christopher Adam Bumstead',
    ci: '1234567',
    codprop: 3,
    nombrePropiedad: 'Edificio Tarija',
    coduni: 8,
    nombreUnidad: 'Departamento 1',
    situacionVencimiento: 'PROXIMA',
  };
}

function pendingPayment(overrides: Partial<PagoResponse> = {}): PagoResponse {
  return {
    codpag: 801,
    codcuo: 101,
    codqr: 6,
    monto: 500,
    metodo: 'QR',
    fechaPago: '2026-09-27T10:00:00',
    fechaRegistro: '2026-09-27T10:00:00',
    estado: 'PENDIENTE_REVISION',
    origenRegistro: 'INQUILINO',
    registradoPor: 'tenant',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}

function receiptMetadata() {
  return {
    nombreArchivo: 'comprobante-inquilino.png',
    tipoContenido: 'image/png',
    fechaRegistro: '2026-09-27T10:15:00',
  };
}
