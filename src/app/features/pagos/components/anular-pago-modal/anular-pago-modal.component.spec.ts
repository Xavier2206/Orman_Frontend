import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PagoResponse } from '../../../contratos/models/contrato.model';
import { AnularPagoModalComponent } from './anular-pago-modal.component';

describe('AnularPagoModalComponent', () => {
  let fixture: ComponentFixture<AnularPagoModalComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnularPagoModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AnularPagoModalComponent);
    fixture.componentRef.setInput('payment', payment());
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the payment details and focuses the required reason field', async () => {
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('annul-payment-title');
    expect(fixture.nativeElement.textContent).toContain('¿Desea anular este pago?');
    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
    expect(fixture.nativeElement.textContent).toContain('Efectivo');
    expect(fixture.nativeElement.textContent).toContain('26/09/2026 12:00');
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('#annul-reason'));
  });

  it('requires a non-empty trimmed reason with at most 500 characters', () => {
    const textarea = fixture.nativeElement.querySelector('#annul-reason') as HTMLTextAreaElement;
    const submit = fixture.nativeElement.querySelector(
      '.confirm-annul-button',
    ) as HTMLButtonElement;

    expect(submit.disabled).toBe(true);

    textarea.value = '   ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(submit.disabled).toBe(true);

    textarea.value = 'a'.repeat(501);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(submit.disabled).toBe(true);

    textarea.value = '  Registro equivocado  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(submit.disabled).toBe(false);
  });

  it('closes from Cancelar or Escape without calling the API', () => {
    const closedValues: boolean[] = [];
    fixture.componentInstance.closed.subscribe((refreshHistory) =>
      closedValues.push(refreshHistory),
    );

    (fixture.nativeElement.querySelector('.cancel-button') as HTMLButtonElement).click();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closedValues).toEqual([false, false]);
    http.expectNone('/api/v1/pagos/25/anular');
  });

  it('sends the trimmed reason once and disables the dialog while the PATCH is pending', () => {
    const annulledPayments: PagoResponse[] = [];
    fixture.componentInstance.annulled.subscribe((result) => annulledPayments.push(result));
    setReason(fixture, '  Registro equivocado  ');

    const submit = fixture.nativeElement.querySelector(
      '.confirm-annul-button',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/pagos/25/anular');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ motivo: 'Registro equivocado' });
    expect(fixture.nativeElement.querySelector('#annul-reason').disabled).toBe(true);
    expect(submit.disabled).toBe(true);
    expect(submit.textContent).toContain('Anulando...');

    submit.click();
    http.expectNone('/api/v1/pagos/25/anular');

    request.flush(payment({ estado: 'ANULADO', motivoAnulacion: 'Registro equivocado' }));
    fixture.detectChanges();
    expect(annulledPayments).toHaveLength(1);
    expect(annulledPayments[0].estado).toBe('ANULADO');
  });

  it.each([
    {
      status: 400,
      body: { fieldErrors: [{ field: 'motivo', message: 'El motivo no es válido.' }] },
      expected: 'El motivo no es válido.',
    },
    {
      status: 403,
      body: { detail: 'Forbidden' },
      expected: 'No tiene permisos para anular este pago.',
    },
    { status: 404, body: { detail: 'Not found' }, expected: 'El pago ya no está disponible.' },
    {
      status: 409,
      body: { detail: 'El estado del pago cambió.' },
      expected: 'El estado del pago cambió.',
    },
    {
      status: 422,
      body: { detail: 'No se puede anular un pago de un contrato finalizado.' },
      expected: 'No se puede anular un pago de un contrato finalizado.',
    },
  ])(
    'keeps the dialog open and handles HTTP $status using ProblemDetail',
    ({ status, body, expected }) => {
      setReason(fixture, 'Motivo correcto');
      (fixture.nativeElement.querySelector('.confirm-annul-button') as HTMLButtonElement).click();
      fixture.detectChanges();

      http
        .expectOne('/api/v1/pagos/25/anular')
        .flush(body, { status, statusText: 'Request failed' });
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        expected,
      );
    },
  );

  it('requests a history refresh after the unavailable payment dialog closes', () => {
    const closedValues: boolean[] = [];
    fixture.componentInstance.closed.subscribe((refreshHistory) =>
      closedValues.push(refreshHistory),
    );
    setReason(fixture, 'Motivo correcto');
    (fixture.nativeElement.querySelector('.confirm-annul-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/pagos/25/anular').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.cancel-button') as HTMLButtonElement).click();
    expect(closedValues).toEqual([true]);
  });
});

function setReason(fixture: ComponentFixture<AnularPagoModalComponent>, value: string): void {
  const textarea = fixture.nativeElement.querySelector('#annul-reason') as HTMLTextAreaElement;
  textarea.value = value;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
}

function payment(overrides: Partial<PagoResponse> = {}): PagoResponse {
  return {
    codpag: 25,
    codcuo: 102,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO',
    fechaPago: '2026-09-26T12:00:00',
    fechaRegistro: '2026-09-26T12:00:00',
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
