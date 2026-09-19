import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadDetailPdfService } from '../../data/unidad-detail-pdf.service';
import { UnidadResponse } from '../../models/unidad.model';
import { UnidadFotoResponse } from '../../models/fotografia.model';
import { UnidadDetailComponent } from './unidad-detail.component';

describe('UnidadDetailComponent', () => {
  let fixture: ComponentFixture<UnidadDetailComponent>;
  let http: HttpTestingController;
  const pdfService = { download: vi.fn().mockResolvedValue(undefined) };
  const notification = { success: vi.fn(), error: vi.fn() };

  const property: Propiedad = {
    codprop: 161,
    nombre: 'Edificio Central',
    tipo: 'EDIFICIO',
    direccion: 'Calle Sucre 123',
    ciudad: 'Tarija',
    referencia: null,
    latitud: null,
    longitud: null,
    portadaUrl: null,
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 3500000,
    estado: 1,
    cantidadUnidades: 2,
    unidadesHabilitadas: 2,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  const unit: UnidadResponse = {
    coduni: 501,
    codprop: 161,
    nombre: 'Unidad 101',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: 'Unidad con balcón.',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ coduni: '501' })),
            snapshot: {
              queryParamMap: convertToParamMap({
                codprop: '161',
                estadoOperativo: '1',
                page: '1',
              }),
            },
          },
        },
        { provide: UnidadDetailPdfService, useValue: pdfService },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    notification.success.mockClear();
    notification.error.mockClear();
    pdfService.download.mockClear();
    pdfService.download.mockResolvedValue(undefined);
    fixture = TestBed.createComponent(UnidadDetailComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function flushDetail(
    detail: UnidadResponse = unit,
    detailProperty: Propiedad | null = property,
    photos: readonly UnidadFotoResponse[] = [],
  ) {
    http.expectOne('/api/v1/unidades/501').flush(detail);
    const propertyRequest = http.expectOne('/api/v1/propiedades/161');

    if (detailProperty) {
      propertyRequest.flush(detailProperty);
    } else {
      propertyRequest.flush(
        { detail: 'No tienes acceso a esta propiedad.' },
        { status: 403, statusText: 'Forbidden' },
      );
    }

    http.expectOne('/api/v1/unidades/501/fotos').flush(photos);

    fixture.detectChanges();
  }

  function page(): {
    downloadPdf(): Promise<void>;
  } {
    return fixture.componentInstance as never as {
      downloadPdf(): Promise<void>;
    };
  }

  it('loads and renders only the confirmed unit detail fields', () => {
    flushDetail();

    const pageElement = fixture.nativeElement as HTMLElement;
    const text = pageElement.textContent ?? '';

    expect(text).toContain('Detalle de unidad');
    expect(text).toContain('Unidad 101');
    expect(text).toContain('DEPARTAMENTO');
    expect(text).toContain('OPERATIVA');
    expect(text).toContain('45,5 m²');
    expect(text).toContain('Torre A');
    expect(text).toContain('Bs 2.500');
    expect(text).toContain('Edificio Central');
    expect(text).not.toMatch(/ocupaci|ocupad|disponib|contrato|inquilino|libre/i);
    expect(text).toContain('Esta unidad todavía no tiene fotografías registradas.');
    expect(pageElement.querySelector('[aria-label="Acciones de la unidad"]')).toBeTruthy();
    expect(
      (pageElement.querySelector('.unit-detail-back-link') as HTMLAnchorElement).getAttribute(
        'href',
      ),
    ).toContain('/app/unidades/listar?codprop=161&estadoOperativo=1&page=1');
  });

  it('shows neutral text for nullable values and only the property identifier when lookup fails', () => {
    flushDetail({ ...unit, descripcion: null, ubicacionInterna: null }, null);

    const pageElement = fixture.nativeElement as HTMLElement;
    const text = pageElement.textContent ?? '';

    expect(text).toContain('No registrada');
    expect(text).toContain('#161');
    expect(text).not.toContain('Edificio Central');
  });

  it('delegates the PDF action with the unit and resolved property', async () => {
    flushDetail();

    const downloadButton = pageElementButton(fixture, 'Descargar PDF');
    expect(downloadButton).toBeTruthy();
    await page().downloadPdf();

    expect(pdfService.download).toHaveBeenCalledWith(unit, property, []);
    expect(notification.success).toHaveBeenCalledWith('PDF descargado correctamente.');
  });

  it('loads internal photo blobs without blocking the detail when an image fails', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:detail-photo');
    const photos: readonly UnidadFotoResponse[] = [
      {
        id: 20,
        coduni: 501,
        url: null,
        titulo: 'Sala',
        ambiente: 'Sala',
        orden: 0,
        portada: true,
        tieneArchivo: true,
      },
      {
        id: 21,
        coduni: 501,
        url: null,
        titulo: 'Cocina',
        ambiente: 'Cocina',
        orden: 1,
        portada: false,
        tieneArchivo: true,
      },
    ];
    flushDetail(unit, property, photos);

    const imageRequests = http.match((request) => request.url.includes('/archivo'));
    expect(imageRequests).toHaveLength(2);
    imageRequests[0].flush(new Blob(['image'], { type: 'image/jpeg' }));
    imageRequests[1].flush(new Blob([], { type: 'application/problem+json' }), {
      status: 404,
      statusText: 'Not Found',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unidad-fotos')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('img[src="blob:detail-photo"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Sala');
    expect(fixture.nativeElement.textContent).not.toContain('No se puede cargar el detalle');
    createObjectUrl.mockRestore();
  });

  it('keeps historical external photo URLs visible with their metadata', () => {
    flushDetail(unit, property, [
      {
        id: 22,
        coduni: 501,
        url: 'https://cdn.example.com/unidad-501/sala.jpg',
        titulo: 'Sala principal',
        ambiente: 'Sala',
        orden: 0,
        portada: true,
        tieneArchivo: false,
      },
    ]);

    const image = fixture.nativeElement.querySelector('img') as HTMLImageElement;

    expect(image.getAttribute('src')).toBe('https://cdn.example.com/unidad-501/sala.jpg');
    expect(fixture.nativeElement.textContent).toContain('Sala principal');
    expect(fixture.nativeElement.textContent).toContain('Portada');
    expect(fixture.nativeElement.querySelector('.unidad-foto-order')).toBeNull();
  });

  it('shows the not-found state for a missing unit', () => {
    http
      .expectOne('/api/v1/unidades/501')
      .flush({ detail: 'Unidad no encontrada.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'La unidad solicitada no existe o no puede consultarse.',
    );
    expect(fixture.nativeElement.querySelector('#unit-detail-title')).toBeTruthy();
  });

  it('shows an access-denied state for a forbidden unit', () => {
    http
      .expectOne('/api/v1/unidades/501')
      .flush({ detail: 'Acceso denegado.' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No tienes permiso para consultar esta unidad.',
    );
    expect(fixture.nativeElement.textContent).toContain('Acceso denegado');
  });

  it('keeps the operational status read-only and removes status actions from the detail', () => {
    flushDetail({ ...unit, estadoOperativo: 0 });

    const pageElement = fixture.nativeElement as HTMLElement;

    expect(pageElement.textContent).toContain('NO OPERATIVA');
    expect(pageElement.querySelector('.unit-detail-status-button')).toBeNull();
    expect(pageElement.querySelector('app-unidad-status-confirm-modal')).toBeNull();
    expect(pageElementButton(fixture, 'Activar unidad')).toBeUndefined();
    expect(pageElementButton(fixture, 'Desactivar unidad')).toBeUndefined();
    expect(pageElementButton(fixture, 'Descargar PDF')).toBeTruthy();
  });
});

function pageElementButton(
  fixture: ComponentFixture<UnidadDetailComponent>,
  label: string,
): HTMLButtonElement {
  return Array.from(
    fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
  ).find((button) => button.textContent?.includes(label)) as HTMLButtonElement;
}
