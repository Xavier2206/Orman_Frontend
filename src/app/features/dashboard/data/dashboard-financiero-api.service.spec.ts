import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardFinancieroApiService } from './dashboard-financiero-api.service';

describe('DashboardFinancieroApiService', () => {
  let service: DashboardFinancieroApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardFinancieroApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the authenticated financial summary endpoint without client filters', () => {
    service.getResumenFinanciero().subscribe();

    const request = http.expectOne('/api/v1/dashboard/resumen-financiero');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys()).toEqual([]);
    request.flush({});
  });
});
