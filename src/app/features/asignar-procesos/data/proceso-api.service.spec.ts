import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ProcesoApiService } from './proceso-api.service';

describe('ProcesoApiService', () => {
  let service: ProcesoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcesoApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProcesoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads a paginated process catalog with the confirmed parameters', () => {
    service.list(2, 10, 'nombre,asc').subscribe((response) => {
      expect(response.page).toBe(2);
    });

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/procesos');

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('nombre,asc');
    request.flush({
      content: [],
      page: 2,
      size: 10,
      totalElements: 0,
      totalPages: 0,
      first: false,
      last: true,
    });
  });

  it('loads all catalog pages and filters inactive processes locally', () => {
    service.listCatalog(2).subscribe((processes) => {
      expect(processes.map((process) => process.codp)).toEqual([1, 3]);
    });

    const firstRequest = http.expectOne((candidate) => candidate.url === '/api/v1/procesos');
    expect(firstRequest.request.params.get('page')).toBe('0');
    firstRequest.flush({
      content: [
        { codp: 1, nombre: 'Uno', enlace: 'uno', estado: 1 },
        { codp: 2, nombre: 'Dos', enlace: 'dos', estado: 0 },
      ],
      page: 0,
      size: 2,
      totalElements: 4,
      totalPages: 2,
      first: true,
      last: false,
    });

    const secondRequest = http.expectOne((candidate) => candidate.url === '/api/v1/procesos');
    expect(secondRequest.request.params.get('page')).toBe('1');
    secondRequest.flush({
      content: [
        { codp: 3, nombre: 'Tres', enlace: 'tres', estado: 1 },
        { codp: 4, nombre: 'Cuatro', enlace: 'cuatro', estado: 0 },
      ],
      page: 1,
      size: 2,
      totalElements: 4,
      totalPages: 2,
      first: false,
      last: true,
    });
  });
});
