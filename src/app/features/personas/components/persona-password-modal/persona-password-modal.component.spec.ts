import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaPasswordModalComponent } from './persona-password-modal.component';
describe('PersonaPasswordModalComponent', () => {
  let f: ComponentFixture<PersonaPasswordModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaPasswordModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaPasswordModalComponent);
    f.componentRef.setInput('login', 'ana');
  });
  it('shows login reference', () => {
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('ana');
  });
  it('emits a valid password', () => {
    const c = f.componentInstance as never as {
      form: { setValue(v: unknown): void };
      submitted: { subscribe(v: (e: { newPassword: string }) => void): void };
      submit(): void;
    };
    c.form.setValue({ password: 'password-1', confirmation: 'password-1' });
    let value = '';
    c.submitted.subscribe((e) => (value = e.newPassword));
    c.submit();
    expect(value).toBe('password-1');
  });
});
