import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { MenuApiService } from './menu-api.service';

describe('MenuApiService', () => {
  let service: MenuApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MenuApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MenuApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads every active Menu catalog page', () => {
    let result: readonly number[] = [];

    service.listActiveCatalog().subscribe((menus) => {
      result = menus.map((menu) => menu.codm);
    });

    const first = http.expectOne((request) => request.url === '/api/v1/menus');

    expect(first.request.params.get('estado')).toBe('1');
    expect(first.request.params.get('page')).toBe('0');
    expect(first.request.params.get('size')).toBe('10');
    expect(first.request.params.get('sort')).toBe('nombre,asc');
    expect(first.request.params.get('q')).toBeNull();
    first.flush({
      content: [{ codm: 11, nombre: 'Personas', icono: 'group', estado: 1 }],
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 2,
      first: true,
      last: false,
    });

    const second = http.expectOne((request) => request.url === '/api/v1/menus');

    expect(second.request.params.get('page')).toBe('1');
    second.flush({
      content: [{ codm: 12, nombre: 'Roles', icono: 'admin_panel_settings', estado: 1 }],
      page: 1,
      size: 10,
      totalElements: 2,
      totalPages: 2,
      first: false,
      last: true,
    });

    expect(result).toEqual([11, 12]);
  });
});
