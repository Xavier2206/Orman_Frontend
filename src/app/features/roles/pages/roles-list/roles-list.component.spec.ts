import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { OrmanNotificationService } from '../../../../core/notifications/orman-notification.service';
import { PageResponse } from '../../../personas/models/persona.model';
import { Rol, RolResumen } from '../../models/rol.model';
import { RolesListComponent } from './roles-list.component';

describe('RolesListComponent', () => {
  let fixture: ComponentFixture<RolesListComponent>;
  let http: HttpTestingController;
  const notification = { success: vi.fn() };
  const roles: readonly Rol[] = [
    { codr: 1, nombre: 'PROPIETARIO', estado: 1 },
    { codr: 2, nombre: 'ADMINISTRADOR', estado: 0 },
  ];
  const summary: RolResumen = {
    totalRoles: 2,
    activos: 1,
    inactivos: 1,
  };
  const firstPage: PageResponse<Rol> = {
    content: roles,
    page: 0,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OrmanNotificationService, useValue: notification },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RolesListComponent);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify();
  });

  function expectListRequest(
    expected: Partial<{
      readonly q: string | null;
      readonly estado: string | null;
      readonly page: number;
    }> = {},
  ): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne((request) => request.url === '/api/v1/roles');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe(`${expected.page ?? 0}`);
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('q')).toBe(expected.q ?? null);
    expect(request.request.params.get('estado')).toBe(expected.estado ?? null);

    return request;
  }

  function expectSummaryRequest(): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne('/api/v1/roles/resumen');

    expect(request.request.method).toBe('GET');
    return request;
  }

  function initial(page = firstPage): void {
    fixture.detectChanges();
    expectListRequest().flush(page);
    expectSummaryRequest().flush(summary);
    fixture.detectChanges();
  }

  it('loads and renders the paginated Roles response and global summary', () => {
    initial();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe('Gestionar Roles');
    expect(fixture.nativeElement.textContent).toContain('Total Roles');
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Activos');
    expect(fixture.nativeElement.textContent).toContain('Inactivos');
    expect(fixture.nativeElement.querySelectorAll('.role-card').length).toBe(2);
  });

  it('renders active, inactive and protected role badges without a principal role icon', () => {
    initial();

    const cards = fixture.nativeElement.querySelectorAll('.role-card') as NodeListOf<HTMLElement>;

    expect(cards[0].textContent).toContain('Activo');
    expect(cards[0].textContent).toContain('Protegido');
    expect(cards[0].querySelector('.role-icon')).toBeNull();
    expect(cards[0].querySelector('mat-icon')?.textContent?.trim()).toBe('shield');
    expect(cards[1].textContent).toContain('Inactivo');
  });

  it('keeps the global summary independent from listing filters', () => {
    initial();

    (fixture.componentInstance as never as { setStatus(value: string): void }).setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [roles[0]],
      totalElements: 1,
    });
    http.expectNone('/api/v1/roles/resumen');
  });

  it('sends q after a 350 ms remote search debounce', () => {
    vi.useFakeTimers();
    initial();

    const search = fixture.nativeElement.querySelector('#role-search') as HTMLInputElement;
    search.value = 'admin';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(349);
    http.expectNone((request) => request.url === '/api/v1/roles');

    vi.advanceTimersByTime(1);
    expectListRequest({ q: 'admin' }).flush({
      ...firstPage,
      content: [roles[1]],
      totalElements: 1,
    });
  });

  it('does not send q when the search is empty', () => {
    vi.useFakeTimers();
    initial();

    const search = fixture.nativeElement.querySelector('#role-search') as HTMLInputElement;
    search.value = '';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    expectListRequest().flush(firstPage);
  });

  it('sends the selected active or inactive state and omits it for all states', () => {
    initial();
    const component = fixture.componentInstance as never as { setStatus(value: string): void };

    component.setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [roles[0]],
      totalElements: 1,
    });

    component.setStatus('0');
    expectListRequest({ estado: '0' }).flush({
      ...firstPage,
      content: [roles[1]],
      totalElements: 1,
    });

    component.setStatus('');
    expectListRequest().flush(firstPage);
  });

  it('combines q and state while resetting the page to zero', () => {
    vi.useFakeTimers();
    const secondPage: PageResponse<Rol> = {
      ...firstPage,
      page: 1,
      totalElements: 12,
      totalPages: 2,
      first: false,
      last: true,
    };
    initial({ ...secondPage, page: 0, first: true, last: false });

    const component = fixture.componentInstance as never as {
      changePage(page: number): void;
      setStatus(value: string): void;
    };
    component.changePage(1);
    expectListRequest({ page: 1 }).flush(secondPage);
    component.setStatus('1');
    expectListRequest({ estado: '1', page: 0 }).flush({ ...firstPage, content: [roles[0]] });

    const search = fixture.nativeElement.querySelector('#role-search') as HTMLInputElement;
    search.value = 'prop';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expectListRequest({ q: 'prop', estado: '1', page: 0 }).flush({
      ...firstPage,
      content: [roles[0]],
    });
  });

  it('preserves active filters when navigating between pages', () => {
    initial({ ...firstPage, totalElements: 12, totalPages: 2, last: false });
    const component = fixture.componentInstance as never as { setStatus(value: string): void };
    component.setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      totalElements: 12,
      totalPages: 2,
      last: false,
    });
    fixture.detectChanges();

    const nextButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Siguiente'));
    nextButton?.click();

    expectListRequest({ estado: '1', page: 1 }).flush({
      ...firstPage,
      page: 1,
      totalElements: 12,
      totalPages: 2,
      first: false,
    });
  });

  it('clears q and state filters and requests the first page', () => {
    vi.useFakeTimers();
    initial();
    const component = fixture.componentInstance as never as {
      clearFilters(): void;
      setStatus(value: string): void;
    };
    component.setStatus('0');
    expectListRequest({ estado: '0' }).flush({ ...firstPage, content: [roles[1]] });

    const search = fixture.nativeElement.querySelector('#role-search') as HTMLInputElement;
    search.value = 'admin';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expectListRequest({ q: 'admin', estado: '0' }).flush({ ...firstPage, content: [roles[1]] });

    component.clearFilters();
    expectListRequest().flush(firstPage);
  });

  it('renders distinct empty states for catalog and active filters', () => {
    initial({ ...firstPage, content: [], totalElements: 0, totalPages: 0 });
    expect(fixture.nativeElement.textContent).toContain('No hay Roles registrados.');

    (fixture.componentInstance as never as { setStatus(value: string): void }).setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron Roles con los filtros seleccionados.',
    );
  });

  it('shows the ProblemDetail detail when loading Roles fails', () => {
    fixture.detectChanges();
    expectListRequest().flush(
      { detail: 'No tiene permiso para consultar los Roles.' },
      { status: 403, statusText: 'Forbidden' },
    );
    expectSummaryRequest().flush(summary);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('No tiene permiso para consultar los Roles.');
    expect(fixture.nativeElement.querySelector('.role-card')).toBeNull();
  });

  it('keeps listing available when only the summary request fails', () => {
    fixture.detectChanges();
    expectListRequest().flush(firstPage);
    expectSummaryRequest().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.role-card').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible cargar el resumen de Roles.',
    );
  });

  it('requests the previous and next pages with the same size and sort', () => {
    const twoPageResponse: PageResponse<Rol> = {
      ...firstPage,
      totalElements: 12,
      totalPages: 2,
      first: true,
      last: false,
    };
    initial(twoPageResponse);

    const nextButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Siguiente'));
    nextButton?.click();
    expectListRequest({ page: 1 }).flush({
      ...twoPageResponse,
      content: [{ codr: 3, nombre: 'LECTURA', estado: 1 }],
      page: 1,
      first: false,
      last: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');

    const previousButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-button') as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes('Anterior'));
    previousButton?.click();
    expectListRequest().flush(twoPageResponse);
  });
});
