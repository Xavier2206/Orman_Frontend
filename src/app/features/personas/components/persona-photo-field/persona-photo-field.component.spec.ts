import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PersonaPhotoFieldComponent } from './persona-photo-field.component';
describe('PersonaPhotoFieldComponent', () => {
  let f: ComponentFixture<PersonaPhotoFieldComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonaPhotoFieldComponent],
    }).compileComponents();
    f = TestBed.createComponent(PersonaPhotoFieldComponent);
  });
  it('renders initials when there is no image', () => {
    f.componentRef.setInput('initials', 'AP');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('AP');
  });
  it('rejects a non-image file', () => {
    const c = f.componentInstance as never as {
      validationError: { subscribe(v: (m: string) => void): void };
      select(e: Event): void;
    };
    let error = '';
    c.validationError.subscribe((m) => (error = m));
    c.select({
      target: { files: [new File(['x'], 'x.txt', { type: 'text/plain' })] },
    } as unknown as Event);
    expect(error).toContain('JPEG');
  });
});
