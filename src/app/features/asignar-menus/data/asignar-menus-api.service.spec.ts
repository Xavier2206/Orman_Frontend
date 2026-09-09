import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AsignarMenusApiService } from './asignar-menus-api.service';

describe('AsignarMenusApiService', () => {
  let service: AsignarMenusApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignarMenusApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AsignarMenusApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the Menús assigned to a Role', () => {
    service.listAssignedMenus(7).subscribe((menus) => {
      expect(menus).toEqual([{ codm: 11, nombre: 'Personas', icono: 'group', estado: 1 }]);
    });

    const request = http.expectOne('/api/v1/roles/7/menus');

    expect(request.request.method).toBe('GET');
    request.flush([{ codm: 11, nombre: 'Personas', icono: 'group', estado: 1 }]);
  });

  it('assigns a Menu to a Role without an extra body', () => {
    service.assignMenu(7, 11).subscribe();

    const request = http.expectOne('/api/v1/roles/7/menus/11');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({});
  });

  it('removes a Menu from a Role', () => {
    service.removeMenu(7, 11).subscribe();

    const request = http.expectOne('/api/v1/roles/7/menus/11');

    expect(request.request.method).toBe('DELETE');
    request.flush({});
  });
});
