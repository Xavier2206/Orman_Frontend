import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad } from '../../models/propiedad.model';
import { PropiedadesListComponent } from './propiedades-list.component';

describe('PropiedadesListComponent', () => {
  let fixture: ComponentFixture<PropiedadesListComponent>;
  let http: HttpTestingController;
  const router = { navigate: vi.fn() };
  const notification = { success: vi.fn() };

  const property: Propiedad = {
    codprop: 7,
    nombre: 'Edificio Tarija',
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
    cantidadUnidades: 3,
    unidadesHabilitadas: 3,
    unidadesOcupadas: 0,
    ocupacion: 0,
  };

  const firstPage: PageResponse<Propiedad> = {
    content: [property],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  const summary = {
    inversionTotal: 3500,
    propiedadesActivas: 2,
    casasActivas: 1,
    edificiosActivos: 1,
    unidadesTotales: 7,
    unidadesHabilitadas: 6,
    unidadesNoHabilitadas: 1,
    unidadesOcupadas: 2,
    ocupacionGlobal: 33.33,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropiedadesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PropiedadesListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  function expectListRequest(
    expected: Partial<{
      readonly q: string | null;
      readonly tipo: string | null;
      readonly estado: string | null;
      readonly page: number;
    }> = {},
  ): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((request) => request.url === '/api/v1/propiedades');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe(expected.q ?? null);
    expect(request.request.params.get('tipo')).toBe(expected.tipo ?? null);
    expect(request.request.params.get('estado')).toBe(expected.estado ?? null);
    expect(request.request.params.get('page')).toBe(String(expected.page ?? 0));
    expect(request.request.params.get('size')).toBe('20');
    expect(request.request.params.get('sort')).toBe('nombre,asc');

    return request;
  }

  function expectSummaryRequest(): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne('/api/v1/propiedades/resumen');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toHaveLength(0);

    return request;
  }

  function flushInitial(
    page: PageResponse<Propiedad> = firstPage,
    summaryResponse = summary,
  ): void {
    fixture.detectChanges();
    expectListRequest().flush(page);
    expectSummaryRequest().flush(summaryResponse);
    fixture.detectChanges();
  }

  it('loads and renders the property list with the approved heading', () => {
    flushInitial();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Mis Propiedades');
    expect(fixture.nativeElement.textContent).toContain(
      'Gestiona y consulta tus propiedades inmobiliarias.',
    );
    expect(fixture.nativeElement.querySelectorAll('app-propiedad-card')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija');
    expect(fixture.nativeElement.textContent).toContain('3 Unidades');
  });

  it('shows the add property button and navigates to the shared create route', () => {
    flushInitial();

    const button = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
    ).find((candidate) => candidate.textContent?.includes('Añadir propiedad'));

    button?.click();

    expect(button).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades/nueva']);
  });

  it('navigates to the shared edit route when the card requests edition', () => {
    flushInitial();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Editar Edificio Tarija"]',
      ) as HTMLButtonElement
    ).click();

    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades', 7, 'editar']);
  });

  it('navigates to the property detail route when the card requests details', () => {
    flushInitial();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Ver detalle de Edificio Tarija"]',
      ) as HTMLButtonElement
    ).click();

    expect(router.navigate).toHaveBeenCalledWith(['/app/propiedades', 7, 'detalle']);
  });

  it('opens and cancels the deactivation confirmation without calling the API', () => {
    flushInitial();

    const deactivateButton = fixture.nativeElement.querySelector(
      '[aria-label="Desactivar propiedad"]',
    ) as HTMLButtonElement;

    deactivateButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Desactivar propiedad');

    (fixture.nativeElement.querySelector('.secondary-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    http.expectNone((request) => request.url.includes('/activar'));
    http.expectNone((request) => request.url.includes('/desactivar'));
  });

  it('deactivates a property after confirmation and refreshes the list and summary', () => {
    flushInitial();

    const component = fixture.componentInstance as never as {
      setStatus(value: string): void;
    };

    component.setStatus('1');
    expectListRequest({ estado: '1' }).flush(firstPage);
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Desactivar propiedad"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();

    const deactivateRequest = http.expectOne('/api/v1/propiedades/7/desactivar');
    expect(deactivateRequest.request.method).toBe('PATCH');
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.secondary-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    deactivateRequest.flush({ ...property, estado: 0 });

    expect(notification.success).toHaveBeenCalledWith('Propiedad desactivada correctamente.');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    expectSummaryRequest().flush({ ...summary, propiedadesActivas: 1 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron propiedades con los filtros aplicados.',
    );
  });

  it('opens the activation confirmation for an inactive property', () => {
    flushInitial({ ...firstPage, content: [{ ...property, estado: 0 }] });

    (
      fixture.nativeElement.querySelector('[aria-label="Activar propiedad"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Activar propiedad');
    expect(fixture.nativeElement.querySelector('.operation-activate')).toBeTruthy();

    (fixture.nativeElement.querySelector('.secondary-button') as HTMLButtonElement).click();
  });

  it('activates an inactive property after confirmation and refreshes the list and summary', () => {
    const inactiveProperty = { ...property, estado: 0 as const };
    flushInitial({ ...firstPage, content: [inactiveProperty] });

    (
      fixture.nativeElement.querySelector('[aria-label="Activar propiedad"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();

    const activateRequest = http.expectOne('/api/v1/propiedades/7/activar');
    expect(activateRequest.request.method).toBe('PATCH');
    activateRequest.flush({ ...inactiveProperty, estado: 1 });

    expect(notification.success).toHaveBeenCalledWith('Propiedad activada correctamente.');
    expectListRequest().flush(firstPage);
    expectSummaryRequest().flush({ ...summary, propiedadesActivas: 3 });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-label="Desactivar propiedad"]')).toBeTruthy();
  });

  it('keeps the status modal open and shows backend feedback on a status error', () => {
    flushInitial();

    (
      fixture.nativeElement.querySelector(
        '[aria-label="Desactivar propiedad"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.confirm-button') as HTMLButtonElement).click();

    http
      .expectOne('/api/v1/propiedades/7/desactivar')
      .flush(
        { detail: 'La propiedad no puede ser desactivada.' },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'La propiedad no puede ser desactivada.',
    );
    expect(notification.success).not.toHaveBeenCalled();
  });

  it('renders only the confirmed type and status filter options', () => {
    flushInitial();

    const pageElement = fixture.nativeElement as HTMLElement;

    pageElement.querySelector('#property-type-trigger')?.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(pageElement.querySelector('#property-type-options')?.textContent).toContain(
      'Todos los tipos',
    );
    expect(pageElement.querySelector('#property-type-options')?.textContent).toContain('Casa');
    expect(pageElement.querySelector('#property-type-options')?.textContent).toContain('Edificio');
    expect(pageElement.querySelector('#property-type-options')?.textContent).not.toContain(
      'Departamento',
    );

    pageElement.querySelector('#property-status-trigger')?.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();
    expect(pageElement.querySelector('#property-status-options')?.textContent).toContain(
      'Todos los estados',
    );
    expect(pageElement.querySelector('#property-status-options')?.textContent).toContain('Activa');
    expect(pageElement.querySelector('#property-status-options')?.textContent).toContain(
      'Inactiva',
    );
  });

  it('sends the type and numeric status values supported by the backend', () => {
    flushInitial();

    const component = fixture.componentInstance as never as {
      setType(value: string): void;
      setStatus(value: string): void;
    };

    component.setType('EDIFICIO');
    expectListRequest({ tipo: 'EDIFICIO' }).flush({
      ...firstPage,
      totalElements: 4,
      totalPages: 1,
    });

    component.setStatus('0');
    expectListRequest({ tipo: 'EDIFICIO', estado: '0' }).flush({
      ...firstPage,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron propiedades con los filtros aplicados.',
    );
  });

  it('does not send or render an independent city filter', () => {
    flushInitial();

    const pageElement = fixture.nativeElement as HTMLElement;

    expect(pageElement.querySelector('#property-city-trigger')).toBeNull();
    expect(pageElement.querySelector('#property-city-options')).toBeNull();
    expect(pageElement.querySelector('input[placeholder*=\"ciudad\"]')).toBeTruthy();
  });

  it('shows the empty state without advancing the future creation flow', () => {
    flushInitial({ ...firstPage, content: [], totalElements: 0, totalPages: 0 });

    const emptyState = fixture.nativeElement as HTMLElement;

    expect(emptyState.textContent).toContain('No existen propiedades registradas.');
    expect(emptyState.querySelector('.empty-state button')).toBeNull();
  });

  it('shows the API ProblemDetail in the error state', () => {
    fixture.detectChanges();
    expectListRequest().flush(
      { detail: 'No tienes permisos para consultar propiedades.' },
      { status: 403, statusText: 'Forbidden' },
    );
    expectSummaryRequest().flush(summary);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role=\"alert\"]')?.textContent).toContain(
      'No tienes permisos para consultar propiedades.',
    );
  });

  it('requests the summary when the page loads and renders all received metrics', () => {
    flushInitial();

    const pageElement = fixture.nativeElement as HTMLElement;

    expect(pageElement.textContent).toContain('Bs 3.500');
    expect(pageElement.textContent).toContain('2 Inmuebles');
    expect(pageElement.textContent).toContain('1 Edificio');
    expect(pageElement.textContent).toContain('1 Casa');
    expect(pageElement.textContent).toContain('7 Unidades');
    expect(pageElement.textContent).toContain('6 Habilitadas');
    expect(pageElement.textContent).toContain('1 No habilitada');
    expect(pageElement.textContent).toContain('33,33%');
    expect(pageElement.textContent).toContain('2 de 6 unidades habilitadas ocupadas');

    const progress = pageElement.querySelector('[role="progressbar"]');

    expect(progress?.getAttribute('aria-valuenow')).toBe('33.33');
    expect(progress?.querySelector('.summary-progress-value')).toBeTruthy();
  });

  it('keeps summary loading independent from the property list loading', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.summary-card-skeleton')).toHaveLength(4);
    expectListRequest().flush(firstPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-propiedad-card')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.summary-card-skeleton')).toHaveLength(4);

    expectSummaryRequest().flush(summary);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.summary-card')).toHaveLength(4);
  });

  it('keeps the property list available when the summary request fails', () => {
    fixture.detectChanges();
    expectListRequest().flush(firstPage);
    expectSummaryRequest().flush(
      { detail: 'No se pudo cargar el resumen de propiedades.' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo cargar el resumen de propiedades.',
    );
    expect(fixture.nativeElement.textContent).toContain('Edificio Tarija');
    expect(fixture.nativeElement.querySelectorAll('app-propiedad-card')).toHaveLength(1);
  });

  it('uses singular labels and an empty progress bar for zero occupancy', () => {
    const zeroSummary = {
      ...summary,
      propiedadesActivas: 1,
      casasActivas: 1,
      edificiosActivos: 0,
      unidadesTotales: 1,
      unidadesHabilitadas: 1,
      unidadesNoHabilitadas: 0,
      unidadesOcupadas: 0,
      ocupacionGlobal: 0,
    };

    flushInitial(firstPage, zeroSummary);

    expect(fixture.nativeElement.textContent).toContain('1 Inmueble');
    expect(fixture.nativeElement.textContent).toContain('1 Casa');
    expect(fixture.nativeElement.textContent).toContain('1 Unidad');
    expect(fixture.nativeElement.textContent).toContain('1 Habilitada');
    expect(fixture.nativeElement.textContent).toContain('0 No habilitadas');
    expect(fixture.nativeElement.textContent).toContain('0%');

    const progressValue = fixture.nativeElement.querySelector(
      '.summary-progress-value',
    ) as HTMLElement;

    expect(progressValue.style.width).toBe('0%');
  });

  it('renders a full progress bar when occupancy is one hundred percent', () => {
    flushInitial(firstPage, {
      ...summary,
      unidadesHabilitadas: 2,
      unidadesOcupadas: 2,
      ocupacionGlobal: 100,
    });

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]');
    const progressValue = fixture.nativeElement.querySelector(
      '.summary-progress-value',
    ) as HTMLElement;

    expect(progress?.getAttribute('aria-valuenow')).toBe('100');
    expect(progressValue.style.width).toBe('100%');
    expect(fixture.nativeElement.textContent).toContain('100%');
  });

  it('loads the summary once and does not reload it for filters or pagination', () => {
    vi.useFakeTimers();
    flushInitial({ ...firstPage, totalElements: 21, totalPages: 2, last: false });

    const component = fixture.componentInstance as never as {
      search(event: Event): void;
      setType(value: string): void;
      setStatus(value: string): void;
      clearFilters(): void;
      changePage(page: number): void;
    };

    component.setType('CASA');
    expectListRequest({ tipo: 'CASA' }).flush(firstPage);
    component.setStatus('1');
    expectListRequest({ tipo: 'CASA', estado: '1' }).flush(firstPage);
    component.clearFilters();
    expectListRequest().flush({ ...firstPage, totalElements: 21, totalPages: 2, last: false });

    const searchEvent = new Event('input');
    Object.defineProperty(searchEvent, 'target', { value: { value: 'tarija' } });
    component.search(searchEvent);
    vi.advanceTimersByTime(350);
    expectListRequest({ q: 'tarija' }).flush({
      ...firstPage,
      totalElements: 21,
      totalPages: 2,
      last: false,
    });

    component.changePage(1);
    expectListRequest({ q: 'tarija', page: 1 }).flush({
      ...firstPage,
      page: 1,
      totalElements: 21,
      totalPages: 2,
      first: false,
      last: true,
    });

    http.expectNone('/api/v1/propiedades/resumen');
  });

  it('debounces remote property searches and sends the confirmed query parameter', () => {
    vi.useFakeTimers();
    flushInitial();

    const search = fixture.nativeElement.querySelector('#property-search') as HTMLInputElement;

    search.value = 'tarija';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(349);
    http.expectNone(
      (request) => request.url === '/api/v1/propiedades' && request.params.get('q') === 'tarija',
    );

    vi.advanceTimersByTime(1);
    expectListRequest({ q: 'tarija' }).flush(firstPage);
  });

  it('ignores a debounced search invalidated by a newer filter selection', () => {
    vi.useFakeTimers();
    flushInitial();

    const search = fixture.nativeElement.querySelector('#property-search') as HTMLInputElement;

    search.value = 'tarija';
    search.dispatchEvent(new Event('input'));
    (fixture.componentInstance as never as { setType(value: string): void }).setType('CASA');
    expectListRequest({ q: 'tarija', tipo: 'CASA' }).flush({
      ...firstPage,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    vi.advanceTimersByTime(350);

    http.expectNone('/api/v1/propiedades');
  });

  it('clears all filters and requests the first server page', () => {
    flushInitial();

    const component = fixture.componentInstance as never as {
      clearFilters(): void;
      setType(value: string): void;
      setStatus(value: string): void;
    };

    component.setType('CASA');
    expectListRequest({ tipo: 'CASA' }).flush(firstPage);
    component.setStatus('1');
    expectListRequest({ tipo: 'CASA', estado: '1' }).flush(firstPage);

    component.clearFilters();
    expectListRequest().flush(firstPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#property-type-trigger')?.textContent).toContain(
      'Todos los tipos',
    );
    expect(fixture.nativeElement.querySelector('#property-status-trigger')?.textContent).toContain(
      'Todos los estados',
    );
  });

  it('shows the compact server pagination summary and preserves filters', () => {
    flushInitial({
      ...firstPage,
      totalElements: 21,
      totalPages: 2,
      last: false,
    });

    const pagination = fixture.nativeElement.querySelector('nav') as HTMLElement;

    expect(pagination.textContent).toContain('Mostrando 1 de 21 propiedades');
    expect(pagination.textContent).toContain('Página 1 de 2');

    const nextButton = Array.from(
      pagination.querySelectorAll('.page-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Siguiente'));

    nextButton?.click();
    expectListRequest({ page: 1 }).flush({
      ...firstPage,
      page: 1,
      totalElements: 21,
      totalPages: 2,
      first: false,
      last: true,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(
      (fixture.nativeElement.querySelector('[aria-label=\"Página anterior\"]') as HTMLButtonElement)
        .disabled,
    ).toBe(false);
  });
});
