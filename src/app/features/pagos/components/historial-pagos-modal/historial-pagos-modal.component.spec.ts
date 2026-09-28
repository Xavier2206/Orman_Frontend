import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { PagoResponse } from '../../../contratos/models/contrato.model';
import type { CuotaListado } from '../../models/cuota-listado.model';
import { HistorialPagosModalComponent } from './historial-pagos-modal.component';

describe('HistorialPagosModalComponent', () => {
  let fixture: ComponentFixture<HistorialPagosModalComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialPagosModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HistorialPagosModalComponent);
  });

  afterEach(() => http.verify());

  function openModal(): void {
    fixture.componentRef.setInput('cuota', quota());
    fixture.detectChanges();
  }

  function historyRequest(codcuo: number) {
    return http.expectOne(`/api/v1/cuotas/${codcuo}/pagos`);
  }

  it('shows an accessible dialog, the selected quota summary, and the loading state', () => {
    openModal();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('payment-history-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('payment-history-summary');
    expect(dialog.getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Cuota #101');
    expect(fixture.nativeElement.textContent).toContain('Valeria Mendoza');
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija · Departamento 3B');
    expect(fixture.nativeElement.textContent).toContain('Septiembre 2026');
    expect(fixture.nativeElement.textContent).toContain('Cargando historial...');
    expect(fixture.nativeElement.querySelector('.history-table')).toBeNull();

    historyRequest(101).flush([]);
    fixture.detectChanges();
  });

  it('shows backend summary amounts without subtracting pending review from the balance', () => {
    fixture.componentRef.setInput(
      'cuota',
      quota({ montoConfirmado: 1000, montoPendienteRevision: 300, saldo: 1500 }),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Monto de cuota');
    expect(fixture.nativeElement.textContent).toContain('Pagado confirmado');
    expect(fixture.nativeElement.textContent).toContain('Pendiente de revisión');
    expect(fixture.nativeElement.textContent).toContain('Saldo pendiente');
    expect(fixture.nativeElement.textContent).toContain('Bs 2.500,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 1.000,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 300,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 1.500,00');

    historyRequest(101).flush([]);
    fixture.detectChanges();
  });

  it('omits the pending review amount when it is zero', () => {
    openModal();

    expect(fixture.nativeElement.textContent).not.toContain('Pendiente de revisión');
    historyRequest(101).flush([]);
    fixture.detectChanges();
  });

  it('shows the empty state without rendering an empty table', () => {
    openModal();
    historyRequest(101).flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay pagos registrados');
    expect(fixture.nativeElement.textContent).toContain(
      'Esta cuota todavía no tiene movimientos de pago.',
    );
    expect(fixture.nativeElement.querySelector('.history-table')).toBeNull();
  });

  it('renders several payments in backend order with friendly values and conditional details', () => {
    openModal();
    const payments = [
      payment({
        codpag: 44,
        metodo: 'QR',
        fechaPago: '2026-12-05T10:30:44',
        fechaRegistro: '2026-12-05T10:45:00',
        fechaRevision: '2026-12-05T11:05:11',
        estado: 'PENDIENTE_REVISION',
        origenRegistro: 'INQUILINO',
        codqr: 991,
      }),
      payment({
        codpag: 43,
        metodo: 'EFECTIVO',
        fechaPago: '2026-12-04T09:15:00',
        estado: 'CONFIRMADO',
        origenRegistro: 'PROPIETARIA',
      }),
      payment({
        codpag: 42,
        fechaPago: '2026-12-03T08:00:00',
        estado: 'RECHAZADO',
        motivoRechazo: 'Comprobante ilegible',
      }),
      payment({
        codpag: 41,
        fechaPago: '2026-12-02T07:00:00',
        estado: 'ANULADO',
        motivoAnulacion: 'Registro duplicado',
      }),
    ];
    historyRequest(101).flush(payments);
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('.history-table') as HTMLTableElement;
    const rows = [...table.querySelectorAll('tbody > tr:not(.reason-row)')];
    expect(rows).toHaveLength(4);
    expect(rows[0].textContent).toContain('05/12/2026 10:30');
    expect(rows[0].textContent).toContain('QR');
    expect(rows[0].textContent).toContain('Pendiente de revisión');
    expect(rows[0].textContent).toContain('Inquilino');
    expect(rows[0].textContent).toContain('Revisado: 05/12/2026 11:05');
    expect(rows[1].textContent).toContain('04/12/2026 09:15');
    expect(rows[1].textContent).toContain('Efectivo');
    expect(rows[1].textContent).toContain('Confirmado');
    expect(rows[1].textContent).toContain('Propietaria');
    expect(rows[2].textContent).toContain('Rechazado');
    expect(rows[3].textContent).toContain('Anulado');
    expect(rows[0].querySelector('.history-status-pending')).not.toBeNull();
    expect(rows[1].querySelector('.history-status-confirmed')).not.toBeNull();
    expect(rows[2].querySelector('.history-status-rejected')).not.toBeNull();
    expect(rows[3].querySelector('.history-status-annulled')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Motivo: Comprobante ilegible');
    expect(fixture.nativeElement.textContent).toContain('Motivo: Registro duplicado');
    expect(fixture.nativeElement.textContent).not.toContain('owner.login');
    expect(fixture.nativeElement.textContent).not.toContain('991');

    const mobileCards = fixture.nativeElement.querySelectorAll('.mobile-history .payment-card');
    expect(mobileCards).toHaveLength(4);
  });

  it('renders one payment and formats the local payment time without timezone conversion', () => {
    openModal();
    historyRequest(101).flush([
      payment({ fechaPago: '2026-09-26T10:30:00', fechaRegistro: '2026-09-26T12:00:00' }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('26/09/2026 10:30');
    expect(fixture.nativeElement.textContent).not.toContain('26/09/2026 12:00');
    expect(fixture.nativeElement.querySelectorAll('.history-table tbody > tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.mobile-history .payment-card')).toHaveLength(1);

    http.expectNone((request) => /\/api\/v1\/pagos\/\d+/.test(request.url));
    http.expectNone((request) => request.url.includes('/comprobante'));
  });

  it('shows annulment only for confirmed payments registered by the owner', () => {
    openModal();
    historyRequest(101).flush([
      payment({ codpag: 51, metodo: 'EFECTIVO' }),
      payment({ codpag: 52, metodo: 'QR' }),
      payment({ codpag: 53, metodo: 'QR', origenRegistro: 'INQUILINO' }),
      payment({ codpag: 54, estado: 'PENDIENTE_REVISION' }),
      payment({ codpag: 55, estado: 'RECHAZADO' }),
      payment({ codpag: 56, estado: 'ANULADO', motivoAnulacion: 'Ya anulado' }),
    ]);
    fixture.detectChanges();

    const desktopButtons = fixture.nativeElement.querySelectorAll(
      '.desktop-history .annul-payment-button',
    );
    const mobileButtons = fixture.nativeElement.querySelectorAll(
      '.mobile-history .annul-payment-button',
    );
    expect(desktopButtons).toHaveLength(2);
    expect(mobileButtons).toHaveLength(2);
    expect(
      fixture.nativeElement
        .querySelector('.desktop-history [data-payment-id="51"] .annul-payment-button')
        ?.getAttribute('aria-label'),
    ).toContain('Bs 500,00');
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="52"] .annul-payment-button',
      ),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="53"] .annul-payment-button',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="54"] .annul-payment-button',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="55"] .annul-payment-button',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.desktop-history [data-payment-id="56"] .annul-payment-button',
      ),
    ).toBeNull();
  });

  it('opens confirmation without sending PATCH and Escape closes only the top modal', async () => {
    openModal();
    historyRequest(101).flush([payment()]);
    fixture.detectChanges();

    const annulButton = fixture.nativeElement.querySelector(
      '.desktop-history .annul-payment-button',
    ) as HTMLButtonElement;
    annulButton.focus();
    annulButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogs = fixture.nativeElement.querySelectorAll('[role="dialog"]');
    expect(dialogs).toHaveLength(2);
    expect(dialogs[1].textContent).toContain('Anular pago');
    http.expectNone('/api/v1/pagos/40/anular');

    dialogs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(document.activeElement).toBe(annulButton);
    expect(fixture.nativeElement.textContent).toContain('Historial de pagos');
    http.expectNone('/api/v1/pagos/40/anular');
  });

  it('refreshes history after closing an unavailable payment error', async () => {
    openModal();
    historyRequest(101).flush([payment()]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.annul-payment-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const reason = fixture.nativeElement.querySelector('#annul-reason') as HTMLTextAreaElement;
    reason.value = 'Registro equivocado';
    reason.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-annul-button') as HTMLButtonElement).click();
    http.expectOne('/api/v1/pagos/40/anular').flush({}, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El pago ya no está disponible.');

    (fixture.nativeElement.querySelector('.cancel-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const refresh = historyRequest(101);
    refresh.flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No hay pagos registrados');
    http.expectNone('/api/v1/cuotas');
  });

  it('shows a safe API error and retries the same cuota history request', () => {
    openModal();
    historyRequest(101).flush(
      { detail: 'Internal SQL detail', traceId: 'private-trace' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('No se pudo cargar el historial de pagos.');
    expect(alert.textContent).not.toContain('Internal SQL detail');
    expect(alert.textContent).not.toContain('private-trace');

    (fixture.nativeElement.querySelector('.retry-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    historyRequest(101).flush([payment()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.history-table')).not.toBeNull();
  });

  it('closes from the header and footer buttons and from Escape', () => {
    let closeCount = 0;
    fixture.componentInstance.closed.subscribe(() => closeCount++);
    openModal();

    (fixture.nativeElement.querySelector('.history-close-button') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.close-action') as HTMLButtonElement).click();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(closeCount).toBe(3);
    historyRequest(101).flush([]);
    fixture.detectChanges();
  });
});

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
    nombreCompleto: 'Valeria Mendoza',
    ci: '1234567',
    codprop: 3,
    nombrePropiedad: 'Edificio Tarija',
    coduni: 8,
    nombreUnidad: 'Departamento 3B',
    situacionVencimiento: 'VENCIDA',
    ...overrides,
  };
}

function payment(overrides: Partial<PagoResponse> = {}): PagoResponse {
  return {
    codpag: 40,
    codcuo: 101,
    codqr: null,
    monto: 500,
    metodo: 'EFECTIVO',
    fechaPago: '2026-09-26T10:30:00',
    fechaRegistro: '2026-09-26T10:31:00',
    estado: 'CONFIRMADO',
    origenRegistro: 'PROPIETARIA',
    registradoPor: 'owner.login',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}
