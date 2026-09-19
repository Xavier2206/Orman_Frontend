import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadRequest, UnidadResponse } from '../../models/unidad.model';
import { UnidadFotoResponse } from '../../models/fotografia.model';
import { UnidadFormComponent } from './unidad-form.component';

describe('UnidadFormComponent', () => {
  let fixture: ComponentFixture<UnidadFormComponent>;
  let http: HttpTestingController;
  let routeParams: Record<string, string>;
  let routeQueryParams: Record<string, string>;
  const route = {
    snapshot: {
      paramMap: convertToParamMap({}),
      queryParamMap: convertToParamMap({}),
    },
  };
  const router = { navigate: vi.fn() };
  const notification = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };

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
    descripcion: 'Unidad de prueba',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  const request: UnidadRequest = {
    nombre: 'Unidad 101',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: 'Unidad de prueba',
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
  };

  beforeEach(async () => {
    routeParams = {};
    routeQueryParams = {};
    route.snapshot.paramMap = convertToParamMap(routeParams);
    route.snapshot.queryParamMap = convertToParamMap(routeQueryParams);

    await TestBed.configureTestingModule({
      imports: [UnidadFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router.navigate.mockClear();
    notification.success.mockClear();
    notification.warning.mockClear();
    notification.error.mockClear();
  });

  afterEach(() => http.verify());

  function createForm(
    coduni: string | null = null,
    codprop: string | null = null,
    contextQueryParams: Record<string, string> = {},
  ): void {
    routeParams = coduni === null ? {} : { coduni };
    routeQueryParams = codprop === null ? contextQueryParams : { ...contextQueryParams, codprop };
    route.snapshot.paramMap = convertToParamMap(routeParams);
    route.snapshot.queryParamMap = convertToParamMap(routeQueryParams);
    fixture = TestBed.createComponent(UnidadFormComponent);
    fixture.detectChanges();
  }

  function page(): {
    form: FormGroup;
    submit(): void;
    propertyMessage(): string | null;
    fieldMessage(field: string): string | null;
    selectedPropertyId(): number | null;
    cancel(): void;
  } {
    return fixture.componentInstance as never as {
      form: FormGroup;
      submit(): void;
      propertyMessage(): string | null;
      fieldMessage(field: string): string | null;
      selectedPropertyId(): number | null;
      cancel(): void;
    };
  }

  function propertyPageResponse(
    content: readonly Propiedad[],
    pageNumber = 0,
    totalPages = 1,
    totalElements = content.length,
  ): PageResponse<Propiedad> {
    return {
      content,
      page: pageNumber,
      size: 100,
      totalElements,
      totalPages,
      first: pageNumber === 0,
      last: totalPages === 0 || pageNumber === totalPages - 1,
    };
  }

  function flushPropertyCatalog(properties: readonly Propiedad[] = [property]): void {
    const propertyRequest = http.expectOne((candidate) => candidate.url === '/api/v1/propiedades');

    expect(propertyRequest.request.method).toBe('GET');
    expect(propertyRequest.request.params.get('size')).toBe('100');
    expect(propertyRequest.request.params.get('sort')).toBe('nombre,asc');
    propertyRequest.flush(propertyPageResponse(properties));
    fixture.detectChanges();
  }

  function setValidValues(): void {
    page().form.setValue({
      nombre: '  Unidad 101  ',
      tipoUnidad: '  DEPARTAMENTO  ',
      descripcion: '  Unidad de prueba  ',
      area: 45.5,
      dormitorios: 1,
      banos: 1,
      piso: 1,
      ubicacionInterna: '  Torre A  ',
      precioBase: 2500,
      estadoOperativo: 1,
    });
    fixture.detectChanges();
  }

  function flushPhotos(photos: readonly UnidadFotoResponse[] = []): void {
    fixture.detectChanges();
    http.expectOne('/api/v1/unidades/501/fotos').flush(photos);
    fixture.detectChanges();
  }

  it('renders one shared create form with real fields and a property selector', () => {
    createForm(null, '161');
    flushPropertyCatalog();

    const pageElement = fixture.nativeElement as HTMLElement;

    expect(pageElement.querySelector('h1')?.textContent?.trim()).toBe('Añadir unidad');
    expect(pageElement.querySelector('#unidad-form')).toBeTruthy();
    expect(pageElement.querySelector('#unit-name')).toBeTruthy();
    expect(pageElement.querySelector('#unit-type')).toBeTruthy();
    expect(pageElement.querySelector('#unit-description')).toBeTruthy();
    expect(pageElement.querySelector('#unit-area')).toBeTruthy();
    expect(pageElement.querySelector('#unit-internal-location')).toBeTruthy();
    expect(pageElement.querySelector('#unit-price')).toBeTruthy();
    expect(pageElement.querySelector('#unit-property-select')).toBeTruthy();
    expect(pageElement.querySelector('#unit-status-title')).toBeTruthy();
    expect(page().selectedPropertyId()).toBe(161);
    expect(pageElement.textContent).toContain('Edificio Central');
  });

  it('selects common unit types and reveals a custom field for Otro', () => {
    createForm(null, '161');
    flushPropertyCatalog();

    const pageElement = fixture.nativeElement as HTMLElement;
    const typeSelect = pageElement.querySelector('#unit-type') as HTMLSelectElement;

    expect(Array.from(typeSelect.options).map((option) => option.value)).toEqual([
      '',
      'CASA',
      'DEPARTAMENTO',
      'TIENDA',
      'OTRO',
    ]);
    expect(pageElement.querySelector('#unit-type-custom')).toBeNull();

    typeSelect.value = 'OTRO';
    typeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const customTypeInput = pageElement.querySelector('#unit-type-custom') as HTMLInputElement;
    expect(customTypeInput).toBeTruthy();
    expect(page().form.get('tipoUnidad')?.value).toBe('');

    customTypeInput.value = 'Penthouse';
    customTypeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(page().form.get('tipoUnidad')?.value).toBe('Penthouse');

    typeSelect.value = 'CASA';
    typeSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(pageElement.querySelector('#unit-type-custom')).toBeNull();
    expect(page().form.get('tipoUnidad')?.value).toBe('CASA');
  });

  it('loads all property pages for direct creation without assuming the first page is complete', () => {
    createForm();

    const firstRequest = http.expectOne((candidate) => candidate.url === '/api/v1/propiedades');
    firstRequest.flush(propertyPageResponse([property], 0, 2, 2));

    const secondProperty = {
      ...property,
      codprop: 162,
      nombre: 'Casa Norte',
      tipo: 'CASA' as const,
    };
    const secondRequest = http.expectOne((candidate) => candidate.url === '/api/v1/propiedades');
    expect(secondRequest.request.params.get('page')).toBe('1');
    secondRequest.flush(propertyPageResponse([secondProperty], 1, 2, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('#unit-property-select option')).toHaveLength(3);
    expect(fixture.nativeElement.textContent).toContain('Casa Norte');
  });

  it('validates required fields, non-negative numeric values and property selection', () => {
    createForm();
    flushPropertyCatalog([]);

    page().form.get('nombre')?.setValue('');
    page().form.get('area')?.setValue(-1);
    page().submit();

    expect(page().form.invalid).toBe(true);
    expect(page().fieldMessage('nombre')).toBe('El nombre es obligatorio.');
    expect(page().fieldMessage('area')).toBe('El área no puede ser negativa.');
    expect(page().propertyMessage()).toBe('Selecciona una propiedad para registrar la unidad.');
    expect(http.match((candidate) => candidate.url.includes('/unidades'))).toHaveLength(0);
  });

  it('creates with codprop in the URL and sends no property identifier in the body', () => {
    createForm(null, '161', { estadoOperativo: '1', page: '1' });
    flushPropertyCatalog();
    setValidValues();

    page().submit();

    const createRequest = http.expectOne('/api/v1/propiedades/161/unidades');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(request);
    expect(createRequest.request.body).not.toHaveProperty('codprop');

    createRequest.flush(unit);
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('Unidad creada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/listar'], {
      queryParams: { codprop: 161, estadoOperativo: '1', page: 1 },
    });
  });

  it('uploads pending create photos in order and sets the selected cover after creation', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pending-photo');
    createForm(null, '161');
    flushPropertyCatalog();
    setValidValues();

    const fileInput = fixture.nativeElement.querySelector(
      '#unit-photo-add-input',
    ) as HTMLInputElement;
    const file = new File(['jpeg'], 'sala.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { configurable: true, value: [file] });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    page().submit();
    const createRequest = http.expectOne('/api/v1/propiedades/161/unidades');
    createRequest.flush(unit);

    const photoRequest = http.expectOne('/api/v1/unidades/501/fotos');
    expect(photoRequest.request.method).toBe('POST');
    expect(photoRequest.request.body.get('foto')).toBeInstanceOf(File);
    expect(photoRequest.request.body.get('orden')).toBe('0');
    photoRequest.flush({
      id: 91,
      coduni: 501,
      url: null,
      titulo: null,
      ambiente: null,
      orden: 0,
      portada: false,
      tieneArchivo: true,
    });

    const coverRequest = http.expectOne('/api/v1/unidades/501/fotos/91/portada');
    expect(coverRequest.request.method).toBe('PATCH');
    coverRequest.flush({
      id: 91,
      coduni: 501,
      url: null,
      titulo: null,
      ambiente: null,
      orden: 0,
      portada: true,
      tieneArchivo: true,
    });
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('Unidad creada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/listar'], {
      queryParams: { codprop: 161 },
    });
    createObjectUrl.mockRestore();
  });

  it('keeps unit creation successful when a pending photo upload fails', () => {
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:failed-photo');
    createForm(null, '161');
    flushPropertyCatalog();
    setValidValues();

    const fileInput = fixture.nativeElement.querySelector(
      '#unit-photo-add-input',
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      configurable: true,
      value: [new File(['jpeg'], 'sala.jpg', { type: 'image/jpeg' })],
    });
    fileInput.dispatchEvent(new Event('change'));
    page().submit();
    http.expectOne('/api/v1/propiedades/161/unidades').flush(unit);

    http
      .expectOne('/api/v1/unidades/501/fotos')
      .flush(
        { detail: 'No se pudo guardar la fotografía.' },
        { status: 500, statusText: 'Server Error' },
      );
    fixture.detectChanges();

    expect(notification.warning).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades', 501, 'editar'], {
      queryParams: { codprop: 161 },
    });
    createObjectUrl.mockRestore();
  });

  it('returns from create to the complete list context when cancelled', () => {
    createForm(null, '161', { estadoOperativo: '1', page: '1' });
    flushPropertyCatalog();

    page().cancel();

    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/listar'], {
      queryParams: { codprop: 161, estadoOperativo: '1', page: 1 },
    });
  });

  it('maps a conflict response without navigating', () => {
    createForm(null, '161');
    flushPropertyCatalog();
    setValidValues();
    page().submit();

    http
      .expectOne('/api/v1/propiedades/161/unidades')
      .flush(
        { detail: 'Ya existe una unidad con ese nombre.', errorCode: 'CONFLICT' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ya existe una unidad con ese nombre dentro de la propiedad.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('loads the unit and associated property in edit mode without exposing an editable selector', () => {
    createForm('501');

    http.expectOne('/api/v1/unidades/501').flush(unit);
    http.expectOne('/api/v1/propiedades/161').flush(property);
    flushPhotos();
    fixture.detectChanges();

    const pageElement = fixture.nativeElement as HTMLElement;

    expect(pageElement.querySelector('h1')?.textContent?.trim()).toBe('Editar unidad');
    expect((pageElement.querySelector('#unit-name') as HTMLInputElement).value).toBe('Unidad 101');
    expect(pageElement.querySelector('#unit-property-select')).toBeNull();
    expect(pageElement.querySelector('#unit-status-title')).toBeNull();
    expect(pageElement.textContent).toContain('Propiedad asociada');
    expect(pageElement.textContent).toContain('Edificio Central');
  });

  it('updates all unit fields and navigates to the current detail', () => {
    createForm('501');
    http.expectOne('/api/v1/unidades/501').flush(unit);
    http.expectOne('/api/v1/propiedades/161').flush(property);
    flushPhotos();
    fixture.detectChanges();

    setValidValues();
    page().submit();

    const updateRequest = http.expectOne('/api/v1/unidades/501');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(request);
    expect(updateRequest.request.body).not.toHaveProperty('codprop');

    updateRequest.flush(unit);
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('Unidad actualizada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades', 501, 'detalle'], {
      queryParams: { codprop: 161 },
    });
  });

  it('preserves the loaded operational state in PUT even if the hidden form control changes', () => {
    createForm('501');
    http.expectOne('/api/v1/unidades/501').flush(unit);
    http.expectOne('/api/v1/propiedades/161').flush(property);
    flushPhotos();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#unit-status-title')).toBeNull();
    page().form.controls['estadoOperativo'].setValue(0);
    page().form.controls['nombre'].setValue('Unidad 101 actualizada');
    page().submit();

    const updateRequest = http.expectOne('/api/v1/unidades/501');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body.estadoOperativo).toBe(1);
    updateRequest.flush({ ...unit, nombre: 'Unidad 101 actualizada' });
    fixture.detectChanges();
  });

  it('returns from edit to the complete list context when cancelled', () => {
    createForm('501', '161', { estadoOperativo: '0', page: '1' });
    http.expectOne('/api/v1/unidades/501').flush(unit);
    http.expectOne('/api/v1/propiedades/161').flush(property);
    flushPhotos();
    fixture.detectChanges();

    page().cancel();

    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/listar'], {
      queryParams: { codprop: 161, estadoOperativo: '0', page: 1 },
    });
  });

  it('keeps the list context when edit success opens the detail', () => {
    createForm('501', '161', { estadoOperativo: '1', page: '1' });
    http.expectOne('/api/v1/unidades/501').flush(unit);
    http.expectOne('/api/v1/propiedades/161').flush(property);
    flushPhotos();
    fixture.detectChanges();

    setValidValues();
    page().submit();
    http.expectOne('/api/v1/unidades/501').flush(unit);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades', 501, 'detalle'], {
      queryParams: { codprop: 161, estadoOperativo: '1', page: 1 },
    });
  });

  it('shows a not-found state when edit loading returns 404', () => {
    createForm('501');
    http
      .expectOne('/api/v1/unidades/501')
      .flush({ detail: 'Unidad no encontrada.' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('La unidad solicitada no fue encontrada.');
    expect(fixture.nativeElement.querySelector('#unidad-form')).toBeNull();
  });
});
