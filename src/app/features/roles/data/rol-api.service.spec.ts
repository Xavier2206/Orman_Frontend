import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { RolApiService } from './rol-api.service';

describe('RolApiService', () => {
  let service: RolApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RolApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RolApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads every active Role catalog page through the shared Role service', () => {
    let result: readonly number[] = [];

    service.listActiveCatalog().subscribe((roles) => {
      result = roles.map((role) => role.codr);
    });

    const first = http.expectOne((request) => request.url === '/api/v1/roles');
    expect(first.request.params.get('estado')).toBe('1');
    expect(first.request.params.get('q')).toBeNull();
    expect(first.request.params.get('page')).toBe('0');
    expect(first.request.params.get('size')).toBe('10');
    expect(first.request.params.get('sort')).toBe('nombre,asc');
    first.flush({
      content: [{ codr: 1, nombre: 'PROPIETARIO', estado: 1 }],
      page: 0,
      size: 10,
      totalElements: 2,
      totalPages: 2,
      first: true,
      last: false,
    });

    const second = http.expectOne((request) => request.url === '/api/v1/roles');
    expect(second.request.params.get('page')).toBe('1');
    second.flush({
      content: [{ codr: 2, nombre: 'ADMINISTRADOR', estado: 1 }],
      page: 1,
      size: 10,
      totalElements: 2,
      totalPages: 2,
      first: false,
      last: true,
    });

    expect(result).toEqual([1, 2]);
  });
});
