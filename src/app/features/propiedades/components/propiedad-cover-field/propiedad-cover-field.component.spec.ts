import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { PropiedadCoverFieldComponent } from './propiedad-cover-field.component';

describe('PropiedadCoverFieldComponent', () => {
  let fixture: ComponentFixture<PropiedadCoverFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadCoverFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PropiedadCoverFieldComponent);
    fixture.detectChanges();
  });

  it('renders a placeholder when no cover is available', () => {
    const field = fixture.nativeElement as HTMLElement;

    expect(field.textContent).toContain('Portada de la propiedad');
    expect(field.textContent).toContain('Portada no disponible');
    expect(field.textContent).toContain('Sin portada');
    expect(field.querySelector('img')).toBeNull();
  });

  it('emits a valid JPG or PNG file and clears the native input value', () => {
    const fileSelected = vi.fn();
    fixture.componentInstance.fileSelected.subscribe(fileSelected);
    const file = new File(['cover'], 'portada.jpg', { type: 'image/jpeg' });
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change'));

    expect(fileSelected).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
  });

  it('rejects unsupported formats and files larger than 5 MiB', () => {
    const validationError = vi.fn();
    fixture.componentInstance.validationError.subscribe(validationError);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const pdf = new File(['document'], 'documento.pdf', { type: 'application/pdf' });
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'portada.png', {
      type: 'image/png',
    });

    Object.defineProperty(input, 'files', { configurable: true, value: [pdf] });
    input.dispatchEvent(new Event('change'));
    Object.defineProperty(input, 'files', { configurable: true, value: [oversized] });
    input.dispatchEvent(new Event('change'));

    expect(validationError).toHaveBeenNthCalledWith(1, 'La portada debe ser JPG o PNG.');
    expect(validationError).toHaveBeenNthCalledWith(2, 'La portada no puede superar 5 MiB.');
  });

  it('emits the removal intent only when a cover can be removed', () => {
    const removeRequested = vi.fn();
    fixture.componentInstance.removeRequested.subscribe(removeRequested);

    fixture.nativeElement.querySelector('.cover-remove-button')?.click();
    expect(removeRequested).not.toHaveBeenCalled();

    fixture.componentRef.setInput('canRemove', true);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.cover-remove-button') as HTMLButtonElement).click();

    expect(removeRequested).toHaveBeenCalledOnce();
  });
});
