import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../../../../core/auth/auth.service';
import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { LocationGeocodingService } from '../../data/location-geocoding.service';
import {
  LocationGeocodingResult,
  PropiedadCoordinates,
} from '../../models/propiedad-location.model';
import { Propiedad } from '../../models/propiedad.model';
import { PropiedadFormComponent } from './propiedad-form.component';

describe('PropiedadFormComponent', () => {
  let fixture: ComponentFixture<PropiedadFormComponent>;
  let http: HttpTestingController;
  let routeCodprop: string | null;
  const router = { navigate: vi.fn() };
  const notification = { success: vi.fn(), warning: vi.fn() };
  const auth = { codper: vi.fn<() => number | null>(() => 10) };
  const locationGeocoding = {
    reverse: vi.fn(),
  };
  let createObjectUrl: ReturnType<typeof vi.fn>;
  let revokeObjectUrl: ReturnType<typeof vi.fn>;
  const property: Propiedad = {
    codprop: 7,
    nombre: 'Edificio Tarija',
    tipo: 'EDIFICIO',
    direccion: 'Av. Las Américas #450',
    ciudad: 'Tarija',
    referencia: 'Zona central',
    latitud: -21.535,
    longitud: -64.729,
    portadaUrl: 'https://cdn.orman.bo/edificio-tarija.webp',
    tienePortada: false,
    codperPropietaria: 3,
    inversionInicial: 3500000,
    estado: 0,
    cantidadUnidades: 1,
    unidadesHabilitadas: 1,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };
  const propertyWithCover: Propiedad = { ...property, tienePortada: true };

  beforeEach(async () => {
    routeCodprop = null;
    createObjectUrl = vi.fn(() => 'blob:property-form-cover');
    revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    await TestBed.configureTestingModule({
      imports: [PropiedadFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeCodprop } } },
        },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: auth },
        { provide: OrmanNotificationService, useValue: notification },
        { provide: LocationGeocodingService, useValue: locationGeocoding },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    vi.clearAllMocks();
    auth.codper.mockReturnValue(10);
    locationGeocoding.reverse.mockReturnValue(of(null));
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  function createForm(codprop: string | null = null): void {
    routeCodprop = codprop;
    fixture = TestBed.createComponent(PropiedadFormComponent);
    fixture.detectChanges();
  }

  function page(): {
    form: FormGroup;
    submit(): void;
    feedback(): string | null;
    fieldErrors(): Record<string, string>;
    loadingError(): string | null;
    submitting(): boolean;
    cancel(): void;
    handleCoverSelection(file: File): void;
    removeCover(): void;
    coverDisplayUrl(): string | null;
    coverDeletePending(): boolean;
    coverChangesPending(): boolean;
    selectedCoverFile(): File | null;
    locationFeedback(): string | null;
    handleMapCoordinates(coordinates: PropiedadCoordinates): void;
  } {
    return fixture.componentInstance as never as {
      form: FormGroup;
      submit(): void;
      feedback(): string | null;
      fieldErrors(): Record<string, string>;
      loadingError(): string | null;
      submitting(): boolean;
      cancel(): void;
      handleCoverSelection(file: File): void;
      removeCover(): void;
      coverDisplayUrl(): string | null;
      coverDeletePending(): boolean;
      coverChangesPending(): boolean;
      selectedCoverFile(): File | null;
      locationFeedback(): string | null;
      handleMapCoordinates(coordinates: PropiedadCoordinates): void;
    };
  }

  function setValidValues(): void {
    page().form.setValue({
      nombre: '  Casa Central  ',
      tipo: 'CASA',
      direccion: '  Calle Sucre 123  ',
      ciudad: '  Tarija  ',
      referencia: '   ',
      latitud: -21.535,
      longitud: -64.729,
      inversionInicial: 350000,
    });
  }

  it('starts the create form empty and keeps technical fields outside the visible controls', () => {
    createForm();

    expect(fixture.nativeElement.textContent).toContain('Nueva propiedad');
    expect(fixture.nativeElement.querySelector('.form-back-button')).toBeNull();
    expect(page().form.value.nombre).toBe('');
    expect(page().form.value.tipo).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="codperPropietaria"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="estado"]')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Portada URL');
    expect(fixture.nativeElement.textContent).not.toContain('Buscar ubicación');
    expect(fixture.nativeElement.textContent).not.toContain('Usar mi ubicación');
    expect(fixture.nativeElement.querySelector('.location-actions')).toBeNull();
  });

  it('renders accessible property type cards and keeps the backend values', () => {
    createForm();

    const radios = fixture.nativeElement.querySelectorAll(
      'input[type="radio"]',
    ) as NodeListOf<HTMLInputElement>;

    expect(radios).toHaveLength(2);
    expect(radios[0].value).toBe('EDIFICIO');
    expect(radios[1].value).toBe('CASA');
    expect(fixture.nativeElement.querySelector('select')).toBeNull();

    radios[1].click();
    fixture.detectChanges();
    expect(page().form.controls['tipo'].value).toBe('CASA');
    expect(radios[1].checked).toBe(true);

    radios[0].click();
    fixture.detectChanges();
    expect(page().form.controls['tipo'].value).toBe('EDIFICIO');
    expect(radios[0].checked).toBe(true);
  });

  it('updates coordinates from map and reverse geocoding only fills empty address fields', () => {
    const result: LocationGeocodingResult = {
      displayName: 'Calle Sucre 123, Tarija, Bolivia',
      direccion: 'Calle Sucre 123',
      ciudad: 'Tarija',
      latitud: -21.53,
      longitud: -64.72,
    };
    locationGeocoding.reverse.mockReturnValue(of(result));
    createForm();
    page().form.controls['referencia'].setValue('Frente al parque');

    page().handleMapCoordinates({ latitud: -21.53, longitud: -64.72 });
    fixture.detectChanges();

    expect(page().form.controls['latitud'].value).toBe(-21.53);
    expect(page().form.controls['longitud'].value).toBe(-64.72);
    expect(page().form.controls['direccion'].value).toBe('Calle Sucre 123');
    expect(page().form.controls['ciudad'].value).toBe('Tarija');
    expect(page().form.controls['referencia'].value).toBe('Frente al parque');

    page().form.controls['direccion'].setValue('Dirección manual');
    page().form.controls['ciudad'].setValue('Ciudad manual');
    page().handleMapCoordinates({ latitud: -21.51, longitud: -64.71 });
    expect(page().form.controls['direccion'].value).toBe('Dirección manual');
    expect(page().form.controls['ciudad'].value).toBe('Ciudad manual');
    expect(page().form.controls['referencia'].value).toBe('Frente al parque');
  });

  it('validates required fields, limits, non-negative investment and paired coordinates', () => {
    createForm();
    const component = page();

    component.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El nombre es obligatorio.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona un tipo de propiedad.');
    expect(fixture.nativeElement.textContent).toContain('La dirección es obligatoria.');
    expect(fixture.nativeElement.textContent).toContain('La ciudad es obligatoria.');
    expect(fixture.nativeElement.textContent).toContain('La inversión inicial es obligatoria.');

    component.form.controls['latitud'].setValue(-91);
    component.form.controls['longitud'].setValue(null);
    component.form.controls['inversionInicial'].setValue(-1);
    component.submit();
    fixture.detectChanges();
    expect(component.form.hasError('coordinatesIncomplete')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa latitud y longitud juntas o deja ambas vacías.',
    );
    expect(fixture.nativeElement.textContent).toContain('La latitud debe estar entre -90 y 90.');
    expect(fixture.nativeElement.textContent).toContain(
      'La inversión inicial no puede ser negativa.',
    );
  });

  it('allows both coordinates empty or both valid values', () => {
    createForm();
    setValidValues();
    const form = page().form;

    form.controls['latitud'].setValue(null);
    form.controls['longitud'].setValue(null);
    expect(form.valid).toBe(true);

    form.controls['latitud'].setValue(-21.535);
    form.controls['longitud'].setValue(-64.729);
    expect(form.valid).toBe(true);
  });

  it('creates with AuthService codper, initial active state and no cover URL', () => {
    createForm();
    setValidValues();
    page().submit();

    const createRequest = http.expectOne('/api/v1/propiedades');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual({
      nombre: 'Casa Central',
      tipo: 'CASA',
      direccion: 'Calle Sucre 123',
      ciudad: 'Tarija',
      referencia: null,
      latitud: -21.535,
      longitud: -64.729,
      portadaUrl: null,
      codperPropietaria: 10,
      inversionInicial: 350000,
      estado: 1,
    });
    createRequest.flush({ ...property, codprop: 8, estado: 1, codperPropietaria: 10 });

    expect(notification.success).toHaveBeenCalledWith('Propiedad creada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades/listar']);
  });

  it('creates the property once and uploads a selected cover after the POST', () => {
    createForm();
    setValidValues();
    const file = new File(['jpeg'], 'portada.jpg', { type: 'image/jpeg' });
    page().handleCoverSelection(file);
    page().submit();

    const createRequest = http.expectOne('/api/v1/propiedades');
    createRequest.flush({ ...property, codprop: 8, estado: 1, codperPropietaria: 10 });

    const uploadRequest = http.expectOne('/api/v1/propiedades/8/portada');
    expect(uploadRequest.request.method).toBe('PUT');
    expect(uploadRequest.request.body).toBeInstanceOf(FormData);
    expect(uploadRequest.request.body.get('foto')).toBe(file);
    uploadRequest.flush(null);

    expect(notification.success).toHaveBeenCalledWith('Propiedad creada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades/listar']);
  });

  it('does not send a create request when AuthService has no valid owner identifier', () => {
    auth.codper.mockReturnValue(null);
    createForm();
    setValidValues();
    page().submit();
    fixture.detectChanges();

    http.expectNone('/api/v1/propiedades');
    expect(page().feedback()).toContain('No fue posible identificar al propietario');
  });

  it('shows ProblemDetail feedback and maps fieldErrors without navigating', () => {
    createForm();
    setValidValues();
    page().submit();
    http.expectOne('/api/v1/propiedades').flush(
      {
        detail: 'Uno o más campos no son válidos.',
        fieldErrors: [
          {
            field: 'inversionInicial',
            message: 'La inversión inicial no puede ser negativa.',
          },
        ],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(page().feedback()).toBe('Uno o más campos no son válidos.');
    expect(page().fieldErrors()['inversionInicial']).toBe(
      'La inversión inicial no puede ser negativa.',
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('prevents a double submit while the create request is in progress', () => {
    createForm();
    setValidValues();
    page().submit();
    page().submit();

    const createRequests = http.match('/api/v1/propiedades');

    expect(createRequests).toHaveLength(1);
    expect(page().submitting()).toBe(true);
    createRequests[0].flush({ ...property, codprop: 8, estado: 1 });
  });

  it('loads an edit route and sends a complete PUT preserving hidden backend fields', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(property);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Editar propiedad');
    expect(page().form.value.nombre).toBe('Edificio Tarija');
    page().form.controls['nombre'].setValue('Edificio Tarija Centro');
    page().submit();

    const updateRequest = http.expectOne('/api/v1/propiedades/7');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({
      nombre: 'Edificio Tarija Centro',
      tipo: 'EDIFICIO',
      direccion: 'Av. Las Américas #450',
      ciudad: 'Tarija',
      referencia: 'Zona central',
      latitud: -21.535,
      longitud: -64.729,
      portadaUrl: 'https://cdn.orman.bo/edificio-tarija.webp',
      codperPropietaria: 3,
      inversionInicial: 3500000,
      estado: 0,
    });
    updateRequest.flush({ ...property, nombre: 'Edificio Tarija Centro' });

    expect(notification.success).toHaveBeenCalledWith('Propiedad actualizada correctamente.');
    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades/listar']);
  });

  it('loads an existing cover and does not touch it when the form has no cover changes', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    const coverRequest = http.expectOne('/api/v1/propiedades/7/portada');
    expect(coverRequest.request.method).toBe('GET');
    coverRequest.flush(new Blob(['cover'], { type: 'image/jpeg' }));
    fixture.detectChanges();

    page().submit();
    const updateRequest = http.expectOne('/api/v1/propiedades/7');
    updateRequest.flush(propertyWithCover);

    http.expectNone('/api/v1/propiedades/7/portada');
    expect(notification.success).toHaveBeenCalledWith('Propiedad actualizada correctamente.');
  });

  it('replaces an existing cover only after the property PUT succeeds', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));
    const file = new File(['png'], 'nueva-portada.png', { type: 'image/png' });

    page().handleCoverSelection(file);
    expect(page().coverChangesPending()).toBe(true);
    http.expectNone('/api/v1/propiedades/7/portada');

    page().submit();
    const updateRequest = http.expectOne('/api/v1/propiedades/7');
    updateRequest.flush(propertyWithCover);

    const uploadRequest = http.expectOne('/api/v1/propiedades/7/portada');
    expect(uploadRequest.request.body.get('foto')).toBe(file);
    uploadRequest.flush(null);

    expect(notification.success).toHaveBeenCalledWith('Propiedad actualizada correctamente.');
  });

  it('marks an existing cover for deletion without DELETE before Save', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));

    page().removeCover();

    expect(page().coverDeletePending()).toBe(true);
    expect(page().coverDisplayUrl()).toBeNull();
    http.expectNone('/api/v1/propiedades/7/portada');
  });

  it('discards a pending cover deletion when Cancelar is used', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));

    page().removeCover();
    page().cancel();

    expect(page().coverDeletePending()).toBe(false);
    expect(page().selectedCoverFile()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades/listar']);
    http.expectNone('/api/v1/propiedades/7/portada');
  });

  it('deletes an existing cover only after the property PUT succeeds', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));
    page().removeCover();
    page().submit();

    const updateRequest = http.expectOne('/api/v1/propiedades/7');
    updateRequest.flush(propertyWithCover);

    const deleteRequest = http.expectOne('/api/v1/propiedades/7/portada');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);

    expect(notification.success).toHaveBeenCalledWith('Propiedad actualizada correctamente.');
  });

  it('turns a pending deletion into a replacement when a new cover is selected', () => {
    createForm('7');
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    http.expectOne('/api/v1/propiedades/7/portada').flush(new Blob(['cover']));
    page().removeCover();
    const file = new File(['jpeg'], 'reemplazo.jpg', { type: 'image/jpeg' });

    page().handleCoverSelection(file);

    expect(page().coverDeletePending()).toBe(false);
    expect(page().selectedCoverFile()).toBe(file);
    page().submit();
    http.expectOne('/api/v1/propiedades/7').flush(propertyWithCover);
    const uploadRequest = http.expectOne('/api/v1/propiedades/7/portada');
    expect(uploadRequest.request.body.get('foto')).toBe(file);
    uploadRequest.flush(null);
  });

  it('discards a selected cover and releases its preview when Cancelar is used', () => {
    createForm();
    const file = new File(['jpeg'], 'portada.jpg', { type: 'image/jpeg' });
    page().handleCoverSelection(file);

    expect(page().coverDisplayUrl()).toBe('blob:property-form-cover');
    page().cancel();

    expect(page().selectedCoverFile()).toBeNull();
    expect(page().coverDisplayUrl()).toBeNull();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:property-form-cover');
  });

  it('does not repeat the property POST when a cover upload fails', () => {
    createForm();
    setValidValues();
    page().handleCoverSelection(new File(['jpeg'], 'portada.jpg', { type: 'image/jpeg' }));
    page().submit();

    const createRequest = http.expectOne('/api/v1/propiedades');
    createRequest.flush({ ...property, codprop: 8, estado: 1, codperPropietaria: 10 });
    http
      .expectOne('/api/v1/propiedades/8/portada')
      .flush({ detail: 'La imagen fue rechazada.' }, { status: 400, statusText: 'Bad Request' });

    expect(notification.warning).toHaveBeenCalledWith(
      'La propiedad se creó correctamente, pero no se pudo guardar la portada. Puedes intentarlo nuevamente desde Editar propiedad.',
    );
    expect(http.match('/api/v1/propiedades')).toHaveLength(0);
  });

  it('blocks editing after a not-found detail response', () => {
    createForm('7');
    http
      .expectOne('/api/v1/propiedades/7')
      .flush(
        { detail: 'La propiedad solicitada no existe.' },
        { status: 404, statusText: 'Not Found' },
      );
    fixture.detectChanges();

    expect(page().loadingError()).toBe('La propiedad solicitada no existe.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se puede editar la propiedad');
  });
});
