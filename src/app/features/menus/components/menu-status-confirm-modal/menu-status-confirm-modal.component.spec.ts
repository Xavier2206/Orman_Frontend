import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { MenuStatusConfirmModalComponent } from './menu-status-confirm-modal.component';

describe('MenuStatusConfirmModalComponent', () => {
  let fixture: ComponentFixture<MenuStatusConfirmModalComponent>;
  const menu = {
    codm: 2,
    nombre: 'REPORTES',
    icono: 'assessment',
    estado: 1 as 0 | 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuStatusConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MenuStatusConfirmModalComponent);
    fixture.componentRef.setInput('menu', menu);
  });

  it('renders the deactivate confirmation with the approved message and icon', () => {
    fixture.componentRef.setInput('operation', 'deactivate');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Desactivar Menú');
    expect(fixture.nativeElement.textContent).toContain('REPORTES');
    expect(fixture.nativeElement.textContent).toContain('asignaciones existentes con Roles y Procesos');
    expect(fixture.nativeElement.textContent).not.toContain('Eliminar Menú');
    const icons = fixture.nativeElement.querySelectorAll('mat-icon') as NodeListOf<Element>;
    expect(Array.from(icons).map((icon) => icon.textContent?.trim())).toEqual([
      'delete_outline',
      'delete_outline',
    ]);
  });

  it('renders the reactivate confirmation and ProblemDetail feedback', () => {
    fixture.componentRef.setInput('operation', 'activate');
    fixture.componentRef.setInput('feedback', 'El Menú ya se encuentra activo.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Reactivar Menú');
    const icons = fixture.nativeElement.querySelectorAll('mat-icon') as NodeListOf<Element>;
    expect(Array.from(icons).map((icon) => icon.textContent?.trim())).toEqual([
      'restore',
      'restore',
    ]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'El Menú ya se encuentra activo.',
    );
  });

  it('emits confirmation and prevents closing while submitting', () => {
    fixture.componentRef.setInput('operation', 'deactivate');
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();
    const confirmed = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentInstance.closed.subscribe(closed);

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    buttons[0].click();
    buttons[1].click();

    expect(closed).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
  });
});
