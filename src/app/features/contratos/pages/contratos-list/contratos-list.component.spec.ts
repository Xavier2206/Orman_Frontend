import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageResponse } from '../../../personas/models/persona.model';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadResponse } from '../../../unidades/models/unidad.model';
import { Contrato, ContratoResumen } from '../../models/contrato.model';
import { ContratosListComponent } from './contratos-list.component';

describe('ContratosListComponent', () => {
  let fixture: ComponentFixture<ContratosListComponent>;
  let http: HttpTestingController;

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

  const secondProperty: Propiedad = {
    ...property,
    codprop: 20,
    nombre: 'Casa Norte',
  };

  const unit: UnidadResponse = {
    coduni: 25,
    codprop: 10,
    nombre: 'Departamento 1A',
    tipoUnidad: 'DEPARTAMENTO',
    descripcion: null,
    area: 80,
    dormitorios: 2,
    banos: 1,
    piso: 1,
    ubicacionInterna: null,
    precioBase: 2500,
    estadoOperativo: 1,
    disponibleParaContrato: true,
  };

  const secondUnit: UnidadResponse = {
    ...unit,
    coduni: 26,
    nombre: 'Departamento 2A',
  };

  const contracts: readonly Contrato[] = [
    {
      codcon: 1,
      coduni: 25,
      codperInquilino: 31,
      fechaInicio: '2026-01-01',
      fechaFin: '2027-01-01',
      montoMensual: 1500,
      moneda: 'BOB',
      garantia: 1500,
      estado: 'VIGENTE',
      fechaRegistro: '2025-12-15T10:00:00',
      fechaRescision: null,
      motivoRescision: null,
      inquilino: {
        codper: 31,
        nombreCompleto: 'Juan Pérez',
        ci: '1234567',
      },
      propiedad: {
        codprop: 10,
        nombre: 'Edificio Central',
      },
      unidad: {
        coduni: 25,
        nombre: 'Departamento 1A',
        tipoUnidad: 'DEPARTAMENTO',
        descripcion: null,
        piso: 1,
      },
      cuotas: {
        totalCuotas: 12,
        cuotasPagadas: 8,
        cuotasPendientes: 4,
        saldoPendiente: 6000,
      },
    },
  ];

  const secondContract: Contrato = {
    ...contracts[0],
    codcon: 2,
    coduni: 26,
    propiedad: {
      codprop: 20,
      nombre: 'Casa Norte',
    },
    unidad: {
      ...contracts[0].unidad!,
      coduni: 26,
      nombre: 'Departamento 2A',
    },
  };

  const page: PageResponse<Contrato> = {
    content: contracts,
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  const resumen: ContratoResumen = {
    vigentes: 4,
    programados: 2,
    finalizados: 7,
    rescindidos: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratosListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ContratosListComponent);
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  function propertyPage(properties: readonly Propiedad[] = [property]): PageResponse<Propiedad> {
    return {
      content: properties,
      page: 0,
      size: 100,
      totalElements: properties.length,
      totalPages: 1,
      first: true,
      last: true,
    };
  }

  function unitPage(units: readonly UnidadResponse[] = [unit]): PageResponse<UnidadResponse> {
    return {
      content: units,
      page: 0,
      size: 100,
      totalElements: units.length,
      totalPages: units.length > 0 ? 1 : 0,
      first: true,
      last: true,
    };
  }

  function flushInitialData(response = page, properties = [property]): void {
    fixture.detectChanges();

    http
      .expectOne((request) => request.url === '/api/v1/contratos' && !request.params.has('estado'))
      .flush(response);

    http.expectOne('/api/v1/contratos/resumen').flush(resumen);

    http
      .expectOne((request) => request.url === '/api/v1/propiedades')
      .flush(propertyPage(properties));

    fixture.detectChanges();
  }

  function selectCatalogFilter(filter: 'property' | 'unit', value: number | null): void {
    const select = fixture.nativeElement.querySelector(
      `#contract-${filter}-select`,
    ) as HTMLSelectElement;

    select.value = value === null ? '' : `${value}`;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function selectState(index: number): void {
    const trigger = fixture.nativeElement.querySelector(
      '#contract-status-trigger',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector(
      `[data-filter="status"][data-index="${index}"]`,
    ) as HTMLButtonElement;
    option.click();
    fixture.detectChanges();
  }

  function expectUnitRequest(codprop: number) {
    return http.expectOne(
      (request) =>
        request.url === `/api/v1/propiedades/${codprop}/unidades` &&
        request.params.get('page') === '0',
    );
  }

  it('listado carga contratos: renders enriched card data and filters', () => {
    flushInitialData();

    expect(fixture.nativeElement.textContent).toContain('Contratos');
    expect(fixture.nativeElement.textContent).toContain('VIGENTES');
    expect(fixture.nativeElement.textContent).toContain('PROGRAMADOS');
    expect(fixture.nativeElement.textContent).toContain('FINALIZADOS');
    expect(fixture.nativeElement.textContent).toContain('RESCINDIDOS');
    expect(fixture.nativeElement.textContent).toContain('Actualmente en curso');
    expect(fixture.nativeElement.textContent).toContain('Inicios confirmados');
    expect(fixture.nativeElement.textContent).toContain('Cumplidos sin deuda');
    expect(fixture.nativeElement.textContent).toContain('Conclusión anticipada');
    expect(fixture.nativeElement.querySelectorAll('.contract-summary-card')).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('Juan Pérez');
    expect(fixture.nativeElement.textContent).toContain('CI 1234567');
    expect(fixture.nativeElement.textContent).toContain('Edificio Central');
    expect(fixture.nativeElement.textContent).toContain('Departamento 1A');
    expect(fixture.nativeElement.textContent).toContain('Piso 1 · DEPARTAMENTO');
    expect(fixture.nativeElement.textContent).toContain('Vigente');
    expect(fixture.nativeElement.textContent).toContain('8 de 12 cuotas pagadas');
    expect(fixture.nativeElement.textContent).toContain('Pendientes');
    expect(fixture.nativeElement.textContent).toContain('4');
    expect(fixture.nativeElement.textContent).toContain('Saldo pendiente');
    expect(fixture.nativeElement.textContent).toContain('Bs 6.000,00');
    expect(fixture.nativeElement.textContent).toContain('12 meses');
  });

  it('búsqueda q funciona: debounces and sends q to contracts api', () => {
    vi.useFakeTimers();
    flushInitialData();

    const searchInput = fixture.nativeElement.querySelector('#contract-search') as HTMLInputElement;

    searchInput.value = 'Juan';
    searchInput.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    const searchRequest = http.expectOne(
      (request) => request.url === '/api/v1/contratos' && request.params.get('q') === 'Juan',
    );
    expect(searchRequest.request.params.get('page')).toBe('0');
    searchRequest.flush(page);
    fixture.detectChanges();
  });

  it('filtro estado: sends estado to contracts api', () => {
    flushInitialData();
    selectState(1);

    const stateRequest = http.expectOne(
      (request) =>
        request.url === '/api/v1/contratos' && request.params.get('estado') === 'VIGENTE',
    );
    stateRequest.flush(page);
    fixture.detectChanges();
  });

  it('selección propiedad carga unidades: sends codprop and populates unit selector', () => {
    flushInitialData();
    selectCatalogFilter('property', 10);

    const contractRequest = http.expectOne(
      (request) => request.url === '/api/v1/contratos' && request.params.get('codprop') === '10',
    );
    expect(contractRequest.request.params.has('coduni')).toBe(false);
    contractRequest.flush({ ...page, content: [], totalElements: 0, totalPages: 0 });

    const unitsRequest = expectUnitRequest(10);
    expect(unitsRequest.request.params.get('size')).toBe('100');
    unitsRequest.flush(unitPage([unit, secondUnit]));
    fixture.detectChanges();

    const unitSelect = fixture.nativeElement.querySelector(
      '#contract-unit-select',
    ) as HTMLSelectElement;
    expect(unitSelect.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Departamento 1A');
  });

  it('unidad inicia bloqueada: displays placeholder when no property is selected', () => {
    flushInitialData();

    const unitSelect = fixture.nativeElement.querySelector(
      '#contract-unit-select',
    ) as HTMLSelectElement;

    expect(fixture.nativeElement.querySelector('#contract-property-select')).not.toBeNull();
    expect(unitSelect.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Seleccione una propiedad primero');
    expect(http.match((request) => request.url.includes('/unidades'))).toHaveLength(0);
  });

  it('cambio de propiedad limpia unidad: clears previous unit and fetches new catalog', () => {
    flushInitialData(page, [property, secondProperty]);
    selectCatalogFilter('property', 10);
    http
      .expectOne(
        (request) => request.url === '/api/v1/contratos' && request.params.get('codprop') === '10',
      )
      .flush(page);
    expectUnitRequest(10).flush(unitPage());
    fixture.detectChanges();

    selectCatalogFilter('unit', 25);
    const unitContractRequest = http.expectOne(
      (request) =>
        request.url === '/api/v1/contratos' &&
        request.params.get('codprop') === '10' &&
        request.params.get('coduni') === '25',
    );
    unitContractRequest.flush(page);
    fixture.detectChanges();

    selectCatalogFilter('property', 20);
    const newPropertyRequest = http.expectOne(
      (request) => request.url === '/api/v1/contratos' && request.params.get('codprop') === '20',
    );
    expect(newPropertyRequest.request.params.has('coduni')).toBe(false);
    newPropertyRequest.flush({ ...page, content: [secondContract] });

    expectUnitRequest(20).flush(unitPage([secondUnit]));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Casa Norte');
    expect(fixture.nativeElement.textContent).not.toContain('Departamento 1A');
    expect(fixture.nativeElement.textContent).toContain('Seleccione una unidad');
  });

  it('envío correcto de query params: combines q, codprop, coduni and estado', () => {
    vi.useFakeTimers();
    flushInitialData();

    const searchInput = fixture.nativeElement.querySelector('#contract-search') as HTMLInputElement;
    searchInput.value = 'Juan';
    searchInput.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    http
      .expectOne(
        (request) => request.url === '/api/v1/contratos' && request.params.get('q') === 'Juan',
      )
      .flush(page);
    fixture.detectChanges();

    selectCatalogFilter('property', 10);
    http
      .expectOne(
        (request) =>
          request.url === '/api/v1/contratos' &&
          request.params.get('q') === 'Juan' &&
          request.params.get('codprop') === '10',
      )
      .flush(page);
    expectUnitRequest(10).flush(unitPage());
    fixture.detectChanges();

    selectCatalogFilter('unit', 25);
    http
      .expectOne(
        (request) =>
          request.url === '/api/v1/contratos' &&
          request.params.get('q') === 'Juan' &&
          request.params.get('codprop') === '10' &&
          request.params.get('coduni') === '25',
      )
      .flush(page);
    fixture.detectChanges();

    selectState(1);
    const fullRequest = http.expectOne(
      (candidate) =>
        candidate.url === '/api/v1/contratos' &&
        candidate.params.get('q') === 'Juan' &&
        candidate.params.get('codprop') === '10' &&
        candidate.params.get('coduni') === '25' &&
        candidate.params.get('estado') === 'VIGENTE',
    );
    fullRequest.flush(page);
  });

  it('acciones visibles según estado: shows all actions for VIGENTE and only visibility for others', () => {
    const multiStatePage: PageResponse<Contrato> = {
      content: [
        { ...contracts[0], codcon: 1, estado: 'VIGENTE' },
        { ...contracts[0], codcon: 2, estado: 'PROGRAMADO' },
        { ...contracts[0], codcon: 3, estado: 'FINALIZADO' },
        { ...contracts[0], codcon: 4, estado: 'RESCINDIDO' },
      ],
      page: 0,
      size: 20,
      totalElements: 4,
      totalPages: 1,
      first: true,
      last: true,
    };

    flushInitialData(multiStatePage);

    const cards = fixture.nativeElement.querySelectorAll('.contract-card');
    expect(cards).toHaveLength(4);

    const cardVigente = cards[0];
    expect(cardVigente.querySelector('.action-view')).not.toBeNull();
    expect(cardVigente.querySelector('.action-payment')).not.toBeNull();
    expect(cardVigente.querySelector('.action-finish')).not.toBeNull();
    expect(cardVigente.querySelector('.action-rescind')).not.toBeNull();

    const cardProgramado = cards[1];
    expect(cardProgramado.querySelector('.action-view')).not.toBeNull();
    expect(cardProgramado.querySelector('.action-payment')).toBeNull();
    expect(cardProgramado.querySelector('.action-finish')).toBeNull();
    expect(cardProgramado.querySelector('.action-rescind')).toBeNull();

    const cardFinalizado = cards[2];
    expect(cardFinalizado.querySelector('.action-view')).not.toBeNull();
    expect(cardFinalizado.querySelector('.action-payment')).toBeNull();
    expect(cardFinalizado.querySelector('.action-finish')).toBeNull();
    expect(cardFinalizado.querySelector('.action-rescind')).toBeNull();

    const cardRescindido = cards[3];
    expect(cardRescindido.querySelector('.action-view')).not.toBeNull();
    expect(cardRescindido.querySelector('.action-payment')).toBeNull();
    expect(cardRescindido.querySelector('.action-finish')).toBeNull();
    expect(cardRescindido.querySelector('.action-rescind')).toBeNull();
  });

  it('responsive básico: grid uses 1 column on mobile and 2 columns on desktop', () => {
    flushInitialData();

    const summaryGrid = fixture.nativeElement.querySelector('.contract-summary-grid');
    const grid = fixture.nativeElement.querySelector('.contract-grid');

    expect(summaryGrid.classList.contains('contract-summary-grid')).toBe(true);
    expect(grid).not.toBeNull();
    expect(grid.classList.contains('grid-cols-1')).toBe(true);
    expect(grid.classList.contains('md:grid-cols-2')).toBe(true);
  });

  it('shows empty state without filters and with filters', () => {
    flushInitialData({ ...page, content: [], totalElements: 0, totalPages: 0 });

    expect(fixture.nativeElement.textContent).toContain('No hay contratos registrados');

    selectState(1);
    const req = http.expectOne(
      (request) =>
        request.url === '/api/v1/contratos' && request.params.get('estado') === 'VIGENTE',
    );
    req.flush({ ...page, content: [], totalElements: 0, totalPages: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No encontramos contratos con estos filtros',
    );
  });
});
