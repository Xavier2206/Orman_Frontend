import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { MeProResponse } from '../models/me-pro-response.model';
import { AsignarProcesosApiService } from './asignar-procesos-api.service';

describe('AsignarProcesosApiService', () => {
  let service: AsignarProcesosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsignarProcesosApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AsignarProcesosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the processes assigned to a Menu', () => {
    service.listAssignedProcesses(7).subscribe((processes) => {
      expect(processes).toEqual([
        {
          codm: 7,
          nombreMenu: 'Personas',
          estadoMenu: 1,
          codp: 11,
          nombreProceso: 'Listar Personas',
          enlaceProceso: 'personas/listar',
          estadoProceso: 1,
        },
      ]);
    });

    const request = http.expectOne('/api/v1/menus/7/procesos');

    expect(request.request.method).toBe('GET');
    request.flush([
      {
        codm: 7,
        nombreMenu: 'Personas',
        estadoMenu: 1,
        codp: 11,
        nombreProceso: 'Listar Personas',
        enlaceProceso: 'personas/listar',
        estadoProceso: 1,
      } satisfies MeProResponse,
    ]);
  });

  it('assigns a Process to a Menu without an extra body', () => {
    let response!: MeProResponse;
    service.assignProcess(7, 11).subscribe((assignedProcess) => (response = assignedProcess));

    const request = http.expectOne('/api/v1/menus/7/procesos/11');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush(
      {
        codm: 7,
        nombreMenu: 'Personas',
        estadoMenu: 1,
        codp: 11,
        nombreProceso: 'Listar Personas',
        enlaceProceso: 'personas/listar',
        estadoProceso: 1,
      } satisfies MeProResponse,
      { status: 201, statusText: 'Created' },
    );
    expect(response.codp).toBe(11);
  });

  it('removes a Process from a Menu', () => {
    service.removeProcess(7, 11).subscribe();

    const request = http.expectOne('/api/v1/menus/7/procesos/11');

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
