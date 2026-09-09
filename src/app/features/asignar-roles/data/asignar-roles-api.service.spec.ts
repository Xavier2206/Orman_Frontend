import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AsignarRolesApiService } from './asignar-roles-api.service';

describe('AsignarRolesApiService', () => {
  let service: AsignarRolesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignarRolesApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AsignarRolesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests a paginated user page with the confirmed login identifier', () => {
    service.listUsuarios(2).subscribe((response) => {
      expect(response.content[0].login).toBe('ana');
    });

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('size')).toBe('5');
    expect(request.request.params.get('sort')).toBe('login,asc');
    expect(request.request.params.has('q')).toBe(false);
    request.flush({
      content: [{ login: 'ana' }],
      page: 2,
      size: 5,
      totalElements: 21,
      totalPages: 5,
      first: false,
      last: false,
    });
  });

  it('sends a trimmed remote user query when it is provided', () => {
    service.listUsuarios(0, ' Xavier ').subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');

    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('q')).toBe('Xavier');
    request.flush({
      content: [],
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('does not send q when the remote query contains only whitespace', () => {
    service.listUsuarios(0, '   ').subscribe();

    const request = http.expectOne((candidate) => candidate.url === '/api/v1/usuarios');

    expect(request.request.params.has('q')).toBe(false);
    request.flush({
      content: [],
      page: 0,
      size: 5,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });
  });

  it('uses encoded login and backend identifiers for assignment operations', () => {
    service.listAssignedRoles('ana demo').subscribe();
    const listRequest = http.expectOne('/api/v1/usuarios/ana%20demo/roles');
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush([]);

    service.assignRole('ana demo', 4).subscribe();
    const assignRequest = http.expectOne('/api/v1/usuarios/ana%20demo/roles/4');
    expect(assignRequest.request.method).toBe('POST');
    expect(assignRequest.request.body).toBeNull();
    assignRequest.flush({});

    service.removeRole('ana demo', 4).subscribe();
    const removeRequest = http.expectOne('/api/v1/usuarios/ana%20demo/roles/4');
    expect(removeRequest.request.method).toBe('DELETE');
    removeRequest.flush({});
  });
});
