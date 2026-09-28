import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, reduce } from 'rxjs';

import { ContratoApiService } from '../../contratos/data/contrato-api.service';
import { ContratoInquilino } from '../../contratos/models/contrato.model';
import { PageResponse } from '../../personas/models/persona.model';
import { PropiedadApiService } from '../../propiedades/data/propiedad-api.service';
import { Propiedad, PropiedadListFilters } from '../../propiedades/models/propiedad.model';
import { UnidadApiService } from '../../unidades/data/unidad-api.service';
import { UnidadResponse } from '../../unidades/models/unidad.model';

const CATALOG_PAGE_SIZE = 100;
const CATALOG_SORT = 'nombre,asc';

@Injectable({ providedIn: 'root' })
export class CuotaCatalogService {
  private readonly contratoApi = inject(ContratoApiService);
  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly unidadApi = inject(UnidadApiService);

  listInquilinos(): Observable<readonly ContratoInquilino[]> {
    return this.contratoApi.listInquilinos();
  }

  listPropiedades(): Observable<readonly Propiedad[]> {
    return this.collectPages((page) => {
      const filters: PropiedadListFilters = {
        q: '',
        tipo: null,
        estado: null,
        page,
        size: CATALOG_PAGE_SIZE,
        sort: CATALOG_SORT,
      };

      return this.propiedadApi.list(filters);
    });
  }

  listUnidades(codprop: number): Observable<readonly UnidadResponse[]> {
    return this.collectPages((page) =>
      this.unidadApi.listByProperty(codprop, page, CATALOG_PAGE_SIZE, CATALOG_SORT),
    );
  }

  private collectPages<T>(
    loadPage: (page: number) => Observable<PageResponse<T>>,
  ): Observable<T[]> {
    return loadPage(0).pipe(
      expand((response) => {
        const nextPage = response.page + 1;
        return nextPage < response.totalPages ? loadPage(nextPage) : EMPTY;
      }),
      reduce((items, response) => [...items, ...response.content], [] as T[]),
    );
  }
}
