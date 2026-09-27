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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 26, 12));

    const emittedRequests: ContratoRescindRequest[] = [];
    const component = fixture.componentInstance as unknown as { submit: () => void };
    const submitSpy = vi.spyOn(component, 'submit');
    fixture.componentInstance.confirmed.subscribe((request) => emittedRequests.push(request));

    fixture.detectChanges();

    const monthSelect = fixture.nativeElement.querySelector('#rescind-month') as HTMLSelectElement;
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
});
