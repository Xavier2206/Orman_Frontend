import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CuotaResponse } from '../../models/contrato.model';
import { ContratoCuotasPanelComponent } from './contrato-cuotas-panel.component';

describe('ContratoCuotasPanelComponent', () => {
  let fixture: ComponentFixture<ContratoCuotasPanelComponent>;

  const paidInstallment: CuotaResponse = {
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

  const pendingInstallment: CuotaResponse = {
    ...paidInstallment,
    codcuo: 2,
    estado: 'PENDIENTE',
    montoConfirmado: 0,
    saldo: 2500,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoCuotasPanelComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ContratoCuotasPanelComponent);
  });

  afterEach(() => fixture.destroy());

  it('shows the correct actions for paid and pending installments', () => {
    fixture.componentRef.setInput('installments', [paidInstallment, pendingInstallment]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('PAGADA');
    expect(fixture.nativeElement.textContent).toContain('PENDIENTE');
    expect(fixture.nativeElement.querySelectorAll('.installment-action')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.installment-action-disabled')).toHaveLength(1);
  });

  it('emits the selected installment when viewing payments', () => {
    let selected: CuotaResponse | undefined;
    fixture.componentInstance.viewPayments.subscribe((installment) => (selected = installment));
    fixture.componentRef.setInput('installments', [paidInstallment]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.installment-action') as HTMLButtonElement).click();

    expect(selected).toEqual(paidInstallment);
  });
});
