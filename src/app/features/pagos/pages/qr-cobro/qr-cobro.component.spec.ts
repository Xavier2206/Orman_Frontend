import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { QrCobroResponse } from '../../models/qr-cobro.model';
import { QrCobroComponent } from './qr-cobro.component';

describe('QrCobroComponent', () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<QrCobroComponent>;
  let notification: { success: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notification = { success: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [QrCobroComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows loading before interpreting a 404 as a valid no-current-QR state', () => {
    fixture = startPage();
    expect(fixture.nativeElement.textContent).toContain('Consultando el QR vigente...');
    expect(fixture.nativeElement.textContent).not.toContain('No tienes un QR de cobro vigente.');

    http
      .expectOne('/api/v1/qr-cobro/vigente')
      .flush({ detail: 'No hay QR vigente.' }, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/v1/qr-cobro').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No tienes un QR de cobro vigente.');
    expect(fixture.nativeElement.textContent).toContain('Configurar QR');
    expect(fixture.nativeElement.querySelector('.qr-error-state')).toBeNull();
  });

  it('loads current image as a Blob and renders history without requesting its images', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qr-current');
    fixture = startPage();
    http.expectOne('/api/v1/qr-cobro/vigente').flush(currentQr);

    const imageRequest = http.expectOne('/api/v1/qr-cobro/18/imagen');
    expect(imageRequest.request.responseType).toBe('blob');
    imageRequest.flush(new Blob(['qr'], { type: 'image/png' }));
    http.expectOne('/api/v1/qr-cobro').flush([currentQr, previousQr]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('qr banco.png');
    expect(
      fixture.nativeElement.querySelector('img[alt="QR de cobro vigente"]')?.getAttribute('src'),
    ).toBe('blob:qr-current');
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    expect(createObjectUrl).toHaveBeenCalledOnce();
    http.expectNone('/api/v1/qr-cobro/17/imagen');
  });

  it('keeps current metadata visible after image failure and retries the image request', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qr-retried');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    fixture = startPage();
    http.expectOne('/api/v1/qr-cobro/vigente').flush(currentQr);
    http.expectOne('/api/v1/qr-cobro/18/imagen').error(new ProgressEvent('error'), {
      status: 500,
      statusText: 'Server Error',
    });
    http.expectOne('/api/v1/qr-cobro').flush([currentQr]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('qr banco.png');
    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar la imagen del QR.');
    (fixture.nativeElement.querySelector('.qr-image-error button') as HTMLButtonElement).click();
    fixture.detectChanges();
    http.expectOne('/api/v1/qr-cobro/18/imagen').flush(new Blob(['qr'], { type: 'image/png' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('img[alt="QR de cobro vigente"]')).not.toBeNull();
    expect(createObjectUrl).toHaveBeenCalledOnce();
    fixture.destroy();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:qr-retried');
  });

  it('shows a safe permission error and allows retrying the current QR request', () => {
    fixture = startPage();
    http
      .expectOne('/api/v1/qr-cobro/vigente')
      .flush(
        { detail: 'Error interno.', traceId: 'private-trace' },
        { status: 403, statusText: 'Forbidden' },
      );
    http.expectOne('/api/v1/qr-cobro').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No tienes permisos para administrar este QR.',
    );
    expect(fixture.nativeElement.textContent).not.toContain('private-trace');
    expect(fixture.nativeElement.textContent).not.toContain('Error interno.');
  });

  it('shows and retries a history error independently from the current-QR state', () => {
    fixture = startPage();
    http
      .expectOne('/api/v1/qr-cobro/vigente')
      .flush({ detail: 'No QR vigente.' }, { status: 404, statusText: 'Not Found' });
    http
      .expectOne('/api/v1/qr-cobro')
      .flush(
        { detail: 'No se pudo consultar el historial.', traceId: 'private-trace' },
        { status: 500, statusText: 'Server Error' },
      );
    fixture.detectChanges();

    const historyAlert = fixture.nativeElement.querySelector(
      '.qr-history-section [role="alert"]',
    ) as HTMLElement;
    expect(historyAlert.textContent).toContain('No fue posible cargar el historial de QR.');
    expect(historyAlert.textContent).not.toContain('private-trace');

    (
      fixture.nativeElement.querySelector('.qr-history-heading button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    http.expectOne('/api/v1/qr-cobro').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay QR registrados.');
    expect(fixture.nativeElement.querySelector('.qr-history-section [role="alert"]')).toBeNull();
  });

  it('opens the reusable configuration modal without calling the API', () => {
    fixture = startPage();
    http
      .expectOne('/api/v1/qr-cobro/vigente')
      .flush({ detail: 'No QR vigente.' }, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/v1/qr-cobro').flush([]);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('.qr-empty-state .qr-primary-button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    http.expectNone('/api/v1/qr-cobro');
  });

  it('refreshes the current QR and history after the configuration succeeds', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:created-qr');
    fixture = startPage();
    http
      .expectOne('/api/v1/qr-cobro/vigente')
      .flush({ detail: 'No QR vigente.' }, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/v1/qr-cobro').flush([]);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.qr-empty-state .qr-primary-button') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const imageInput = fixture.nativeElement.querySelector('#qr-image') as HTMLInputElement;
    Object.defineProperty(imageInput, 'files', {
      configurable: true,
      value: [new File(['qr'], 'nuevo.png', { type: 'image/png' })],
    });
    imageInput.dispatchEvent(new Event('change', { bubbles: true }));
    const startDate = fixture.nativeElement.querySelector('#qr-start-date') as HTMLInputElement;
    startDate.value = '2026-09-26';
    startDate.dispatchEvent(new Event('input', { bubbles: true }));
    const endDate = fixture.nativeElement.querySelector('#qr-end-date') as HTMLInputElement;
    endDate.value = '2027-09-26';
    endDate.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    http.expectOne('/api/v1/qr-cobro').flush(currentQr);
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('QR de cobro configurado correctamente.');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    http.expectOne('/api/v1/qr-cobro/vigente').flush(currentQr);
    http.expectOne('/api/v1/qr-cobro/18/imagen').flush(new Blob(['qr'], { type: 'image/png' }));
    http.expectOne('/api/v1/qr-cobro').flush([currentQr]);
  });

  function startPage(): ComponentFixture<QrCobroComponent> {
    const pageFixture = TestBed.createComponent(QrCobroComponent);
    pageFixture.detectChanges();
    return pageFixture;
  }
});

const currentQr: QrCobroResponse = {
  codqr: 18,
  fechaInicio: '2026-09-26',
  fechaFin: '2027-09-26',
  estado: 'ACTIVO',
  tieneImagen: true,
  nombreArchivo: 'qr banco.png',
  tipoContenido: 'image/png',
  fechaRegistro: '2026-09-26T12:30:00',
};

const previousQr: QrCobroResponse = {
  codqr: 17,
  fechaInicio: '2025-09-26',
  fechaFin: '2026-09-25',
  estado: 'INACTIVO',
  tieneImagen: true,
  nombreArchivo: 'qr anterior.jpg',
  tipoContenido: 'image/jpeg',
  fechaRegistro: '2025-09-25T12:30:00',
};
