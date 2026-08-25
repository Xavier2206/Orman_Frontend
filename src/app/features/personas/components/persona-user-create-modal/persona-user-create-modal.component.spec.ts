import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaUserCreateModalComponent } from './persona-user-create-modal.component';
describe('PersonaUserCreateModalComponent', () => {
  let f: ComponentFixture<PersonaUserCreateModalComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaUserCreateModalComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaUserCreateModalComponent);
  });
  it('renders login input', () => {
    f.detectChanges();
    expect(f.nativeElement.querySelector('[formControlName="login"]')).toBeTruthy();
  });
  it('rejects mismatched passwords', () => {
    const c = f.componentInstance as never as {
      form: { setValue(v: unknown): void };
      submit(): void;
      mismatch: boolean;
    };
    c.form.setValue({ login: 'ana', password: 'password-1', confirmation: 'otherpass' });
    c.submit();
    expect(c.mismatch).toBe(true);
  });
});
