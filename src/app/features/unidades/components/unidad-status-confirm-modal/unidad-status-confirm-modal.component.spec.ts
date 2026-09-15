import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { UnidadStatusConfirmModalComponent } from './unidad-status-confirm-modal.component';

describe('UnidadStatusConfirmModalComponent', () => {
  let fixture: ComponentFixture<UnidadStatusConfirmModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadStatusConfirmModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UnidadStatusConfirmModalComponent);
    fixture.componentRef.setInput('operation', 'deactivate');
    fixture.componentRef.setInput('unitName', 'Unidad 101');
    fixture.detectChanges();
  });

  it('renders the deactivation confirmation with accessible dialog metadata', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('unidad-status-title');
    expect(dialog.getAttribute('aria-describedby')).toBe('unidad-status-description');
    expect(fixture.nativeElement.textContent).toContain('Desactivar unidad');
    expect(fixture.nativeElement.textContent).toContain('Unidad 101');
    expect(fixture.nativeElement.textContent).toContain('La unidad dejará de estar operativa.');
    expect(fixture.nativeElement.textContent).toContain('Cancelar');
    expect(fixture.nativeElement.textContent).toContain('Desactivar');
  });

  it('renders the activation variant and backend feedback', () => {
    fixture.componentRef.setInput('operation', 'activate');
    fixture.componentRef.setInput('feedback', 'La unidad no pudo activarse.');
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.classList.contains('operation-activate')).toBe(true);
    expect(dialog.getAttribute('aria-describedby')).toBe(
      'unidad-status-description unidad-status-error',
    );
    expect(fixture.nativeElement.textContent).toContain('Activar unidad');
    expect(fixture.nativeElement.textContent).toContain('La unidad volverá a estar operativa.');
    expect(fixture.nativeElement.textContent).toContain('La unidad no pudo activarse.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('disables both modal actions while the request is submitting', () => {
    fixture.componentRef.setInput('submitting', true);
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons).toHaveLength(2);
    expect(Array.from(buttons).every((button) => button.disabled)).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Desactivando...');
  });
});
