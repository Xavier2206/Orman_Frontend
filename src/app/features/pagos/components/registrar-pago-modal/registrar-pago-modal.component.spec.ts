import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaListado } from '../../models/cuota-listado.model';
import { RegistrarPagoModalComponent } from './registrar-pago-modal.component';

describe('RegistrarPagoModalComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<RegistrarPagoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarPagoModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    fixture?.destroy();
    document.documentElement.removeAttribute('data-theme');
  });

  it('shows the selected quota summary and pending review warning in an accessible dialog', () => {
    createModal(
      quota({
        montoConfirmado: 500,
        saldo: 2000,
        montoPendienteRevision: 300,
      }),
    );

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('register-payment-title');
    expect(fixture.nativeElement.textContent).toContain('Carlos Mendoza');
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija · Departamento 2');
    expect(fixture.nativeElement.textContent).toContain('Septiembre 2026');
    expect(fixture.nativeElement.textContent).toContain('Bs 2.500,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 2.000,00');
    expect(fixture.nativeElement.textContent).toContain('Pendiente de revisión');
    expect(fixture.nativeElement.textContent).toContain('Bs 300,00');
    expect(fixture.nativeElement.textContent).toContain('revísalo en lugar de registrar otro pago');
    setInput('#payment-amount', '1');
    expect(submitButton().disabled).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[aria-label="Cerrar modal registrar pago"]'),
    ).not.toBeNull();
  });

  it('shows a fixed cash method without QR controls', () => {
    createModal();

    expect(fixture.nativeElement.querySelector('.payment-method').textContent).toContain(
      'Método: Efectivo',
    );
    expect(fixture.nativeElement.querySelectorAll('input[type=radio]')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain('TRANSFERENCIA');
    expect(fixture.nativeElement.textContent).not.toContain('Cuenta de pago');
    expect(fixture.nativeElement.textContent).not.toContain('Referencia');
    expect(fixture.nativeElement.querySelector('#payment-date')).toBeNull();
    expect(fixture.nativeElement.querySelector('#payment-time')).toBeNull();
    expect(fixture.nativeElement.querySelector('#payment-proof')).toBeNull();
  });

  it('registers EFECTIVO in multipart with only the pago JSON part', async () => {
    createModal();
    setInput('#payment-amount', '500.00');
    expect(balancePreview().textContent).toContain('Saldo después del pago: Bs 2.000,00');
    submit();

    const request = http.expectOne('/api/v1/cuotas/101/pagos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeInstanceOf(FormData);
    const formData = request.request.body as FormData;
    const payment = await readPagoPart(formData);
    expect(payment).toMatchObject({
      monto: 500,
      metodo: 'EFECTIVO',
      idempotencyKey: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
    });
    expect(payment).not.toHaveProperty('fechaPago');
    expect(payment).not.toHaveProperty('codqr');
    expect(payment).not.toHaveProperty('codcta');
    expect(payment).not.toHaveProperty('referenciaExterna');
    expect(formData.has('comprobante')).toBe(false);
    expect([...formData.keys()]).toEqual(['pago']);
    expect(request.request.headers.has('Content-Type')).toBe(false);
    request.flush(paymentResponse(), { status: 201, statusText: 'Created' });
  });

  it('validates positive amount, two decimals, and the cuota balance', () => {
    createModal(quota({ saldo: 2000 }));
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', '0');
    expect(fixture.nativeElement.textContent).toContain('El monto mínimo es Bs 0,01.');

    setInput('#payment-amount', '2000.01');
    expect(fixture.nativeElement.textContent).toContain(
      'El monto no puede superar el saldo disponible de Bs 2.000,00.',
    );
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', '10.123');
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un monto numérico con máximo dos decimales.',
    );
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', '-10');
    expect(fixture.nativeElement.textContent).toContain('El monto mínimo es Bs 0,01.');
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', 'abc');
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un monto numérico con máximo dos decimales.',
    );
    expect(submitButton().disabled).toBe(true);
    expect(http.match('/api/v1/cuotas/101/pagos')).toHaveLength(0);
  });

  it('previews partial and full payments with two-decimal monetary precision', () => {
    createModal(quota({ saldo: 2500 }));

    setInput('#payment-amount', '500');
    expect(balancePreview().textContent).toContain('Saldo después del pago: Bs 2.000,00');
    expect(submitButton().disabled).toBe(false);

    setInput('#payment-amount', '1000');
    expect(balancePreview().textContent).toContain('Saldo después del pago: Bs 1.500,00');

    setInput('#payment-amount', '2499.99');
    expect(balancePreview().textContent).toContain('Saldo después del pago: Bs 0,01');

    setInput('#payment-amount', '2500');
    expect(balancePreview().textContent).toContain('Saldo después del pago: Bs 0,00');
    expect(
      fixture.nativeElement.querySelector('.amount-summary .balance-row dd').textContent,
    ).toContain('Bs 2.500,00');
  });

  it('does not preview a zero or over-balance payment', () => {
    createModal(quota({ saldo: 2500 }));

    setInput('#payment-amount', '0');
    expect(balancePreview().textContent).not.toContain('Saldo después del pago');
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', '2500.01');
    expect(balancePreview().textContent).not.toContain('Saldo después del pago');
    expect(submitButton().disabled).toBe(true);
  });

  it('keeps the same idempotency key on retry and displays safe ProblemDetail feedback', async () => {
    createModal();
    setInput('#payment-amount', '500');
    submit();

    const firstRequest = http.expectOne('/api/v1/cuotas/101/pagos');
    const firstFormData = firstRequest.request.body as FormData;
    const firstPayment = (await readPagoPart(firstFormData)) as { idempotencyKey: string };
    expect(amountInput().disabled).toBe(true);
    expect(submitButton().disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Registrando...');
    firstRequest.flush(
      { detail: 'El monto supera el saldo pendiente de la Cuota.', traceId: 'internal-44' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'El monto supera el saldo pendiente de la Cuota.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('internal-44');

    submit();
    const retryRequest = http.expectOne('/api/v1/cuotas/101/pagos');
    const retryPayment = (await readPagoPart(retryRequest.request.body as FormData)) as {
      idempotencyKey: string;
    };
    expect(retryPayment.idempotencyKey).toBe(firstPayment.idempotencyKey);
    retryRequest.flush(paymentResponse(), { status: 201, statusText: 'Created' });
  });

  it.each([
    { status: 413, message: 'Las imágenes deben pesar como máximo 5 MB.' },
    { status: 415, message: 'Formato de imagen no permitido.' },
  ])('shows the expected inline message for HTTP $status', ({ status, message }) => {
    createModal();
    setInput('#payment-amount', '500');
    submit();
    http
      .expectOne('/api/v1/cuotas/101/pagos')
      .flush({ detail: 'Backend detail' }, { status, statusText: 'Request Rejected' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(message);
  });

  it.each([
    { status: 400, detail: 'Falta un dato requerido.' },
    { status: 404, detail: 'La cuota ya no está disponible.' },
    { status: 409, detail: 'La clave de idempotencia ya fue utilizada.' },
    { status: 422, detail: 'El monto supera el saldo pendiente.' },
  ])('shows a safe ProblemDetail for HTTP $status', ({ status, detail }) => {
    createModal();
    setInput('#payment-amount', '500');
    submit();
    http
      .expectOne('/api/v1/cuotas/101/pagos')
      .flush({ detail, traceId: 'internal-99' }, { status, statusText: 'Request Rejected' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(detail);
    expect(fixture.nativeElement.textContent).not.toContain('internal-99');
  });

  it('maps HTTP 403 to an authorization message without exposing backend details', () => {
    createModal();
    setInput('#payment-amount', '500');
    submit();
    http
      .expectOne('/api/v1/cuotas/101/pagos')
      .flush({ detail: 'internal policy response' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes permiso para registrar pagos.');
    expect(fixture.nativeElement.textContent).not.toContain('internal policy response');
  });

  it('does not duplicate submission on repeated clicks while the request is pending', () => {
    createModal();
    setInput('#payment-amount', '500');
    submit();
    submit();

    const requests = http.match('/api/v1/cuotas/101/pagos');
    expect(requests).toHaveLength(1);
    requests[0].flush(paymentResponse(), { status: 201, statusText: 'Created' });
  });

  it('closes on Escape when idle and renders with each official theme', () => {
    createModal();
    let closed = false;
    fixture.componentInstance.closed.subscribe(() => (closed = true));
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toBe(true);

    for (const theme of ['orman', 'light', 'dark'] as const) {
      document.documentElement.setAttribute('data-theme', theme);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
      expect(fixture.nativeElement.textContent).toContain('Registrar pago');
    }
  });

  function createModal(selectedQuota = quota()): void {
    fixture = TestBed.createComponent(RegistrarPagoModalComponent);
    fixture.componentRef.setInput('cuota', selectedQuota);
    fixture.detectChanges();
  }

  function setInput(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function submit(): void {
    (fixture.nativeElement.querySelector('#register-payment-submit') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('#register-payment-submit');
  }

  function amountInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#payment-amount');
  }

  function balancePreview(): HTMLElement {
    return fixture.nativeElement.querySelector('#payment-balance-preview');
  }
});

async function readPagoPart(formData: FormData): Promise<unknown> {
  const paymentPart = formData.get('pago');
  expect(paymentPart).toBeInstanceOf(Blob);
  expect((paymentPart as Blob).type).toBe('application/json');

  return JSON.parse(await (paymentPart as Blob).text());
}

function quota(overrides: Partial<CuotaListado> = {}): CuotaListado {
  return {
    codcuo: 101,
    codcon: 77,
    periodo: '2026-09',
    fechaVencimiento: '2026-09-05',
    monto: 2500,
    montoConfirmado: 0,
    saldo: 2500,
    montoPendienteRevision: 0,
    estado: 'PENDIENTE',
    codperInquilino: 15,
    nombreCompleto: 'Carlos Mendoza',
    ci: '1234567',
    codprop: 3,
    nombrePropiedad: 'Edificio Tarija',
    coduni: 8,
    nombreUnidad: 'Departamento 2',
    situacionVencimiento: 'VENCIDA',
    ...overrides,
  };
}

function paymentResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    codpag: 9,
    codcuo: 101,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO',
    fechaPago: '2026-09-25T18:30:00',
    fechaRegistro: '2026-09-25T18:30:00',
    estado: 'CONFIRMADO',
    origenRegistro: 'PROPIETARIA',
    registradoPor: 'owner',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}
