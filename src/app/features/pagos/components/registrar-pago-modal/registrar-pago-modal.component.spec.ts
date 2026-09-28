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

  it('shows only EFECTIVO and QR and hides QR fields for cash', () => {
    createModal();

    expect(fixture.nativeElement.querySelector('#payment-method-cash')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#payment-method-qr')).not.toBeNull();
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

  it('requires date and time for QR and sends a LocalDateTime without codqr', async () => {
    createModal();
    chooseMethod('QR');

    expect(fixture.nativeElement.querySelector('#payment-date')?.required).toBe(true);
    expect(fixture.nativeElement.querySelector('#payment-time')?.required).toBe(true);
    expect(fixture.nativeElement.querySelector('#payment-proof')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.qr-fields')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.date-time-fields')).not.toBeNull();
    expect(submitButton().disabled).toBe(true);

    setInput('#payment-amount', '75');
    setValidQrDateTime();
    expect(submitButton().disabled).toBe(false);
    submit();

    const request = http.expectOne('/api/v1/cuotas/101/pagos');
    const formData = request.request.body as FormData;
    const payment = (await readPagoPart(formData)) as Record<string, unknown>;
    expect(payment).toMatchObject({
      monto: 75,
      metodo: 'QR',
      fechaPago: previousDate(dateInput().max) + 'T08:45:00',
      idempotencyKey: expect.any(String),
    });
    expect(payment).not.toHaveProperty('codqr');
    expect(payment).not.toHaveProperty('codcta');
    expect(payment).not.toHaveProperty('referenciaExterna');
    expect([...formData.keys()]).toEqual(['pago']);
    request.flush(paymentResponse({ codqr: 12, metodo: 'QR' }), {
      status: 201,
      statusText: 'Created',
    });
  });

  it('rejects future QR dates and times before sending', () => {
    createModal();
    chooseMethod('QR');
    setInput('#payment-amount', '100');
    setInput('#payment-date', nextDate(dateInput().max));
    setInput('#payment-time', '10:00');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se permiten fechas u horas futuras.');
    expect(submitButton().disabled).toBe(true);
    expect(http.match('/api/v1/cuotas/101/pagos')).toHaveLength(0);
  });

  it.each([
    { name: 'comprobante.png', type: 'image/png' },
    { name: 'comprobante.jpg', type: 'image/jpeg' },
    { name: 'comprobante.jpeg', type: 'image/jpeg' },
  ])('accepts a $type comprobante and keeps it local until submit', ({ name, type }) => {
    createModal();
    chooseMethod('QR');
    const selected = new File(['image data'], name, { type });
    selectFile(selected);

    expect(fixture.nativeElement.textContent).toContain(name);
    expect(fixture.nativeElement.textContent).toContain('KB');
    expect(http.match('/api/v1/cuotas/101/pagos')).toHaveLength(0);
    const fileInput = fixture.nativeElement.querySelector('#payment-proof') as HTMLInputElement;
    expect(fileInput.accept).toBe('image/png,image/jpeg');
    expect(fileInput.multiple).toBe(false);
  });

  it('sends a selected QR comprobante only after submit', async () => {
    createModal();
    chooseMethod('QR');
    setInput('#payment-amount', '75');
    setValidQrDateTime();
    selectFile(new File(['image bytes'], 'pago.png', { type: 'image/png' }));
    expect(http.match('/api/v1/cuotas/101/pagos')).toHaveLength(0);

    submit();
    const request = http.expectOne('/api/v1/cuotas/101/pagos');
    const formData = request.request.body as FormData;
    expect([...formData.keys()]).toEqual(['pago', 'comprobante']);
    const receipt = formData.get('comprobante') as File;
    expect(receipt.name).toBe('pago.png');
    expect(receipt.type).toBe('image/png');
    request.flush(paymentResponse({ codqr: 12, metodo: 'QR' }), {
      status: 201,
      statusText: 'Created',
    });
  });

  it('accepts a comprobante at the 5 MB limit', () => {
    createModal();
    chooseMethod('QR');
    selectFile(new File([new Uint8Array(5 * 1024 * 1024)], 'limit.png', { type: 'image/png' }));

    expect(fixture.nativeElement.textContent).toContain('limit.png');
    expect(fixture.nativeElement.textContent).toContain('5 MB');
    expect(fixture.nativeElement.textContent).not.toContain('debe pesar como máximo 5 MB');
  });

  it.each([
    { name: 'comprobante.pdf', type: 'application/pdf' },
    { name: 'mismatch.png', type: 'image/jpeg' },
  ])('rejects unsupported or mismatched comprobante formats inline', ({ name, type }) => {
    createModal();
    chooseMethod('QR');
    selectFile(new File(['file content'], name, { type }));

    expect(fixture.nativeElement.textContent).toContain('Selecciona una imagen PNG o JPEG.');
    expect(fixture.nativeElement.querySelector('.selected-file')).toBeNull();
    expect(submitButton().disabled).toBe(true);
    expect(http.match('/api/v1/cuotas/101/pagos')).toHaveLength(0);
  });

  it('rejects comprobantes larger than 5 MB and allows removing a valid file', () => {
    createModal();
    chooseMethod('QR');
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });
    selectFile(oversized);

    expect(fixture.nativeElement.textContent).toContain('debe pesar como máximo 5 MB');
    expect(fixture.nativeElement.querySelector('.selected-file')).toBeNull();

    selectFile(new File(['image'], 'small.png', { type: 'image/png' }));
    (
      fixture.nativeElement.querySelector('.selected-file .text-button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('small.png');
    expect(fixture.nativeElement.querySelector('.selected-file')).toBeNull();
  });

  it('clears QR date, time, and comprobante when switching to EFECTIVO', () => {
    createModal();
    chooseMethod('QR');
    setInput('#payment-date', previousDate(dateInput().max));
    setInput('#payment-time', '08:45');
    selectFile(new File(['image'], 'proof.jpg', { type: 'image/jpeg' }));

    chooseMethod('EFECTIVO');
    expect(fixture.nativeElement.querySelector('#payment-date')).toBeNull();
    expect(fixture.nativeElement.querySelector('#payment-time')).toBeNull();
    expect(fixture.nativeElement.querySelector('#payment-proof')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('proof.jpg');

    chooseMethod('QR');
    expect(dateInput().value).toBe('');
    expect(timeInput().value).toBe('');
    expect(fixture.nativeElement.textContent).not.toContain('proof.jpg');
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

  function chooseMethod(method: 'EFECTIVO' | 'QR'): void {
    const id = method === 'QR' ? '#payment-method-qr' : '#payment-method-cash';
    (fixture.nativeElement.querySelector(id) as HTMLInputElement).click();
    fixture.detectChanges();
  }

  function selectFile(file: File): void {
    const input = fixture.nativeElement.querySelector('#payment-proof') as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      configurable: true,
      value: { 0: file, length: 1 },
    });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function setInput(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function setValidQrDateTime(): void {
    setInput('#payment-date', previousDate(dateInput().max));
    setInput('#payment-time', '08:45');
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

  function dateInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#payment-date');
  }

  function timeInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('#payment-time');
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

function previousDate(date: string): string {
  const yesterday = new Date(date + 'T00:00:00Z');
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday.toISOString().slice(0, 10);
}

function nextDate(date: string): string {
  const tomorrow = new Date(date + 'T00:00:00Z');
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
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
