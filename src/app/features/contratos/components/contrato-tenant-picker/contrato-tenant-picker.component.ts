import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Subject, catchError, debounceTime, map, of, switchMap } from 'rxjs';

import { isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PersonaApiService } from '../../../personas/data/persona-api.service';
import { PageResponse, Persona } from '../../../personas/models/persona.model';

interface TenantSearchRequest {
  readonly query: string;
  readonly page: number;
}

interface TenantSearchResult {
  readonly query: string;
  readonly page: number;
  readonly totalPages: number;
  readonly personas: readonly Persona[] | null;
  readonly error: string | null;
}

@Component({
  selector: 'app-contrato-tenant-picker',
  imports: [MatIconModule],
  templateUrl: './contrato-tenant-picker.component.html',
  styleUrl: './contrato-tenant-picker.component.css',
})
export class ContratoTenantPickerComponent {
  readonly validationRequested = input(false);
  readonly selectionChange = output<Persona | null>();

  private readonly personaApi = inject(PersonaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly tenantRequests$ = new Subject<TenantSearchRequest>();
  private readonly tenantPageSize = 20;

  protected readonly selectedTenant = signal<Persona | null>(null);
  protected readonly tenantQuery = signal('');
  protected readonly tenantResults = signal<readonly Persona[]>([]);
  protected readonly pickerOpen = signal(false);
  protected readonly tenantLoading = signal(false);
  protected readonly tenantError = signal<string | null>(null);
  protected readonly tenantPage = signal(0);
  protected readonly tenantTotalPages = signal(0);
  protected readonly hasMoreTenants = computed(
    () => this.tenantPage() + 1 < this.tenantTotalPages(),
  );

  constructor() {
    this.tenantRequests$
      .pipe(
        debounceTime(250),
        switchMap(({ query, page }) =>
          this.personaApi
            .list({
              q: query,
              tipoPersona: 'I',
              estado: 1,
              page,
              size: this.tenantPageSize,
              sort: 'ap,asc',
            })
            .pipe(
              map((response): TenantSearchResult => ({
                query,
                page: response.page,
                totalPages: response.totalPages,
                personas: response.content,
                error: null,
              })),
              catchError((requestError: unknown) =>
                of<TenantSearchResult>({
                  query,
                  page,
                  totalPages: 0,
                  personas: null,
                  error: this.errorMessage(requestError),
                }),
              ),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => this.handleTenantResult(result));
  }

  protected searchTenants(event: Event): void {
    const query = (event.target as HTMLInputElement).value;

    this.tenantQuery.set(query);
    this.pickerOpen.set(true);
    this.tenantResults.set([]);
    this.tenantPage.set(0);
    this.tenantTotalPages.set(0);
    this.tenantError.set(null);
    this.tenantLoading.set(true);
    this.clearSelection();
    this.tenantRequests$.next({ query, page: 0 });
  }

  protected openPicker(): void {
    this.pickerOpen.set(true);

    if (this.tenantResults().length === 0 && !this.tenantLoading()) {
      this.tenantLoading.set(true);
      this.tenantError.set(null);
      this.tenantRequests$.next({ query: this.tenantQuery(), page: 0 });
    }
  }

  protected selectTenant(persona: Persona): void {
    if (persona.estado !== 1 || persona.tipoPersona !== 'I') {
      return;
    }

    this.selectedTenant.set(persona);
    this.selectionChange.emit(persona);
    this.tenantQuery.set('');
    this.tenantResults.set([]);
    this.pickerOpen.set(false);
  }

  protected clearTenant(): void {
    this.clearSelection();
    this.tenantQuery.set('');
    this.tenantResults.set([]);
    this.tenantPage.set(0);
    this.tenantTotalPages.set(0);
  }

  protected loadMoreTenants(): void {
    if (this.tenantLoading() || !this.hasMoreTenants()) {
      return;
    }

    const nextPage = this.tenantPage() + 1;
    this.tenantLoading.set(true);
    this.tenantRequests$.next({ query: this.tenantQuery(), page: nextPage });
  }

  protected retryTenants(): void {
    this.tenantError.set(null);
    this.tenantLoading.set(true);
    this.tenantRequests$.next({ query: this.tenantQuery(), page: 0 });
  }

  protected fullName(persona: Persona): string {
    return [persona.nombre, persona.ap, persona.am]
      .filter((part): part is string => Boolean(part?.trim()))
      .join(' ');
  }

  @HostListener('document:click', ['$event'])
  protected handleDocumentClick(event: MouseEvent): void {
    const target = event.target;
    const picker = this.host.nativeElement.querySelector('.tenant-picker');

    if (this.pickerOpen() && target instanceof Node && picker && !picker.contains(target)) {
      this.pickerOpen.set(false);
    }
  }

  private clearSelection(): void {
    this.selectedTenant.set(null);
    this.selectionChange.emit(null);
  }

  private handleTenantResult(result: TenantSearchResult): void {
    if (result.query !== this.tenantQuery()) {
      return;
    }

    this.tenantLoading.set(false);

    if (result.personas === null) {
      this.tenantError.set(result.error);
      return;
    }

    const activeTenants = result.personas.filter(
      (persona) => persona.estado === 1 && persona.tipoPersona === 'I',
    );

    this.tenantResults.update((current) =>
      result.page === 0 ? activeTenants : [...current, ...activeTenants],
    );
    this.tenantPage.set(result.page);
    this.tenantTotalPages.set(result.totalPages);
  }

  private errorMessage(requestError: unknown): string {
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

    return 'No fue posible buscar inquilinos.';
  }
}
