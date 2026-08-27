import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PersonaPhotoFieldComponent } from './persona-photo-field.component';

type PhotoFieldHarness = {
  fileSelected: { subscribe(callback: (file: File | null) => void): void };
  validationError: { subscribe(callback: (message: string) => void): void };
  select(event: Event): void;
};

describe('PersonaPhotoFieldComponent', () => {
  let fixture: ComponentFixture<PersonaPhotoFieldComponent>;
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createObjectUrl = vi.fn(() => 'blob:persona-preview');
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });

    await TestBed.configureTestingModule({
      imports: [PersonaPhotoFieldComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PersonaPhotoFieldComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function component(): PhotoFieldHarness {
    return fixture.componentInstance as never as PhotoFieldHarness;
  }

  function select(file: File): void {
    component().select({ target: { files: [file] } } as unknown as Event);
  }

  it('renders initials when there is no image', () => {
    fixture.componentRef.setInput('initials', 'AP');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('AP');
  });

  it('accepts a JPEG file and generates a preview', () => {
    let selected: File | null = null;
    component().fileSelected.subscribe((file) => (selected = file));
    const file = new File(['jpeg'], 'persona.jpg', { type: 'image/jpeg' });

    select(file);
    fixture.detectChanges();

    expect(selected).toBe(file);
    expect(createObjectUrl).toHaveBeenCalledWith(file);
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toBe(
      'blob:persona-preview',
    );
    expect(fixture.nativeElement.textContent).toContain('Fotografía lista para guardar.');
  });

  it('accepts a PNG file', () => {
    let selected: File | null = null;
    component().fileSelected.subscribe((file) => (selected = file));
    const file = new File(['png'], 'persona.png', { type: 'image/png' });

    select(file);

    expect(selected).toBe(file);
  });

  it('rejects an unsupported MIME type with the inline message', () => {
    let error = '';
    component().validationError.subscribe((message) => (error = message));

    select(new File(['x'], 'persona.gif', { type: 'image/gif' }));

    expect(error).toBe('La fotografía debe ser JPG o PNG.');
  });

  it('rejects a file larger than 2 MiB', () => {
    let error = '';
    component().validationError.subscribe((message) => (error = message));

    select(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'persona.jpg', { type: 'image/jpeg' }));

    expect(error).toBe('La fotografía no puede superar 2 MB.');
  });

  it('revokes an object URL when a selected photo is removed', () => {
    select(new File(['jpeg'], 'persona.jpg', { type: 'image/jpeg' }));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.remove').click();

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:persona-preview');
  });
});
