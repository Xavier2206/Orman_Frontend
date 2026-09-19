import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadEstadoOperativo, UnidadResponse } from '../../models/unidad.model';
import { UnidadesListComponent } from './unidades-list.component';

describe('UnidadesListComponent', () => {
  let fixture: ComponentFixture<UnidadesListComponent>;
  let http: HttpTestingController;
  let routeQueryParams$: BehaviorSubject<ParamMap>;
  const router = { navigate: vi.fn() };
  const notification = { success: vi.fn() };
  const route = {
    queryParamMap: null as unknown as BehaviorSubject<ParamMap>,
  };

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

  const secondProperty: Propiedad = {
    ...property,
    codprop: 162,
    nombre: 'Casa Norte',
    tipo: 'CASA',
  };

  const unit: UnidadResponse = {
    coduni: 501,
    codprop: 161,
    nombre: 'Unidad 101',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: null,
    area: 45.5,
    dormitorios: 1,
    banos: 1,
    piso: 1,
    ubicacionInterna: 'Torre A',
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  const secondUnit: UnidadResponse = {
    ...unit,
    coduni: 502,
    nombre: 'Unidad 102',
    estadoOperativo: 0,
  };

  beforeEach(async () => {
    routeQueryParams$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
    route.queryParamMap = routeQueryParams$;

    await TestBed.configureTestingModule({
      imports: [UnidadesListComponent],
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
    fixture = TestBed.createComponent(UnidadesListComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function expectPropertyRequest(page = 0): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/propiedades' && candidate.params.get('page') === String(page),
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('size')).toBe('100');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('q')).toBeNull();
    expect(request.request.params.get('tipo')).toBeNull();
    expect(request.request.params.get('estado')).toBeNull();

    return request;
  }

  function expectUnitRequest(
    codprop: number,
    page = 0,
    estadoOperativo: UnidadEstadoOperativo | null = null,
  ): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne(
      (candidate) => candidate.url === `/api/v1/propiedades/${codprop}/unidades`,
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe(String(page));
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('estadoOperativo')).toBe(
      estadoOperativo === null ? null : String(estadoOperativo),
    );

    return request;
  }

  function pageResponse<T>(
    content: readonly T[],
    page = 0,
    totalPages = 1,
    totalElements = content.length,
  ): PageResponse<T> {
    return {
      content,
      page,
      size: 20,
      totalElements,
      totalPages,
      first: page === 0,
      last: totalPages === 0 || page === totalPages - 1,
    };
  }

  function flushProperties(properties: readonly Propiedad[] = [property]): void {
    expectPropertyRequest().flush(pageResponse(properties));
    fixture.detectChanges();
  }

  function selectProperty(codprop: number): void {
    const select = fixture.nativeElement.querySelector(
      '#unit-property-select',
    ) as HTMLSelectElement;

    select.value = String(codprop);
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function selectStatus(value: string): void {
    const select = fixture.nativeElement.querySelector('#unit-status-select') as HTMLSelectElement;

    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function statusButton(label: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`[aria-label="${label}"]`) as HTMLButtonElement;
  }

  function confirmStatus(label: string): void {
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector(
      'app-unidad-status-confirm-modal',
    ) as HTMLElement;
    const button = Array.from(modal.querySelectorAll('button')).find((candidate) =>
      candidate.textContent?.includes(label),
    ) as HTMLButtonElement;

    button.click();
  }

  it('shows the initial state without requesting units before a property is selected', () => {
    flushProperties();

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('h1')?.textContent?.trim()).toBe('Unidades');
    expect(page.textContent).toContain('Selecciona una propiedad');
    expect(page.textContent).toContain(
      'Elige una propiedad para consultar y gestionar sus unidades.',
    );
    expect(page.querySelector('#unit-property-select')).toBeTruthy();
    expect(http.match((request) => request.url.includes('/unidades'))).toHaveLength(0);
  });

  it('loads every property page for the selector using the maximum supported size', () => {
    expectPropertyRequest().flush(pageResponse([property], 0, 2, 2));
    expectPropertyRequest(1).flush(pageResponse([secondProperty], 1, 2, 2));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll(
      '#unit-property-select option',
    ) as NodeListOf<HTMLOptionElement>;

    expect(options).toHaveLength(3);
    expect(options[1].textContent?.trim()).toBe('Edificio Central');
    expect(options[2].textContent?.trim()).toBe('Casa Norte');
  });

  it('selects a property and requests its first unit page with the confirmed endpoint', () => {
    flushProperties();
    selectProperty(161);

    const request = expectUnitRequest(161);

    request.flush(pageResponse([unit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Unidad 101');
  });

  it('requests operational and non-operational units from the backend', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit, secondUnit]));
    fixture.detectChanges();

    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([unit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-unidad-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Unidad 101');
    expect(fixture.nativeElement.textContent).not.toContain('Unidad 102');
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 1 unidades');

    selectStatus('non-operational');
    expectUnitRequest(161, 0, 0).flush(pageResponse([secondUnit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-unidad-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).not.toContain('Unidad 101');
    expect(fixture.nativeElement.textContent).toContain('Unidad 102');
    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 1 unidades');
  });

  it('renders PageResponse.content without applying local status filtering', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([secondUnit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-unidad-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Unidad 102');
  });

  it('clears the property and status filters and returns to the initial state', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit, secondUnit]));
    fixture.detectChanges();
    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([unit]));
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector(
      '.clear-filters-button',
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#unit-property-select') as HTMLSelectElement).value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('#unit-status-select') as HTMLSelectElement).value,
    ).toBe('all');
    expect(fixture.nativeElement.textContent).toContain('Selecciona una propiedad');
    expect(fixture.nativeElement.querySelectorAll('app-unidad-card')).toHaveLength(0);
  });

  it('uses the backend empty response for a selected status', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectStatus('non-operational');
    expectUnitRequest(161, 0, 0).flush(pageResponse([], 0, 0, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay unidades no operativas para esta propiedad.',
    );
    expect(fixture.nativeElement.textContent).toContain('Mostrar todas');
    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeNull();
  });

  it('shows the add unit button and preserves the selected property context', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([]));
    fixture.detectChanges();

    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Añadir unidad'));

    addButton?.click();

    expect(addButton).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/nueva'], {
      queryParams: { codprop: 161 },
    });
  });

  it('allows entering the create screen without a selected property', () => {
    flushProperties();

    const addButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Añadir unidad'));

    addButton?.click();

    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades/nueva']);
  });

  it('navigates to edit and detail when a unit card emits its actions', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[aria-label="Editar Unidad 101"]') as HTMLButtonElement
    ).click();
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades', 501, 'editar'], {
      queryParams: { codprop: 161 },
    });

    router.navigate.mockClear();
    (
      fixture.nativeElement.querySelector(
        '[aria-label="Ver detalle de Unidad 101"]',
      ) as HTMLButtonElement
    ).click();
    expect(router.navigate).toHaveBeenCalledWith(['/app/unidades', 501, 'detalle'], {
      queryParams: { codprop: 161 },
    });
  });

  it('shows the state action, opens the confirmation modal and does not call the API on cancel', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit, secondUnit]));
    fixture.detectChanges();

    statusButton('Desactivar Unidad 101').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unidad-status-confirm-modal')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Desactivar unidad');
    confirmStatus('Cancelar');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unidad-status-confirm-modal')).toBeNull();
    expect(http.match((request) => request.url.includes('/activar'))).toHaveLength(0);
    expect(http.match((request) => request.url.includes('/desactivar'))).toHaveLength(0);
  });

  it('uses the activation PATCH and refreshes the current page with the selected filter', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([secondUnit]));
    fixture.detectChanges();

    statusButton('Activar Unidad 102').click();
    confirmStatus('Activar');

    const activateRequest = http.expectOne('/api/v1/unidades/502/activar');
    expect(activateRequest.request.method).toBe('PATCH');
    activateRequest.flush({ ...secondUnit, estadoOperativo: 1 });
    fixture.detectChanges();

    const refreshedRequest = expectUnitRequest(161);
    refreshedRequest.flush(pageResponse([{ ...secondUnit, estadoOperativo: 1 }]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('OPERATIVA');
    expect(statusButton('Desactivar Unidad 102')).toBeTruthy();
    expect(notification.success).toHaveBeenCalledWith('Unidad activada correctamente.');
  });

  it('keeps an operational unit unchanged and shows the backend 422 detail', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    statusButton('Desactivar Unidad 101').click();
    confirmStatus('Desactivar');

    http.expectOne('/api/v1/unidades/501/desactivar').flush(
      {
        detail: 'No se puede desactivar la unidad porque tiene un contrato vigente.',
        errorCode: 'BUSINESS_RULE_VIOLATION',
      },
      { status: 422, statusText: 'Unprocessable Content' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se puede desactivar la unidad porque tiene un contrato vigente.',
    );
    expect(fixture.nativeElement.textContent).toContain('OPERATIVA');
    expect(statusButton('Desactivar Unidad 101')).toBeTruthy();
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('removes a deactivated unit from the operational filter after refreshing the current page', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([unit], 0, 1, 1));
    fixture.detectChanges();

    statusButton('Desactivar Unidad 101').click();
    confirmStatus('Desactivar');
    http.expectOne('/api/v1/unidades/501/desactivar').flush({ ...unit, estadoOperativo: 0 });
    fixture.detectChanges();

    const refreshedRequest = expectUnitRequest(161, 0, 1);
    refreshedRequest.flush(pageResponse([], 0, 0, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay unidades operativas para esta propiedad.',
    );
    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeNull();
  });

  it('removes an activated unit from the non-operational filter after refreshing the current page', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([secondUnit]));
    fixture.detectChanges();

    selectStatus('non-operational');
    expectUnitRequest(161, 0, 0).flush(pageResponse([secondUnit], 0, 1, 1));
    fixture.detectChanges();

    statusButton('Activar Unidad 102').click();
    confirmStatus('Activar');
    http.expectOne('/api/v1/unidades/502/activar').flush({ ...secondUnit, estadoOperativo: 1 });
    fixture.detectChanges();

    const refreshedRequest = expectUnitRequest(161, 0, 0);
    refreshedRequest.flush(pageResponse([], 0, 0, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No hay unidades no operativas para esta propiedad.',
    );
    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeNull();
  });

  it('renders the unit list without filters, summaries, or unsupported occupancy data', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit, secondUnit]));
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;

    expect(page.querySelector('input')).toBeNull();
    expect(page.textContent).not.toContain('Resumen');
    expect(page.textContent).not.toMatch(/ocupaci|ocupad|disponib/i);
    expect(page.querySelectorAll('app-unidad-card')).toHaveLength(2);
  });

  it('shows the empty state returned by backend for a property without units', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([], 0, 0, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Esta propiedad todavía no tiene unidades registradas.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Cuando registres unidades para esta propiedad aparecerán aquí.',
    );
    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeNull();
  });

  it('shows a backend error and allows retrying the unit request', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(
      { detail: 'No pudimos cargar las unidades.', status: 403 },
      { status: 403, statusText: 'Forbidden' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar las unidades.');

    const retry = fixture.nativeElement.querySelector('.error-state button') as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();

    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unidad-card')).toBeTruthy();
  });

  it('shows a property loading error and allows reloading the selector catalog', () => {
    expectPropertyRequest().flush(
      { detail: 'No fue posible cargar las propiedades.', status: 500 },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No fue posible cargar las propiedades.');

    const retry = fixture.nativeElement.querySelector(
      '.property-selector-error button',
    ) as HTMLButtonElement;
    retry.click();
    fixture.detectChanges();

    expectPropertyRequest().flush(pageResponse([property]));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#unit-property-select')).toBeTruthy();
  });

  it('paginates unit pages while preserving the selected property and default sort', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit], 0, 2, 21));
    fixture.detectChanges();

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Página siguiente"]',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expectUnitRequest(161, 1).flush(pageResponse([secondUnit], 1, 2, 21));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 21 unidades');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(
      (fixture.nativeElement.querySelector('[aria-label="Página anterior"]') as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });

  it('preserves the selected status when changing unit pages', () => {
    flushProperties();
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([unit], 0, 2, 21));
    fixture.detectChanges();

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Página siguiente"]',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expectUnitRequest(161, 1, 1).flush(pageResponse([unit], 1, 2, 21));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mostrando 1 de 21 unidades');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
  });

  it('reconstructs property, status and page from query params without duplicate requests', () => {
    flushProperties();

    routeQueryParams$.next(convertToParamMap({ codprop: '161', estadoOperativo: '1', page: '1' }));
    fixture.detectChanges();

    expectUnitRequest(161, 1, 1).flush(pageResponse([unit], 1, 2, 21));
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#unit-property-select') as HTMLSelectElement).value,
    ).toBe('161');
    expect(
      (fixture.nativeElement.querySelector('#unit-status-select') as HTMLSelectElement).value,
    ).toBe('operational');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(http.match((request) => request.url.includes('/unidades'))).toHaveLength(0);
  });

  it('falls back safely when query params are invalid', () => {
    flushProperties();

    routeQueryParams$.next(
      convertToParamMap({ codprop: 'not-a-property', estadoOperativo: '9', page: '-1' }),
    );
    fixture.detectChanges();

    expect(
      (fixture.nativeElement.querySelector('#unit-property-select') as HTMLSelectElement).value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('#unit-status-select') as HTMLSelectElement).value,
    ).toBe('all');
    expect(http.match((request) => request.url.includes('/unidades'))).toHaveLength(0);
  });

  it('resets the unit page to zero when the property changes', () => {
    flushProperties([property, secondProperty]);
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit], 0, 2, 21));
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector('[aria-label="Página siguiente"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expectUnitRequest(161, 1).flush(pageResponse([secondUnit], 1, 2, 21));
    fixture.detectChanges();

    selectProperty(162);
    const request = expectUnitRequest(162, 0);

    expect(request.request.params.get('page')).toBe('0');
    request.flush(pageResponse([], 0, 0, 0));
  });

  it('preserves the selected status when changing property', () => {
    flushProperties([property, secondProperty]);
    selectProperty(161);
    expectUnitRequest(161).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectStatus('operational');
    expectUnitRequest(161, 0, 1).flush(pageResponse([unit]));
    fixture.detectChanges();

    selectProperty(162);
    const request = expectUnitRequest(162, 0, 1);

    request.flush(pageResponse([unit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Casa Norte');
  });

  it('cancels the previous unit request when the property changes', () => {
    flushProperties([property, secondProperty]);
    selectProperty(161);
    const firstRequest = expectUnitRequest(161);

    selectProperty(162);
    expect(firstRequest.cancelled).toBe(true);
    expectUnitRequest(162).flush(pageResponse([secondUnit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unidad 102');
  });
});
