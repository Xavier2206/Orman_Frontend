import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaStatusConfirmModalComponent } from './persona-status-confirm-modal.component';
describe('PersonaStatusConfirmModalComponent', () => {
  let f: ComponentFixture<PersonaStatusConfirmModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaStatusConfirmModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaStatusConfirmModalComponent);
  });
  it('shows deactivate text', () => {
    f.componentRef.setInput('operation', 'deactivate');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Dar de baja');
  });
  it('shows activate text', () => {
    f.componentRef.setInput('operation', 'activate');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Reactivar');
  });
});
