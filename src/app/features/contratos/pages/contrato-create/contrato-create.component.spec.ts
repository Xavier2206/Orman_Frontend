import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse, Persona } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import { ContratoCreateComponent } from './contrato-create.component';

describe('ContratoCreateComponent', () => {
  let fixture: ComponentFixture<ContratoCreateComponent>;
  let http: HttpTestingController;
  let successNotification: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  const property: Propiedad = {
    codprop: 10,
    nombre: 'Edificio Central',
    tipo: 'EDIFICIO',
    direccion: 'Calle Central 10',
    ciudad: 'La Paz',
    referencia: null,
    latitud: null,
    longitud: null,
    portadaUrl: null,
    tienePortada: false,
    codperPropietaria: 1,
    inversionInicial: 100000,
    estado: 1,
    cantidadUnidades: 2,
    unidadesHabilitadas: 2,
    unidadesOcupadas: 1,
    ocupacion: 50,
  };

  const unit: UnidadResponse = {
    coduni: 25,
    codprop: 10,
    nombre: 'Departamento 2',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: null,
    area: 80,
    dormitorios: 2,
    banos: 1,
    piso: 2,
    ubicacionInterna: null,
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  const tenant: Persona = {
    codper: 31,
    ci: '1234567',
    nombre: 'Juan',
    ap: 'Pérez',
    am: 'Gómez',
    genero: 'M',
    estado: 1,
    correo: '',
    telefono: '',
    tipoPersona: 'I',
    foto: null,
    fechaRegistro: '2026-01-01T00:00:00',
    usuario: null,
    acciones: {
      puedeEditar: true,
      puedeDesactivar: true,
      puedeActivar: false,
      puedeEliminar: true,
      puedeCrearUsuario: false,
      puedeCambiarPassword: false,
    },
  };

  function pageResponse<T>(content: readonly T[], page = 0, totalPages = 1): PageResponse<T> {
    return {
      content,
      page,
      size: 100,
      totalElements: content.length,
      totalPages,
      first: page === 0,
      last: page + 1 === totalPages,
    };
  }

  beforeEach(async () => {
    successNotification = vi.fn();
    navigateByUrl = vi.fn().mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [ContratoCreateComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: OrmanNotificationService,
          useValue: { success: successNotification },
        },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratoCreateComponent);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  function loadProperties(): void {
    fixture.detectChanges();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades' && candidate.params.get('estado') === '1',
    );
    expect(request.request.params.get('size')).toBe('100');
    request.flush(pageResponse([property]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.contract-create-layout')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.contract-create-sidebar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.contract-document-section')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
  }

  function selectUnit(units = [unit]): void {
    const propertySelect = fixture.nativeElement.querySelector(
      '#contract-create-property',
    ) as HTMLSelectElement;
    propertySelect.value = '10';
    propertySelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const unitRequest = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades/10/unidades' &&
        candidate.params.get('estadoOperativo') === '1',
    );
    unitRequest.flush(pageResponse(units));
    fixture.detectChanges();

    const unitSelect = fixture.nativeElement.querySelector(
      '#contract-create-unit',
    ) as HTMLSelectElement;
    unitSelect.value = '25';
    unitSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function searchAndSelectTenant(): void {
    vi.useFakeTimers();
    const search = fixture.nativeElement.querySelector(
      '#contract-tenant-search',
    ) as HTMLInputElement;
    search.value = 'Juan Pérez';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    vi.advanceTimersByTime(250);
    fixture.detectChanges();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/personas' &&
        candidate.params.get('q') === 'Juan Pérez' &&
        candidate.params.get('tipoPersona') === 'I' &&
        candidate.params.get('estado') === '1',
    );
    expect(request.request.params.get('size')).toBe('20');
    request.flush(
      pageResponse([
        tenant,
        { ...tenant, codper: 32, estado: 0 },
        { ...tenant, codper: 33, tipoPersona: 'A' },
      ]),
    );
    fixture.detectChanges();
    vi.useRealTimers();

    expect(fixture.nativeElement.querySelectorAll('.tenant-option')).toHaveLength(1);
    const tenantOption = fixture.nativeElement.querySelector('.tenant-option') as HTMLButtonElement;
    tenantOption.click();
    fixture.detectChanges();
  }

  function fillFinancials(): void {
    const startMonth = fixture.nativeElement.querySelector(
      '#contract-start-month',
    ) as HTMLInputElement;
    startMonth.value = '2026-10';
    startMonth.dispatchEvent(new Event('input'));

    const rent = fixture.nativeElement.querySelector('#contract-monthly-rent') as HTMLInputElement;
    rent.value = '2500';
    rent.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function selectPdf(): void {
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['%PDF-1.7'], 'contrato.pdf', { type: 'application/pdf' });

    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: { item: (index: number) => (index === 0 ? file : null) },
    });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  it('loads only enabled properties and waits for a property before loading units', () => {
    fixture.detectChanges();

    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades' && candidate.params.get('estado') === '1',
    );
    request.flush(pageResponse([property]));
    fixture.detectChanges();

    const unitSelect = fixture.nativeElement.querySelector(
      '#contract-create-unit',
    ) as HTMLSelectElement;

    expect(unitSelect.disabled).toBe(true);
    expect(http.match((candidate) => candidate.url.includes('/unidades'))).toHaveLength(0);
    expect(http.match((candidate) => candidate.url === '/api/v1/personas')).toHaveLength(0);
  });

  it('loads operational units and searches tenants using active tenant filters', () => {
    loadProperties();
    selectUnit();
    searchAndSelectTenant();

    expect(fixture.nativeElement.textContent).toContain('Juan Pérez Gómez');
    expect(fixture.nativeElement.textContent).toContain('CI 1234567');
    expect(fixture.nativeElement.textContent).toContain('Piso 2');
    expect(fixture.nativeElement.querySelectorAll('.contract-tenant-badge')).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Activo');
    expect(fixture.nativeElement.textContent).toContain('Inquilino');
  });

  it('shows only units available for a new contract', () => {
    loadProperties();
    selectUnit([
      unit,
      { ...unit, coduni: 26, nombre: 'Departamento ocupado', disponibleParaContrato: false },
    ]);

    const unitOptions = Array.from(
      fixture.nativeElement.querySelectorAll(
        '#contract-create-unit option',
      ) as NodeListOf<HTMLOptionElement>,
    ).map((option) => option.textContent?.trim());

    expect(unitOptions).toEqual(['Selecciona una unidad', 'Departamento 2']);
    expect(fixture.nativeElement.textContent).not.toContain('Departamento ocupado');
  });

  it('previews calendar-month boundaries and generated monthly installment count', () => {
    loadProperties();
    fillFinancials();

    expect(fixture.nativeElement.querySelector('#contract-end-date')?.value).toBe('01/10/2027');
    expect(fixture.nativeElement.textContent).toContain(
      'Se generarán 12 cuotas mensuales desde Octubre 2026 hasta Septiembre 2027.',
    );
    expect(fixture.nativeElement.textContent).toContain('12 cuotas mensuales previstas');
  });

  it('posts the confirmed contract request and navigates after success', () => {
    loadProperties();
    selectUnit();
    searchAndSelectTenant();
    fillFinancials();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/unidades/25/contratos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      codperInquilino: 31,
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      montoMensual: 2500,
      garantia: 0,
    });
    request.flush({
      codcon: 42,
      coduni: 25,
      codperInquilino: 31,
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      montoMensual: 2500,
      moneda: 'BOB',
      garantia: 0,
      estado: 'PROGRAMADO',
      fechaRegistro: '2026-09-16T12:00:00',
      fechaRescision: null,
      motivoRescision: null,
      inquilino: null,
      unidad: null,
      propiedad: null,
      cuotas: null,
    });
    fixture.detectChanges();

    expect(successNotification).toHaveBeenCalledWith('Contrato creado correctamente.');
    expect(navigateByUrl).toHaveBeenCalledWith('/app/contratos/listar');
  });

  it('uploads the selected PDF only after the backend returns codcon', () => {
    loadProperties();
    selectUnit();
    searchAndSelectTenant();
    fillFinancials();
    selectPdf();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    const createRequest = http.expectOne('/api/v1/unidades/25/contratos');
    expect(http.match((request) => request.url.includes('/archivos')).length).toBe(0);
    createRequest.flush({
      codcon: 42,
      coduni: 25,
      codperInquilino: 31,
      fechaInicio: '2026-10-01',
      fechaFin: '2027-10-01',
      montoMensual: 2500,
      moneda: 'BOB',
      garantia: 0,
      estado: 'PROGRAMADO',
      fechaRegistro: '2026-09-16T12:00:00',
      fechaRescision: null,
      motivoRescision: null,
      inquilino: null,
      unidad: null,
      propiedad: null,
      cuotas: null,
    });
    fixture.detectChanges();

    const uploadRequest = http.expectOne('/api/v1/contratos/42/archivos?orden=0');
    expect(uploadRequest.request.method).toBe('POST');
    expect(uploadRequest.request.body).toBeInstanceOf(FormData);
    uploadRequest.flush({
      codarc: 7,
      codcon: 42,
      nombreArchivo: 'contrato.pdf',
      tipoContenido: 'application/pdf',
      tamanoOriginal: 8,
      tamanoFinal: 8,
      fechaSubida: '2026-09-16T12:00:00',
      subidoPor: 'propietaria',
      orden: 0,
      almacenadoInternamente: true,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('contrato.pdf');
    expect(successNotification).toHaveBeenCalledWith(
      'Documento del contrato cargado correctamente.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('shows a conflict message when the backend rejects an overlapping period', () => {
    loadProperties();
    selectUnit();
    searchAndSelectTenant();
    fillFinancials();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    http
      .expectOne('/api/v1/unidades/25/contratos')
      .flush({ detail: 'Conflicto.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ya existe un contrato que se superpone con este período.',
    );
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
