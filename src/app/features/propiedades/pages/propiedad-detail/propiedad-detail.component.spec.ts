import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadDetailPdfService } from '../../data/propiedad-detail-pdf.service';
import { Propiedad } from '../../models/propiedad.model';
import { PropiedadDetailComponent } from './propiedad-detail.component';

describe('PropiedadDetailComponent', () => {
  let fixture: ComponentFixture<PropiedadDetailComponent>;
  let http: HttpTestingController;
  const notification = { success: vi.fn(), error: vi.fn() };
  const pdfService = { download: vi.fn().mockResolvedValue(undefined) };
  const property: Propiedad = {
    codprop: 7,
    nombre: 'Torre San Jerónimo',
    tipo: 'EDIFICIO',
    direccion: 'Av. Las Américas #840',
    ciudad: 'Tarija',
    referencia: null,
    latitud: null,
    longitud: null,
    portadaUrl: 'https://legacy.example/portada.jpg',
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 4200000,
    estado: 1,
    cantidadUnidades: 3,
    unidadesHabilitadas: 0,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ codprop: '7' })) },
        },
        { provide: OrmanNotificationService, useValue: notification },
        { provide: PropiedadDetailPdfService, useValue: pdfService },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PropiedadDetailComponent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    http.verify();
  });

  function flushProperty(detail: Propiedad = property): void {
    fixture.detectChanges();
    http.expectOne('/api/v1/propiedades/7').flush(detail);
    fixture.detectChanges();
  }

  it('loads and renders only the confirmed property detail data', () => {
    flushProperty();

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent?.trim()).toBe('Detalle de propiedad');
    expect(page.textContent).toContain('Torre San Jerónimo');
    expect(page.textContent).toContain('Edificio');
    expect(page.textContent).toContain('Av. Las Américas #840');
    expect(page.textContent).toContain('No registrada');
    expect(page.textContent).toContain('Bs 4.200.000');
    expect(page.textContent).toContain('3 unidades registradas');
    expect(page.textContent).not.toContain('Ocupación');
    expect(page.textContent).not.toContain('Unidades habilitadas');
    expect(page.querySelector('img')).toBeNull();
    http.expectNone('/api/v1/propiedades/7/portada');
  });

  it('requests a protected cover only when the detail response confirms one', () => {
    flushProperty({ ...property, tienePortada: true });

    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');

    expect(coverRequest.request.method).toBe('GET');
    coverRequest.flush(new Blob(['cover'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.property-detail-cover img')).toBeTruthy();
  });

  it('shows a not-found state from the confirmed 404 response', () => {
    fixture.detectChanges();
    http
      .expectOne('/api/v1/propiedades/7')
      .flush({ detail: 'Propiedad no encontrada.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Propiedad no encontrada');
    expect(fixture.nativeElement.textContent).toContain(
      'La propiedad solicitada no existe o ya no está disponible.',
    );
  });

  it('shows an access-denied state from the confirmed 403 response', () => {
    fixture.detectChanges();
    http
      .expectOne('/api/v1/propiedades/7')
      .flush({ detail: 'No tienes acceso.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Acceso denegado');
    expect(fixture.nativeElement.textContent).toContain(
      'No tienes permiso para consultar esta propiedad.',
    );
  });

  it('exposes only the PDF action in the detail header', () => {
    flushProperty();

    const page = fixture.nativeElement as HTMLElement;
    const actions = page.querySelector('.property-detail-actions');

    expect(actions?.querySelectorAll('button')).toHaveLength(1);
    expect(actions?.textContent).toContain('Descargar PDF');
    expect(actions?.textContent).not.toContain('Editar');
    expect(actions?.textContent).not.toContain('Imprimir');
  });

  it('delegates PDF generation and reports success', async () => {
    flushProperty();
    const component = fixture.componentInstance as never as {
      downloadPdf(): Promise<void>;
    };

    await component.downloadPdf();

    expect(pdfService.download).toHaveBeenCalledWith(property, null);
    expect(notification.success).toHaveBeenCalledWith('PDF descargado correctamente.');
  });
});
