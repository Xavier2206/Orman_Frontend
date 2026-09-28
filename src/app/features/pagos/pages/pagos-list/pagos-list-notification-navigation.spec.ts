import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { CuotaCatalogService } from '../../data/cuota-catalog.service';
import { CuotaListado } from '../../models/cuota-listado.model';
import { PagosListComponent } from './pagos-list.component';

describe('PagosListComponent notification navigation', () => {
  let fixture: ComponentFixture<PagosListComponent>;
  let http: HttpTestingController;
  let queryParamMap: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let originalScrollIntoView: typeof HTMLElement.prototype.scrollIntoView | undefined;
  let originalMatchMediaDescriptor: PropertyDescriptor | undefined;
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    queryParamMap = new BehaviorSubject(convertToParamMap({}));
    originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    originalMatchMediaDescriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    scrollIntoViewSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoViewSpy,
    });

    await TestBed.configureTestingModule({
      imports: [PagosListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: queryParamMap.asObservable() },
        },
        {
          provide: CuotaCatalogService,
          useValue: {
            listInquilinos: () => of([]),
            listPropiedades: () => of(emptyCatalogPage()),
            listUnidades: () => of([]),
          },
        },
        { provide: OrmanNotificationService, useValue: { success: vi.fn() } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();

    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
        configurable: true,
        value: originalScrollIntoView,
      });
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }

    if (originalMatchMediaDescriptor) {
      Object.defineProperty(window, 'matchMedia', originalMatchMediaDescriptor);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('requests the exact codcuo, renders its stable row id, scrolls and highlights it', async () => {
    startPage({ codcuo: '1894' });

    const request = http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894');
    expect(request.request.params.keys().sort()).toEqual(['codcuo', 'page', 'size']);
    request.flush(pageWithQuota(1894));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('[data-codcuo="1894"]') as HTMLElement;
    expect(row).toBeTruthy();
    expect(row.classList).toContain('quota-row-highlight');
    expect(fixture.nativeElement.querySelector('[data-codcuo="101"]')).toBeNull();
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(
      fixture.nativeElement.querySelector('nav[aria-label="Paginación de cuotas"]'),
    ).toBeNull();
  });

  it('uses immediate scrolling when reduced motion is preferred', async () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true }),
    });
    startPage({ codcuo: '1894' });

    http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894').flush(pageWithQuota(1894));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: 'auto', block: 'center' });
  });

  it('shows the related-quota message when the codcuo query returns an empty page', () => {
    startPage({ codcuo: '1894' });
    http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894').flush(emptyQuotaPage());
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se encontró la cuota relacionada.');
    expect(fixture.nativeElement.querySelector('app-cuota-table')).toBeNull();
  });

  it('does not render a different quota if the filtered response omits the requested codcuo', () => {
    startPage({ codcuo: '1894' });
    http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894').flush(pageWithQuota(101));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se encontró la cuota relacionada.');
    expect(fixture.nativeElement.querySelector('[data-codcuo="101"]')).toBeNull();
  });

  it('clears old filters before requesting a cuota from a later notification navigation', async () => {
    startPage();
    http.expectOne('/api/v1/cuotas?page=0&size=20').flush(emptyQuotaPage());
    fixture.detectChanges();

    await selectOption('payment-state', 1);
    http
      .expectOne((request) => request.url === '/api/v1/cuotas' && request.params.has('estado'))
      .flush(emptyQuotaPage());
    fixture.detectChanges();

    queryParamMap.next(convertToParamMap({ codcuo: '1894' }));
    fixture.detectChanges();

    const request = http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894');
    expect(request.request.params.has('estado')).toBe(false);
    expect(fixture.nativeElement.querySelector('#payment-state-trigger').textContent).toContain(
      'Todos',
    );
    request.flush(pageWithQuota(1894));
    fixture.detectChanges();
  });

  it('does not make an unfiltered request when codcuo is invalid', () => {
    startPage({ codcuo: 'not-an-id' });

    expect(fixture.nativeElement.textContent).toContain('No se encontró la cuota relacionada.');
    http.expectNone((request) => request.url === '/api/v1/cuotas');
  });

  it('cancels a pending lookup if a later notification contains an invalid codcuo', () => {
    startPage({ codcuo: '1894' });
    const pendingRequest = http.expectOne('/api/v1/cuotas?page=0&size=20&codcuo=1894');

    queryParamMap.next(convertToParamMap({ codcuo: 'not-an-id' }));
    fixture.detectChanges();

    expect(pendingRequest.cancelled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('No se encontró la cuota relacionada.');
    http.expectNone((request) => request.url === '/api/v1/cuotas');
  });

  function startPage(params: Record<string, string> = {}): void {
    queryParamMap.next(convertToParamMap(params));
    fixture = TestBed.createComponent(PagosListComponent);
    fixture.detectChanges();
  }

  async function selectOption(filterId: string, optionIndex: number): Promise<void> {
    const trigger = fixture.nativeElement.querySelector(
      `#${filterId}-trigger`,
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelectorAll(`#${filterId}-options [role="option"]`)[
      optionIndex
    ] as HTMLElement;
    option.click();
    fixture.detectChanges();
    await fixture.whenStable();
  }
});

function emptyQuotaPage() {
  return {
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
}

function emptyCatalogPage() {
  return {
    content: [],
    page: 0,
    size: 100,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  };
}

function pageWithQuota(codcuo: number) {
  const quota: CuotaListado = {
    codcuo,
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
  };

  return {
    content: [quota],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };
}
