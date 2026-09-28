import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { PagoResponse } from '../../../contratos/models/contrato.model';
import { PagoRevisionSeleccion } from './cuota-table.component';
import { CuotaListado } from '../../models/cuota-listado.model';
import { CuotaTableComponent } from './cuota-table.component';

describe('CuotaTableComponent', () => {
  let fixture: ComponentFixture<CuotaTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CuotaTableComponent] }).compileComponents();
    fixture = TestBed.createComponent(CuotaTableComponent);
  });

  it('shows a register action for a balance without a pending payment review', () => {
    fixture.componentRef.setInput('cuotas', [quota()]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Valeria Mendoza');
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija');
    expect(fixture.nativeElement.textContent).toContain('Septiembre 2026');
    expect(fixture.nativeElement.textContent).toContain('05/09/2026');
    expect(fixture.nativeElement.textContent).toContain('Vencida');
    expect(fixture.nativeElement.textContent).toContain('Bs 2.500,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 0,00');
    expect(fixture.nativeElement.textContent).toContain('PENDIENTE');
    const registerAction = fixture.nativeElement.querySelector(
      '[aria-label="Registrar pago de la cuota 101"]',
    ) as HTMLButtonElement;
    expect(registerAction).not.toBeNull();
    expect(registerAction.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();
    const historyAction = fixture.nativeElement.querySelector(
      '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 101"]',
    ) as HTMLButtonElement;
    expect(historyAction).not.toBeNull();
    expect(historyAction.disabled).toBe(false);
  });

  it('places status before the amounts and due date where status used to appear', () => {
    fixture.componentRef.setInput('cuotas', [quota()]);
    fixture.detectChanges();

    const headers = Array.from(
      fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLTableCellElement>,
    ).map((header) => header.textContent?.trim());

    expect(headers).toEqual([
      'Inquilino',
      'Propiedad / unidad',
      'Período',
      'Estado',
      'Monto',
      'Pagado',
      'Saldo',
      'Vencimiento',
      'Acciones',
    ]);

    const cells = fixture.nativeElement.querySelectorAll(
      'tbody tr td',
    ) as NodeListOf<HTMLTableCellElement>;
    expect(cells[3].querySelector('.status-badge')?.textContent?.trim()).toBe('PENDIENTE');
    expect(cells[7].querySelector('time')?.getAttribute('datetime')).toBe('2026-09-05');
  });

  it('keeps the review action hidden until an actual tenant payment is resolved', () => {
    fixture.componentRef.setInput('cuotas', [
      quota({
        estado: 'PARCIAL',
        montoConfirmado: 500,
        saldo: 1500,
        montoPendienteRevision: 500,
      }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pago por revisar');
    expect(fixture.nativeElement.textContent).toContain('PARCIAL');
    expect(fixture.nativeElement.textContent).toContain('Bs 1.500,00');
    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
    const registerAction = fixture.nativeElement.querySelector(
      '[aria-label="Registrar pago de la cuota 101"]',
    ) as HTMLButtonElement;
    expect(registerAction).not.toBeNull();
    expect(registerAction.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 101"]',
      ),
    ).not.toBeNull();
  });

  it('shows an accessible review action for each real pending tenant payment', () => {
    const selectedQuota = quota({ montoPendienteRevision: 750 });
    const selectedPayment = payment({ monto: 500 });
    let emittedSelection: PagoRevisionSeleccion | undefined;
    fixture.componentRef.setInput('cuotas', [selectedQuota]);
    fixture.componentRef.setInput(
      'pagosPendientesRevision',
      new Map([[selectedQuota.codcuo, [selectedPayment]]]),
    );
    fixture.componentInstance.reviewPayment.subscribe(
      (selection) => (emittedSelection = selection),
    );
    fixture.detectChanges();

    const reviewAction = fixture.nativeElement.querySelector(
      '[aria-label="Revisar pago 801 de la cuota 101"]',
    ) as HTMLButtonElement;
    expect(reviewAction).not.toBeNull();
    expect(reviewAction.disabled).toBe(false);
    expect(reviewAction.title).toBe('Revisar pago 801 de la cuota 101');
    expect(fixture.nativeElement.textContent).toContain('Revisar pago Bs 500,00');

    reviewAction.click();

    expect(emittedSelection).toEqual({ cuota: selectedQuota, pago: selectedPayment });
  });

  it('does not expose review actions for resolved payments or owner-origin payments', () => {
    const selectedQuota = quota({ montoPendienteRevision: 500 });
    fixture.componentRef.setInput('cuotas', [selectedQuota]);
    fixture.componentRef.setInput(
      'pagosPendientesRevision',
      new Map([
        [
          selectedQuota.codcuo,
          [
            payment({ estado: 'CONFIRMADO' }),
            payment({ codpag: 802, origenRegistro: 'PROPIETARIA' }),
          ],
        ],
      ]),
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();
  });

  it('emits the selected quota when its payment history action is activated', () => {
    const selectedQuota = quota();
    let emittedQuota: CuotaListado | undefined;
    fixture.componentRef.setInput('cuotas', [selectedQuota]);
    fixture.componentInstance.viewPaymentHistory.subscribe((value) => (emittedQuota = value));
    fixture.detectChanges();

    const historyAction = fixture.nativeElement.querySelector(
      '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 101"]',
    ) as HTMLButtonElement;
    historyAction.click();

    expect(emittedQuota).toBe(selectedQuota);
  });

  it('emits the selected quota when its register payment action is activated', () => {
    const selectedQuota = quota();
    let emittedQuota: CuotaListado | undefined;
    fixture.componentRef.setInput('cuotas', [selectedQuota]);
    fixture.componentInstance.registerPayment.subscribe((value) => (emittedQuota = value));
    fixture.detectChanges();

    const registerAction = fixture.nativeElement.querySelector(
      '[aria-label="Registrar pago de la cuota 101"]',
    ) as HTMLButtonElement;
    registerAction.click();

    expect(emittedQuota).toBe(selectedQuota);
  });

  it('shows only history for a paid quota and indicates that actions belong to a later phase', () => {
    fixture.componentRef.setInput('cuotas', [
      quota({
        estado: 'PAGADA',
        montoConfirmado: 2500,
        saldo: 0,
        situacionVencimiento: 'SIN_SALDO',
      }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label*="Registrar pago"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();
    const historyAction = fixture.nativeElement.querySelector(
      '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 101"]',
    ) as HTMLButtonElement;
    expect(historyAction).not.toBeNull();
    expect(historyAction.disabled).toBe(false);
    expect(historyAction.title).toBe('Ver historial de pagos de Septiembre 2026, cuota 101');
    expect(fixture.nativeElement.querySelector('.due-badge')).toBeNull();
  });

  it('does not offer registration for an annulled quota', () => {
    fixture.componentRef.setInput('cuotas', [quota({ estado: 'ANULADA' })]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[aria-label*="Registrar pago"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ANULADA');
    expect(
      fixture.nativeElement.querySelector(
        '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 101"]',
      ),
    ).not.toBeNull();
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
    codpag: 801,
    codcuo: 101,
    codqr: null,
    monto: 250,
    metodo: 'QR',
    fechaPago: '2026-09-27T10:00:00',
    fechaRegistro: '2026-09-27T10:00:00',
    estado: 'PENDIENTE_REVISION',
    origenRegistro: 'INQUILINO',
    registradoPor: 'inquilino',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}
