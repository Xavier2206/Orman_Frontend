import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';

import { ProblemDetail, isProblemDetail } from '../../../../core/api/problem-detail.model';
import { PersonaDetailModalComponent } from '../../components/persona-detail-modal/persona-detail-modal.component';
import { PersonaFormModalComponent } from '../../components/persona-form-modal/persona-form-modal.component';
import { PersonaPasswordModalComponent } from '../../components/persona-password-modal/persona-password-modal.component';
import { PersonaStatusConfirmModalComponent } from '../../components/persona-status-confirm-modal/persona-status-confirm-modal.component';
import { PersonaUserCreateModalComponent } from '../../components/persona-user-create-modal/persona-user-create-modal.component';
import { PersonaApiService } from '../../data/persona-api.service';
import { PersonaFormSubmit, PersonaUserCreateSubmit } from '../../models/persona-modal.model';
import { PersonaResumen } from '../../models/persona-resumen.model';
import { PageResponse, Persona, PersonaListFilters } from '../../models/persona.model';

type ModalMode = 'form' | 'detail' | 'confirm' | 'user' | 'password' | null;
type FilterMenu = 'type' | 'status';

interface FilterOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-personas-list',
  imports: [
    MatIconModule,
    PersonaFormModalComponent,
    PersonaDetailModalComponent,
    PersonaStatusConfirmModalComponent,
    PersonaUserCreateModalComponent,
    PersonaPasswordModalComponent,
  ],
  templateUrl: './personas-list.component.html',
  styleUrl: './personas-list.component.css',
})
export class PersonasListComponent {
  private readonly api = inject(PersonaApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly search$ = new Subject<string>();
  private readonly photoUrls = signal<ReadonlyMap<number, string>>(new Map());
  protected readonly page = signal<PageResponse<Persona> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resumen = signal<PersonaResumen | null>(null);
  protected readonly resumenLoading = signal(true);
  protected readonly resumenError = signal(false);
  protected readonly filters = signal<PersonaListFilters>({
    q: '',
    tipoPersona: null,
    estado: null,
    page: 0,
    size: 10,
    sort: 'ap,asc',
  });
  protected readonly modal = signal<ModalMode>(null);
  protected readonly selected = signal<Persona | null>(null);
  protected readonly submitting = signal(false);
  protected readonly feedback = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string>>({});
  protected readonly mobileMenu = signal<number | null>(null);
  protected readonly openFilter = signal<FilterMenu | null>(null);
  protected readonly typeOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos los tipos' },
    { value: 'A', label: 'Administrativo' },
    { value: 'I', label: 'Inquilino' },
  ];
  protected readonly statusOptions: readonly FilterOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: '1', label: 'Activos' },
    { value: '0', label: 'Inactivos' },
  ];

  constructor() {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.load({ q, page: 0 }));
    this.load();
    this.loadResumen();
    this.destroyRef.onDestroy(() => this.revokePhotos());
  }
  protected search(event: Event): void {
    this.search$.next((event.target as HTMLInputElement).value);
  }
  protected setType(value: string): void {
    this.load({ tipoPersona: value === 'A' || value === 'I' ? value : null, page: 0 });
  }
  protected setStatus(value: string): void {
    this.load({ estado: value === '1' ? 1 : value === '0' ? 0 : null, page: 0 });
  }
  protected selectedFilterLabel(filter: FilterMenu): string {
    return (
      this.filterOptions(filter).find((option) => option.value === this.selectedFilterValue(filter))
        ?.label ?? ''
    );
  }
  protected selectedFilterValue(filter: FilterMenu): string {
    return filter === 'type'
      ? (this.filters().tipoPersona ?? '')
      : `${this.filters().estado ?? ''}`;
  }
  protected toggleFilter(filter: FilterMenu): void {
    if (this.openFilter() === filter) {
      this.closeFilter();
      return;
    }

    this.openFilter.set(filter);
    this.focusFilterOption(filter, this.selectedFilterIndex(filter));
  }
  protected selectFilter(filter: FilterMenu, value: string): void {
    if (filter === 'type') {
      this.setType(value);
    } else {
      this.setStatus(value);
    }

    this.closeFilter(true, filter);
  }
  protected handleFilterTriggerKeydown(event: KeyboardEvent, filter: FilterMenu): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    this.openFilter.set(filter);
    this.focusFilterOption(filter, this.selectedFilterIndex(filter));
  }
  protected handleFilterOptionKeydown(
    event: KeyboardEvent,
    filter: FilterMenu,
    index: number,
  ): void {
    const options = this.filterOptions(filter);

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFilter(true, filter);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectFilter(filter, options[index].value);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      this.focusFilterOption(filter, (index + offset + options.length) % options.length);
    }
  }
  @HostListener('document:click', ['$event'])
  protected closeFilterOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (this.openFilter() && target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.closeFilter();
    }
  }
  protected clearFilters(): void {
    this.load({ q: '', tipoPersona: null, estado: null, page: 0 });
  }
  protected hasFilters(): boolean {
    const f = this.filters();
    return Boolean(f.q || f.tipoPersona || f.estado !== null);
  }
  protected changePage(page: number): void {
    if (page >= 0 && (!this.page() || page < this.page()!.totalPages)) this.load({ page });
  }
  protected fullName(p: Persona): string {
    return [p.nombre, p.ap, p.am].filter((part): part is string => Boolean(part?.trim())).join(' ');
  }
  protected initials(p: Persona): string {
    return (
      [p.nombre, p.ap]
        .filter(Boolean)
        .map((part) => part!.trim().charAt(0))
        .join('')
        .toUpperCase() || 'P'
    );
  }
  protected typeName(tipo: Persona['tipoPersona']): string {
    return tipo === 'A' ? 'Administrativo' : 'Inquilino';
  }
  protected photoUrl(p: Persona): string | null {
    return this.photoUrls().get(p.codper) ?? null;
  }
  protected toggleMobileMenu(codper: number): void {
    this.mobileMenu.update((open) => (open === codper ? null : codper));
  }
  protected openCreate(): void {
    this.selected.set(null);
    this.open('form');
  }
  protected openEdit(p: Persona): void {
    this.selected.set(p);
    this.open('form');
  }
  protected openDetail(p: Persona): void {
    this.selected.set(p);
    this.open('detail');
  }
  protected openConfirm(p: Persona): void {
    this.selected.set(p);
    this.open('confirm');
  }
  protected openUser(p: Persona): void {
    this.selected.set(p);
    this.open('user');
  }
  protected openPassword(p: Persona): void {
    this.selected.set(p);
    this.open('password');
  }
  protected closeModal(): void {
    this.modal.set(null);
    this.feedback.set(null);
    this.fieldErrors.set({});
  }
  protected submitPersona(event: PersonaFormSubmit): void {
    const current = this.selected();
    const creating = current === null;
    let persistedPersona: Persona | null = current;

    this.submitting.set(true);
    this.feedback.set(null);
    this.fieldErrors.set({});
    const request$ = current
      ? this.api.update(current.codper, event.request)
      : this.api.create(event.request);

    request$
      .pipe(
        switchMap((persona) => {
          persistedPersona = persona;
          this.selected.set(persona);

          return event.photo ? this.api.subirFoto(persona.codper, event.photo) : of(persona);
        }),
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
          if (!current) this.loadResumen();
        },
        error: (error: unknown) => {
          if (creating && persistedPersona && event.photo) {
            this.feedback.set(
              'La Persona fue creada correctamente, pero no se pudo guardar la fotografía.',
            );
            this.fieldErrors.set({});
            this.load();
            this.loadResumen();
            return;
          }

          this.consumeError(error);
        },
      });
  }
  protected removePhoto(): void {
    const p = this.selected();
    if (!p?.foto) return;
    this.submitting.set(true);
    this.api
      .eliminarFoto(p.codper)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.clearDeletedPhoto(p.codper);
        },
        error: (e: unknown) => this.consumeError(e),
      });
  }
  protected submitStatus(): void {
    const p = this.selected();
    if (!p) return;
    this.submitting.set(true);
    (p.estado === 1 ? this.api.desactivar(p.codper) : this.api.activar(p.codper))
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
          this.loadResumen();
        },
        error: (e: unknown) => this.consumeError(e),
      });
  }
  protected submitUser(event: PersonaUserCreateSubmit): void {
    const p = this.selected();
    if (!p) return;
    this.submitting.set(true);
    this.api
      .crearUsuario({ ...event, codper: p.codper })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
          this.loadResumen();
        },
        error: (e: unknown) => this.consumeError(e),
      });
  }
  protected submitPassword(event: { newPassword: string }): void {
    const login = this.selected()?.usuario?.login;
    if (!login) return;
    this.submitting.set(true);
    this.api
      .cambiarPassword(login, event)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.closeModal();
          this.load();
        },
        error: (e: unknown) => this.consumeError(e),
      });
  }
  private load(change: Partial<PersonaListFilters> = {}): void {
    const filters = { ...this.filters(), ...change };
    this.filters.set(filters);
    this.loading.set(true);
    this.error.set(null);
    this.api
      .list(filters)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.loadPhotos(page.content);
        },
        error: (e: unknown) => this.error.set(this.errorMessage(e)),
      });
  }
  private filterOptions(filter: FilterMenu): readonly FilterOption[] {
    return filter === 'type' ? this.typeOptions : this.statusOptions;
  }
  private selectedFilterIndex(filter: FilterMenu): number {
    const selectedLabel = this.selectedFilterLabel(filter);
    return Math.max(
      this.filterOptions(filter).findIndex((option) => option.label === selectedLabel),
      0,
    );
  }
  private closeFilter(restoreFocus = false, filter = this.openFilter()): void {
    this.openFilter.set(null);

    if (restoreFocus && filter) {
      queueMicrotask(() => {
        this.host.nativeElement
          .querySelector<HTMLButtonElement>(`#persona-${filter}-trigger`)
          ?.focus();
      });
    }
  }
  private focusFilterOption(filter: FilterMenu, index: number): void {
    queueMicrotask(() => {
      this.host.nativeElement
        .querySelector<HTMLElement>(`[data-filter="${filter}"][data-index="${index}"]`)
        ?.focus();
    });
  }
  private loadResumen(): void {
    this.resumenLoading.set(true);
    this.resumenError.set(false);
    this.api
      .resumen()
      .pipe(
        finalize(() => this.resumenLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => this.resumen.set(r),
        error: () => {
          this.resumen.set(null);
          this.resumenError.set(true);
        },
      });
  }
  private loadPhotos(personas: readonly Persona[]): void {
    this.revokePhotos();
    personas
      .filter((p) => p.foto)
      .forEach((p) =>
        this.api
          .getFoto(p.codper)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (blob) =>
              this.photoUrls.update((urls) =>
                new Map(urls).set(p.codper, URL.createObjectURL(blob)),
              ),
            error: () => undefined,
          }),
      );
  }
  private revokePhotos(): void {
    this.photoUrls().forEach((url) => URL.revokeObjectURL(url));
    this.photoUrls.set(new Map());
  }
  private clearDeletedPhoto(codper: number): void {
    this.selected.update((selected) =>
      selected?.codper === codper ? { ...selected, foto: null } : selected,
    );
    this.page.update((page) =>
      page
        ? {
            ...page,
            content: page.content.map((persona) =>
              persona.codper === codper ? { ...persona, foto: null } : persona,
            ),
          }
        : null,
    );

    const photoUrl = this.photoUrls().get(codper);
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }

    this.photoUrls.update((urls) => {
      const updatedUrls = new Map(urls);
      updatedUrls.delete(codper);
      return updatedUrls;
    });
  }
  private open(mode: ModalMode): void {
    this.mobileMenu.set(null);
    this.feedback.set(null);
    this.fieldErrors.set({});
    this.modal.set(mode);
  }
  private consumeError(error: unknown): void {
    const problem =
      error instanceof HttpErrorResponse && isProblemDetail(error.error) ? error.error : null;
    this.feedback.set(problem?.detail ?? 'No fue posible completar la operación.');
    this.fieldErrors.set(
      Object.fromEntries((problem?.fieldErrors ?? []).map((field) => [field.field, field.message])),
    );
  }
  private errorMessage(error: unknown): string {
    const problem: ProblemDetail | null =
      error instanceof HttpErrorResponse && isProblemDetail(error.error) ? error.error : null;
    return (
      problem?.detail ??
      (error instanceof HttpErrorResponse && error.status === 403
        ? 'Acceso denegado.'
        : 'No fue posible cargar las personas.')
    );
  }
}
