import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, input, output, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  expand,
  map,
  of,
  reduce,
  switchMap,
} from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PageResponse } from '../../../personas/models/persona.model';
import { PropiedadApiService } from '../../../propiedades/data/propiedad-api.service';
import { Propiedad } from '../../../propiedades/models/propiedad.model';
import { UnidadApiService } from '../../../unidades/data/unidad-api.service';
import { UnidadResponse } from '../../../unidades/models/unidad.model';

export interface ContratoLocationSelection {
  readonly propiedad: Propiedad | null;
  readonly unidad: UnidadResponse | null;
}

interface CatalogResult<T> {
  readonly items: readonly T[] | null;
  readonly error: string | null;
}

interface UnitLoadRequest {
  readonly codprop: number;
}

interface UnitLoadResult extends CatalogResult<UnidadResponse> {
  readonly codprop: number;
}

@Component({
  selector: 'app-contrato-location-picker',
  imports: [MatIconModule],
  templateUrl: './contrato-location-picker.component.html',
  styleUrl: './contrato-location-picker.component.css',
})
export class ContratoLocationPickerComponent {
  readonly validationRequested = input(false);
  readonly selectionChange = output<ContratoLocationSelection>();

  private readonly propiedadApi = inject(PropiedadApiService);
  private readonly unidadApi = inject(UnidadApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly propertyRequests$ = new Subject<void>();
  private readonly unitRequests$ = new Subject<UnitLoadRequest>();
  private readonly catalogPageSize = 100;
  private readonly sortByName = 'nombre,asc';

  protected readonly properties = signal<readonly Propiedad[]>([]);
  protected readonly propertyLoading = signal(true);
  protected readonly propertyError = signal<string | null>(null);
  protected readonly units = signal<readonly UnidadResponse[]>([]);
  protected readonly unitLoading = signal(false);
  protected readonly unitError = signal<string | null>(null);
  protected readonly selectedProperty = signal<Propiedad | null>(null);
  protected readonly selectedUnit = signal<UnidadResponse | null>(null);

  constructor() {
    this.propertyRequests$
      .pipe(
        switchMap(() =>
          this.loadAllProperties().pipe(
            map((items): CatalogResult<Propiedad> => ({ items, error: null })),
            catchError((requestError: unknown) =>
              of<CatalogResult<Propiedad>>({
                items: null,
                error: this.errorMessage(requestError, 'No fue posible cargar las propiedades.'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handlePropertyResult(result));

    this.unitRequests$
      .pipe(
        switchMap(({ codprop }) =>
          this.loadAllUnits(codprop).pipe(
            map((items): UnitLoadResult => ({ codprop, items, error: null })),
            catchError((requestError: unknown) =>
              of<UnitLoadResult>({
                codprop,
                items: null,
                error: this.errorMessage(requestError, 'No fue posible cargar las unidades.'),
              }),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleUnitResult(result));

    this.loadProperties();
  }

  protected selectProperty(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const property = this.properties().find((item) => `${item.codprop}` === value) ?? null;

    if (property?.codprop === this.selectedProperty()?.codprop) {
      return;
    }

    this.selectedProperty.set(property);
    this.selectedUnit.set(null);
    this.units.set([]);
    this.unitError.set(null);
    this.selectionChange.emit({ propiedad: property, unidad: null });

    if (!property) {
      this.unitLoading.set(false);
      return;
    }

    this.unitLoading.set(true);
    this.unitRequests$.next({ codprop: property.codprop });
  }

  protected selectUnit(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const unit = this.units().find((item) => `${item.coduni}` === value) ?? null;

    this.selectedUnit.set(unit);
    this.selectionChange.emit({ propiedad: this.selectedProperty(), unidad: unit });
  }

  protected retryProperties(): void {
    this.loadProperties();
  }

  protected retryUnits(): void {
    const property = this.selectedProperty();

    if (!property) {
      return;
    }

    this.units.set([]);
    this.unitError.set(null);
    this.unitLoading.set(true);
    this.unitRequests$.next({ codprop: property.codprop });
  }

  private loadProperties(): void {
    this.propertyLoading.set(true);
    this.propertyError.set(null);
    this.propertyRequests$.next();
  }

  private loadAllProperties(): Observable<readonly Propiedad[]> {
    return this.collectPages((page) =>
      this.propiedadApi.list({
        q: '',
        tipo: null,
        estado: 1,
        page,
        size: this.catalogPageSize,
        sort: this.sortByName,
      }),
    );
  }

  private loadAllUnits(codprop: number): Observable<readonly UnidadResponse[]> {
    return this.collectPages((page) =>
      this.unidadApi.listByProperty(codprop, page, this.catalogPageSize, this.sortByName, 1),
    );
  }

  private collectPages<T>(loadPage: (page: number) => Observable<PageResponse<T>>): Observable<T[]> {
    return loadPage(0).pipe(
      expand((response) => {
        const nextPage = response.page + 1;

        return nextPage < response.totalPages ? loadPage(nextPage) : EMPTY;
      }),
      reduce((items, response) => [...items, ...response.content], [] as T[]),
    );
  }

  private handlePropertyResult(result: CatalogResult<Propiedad>): void {
    this.propertyLoading.set(false);

    if (result.items === null) {
      this.properties.set([]);
      this.propertyError.set(result.error);
      return;
    }

    this.properties.set(result.items);
  }

  private handleUnitResult(result: UnitLoadResult): void {
    if (result.codprop !== this.selectedProperty()?.codprop) {
      return;
    }

    this.unitLoading.set(false);

    if (result.items === null) {
      this.units.set([]);
      this.unitError.set(result.error);
      return;
    }

    this.units.set(result.items.filter((unit) => unit.disponibleParaContrato));
  }

  private errorMessage(requestError: unknown, fallback: string): string {
    if (
      requestError instanceof HttpErrorResponse &&
      isProblemDetail(requestError.error) &&
      requestError.error.detail
    ) {
      return requestError.error.detail;
    }

    if (requestError instanceof HttpErrorResponse && requestError.status === 403) {
      return 'No tienes permisos para consultar este catálogo.';
    }

    return fallback;
  }
}
