import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { UnidadFotoResponse } from '../../models/fotografia.model';
import { UnidadFotosManagerComponent } from './unidad-fotos-manager.component';

describe('UnidadFotosManagerComponent', () => {
  let fixture: ComponentFixture<UnidadFotosManagerComponent>;
  let http: HttpTestingController;
  const notification = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadFotosManagerComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UnidadFotosManagerComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function selectFile(file: File): void {
    const input = fixture.nativeElement.querySelector('#unit-photo-add-input') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('rejects unsupported formats and files over 5 MiB before HTTP', () => {
    selectFile(new File(['webp'], 'sala.webp', { type: 'image/webp' }));
    expect(fixture.nativeElement.textContent).toContain('La fotografía debe ser JPG o PNG.');

    selectFile(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.jpg', { type: 'image/jpeg' }),
    );
    expect(fixture.nativeElement.textContent).toContain('La fotografía no puede superar 5 MiB.');
    expect(http.match(() => true)).toHaveLength(0);
  });

  it('loads existing photos in edit mode and keeps the cover action independent', () => {
    fixture.componentRef.setInput('coduni', 145);
    fixture.componentRef.setInput('editMode', true);
    fixture.detectChanges();

    const photo: UnidadFotoResponse = {
      id: 30,
      coduni: 145,
      url: 'https://example.test/sala.jpg',
      titulo: 'Sala',
      ambiente: 'Sala',
      orden: 0,
      portada: false,
      tieneArchivo: false,
    };
    http.expectOne('/api/v1/unidades/145/fotos').flush([photo]);
    fixture.detectChanges();

    const coverButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Portada')) as HTMLButtonElement;
    coverButton.click();
    const coverRequest = http.expectOne('/api/v1/unidades/145/fotos/30/portada');
    expect(coverRequest.request.method).toBe('PATCH');
    coverRequest.flush({ ...photo, portada: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sala');
    expect(notification.success).toHaveBeenCalledWith('Portada de la unidad actualizada.');
  });

  it('revokes pending object URLs when the manager is destroyed', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    selectFile(new File(['jpeg'], 'sala.jpg', { type: 'image/jpeg' }));
    fixture.destroy();

    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:pending');
    createObjectUrl.mockRestore();
    revokeObjectUrl.mockRestore();
  });
});
