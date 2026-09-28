import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { QrCobroResponse } from '../../models/qr-cobro.model';
import { QrCobroConfigModalComponent } from './qr-cobro-config-modal.component';

describe('QrCobroConfigModalComponent', () => {
  let http: HttpTestingController;
  let createObjectUrl: ReturnType<typeof vi.spyOn>;
  let revokeObjectUrl: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qr-preview');
    revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [QrCobroConfigModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('requires an image and both dates before making a request', () => {
    const fixture = createModal();
    submit(fixture);

    expect(fixture.nativeElement.textContent).toContain('Selecciona la imagen del QR.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona la fecha de inicio.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona la fecha de vencimiento.');
    http.expectNone('/api/v1/qr-cobro');
  });

  it('rejects an end date before the start date', () => {
    const fixture = createModal();
    fillDates(fixture, '2026-09-27', '2026-09-26');
    chooseImage(fixture, new File(['qr'], 'qr.png', { type: 'image/png' }));
    submit(fixture);

    expect(fixture.nativeElement.textContent).toContain(
      'La fecha de vencimiento no puede ser anterior a la fecha de inicio.',
    );
    http.expectNone('/api/v1/qr-cobro');
  });

  it('accepts the same start and end dates', () => {
    const fixture = createModal();
    fillDates(fixture, '2026-09-26', '2026-09-26');
    chooseImage(fixture, new File(['qr'], 'qr.png', { type: 'image/png' }));
    submit(fixture);

    const request = http.expectOne('/api/v1/qr-cobro');
    expect(request.request.method).toBe('POST');
    request.flush(qrResponse);
    fixture.destroy();
  });

  it('rejects unsupported extension or MIME type', () => {
    const fixture = createModal();
    chooseImage(fixture, new File(['qr'], 'qr.svg', { type: 'image/svg+xml' }));

    expect(fixture.nativeElement.textContent).toContain('Selecciona un archivo PNG o JPG/JPEG.');

    chooseImage(fixture, new File(['qr'], 'qr.png', { type: 'image/svg+xml' }));

    expect(fixture.nativeElement.textContent).toContain('Selecciona un archivo PNG o JPG/JPEG.');
    http.expectNone('/api/v1/qr-cobro');
  });

  it('rejects an image larger than 5 MiB', () => {
    const fixture = createModal();
    const contents = new Uint8Array(5 * 1024 * 1024 + 1);
    chooseImage(fixture, new File([contents], 'qr.png', { type: 'image/png' }));

    expect(fixture.nativeElement.textContent).toContain('La imagen debe pesar como máximo 5 MiB.');
    expect(fixture.nativeElement.querySelector('.qr-preview')).toBeNull();
    http.expectNone('/api/v1/qr-cobro');
  });

  it('creates the first QR with multipart fields and keeps the modal busy until the response', () => {
    const fixture = createModal();
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fillDates(fixture, '2026-09-26', '2027-09-26');
    chooseImage(fixture, new File(['qr'], 'qr banco.PNG', { type: 'image/png' }));
    submit(fixture);

    const request = http.expectOne('/api/v1/qr-cobro');
    expect(request.request.method).toBe('POST');
    expect(request.request.body.get('imagen')).toBeInstanceOf(File);
    const metadata = request.request.body.get('qr') as Blob;
    expect(metadata.type).toBe('application/json');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').textContent).toContain(
      'Guardando...',
    );
    expect(fixture.nativeElement.querySelector('#qr-start-date').disabled).toBe(true);
    expect(saved).not.toHaveBeenCalled();
    submit(fixture);
    http.expectNone('/api/v1/qr-cobro');

    request.flush(qrResponse);
    fixture.detectChanges();

    expect(saved).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:qr-preview');
  });

  it('keeps the selected image and shows a useful backend detail after a failed create', () => {
    const fixture = createModal();
    fillDates(fixture, '2026-09-26', '2027-09-26');
    chooseImage(fixture, new File(['qr'], 'qr banco.png', { type: 'image/png' }));
    submit(fixture);

    http
      .expectOne('/api/v1/qr-cobro')
      .flush(
        { detail: 'Las fechas de vigencia se solapan.' },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Las fechas de vigencia se solapan.');
    expect(fixture.nativeElement.textContent).toContain('qr banco.png');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('deactivates the old QR before creating its replacement', () => {
    const fixture = createModal(currentQr);
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);
    fillDates(fixture, '2027-09-27', '2028-09-26');
    chooseImage(fixture, new File(['new qr'], 'nuevo qr.jpg', { type: 'image/jpeg' }));
    submit(fixture);

    const deactivate = http.expectOne('/api/v1/qr-cobro/18/estado');
    expect(deactivate.request.method).toBe('PATCH');
    expect(deactivate.request.body).toEqual({ estado: 'INACTIVO' });
    deactivate.flush({ ...qrResponse, estado: 'INACTIVO' });

    const create = http.expectOne('/api/v1/qr-cobro');
    expect(create.request.method).toBe('POST');
    create.flush({ ...qrResponse, codqr: 19, nombreArchivo: 'nuevo qr.jpg' });
    fixture.detectChanges();

    expect(saved).toHaveBeenCalledOnce();
    http.expectNone('/api/v1/qr-cobro/18/estado');
  });

  it('reactivates the old QR when creating its replacement fails', () => {
    const fixture = createModal(currentQr);
    fillDates(fixture, '2027-09-27', '2028-09-26');
    chooseImage(fixture, new File(['new qr'], 'nuevo.png', { type: 'image/png' }));
    submit(fixture);

    http.expectOne('/api/v1/qr-cobro/18/estado').flush({ ...qrResponse, estado: 'INACTIVO' });
    http
      .expectOne('/api/v1/qr-cobro')
      .flush(
        { detail: 'La imagen no pudo validarse.' },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    const reactivate = http.expectOne('/api/v1/qr-cobro/18/estado');
    expect(reactivate.request.body).toEqual({ estado: 'ACTIVO' });
    reactivate.flush(qrResponse);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La imagen no pudo validarse.');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('shows a clear recovery failure when it cannot restore the old QR', () => {
    const fixture = createModal(currentQr);
    const recoveryFailed = vi.fn();
    fixture.componentInstance.recoveryFailed.subscribe(recoveryFailed);
    fillDates(fixture, '2027-09-27', '2028-09-26');
    chooseImage(fixture, new File(['new qr'], 'nuevo.png', { type: 'image/png' }));
    submit(fixture);

    http.expectOne('/api/v1/qr-cobro/18/estado').flush({ ...qrResponse, estado: 'INACTIVO' });
    http
      .expectOne('/api/v1/qr-cobro')
      .flush(
        { detail: 'Fallo de validación.' },
        { status: 422, statusText: 'Unprocessable Content' },
      );
    http
      .expectOne('/api/v1/qr-cobro/18/estado')
      .flush({ detail: 'QR no disponible.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(recoveryFailed).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible guardar el nuevo QR ni restaurar automáticamente el QR anterior.',
    );
  });

  it('does not call the API when canceled and releases a replaced preview', () => {
    const fixture = createModal();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    chooseImage(fixture, new File(['first'], 'uno.png', { type: 'image/png' }));
    chooseImage(fixture, new File(['second'], 'dos.png', { type: 'image/png' }));

    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:qr-preview');
    (fixture.nativeElement.querySelector('.qr-cancel-button') as HTMLButtonElement).click();

    expect(closed).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledTimes(2);
    http.expectNone('/api/v1/qr-cobro');
  });

  function createModal(
    qr: QrCobroResponse | null = null,
  ): ComponentFixture<QrCobroConfigModalComponent> {
    const fixture = TestBed.createComponent(QrCobroConfigModalComponent);

    if (qr) {
      fixture.componentRef.setInput('currentQr', qr);
    }

    fixture.detectChanges();
    return fixture;
  }

  function fillDates(
    fixture: ComponentFixture<QrCobroConfigModalComponent>,
    startDate: string,
    endDate: string,
  ): void {
    setInputValue(fixture, '#qr-start-date', startDate);
    setInputValue(fixture, '#qr-end-date', endDate);
  }

  function setInputValue(
    fixture: ComponentFixture<QrCobroConfigModalComponent>,
    selector: string,
    value: string,
  ): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
  }

  function chooseImage(fixture: ComponentFixture<QrCobroConfigModalComponent>, file: File): void {
    const input = fixture.nativeElement.querySelector('#qr-image') as HTMLInputElement;
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });
    input.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
  }

  function submit(fixture: ComponentFixture<QrCobroConfigModalComponent>): void {
    (fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();
  }
});

const qrResponse: QrCobroResponse = {
  codqr: 18,
  fechaInicio: '2026-09-26',
  fechaFin: '2027-09-26',
  estado: 'ACTIVO',
  tieneImagen: true,
  nombreArchivo: 'qr.png',
  tipoContenido: 'image/png',
  fechaRegistro: '2026-09-26T12:30:00',
};

const currentQr = qrResponse;
