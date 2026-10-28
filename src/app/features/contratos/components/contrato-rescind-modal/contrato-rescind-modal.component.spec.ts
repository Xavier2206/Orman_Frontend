import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Contrato, ContratoRescindRequest, CuotaResponse } from '../../models/contrato.model';
import { ContratoRescindModalComponent } from './contrato-rescind-modal.component';

describe('ContratoRescindModalComponent', () => {
  let fixture: ComponentFixture<ContratoRescindModalComponent>;

  const contract: Contrato = {
    codcon: 1481,
    coduni: 25,
    codperInquilino: 31,
    fechaInicio: '2026-01-01',
    fechaFin: '2027-01-01',
    montoMensual: 1500,
    moneda: 'BOB',
    garantia: 1500,
    estado: 'VIGENTE',
    fechaRegistro: '2025-12-15T10:00:00',
    fechaRescision: null,
    motivoRescision: null,
    inquilino: {
      codper: 31,
      nombreCompleto: 'Juan Pérez',
      ci: '1234567',
    },
    propiedad: {
      codprop: 10,
      nombre: 'Edificio Central',
    },
    unidad: {
      coduni: 25,
      nombre: 'Departamento 1A',
      tipoUnidad: 'DEPARTAMENTO',
      descripcion: null,
      piso: 1,
    },
    cuotas: {
      totalCuotas: 12,
      cuotasPagadas: 8,
      cuotasPendientes: 4,
      saldoPendiente: 6000,
    },
  };

  const installments: readonly CuotaResponse[] = Array.from({ length: 9 }, (_, index) => {
    const month = String(index + 1).padStart(2, '0');
    const period = '2026-' + month;

    return {
      codcuo: 3001 + index,
      codcon: 1481,
      periodo: period,
      fechaVencimiento: period + '-01',
      monto: 1500,
      montoConfirmado: 1500,
      saldo: 0,
      montoPendienteRevision: 0,
      estado: 'PAGADA',
    } satisfies CuotaResponse;
  });

  function quota(period: string, overrides: Partial<CuotaResponse> = {}): CuotaResponse {
    return {
      codcuo: Number(period.slice(5, 7)),
      codcon: 1481,
      periodo: period,
      fechaVencimiento: `${period}-01`,
      monto: 1500,
      montoConfirmado: 1500,
      saldo: 0,
      montoPendienteRevision: 0,
      estado: 'PAGADA',
      ...overrides,
    };
  }

  function selectMonth(value: string): HTMLSelectElement {
    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;
    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    return select;
  }

  function enterReason(): void {
    const reason = fixture.nativeElement.querySelector('#rescind-reason') as HTMLTextAreaElement;
    reason.value = 'Rescisión solicitada';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function setCurrentDate(year: number, month: number): void {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(year, month - 1, 26, 12));
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoRescindModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ContratoRescindModalComponent);
    fixture.componentRef.setInput('contract', contract);
    fixture.componentRef.setInput('installments', installments);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits the trimmed request once from a real submit-button click without native navigation', () => {
    setCurrentDate(2026, 9);

    const emittedRequests: ContratoRescindRequest[] = [];
    const component = fixture.componentInstance as unknown as { submit: () => void };
    const submitSpy = vi.spyOn(component, 'submit');
    fixture.componentInstance.confirmed.subscribe((request) => emittedRequests.push(request));

    fixture.detectChanges();

    const monthSelect = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;
    expect(monthSelect.value).toBe('');
    monthSelect.value = '2026-09';
    monthSelect.dispatchEvent(new Event('change'));

    const reason = fixture.nativeElement.querySelector('#rescind-reason') as HTMLTextAreaElement;
    reason.value = '  Rescisión prevista para prueba funcional  ';
    reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    let nativeSubmitPrevented = false;
    form.addEventListener('submit', (event) => {
      nativeSubmitPrevented = event.defaultPrevented;
    });

    const submitButton = fixture.nativeElement.querySelector(
      '.action-modal-submit',
    ) as HTMLButtonElement;
    expect(submitButton.type).toBe('submit');
    expect(submitButton.disabled).toBe(false);

    submitButton.click();

    expect(submitSpy).toHaveBeenCalledTimes(1);
    expect(nativeSubmitPrevented).toBe(true);
    expect(emittedRequests).toEqual([
      {
        fechaRescision: '2026-09-01',
        motivoRescision: 'Rescisión prevista para prueba funcional',
      },
    ]);
  });

  it('bloquea los meses anteriores al último período con pago confirmado', () => {
    setCurrentDate(2026, 12);
    fixture.componentRef.setInput(
      'installments',
      ['2026-08', '2026-09', '2026-10', '2026-11'].map((period) => quota(period)),
    );
    fixture.detectChanges();

    const options = Array.from(
      (fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement).options,
    );

    expect(options.find((option) => option.value === '2026-10')?.disabled).toBe(true);
    expect(options.find((option) => option.value === '2026-09')?.disabled).toBe(true);
    expect(options.find((option) => option.value === '2026-11')?.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Noviembre de 2026');
    expect(fixture.nativeElement.textContent).toContain('Bs 1.500,00');
  });

  it('permite octubre cuando es el último mes pagado y bloquea septiembre', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput(
      'installments',
      Array.from({ length: 10 }, (_, index) => quota(`2026-${String(index + 1).padStart(2, '0')}`)),
    );
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;
    const september = Array.from(select.options).find((option) => option.value === '2026-09');
    const october = Array.from(select.options).find((option) => option.value === '2026-10');

    expect(september?.disabled).toBe(true);
    expect(october?.disabled).toBe(false);

    selectMonth('2026-10');
    enterReason();

    expect(
      (fixture.nativeElement.querySelector('.action-modal-submit') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('bloquea cortes anteriores a una cuota parcial y no permite confirmar el saldo de esa cuota', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput('installments', [
      ...Array.from({ length: 9 }, (_, index) =>
        quota(`2026-${String(index + 1).padStart(2, '0')}`),
      ),
      quota('2026-10', {
        montoConfirmado: 500,
        saldo: 1000,
        estado: 'PARCIAL',
      }),
    ]);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;
    expect(Array.from(select.options).find((option) => option.value === '2026-09')?.disabled).toBe(
      true,
    );

    selectMonth('2026-10');
    enterReason();

    expect(fixture.nativeElement.textContent).toContain('Existe saldo pendiente en una cuota.');
    expect(
      (fixture.nativeElement.querySelector('.action-modal-submit') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('no bloquea por cuotas sin importe confirmado, aunque estén pendientes o anuladas', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput('installments', [
      quota('2026-09', { montoConfirmado: 0, saldo: 1500, estado: 'PENDIENTE' }),
      quota('2026-10', { montoConfirmado: 0, saldo: 0, estado: 'ANULADA' }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Último período con dinero confirmado');
    expect(
      Array.from(
        (fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement).options,
      ).find((option) => option.value === '2026-09')?.disabled,
    ).toBe(false);
  });

  it('bloquea la confirmación por un pago pendiente de revisión posterior al corte', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput('installments', [
      ...Array.from({ length: 9 }, (_, index) =>
        quota(`2026-${String(index + 1).padStart(2, '0')}`),
      ),
      quota('2026-10', {
        montoConfirmado: 0,
        montoPendienteRevision: 500,
        saldo: 1500,
        estado: 'PENDIENTE',
      }),
    ]);
    fixture.detectChanges();

    selectMonth('2026-09');
    enterReason();

    expect(fixture.nativeElement.textContent).toContain(
      'Existe un pago pendiente de revisión en el contrato.',
    );
    expect(
      (fixture.nativeElement.querySelector('.action-modal-submit') as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it('no habilita meses futuros y explica cuando el último período confirmado supera los cortes permitidos', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput('installments', [quota('2026-12')]);
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;

    expect(select.disabled).toBe(true);
    expect(Array.from(select.options).some((option) => option.value === '2026-11')).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Diciembre de 2026');
    expect(fixture.nativeElement.textContent).toContain('no existe un corte permitido');
  });

  it('excluye el mes cuyo primer día coincide con fechaFin', () => {
    setCurrentDate(2027, 1);
    fixture.componentRef.setInput('contract', { ...contract, fechaFin: '2027-01-01' });
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;

    expect(Array.from(select.options).some((option) => option.value === '2027-01')).toBe(false);
    expect(Array.from(select.options).some((option) => option.value === '2026-12')).toBe(true);
  });

  it('excluye un mes si su primer día queda antes del inicio del contrato', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput('contract', {
      ...contract,
      fechaInicio: '2026-09-15',
    });
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;

    expect(Array.from(select.options).some((option) => option.value === '2026-09')).toBe(false);
    expect(Array.from(select.options).some((option) => option.value === '2026-10')).toBe(true);
  });

  it('permite confirmar si no hay pagos posteriores y todas las cuotas hasta el corte están pagadas', () => {
    setCurrentDate(2026, 9);
    fixture.componentRef.setInput('installments', installments);
    fixture.detectChanges();

    selectMonth('2026-09');
    enterReason();

    expect(
      (fixture.nativeElement.querySelector('.action-modal-submit') as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it('no presenta cálculos ni advertencias de corte antes de elegir un mes', () => {
    setCurrentDate(2026, 9);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Selecciona el último mes a cobrar para calcular qué cuotas se exigirán y cuáles se anularán.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('Existe saldo pendiente en una cuota.');
    expect(fixture.nativeElement.textContent).not.toContain(
      'Hay dinero confirmado en un período posterior al corte.',
    );
  });

  it('limpia y explica una selección que queda bloqueada tras actualizar las cuotas', () => {
    setCurrentDate(2026, 10);
    fixture.componentRef.setInput(
      'installments',
      Array.from({ length: 9 }, (_, index) => quota(`2026-${String(index + 1).padStart(2, '0')}`)),
    );
    fixture.detectChanges();

    const select = selectMonth('2026-09');
    enterReason();
    fixture.componentRef.setInput('installments', [
      ...Array.from({ length: 9 }, (_, index) =>
        quota(`2026-${String(index + 1).padStart(2, '0')}`),
      ),
      quota('2026-10'),
    ]);
    fixture.detectChanges();

    expect(select.value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Se limpió el último mes a cobrar');
    expect(fixture.nativeElement.querySelector('#rescind-reason').value).toBe(
      'Rescisión solicitada',
    );
  });
});
