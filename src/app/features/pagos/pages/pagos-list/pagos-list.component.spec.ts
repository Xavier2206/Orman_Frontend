import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { CuotaListado } from '../../models/cuota-listado.model';
import { PagosListComponent } from './pagos-list.component';

describe('PagosListComponent', () => {
  let http: HttpTestingController;
  let notification: { success: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notification = { success: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [PagosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads catalogs and requests the first page of cuotas without optional filters', () => {
    const fixture = createPage();

    expect(fixture.nativeElement.textContent).toContain('Gestión de pagos');
    expect(fixture.nativeElement.textContent).toContain('No hay cuotas para mostrar');
    expect(fixture.nativeElement.querySelectorAll('.payments-empty').length).toBe(1);
    expect(
      fixture.nativeElement.querySelector('nav[aria-label="Paginación de cuotas"]'),
    ).toBeNull();
  });

  it('shows loading and a safe ProblemDetail message when the cuotas request fails', () => {
    const fixture = startPage();

    const loading = fixture.nativeElement.querySelector('[role="status"][aria-busy="true"]');
    expect(loading.textContent).toContain('Cargando cuotas');
    flushCatalogRequests();

    http
      .expectOne('/api/v1/cuotas?page=0&size=20')
      .flush(
        { detail: 'No fue posible consultar las cuotas.', traceId: 'internal-trace' },
        { status: 500, statusText: 'Internal Server Error' },
      );
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(error.textContent).toContain('No fue posible consultar las cuotas.');
    expect(error.textContent).not.toContain('internal-trace');
  });

  it('converts the selected month into an API period and keeps it while paging', () => {
    const fixture = createPage(pageWithQuota(0, 2));
    const month = fixture.nativeElement.querySelector('#payment-period') as HTMLInputElement;
    month.value = '2026-09';
    month.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();

    const filteredRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(filteredRequest.request.params.get('periodo')).toBe('2026-09-01');
    expect(filteredRequest.request.params.get('page')).toBe('0');
    filteredRequest.flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    const nextButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Siguiente'),
    ) as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();

    const nextRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(nextRequest.request.params.get('periodo')).toBe('2026-09-01');
    expect(nextRequest.request.params.get('page')).toBe('1');
    expect(nextRequest.request.params.get('size')).toBe('20');
    nextRequest.flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
  });

  it('combines tenant, state, and due filters and returns to page zero after each change', async () => {
    const fixture = createPage(pageWithQuota(0, 2));
    const nextButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Siguiente'),
    ) as HTMLButtonElement;
    nextButton.click();
    fixture.detectChanges();
    http.expectOne('/api/v1/cuotas?page=1&size=20').flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    await selectOption(fixture, 'payment-tenant', 1);
    const tenantRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(tenantRequest.request.params.get('codperInquilino')).toBe('15');
    expect(tenantRequest.request.params.get('page')).toBe('0');
    tenantRequest.flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    await selectOption(fixture, 'payment-state', 2);
    const stateRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(stateRequest.request.params.get('codperInquilino')).toBe('15');
    expect(stateRequest.request.params.get('estado')).toBe('PARCIAL');
    expect(stateRequest.request.params.get('page')).toBe('0');
    stateRequest.flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    await selectOption(fixture, 'payment-due', 1);
    const dueRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(dueRequest.request.params.get('codperInquilino')).toBe('15');
    expect(dueRequest.request.params.get('estado')).toBe('PARCIAL');
    expect(dueRequest.request.params.get('vencimiento')).toBe('VENCIDAS');
    expect(dueRequest.request.params.get('page')).toBe('0');
    dueRequest.flush(pageWithQuota(0, 2));
  });

  it('loads units after choosing a property and sends both property and unit filters', async () => {
    const fixture = createPage();

    (fixture.nativeElement.querySelector('.filter-toolbar button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await selectOption(fixture, 'payment-property', 1);

    const unitsRequest = http.expectOne(
      '/api/v1/propiedades/3/unidades?page=0&size=100&sort=nombre,asc',
    );
    unitsRequest.flush({
      content: [
        {
          coduni: 8,
          codprop: 3,
          nombre: 'Departamento 3B',
          tipoUnidad: 'DEPARTAMENTO',
          descripcion: null,
          area: 50,
          dormitorios: 2,
          banos: 1,
          piso: 3,
          ubicacionInterna: null,
          precioBase: 2000,
          estadoOperativo: 1,
          disponibleParaContrato: false,
        },
      ],
      page: 0,
      size: 100,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    fixture.detectChanges();

    const propertyRequest = http.expectOne(
      (request) => request.url === '/api/v1/cuotas' && request.params.get('codprop') === '3',
    );
    propertyRequest.flush(emptyPage());
    fixture.detectChanges();

    await selectOption(fixture, 'payment-unit', 1);
    const unitRequest = http.expectOne(
      (request) =>
        request.url === '/api/v1/cuotas' &&
        request.params.get('codprop') === '3' &&
        request.params.get('coduni') === '8',
    );
    expect(unitRequest.request.params.get('page')).toBe('0');
    unitRequest.flush(emptyPage());

    await selectOption(fixture, 'payment-property', 2);
    const changedPropertyUnits = http.expectOne(
      '/api/v1/propiedades/4/unidades?page=0&size=100&sort=nombre,asc',
    );
    const changedPropertyCuotas = http.expectOne(
      (request) =>
        request.url === '/api/v1/cuotas' &&
        request.params.get('codprop') === '4' &&
        !request.params.has('coduni'),
    );
    expect(fixture.nativeElement.querySelector('#payment-unit-trigger').textContent).toContain(
      'Cargando unidades',
    );
    changedPropertyCuotas.flush(emptyPage());
    changedPropertyUnits.flush({
      content: [],
      page: 0,
      size: 100,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#payment-unit-trigger').textContent).toContain(
      'Todas las unidades',
    );
  });

  it('sends the review filter and offers a way to clear it from the empty results state', () => {
    const fixture = createPage();

    (fixture.nativeElement.querySelector('.filter-toolbar button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const reviewFilter = fixture.nativeElement.querySelector(
      '#payment-review-filter',
    ) as HTMLInputElement;
    reviewFilter.click();
    fixture.detectChanges();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/cuotas');
    expect(request.request.params.get('conPagoPendienteRevision')).toBe('true');
    request.flush(emptyPage());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No encontramos cuotas');
    (fixture.nativeElement.querySelector('.empty-clear') as HTMLButtonElement).click();
    fixture.detectChanges();

    const clearedRequest = http.expectOne('/api/v1/cuotas?page=0&size=20');
    clearedRequest.flush(emptyPage());
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay cuotas para mostrar');
  });

  it('opens payment for the selected quota, closes after 201, notifies, and refreshes the current page', async () => {
    const fixture = createPage(pageWithQuota(0, 2));
    const month = fixture.nativeElement.querySelector('#payment-period') as HTMLInputElement;
    month.value = '2026-09';
    month.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    http.expectOne((request) => request.url === '/api/v1/cuotas').flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    const nextPageButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Siguiente'),
    ) as HTMLButtonElement;
    nextPageButton.click();
    fixture.detectChanges();
    http.expectOne('/api/v1/cuotas?page=1&size=20&periodo=2026-09-01').flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    const registerButton = fixture.nativeElement.querySelector(
      '[aria-label="Registrar pago de la cuota 102"]',
    ) as HTMLButtonElement;
    registerButton.focus();
    registerButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Registrar pago');
    expect(fixture.nativeElement.textContent).toContain('Valeria Mendoza');
    expect(fixture.nativeElement.textContent).toContain('Departamento 3B');

    const amount = fixture.nativeElement.querySelector('#payment-amount') as HTMLInputElement;
    amount.value = '2500';
    amount.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('#register-payment-submit') as HTMLButtonElement).click();
    fixture.detectChanges();

    const paymentRequest = http.expectOne('/api/v1/cuotas/102/pagos');
    expect(paymentRequest.request.method).toBe('POST');
    const paymentPayload = (await readPagoPart(paymentRequest.request.body as FormData)) as {
      metodo: string;
    };
    expect(paymentPayload.metodo).toBe('EFECTIVO');
    paymentRequest.flush(
      {
        codpag: 10,
        codcuo: 102,
        codqr: null,
        monto: 2500,
        metodo: 'EFECTIVO',
        fechaPago: '2026-09-25T18:30:00',
        fechaRegistro: '2026-09-25T18:30:00',
        estado: 'CONFIRMADO',
        origenRegistro: 'PROPIETARIA',
        registradoPor: 'owner',
        revisadoPor: null,
        fechaRevision: null,
        motivoRechazo: null,
        motivoAnulacion: null,
      },
      { status: 201, statusText: 'Created' },
    );
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('Pago registrado correctamente.');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(registerButton);
    const refreshRequest = http.expectOne((request) => request.url === '/api/v1/cuotas');
    expect(refreshRequest.request.params.get('periodo')).toBe('2026-09-01');
    expect(refreshRequest.request.params.get('page')).toBe('1');
    expect(refreshRequest.request.params.get('size')).toBe('20');
    refreshRequest.flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(document.activeElement).toBe(registerButton);
  });

  it('opens history for the selected quota without refreshing or changing the filtered page', async () => {
    const fixture = createPage(pageWithQuota(0, 2));
    const periodFilter = fixture.nativeElement.querySelector('#payment-period') as HTMLInputElement;
    periodFilter.value = '2026-09';
    periodFilter.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    http.expectOne((request) => request.url === '/api/v1/cuotas').flush(pageWithQuota(0, 2));
    fixture.detectChanges();

    const nextPageButton = [...fixture.nativeElement.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Siguiente'),
    ) as HTMLButtonElement;
    nextPageButton.click();
    fixture.detectChanges();
    http.expectOne('/api/v1/cuotas?page=1&size=20&periodo=2026-09-01').flush(pageWithQuota(1, 2));
    fixture.detectChanges();

    const historyButton = fixture.nativeElement.querySelector(
      '[aria-label="Ver historial de pagos de Septiembre 2026, cuota 102"]',
    ) as HTMLButtonElement;
    historyButton.focus();
    historyButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const historyRequest = http.expectOne('/api/v1/cuotas/102/pagos');
    expect(historyRequest.request.method).toBe('GET');
    historyRequest.flush([
      {
        codpag: 10,
        codcuo: 102,
        codqr: null,
        monto: 500,
        metodo: 'EFECTIVO',
        fechaPago: '2026-09-25T18:30:00',
        fechaRegistro: '2026-09-25T18:30:00',
        estado: 'CONFIRMADO',
        origenRegistro: 'PROPIETARIA',
        registradoPor: 'owner',
        revisadoPor: null,
        fechaRevision: null,
        motivoRechazo: null,
        motivoAnulacion: null,
      },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Historial de pagos');
    expect(fixture.nativeElement.textContent).toContain('Cuota #102');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(periodFilter.value).toBe('2026-09');
    http.expectNone((request) => request.url === '/api/v1/cuotas');

    (fixture.nativeElement.querySelector('.close-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(periodFilter.value).toBe('2026-09');
    expect(document.activeElement).toBe(historyButton);
    http.expectNone((request) => request.url === '/api/v1/cuotas');

    historyButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    http.expectOne('/api/v1/cuotas/102/pagos').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay pagos registrados');
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
    expect(periodFilter.value).toBe('2026-09');
    http.expectNone((request) => request.url === '/api/v1/cuotas');

    (fixture.nativeElement.querySelector('.close-action') as HTMLButtonElement).click();
    fixture.detectChanges();
  });

  it('resolves a real pending tenant payment, confirms it, and refreshes the quota from Backend', async () => {
    const fixture = createPage(pageWithQuota(0, 1, { montoPendienteRevision: 500 }));
    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();

    const installmentPayments = http.expectOne('/api/v1/cuotas/101/pagos');
    expect(installmentPayments.request.method).toBe('GET');
    installmentPayments.flush([pendingReviewPayment()]);
    fixture.detectChanges();

    const reviewButton = fixture.nativeElement.querySelector(
      '[aria-label="Revisar pago 801 de la cuota 101"]',
    ) as HTMLButtonElement;
    expect(reviewButton).not.toBeNull();
    reviewButton.focus();
    reviewButton.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const detailRequest = http.expectOne('/api/v1/pagos/801');
    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush(pendingReviewPayment());
    fixture.detectChanges();
    http.expectOne('/api/v1/pagos/801/comprobante/metadata').flush({
      nombreArchivo: 'comprobante.png',
      tipoContenido: 'image/png',
      fechaRegistro: '2026-09-27T10:15:00',
    });
    http
      .expectOne('/api/v1/pagos/801/comprobante')
      .flush(new Blob(['receipt'], { type: 'image/png' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Valeria Mendoza');

    (fixture.nativeElement.querySelector('.confirm-payment-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.review-primary-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const confirmRequest = http.expectOne('/api/v1/pagos/801/confirmar');
    expect(confirmRequest.request.method).toBe('PATCH');
    expect(confirmRequest.request.body).toBeNull();
    confirmRequest.flush(pendingReviewPayment({ estado: 'CONFIRMADO' }));
    fixture.detectChanges();

    expect(notification.success).toHaveBeenCalledWith('Pago confirmado correctamente.');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    const cuotaRefresh = http.expectOne('/api/v1/cuotas?page=0&size=20');
    cuotaRefresh.flush(pageWithQuota(0, 1, { montoConfirmado: 500, saldo: 2000 }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label*="Revisar pago"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Bs 500,00');
  });
});

async function selectOption(
  fixture: ComponentFixture<PagosListComponent>,
  filterId: string,
  optionIndex: number,
): Promise<void> {
  const trigger = fixture.nativeElement.querySelector(`#${filterId}-trigger`) as HTMLButtonElement;
  trigger.click();
  fixture.detectChanges();
  const option = fixture.nativeElement.querySelectorAll(`#${filterId}-options [role="option"]`)[
    optionIndex
  ] as HTMLElement;
  option.click();
  fixture.detectChanges();
  await fixture.whenStable();
}

function startPage(): ComponentFixture<PagosListComponent> {
  const fixture = TestBed.createComponent(PagosListComponent);
  fixture.detectChanges();

  return fixture;
}

function flushCatalogRequests(): void {
  httpRequest('/api/v1/contratos/inquilinos').flush([
    { codper: 15, nombreCompleto: 'Valeria Mendoza', ci: '1234567' },
  ]);
  httpRequest((request) => request.url === '/api/v1/propiedades').flush({
    content: [
      {
        codprop: 3,
        nombre: 'Edificio Tarija',
        tipo: 'EDIFICIO',
        direccion: 'Calle Central',
        ciudad: 'Tarija',
        referencia: null,
        latitud: null,
        longitud: null,
        portadaUrl: null,
        tienePortada: false,
        codperPropietaria: 1,
        inversionInicial: 0,
        estado: 1,
        cantidadUnidades: 1,
        unidadesHabilitadas: 1,
        unidadesOcupadas: 0,
        ocupacion: 0,
      },
      {
        codprop: 4,
        nombre: 'Casa Camargo',
        tipo: 'CASA',
        direccion: 'Calle Camargo',
        ciudad: 'Camargo',
        referencia: null,
        latitud: null,
        longitud: null,
        portadaUrl: null,
        tienePortada: false,
        codperPropietaria: 1,
        inversionInicial: 0,
        estado: 1,
        cantidadUnidades: 0,
        unidadesHabilitadas: 0,
        unidadesOcupadas: 0,
        ocupacion: 0,
      },
    ],
    page: 0,
    size: 100,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  });
}

function createPage(page = emptyPage()): ComponentFixture<PagosListComponent> {
  const fixture = startPage();
  flushCatalogRequests();
  httpRequest('/api/v1/cuotas?page=0&size=20').flush(page);
  fixture.detectChanges();

  return fixture;
}

function httpRequest(
  match: string | ((request: import('@angular/common/http').HttpRequest<unknown>) => boolean),
) {
  return TestBed.inject(HttpTestingController).expectOne(match);
}

function emptyPage(pageNumber = 0): PageResponse<CuotaListado> {
  return {
    content: [],
    page: pageNumber,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
}

function pageWithQuota(
  pageNumber: number,
  totalPages: number,
  overrides: Partial<CuotaListado> = {},
): PageResponse<CuotaListado> {
  const quota: CuotaListado = {
    codcuo: pageNumber + 101,
    codcon: 77,
    periodo: '2026-09',
    fechaVencimiento: '2026-09-05',
    monto: 2500,
    montoConfirmado: 0,
    saldo: 2500,
    montoPendienteRevision: 0,
    estado: 'PENDIENTE',
    codperInquilino: 15,
    nombreCompleto: 'Valeria Mendoza',
    ci: '1234567',
    codprop: 3,
    nombrePropiedad: 'Edificio Tarija',
    coduni: 8,
    nombreUnidad: 'Departamento 3B',
    situacionVencimiento: 'VENCIDA',
    ...overrides,
  };

  return {
    content: [quota],
    page: pageNumber,
    size: 20,
    totalElements: 21,
    totalPages,
    first: pageNumber === 0,
    last: pageNumber === totalPages - 1,
  };
}

function pendingReviewPayment(
  overrides: Partial<import('../../../contratos/models/contrato.model').PagoResponse> = {},
) {
  return {
    codpag: 801,
    codcuo: 101,
    codqr: 5,
    monto: 500,
    metodo: 'QR' as const,
    fechaPago: '2026-09-27T10:00:00',
    fechaRegistro: '2026-09-27T10:00:00',
    estado: 'PENDIENTE_REVISION' as const,
    origenRegistro: 'INQUILINO' as const,
    registradoPor: 'tenant',
    revisadoPor: null,
    fechaRevision: null,
    motivoRechazo: null,
    motivoAnulacion: null,
    ...overrides,
  };
}

async function readPagoPart(formData: FormData): Promise<unknown> {
  const paymentPart = formData.get('pago');
  expect(paymentPart).toBeInstanceOf(Blob);
  expect((paymentPart as Blob).type).toBe('application/json');

  return JSON.parse(await (paymentPart as Blob).text());
}
