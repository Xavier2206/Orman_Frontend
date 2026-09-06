import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaStatusConfirmModalComponent } from './persona-status-confirm-modal.component';
describe('PersonaStatusConfirmModalComponent', () => {
  let f: ComponentFixture<PersonaStatusConfirmModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaStatusConfirmModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaStatusConfirmModalComponent);
    f.componentRef.setInput('personaName', 'Ana Paz');
  });
  it('shows deactivate text', () => {
    f.componentRef.setInput('operation', 'deactivate');
    f.detectChanges();

    expect(f.nativeElement.textContent).toContain('Dar de baja');
    expect(f.nativeElement.textContent).toContain('Ana Paz');
    expect(f.nativeElement.textContent).toContain(
      'La persona pasará a estado inactivo. Sus datos permanecerán registrados en el sistema y podrá ser reactivada cuando sea necesario.',
    );
    expect(f.nativeElement.querySelector('mat-icon')?.textContent).toContain('person_off');
  });
  it('shows activate text', () => {
    f.componentRef.setInput('operation', 'activate');
    f.detectChanges();

    expect(f.nativeElement.textContent).toContain('Reactivar');
    expect(f.nativeElement.textContent).toContain('Ana Paz');
    expect(f.nativeElement.textContent).toContain(
      'La persona volverá a estado activo y podrá continuar siendo gestionada normalmente en el sistema.',
    );
    expect(f.nativeElement.querySelector('mat-icon')?.textContent).toContain('restore');
  });
  it('exposes the confirmation message to assistive technology', () => {
    f.componentRef.setInput('operation', 'deactivate');
    f.detectChanges();

    const dialog = f.nativeElement.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialog.getAttribute('aria-describedby')).toBe('persona-status-description');
    expect(dialog.getAttribute('aria-busy')).toBe('false');
  });
  it('exposes backend feedback as an accessible alert', () => {
    f.componentRef.setInput('operation', 'deactivate');
    f.componentRef.setInput('feedback', 'La Persona no puede ser desactivada.');
    f.detectChanges();

    const dialog = f.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const alert = f.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('La Persona no puede ser desactivada.');
    expect(dialog.getAttribute('aria-describedby')).toBe(
      'persona-status-description persona-status-error',
    );
  });
  it('shows the contextual submitting label and disables both actions', () => {
    f.componentRef.setInput('operation', 'activate');
    f.componentRef.setInput('submitting', true);
    f.detectChanges();

    const buttons = f.nativeElement.querySelectorAll('button');

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
    expect(f.nativeElement.textContent).toContain('Reactivando...');
    expect(f.nativeElement.querySelector('[role="dialog"]')?.getAttribute('aria-busy')).toBe('true');
  });
});
