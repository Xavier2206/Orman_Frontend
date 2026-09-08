import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { PageResponse } from '../../../personas/models/persona.model';
import { Menu, MenuResumen } from '../../models/menu.model';
import { MenusListComponent } from './menus-list.component';

describe('MenusListComponent', () => {
  let fixture: ComponentFixture<MenusListComponent>;
  let http: HttpTestingController;
  const menus: readonly Menu[] = [
    { codm: 1, nombre: 'CONTROL DE ACCESO', icono: 'admin_panel_settings', estado: 1 },
    { codm: 2, nombre: 'REPORTES', icono: null, estado: 0 },
  ];
  const summary: MenuResumen = {
    totalMenus: 2,
    activos: 1,
    inactivos: 1,
  };
  const firstPage: PageResponse<Menu> = {
    content: menus,
    page: 0,
    size: 10,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenusListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MenusListComponent);
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
    const request = http.expectOne((request) => request.url === '/api/v1/menus');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe(String(expected.page ?? 0));
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    expect(request.request.params.get('q')).toBe(expected.q ?? null);
    expect(request.request.params.get('estado')).toBe(expected.estado ?? null);

    return request;
  }

  function expectSummaryRequest(): ReturnType<HttpTestingController['expectOne']> {
    const request = http.expectOne('/api/v1/menus/resumen');

    expect(request.request.method).toBe('GET');
    return request;
  }

  function initial(page = firstPage): void {
    fixture.detectChanges();
    expectListRequest().flush(page);
    expectSummaryRequest().flush(summary);
    fixture.detectChanges();
  }

  it('loads the list and global summary on entry', () => {
    initial();

    expect(fixture.nativeElement.querySelector('h1')?.textContent?.trim()).toBe(
      'Gestionar Menús',
    );
    expect(fixture.nativeElement.textContent).toContain('Total Menús');
    expect(fixture.nativeElement.textContent).toContain('2');
    expect(fixture.nativeElement.textContent).toContain('Activos');
    expect(fixture.nativeElement.textContent).toContain('Inactivos');
    expect(fixture.nativeElement.querySelectorAll('.menu-card').length).toBe(2);
  });

  it('renders the received icon, menu fallback and status badges', () => {
    initial();

    const cards = fixture.nativeElement.querySelectorAll('.menu-card') as NodeListOf<HTMLElement>;
    const iconElements = fixture.nativeElement.querySelectorAll(
      '.menu-card .menu-icon mat-icon',
    ) as NodeListOf<Element>;
    const icons = Array.from(iconElements).map((icon) => icon.textContent?.trim());

    expect(icons).toEqual(['admin_panel_settings', 'menu']);
    expect(cards[0].textContent).toContain('Activo');
    expect(cards[1].textContent).toContain('Inactivo');
  });

  it('keeps the global summary independent from listing filters', () => {
    initial();

    (fixture.componentInstance as never as { setStatus(value: string): void }).setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [menus[0]],
      totalElements: 1,
    });

    http.expectNone('/api/v1/menus/resumen');
  });

  it('sends q after a 350 ms remote search debounce', () => {
    vi.useFakeTimers();
    initial();

    const search = fixture.nativeElement.querySelector('#menu-search') as HTMLInputElement;
    search.value = 'control';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(349);
    http.expectNone((request) => request.url === '/api/v1/menus');

    vi.advanceTimersByTime(1);
    expectListRequest({ q: 'control' }).flush({
      ...firstPage,
      content: [menus[0]],
      totalElements: 1,
    });
  });

  it('does not send q when the search is empty', () => {
    vi.useFakeTimers();
    initial();

    const search = fixture.nativeElement.querySelector('#menu-search') as HTMLInputElement;
    search.value = '';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);

    expectListRequest().flush(firstPage);
  });

  it('sends active, inactive and all state filters correctly', () => {
    initial();
    const component = fixture.componentInstance as never as { setStatus(value: string): void };

    component.setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [menus[0]],
      totalElements: 1,
    });

    component.setStatus('0');
    expectListRequest({ estado: '0' }).flush({
      ...firstPage,
      content: [menus[1]],
      totalElements: 1,
    });

    component.setStatus('');
    expectListRequest().flush(firstPage);
  });

  it('combines q and state while resetting the page to zero', () => {
    vi.useFakeTimers();
    const secondPage: PageResponse<Menu> = {
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
    expectListRequest({ estado: '1', page: 0 }).flush({ ...firstPage, content: [menus[0]] });

    const search = fixture.nativeElement.querySelector('#menu-search') as HTMLInputElement;
    search.value = 'control';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expectListRequest({ q: 'control', estado: '1', page: 0 }).flush({
      ...firstPage,
      content: [menus[0]],
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
    expectListRequest({ estado: '0' }).flush({ ...firstPage, content: [menus[1]] });

    const search = fixture.nativeElement.querySelector('#menu-search') as HTMLInputElement;
    search.value = 'report';
    search.dispatchEvent(new Event('input'));
    vi.advanceTimersByTime(350);
    expectListRequest({ q: 'report', estado: '0' }).flush({ ...firstPage, content: [menus[1]] });

    component.clearFilters();
    expectListRequest().flush(firstPage);
  });

  it('renders distinct empty states for the catalog and active filters', () => {
    initial({ ...firstPage, content: [], totalElements: 0, totalPages: 0 });
    expect(fixture.nativeElement.textContent).toContain('No hay Menús registrados.');

    (fixture.componentInstance as never as { setStatus(value: string): void }).setStatus('1');
    expectListRequest({ estado: '1' }).flush({
      ...firstPage,
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron Menús con los filtros seleccionados.',
    );
  });

  it('shows ProblemDetail detail when loading Menús fails', () => {
    fixture.detectChanges();
    expectListRequest().flush(
      { detail: 'No tiene permiso para consultar los Menús.' },
      { status: 403, statusText: 'Forbidden' },
    );
    expectSummaryRequest().flush(summary);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;

    expect(alert.textContent).toContain('No tiene permiso para consultar los Menús.');
    expect(fixture.nativeElement.querySelector('.menu-card')).toBeNull();
  });

  it('keeps the listing available when only the summary request fails', () => {
    fixture.detectChanges();
    expectListRequest().flush(firstPage);
    expectSummaryRequest().flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.menu-card').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible cargar el resumen de Menús.',
    );
  });

  it('requests previous and next pages with the same size and sort', () => {
    const twoPageResponse: PageResponse<Menu> = {
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
      content: [{ codm: 3, nombre: 'AUDITORÍA', icono: 'fact_check', estado: 1 }],
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
