import {
  Component,
  ElementRef,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import {
  MENU_ICON_CATALOG,
  MENU_ICON_CATEGORIES,
  MenuIconCategory,
} from '../../models/menu-icon-catalog';
import { CreateMenuRequest, Menu, UpdateMenuRequest } from '../../models/menu.model';

export type MenuFormMode = 'create' | 'edit';

export type MenuFormSubmission =
  | { readonly mode: 'create'; readonly request: CreateMenuRequest }
  | { readonly mode: 'edit'; readonly request: UpdateMenuRequest };

type MenuFormControls = {
  nombre: FormControl<string>;
  icono: FormControl<string | null>;
  estado: FormControl<0 | 1>;
};

const notBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  String(control.value ?? '').trim() ? null : { required: true };

@Component({
  selector: 'app-menu-form-modal',
  imports: [MatIconModule, ReactiveFormsModule, PersonaModalFocusDirective],
  templateUrl: './menu-form-modal.component.html',
  styleUrl: './menu-form-modal.component.css',
})
export class MenuFormModalComponent implements OnChanges {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input.required<MenuFormMode>();
  readonly menu = input<Menu | null>(null);
  readonly submitting = input(false);
  readonly feedback = input<string | null>(null);
  readonly fieldErrors = input<Readonly<Record<string, string>>>({});
  readonly closed = output<void>();
  readonly saved = output<MenuFormSubmission>();
  protected readonly submitAttempted = signal(false);
  protected readonly iconPickerOpen = signal(false);
  protected readonly iconSearch = signal('');
  protected readonly iconCategory = signal<MenuIconCategory>('Todos');
  protected readonly iconCategories = MENU_ICON_CATEGORIES;
  protected readonly filteredIcons = computed(() => {
    const search = this.iconSearch().trim().toLowerCase();
    const category = this.iconCategory();

    return MENU_ICON_CATALOG.filter(
      (icon) =>
        (category === 'Todos' || icon.category === category) &&
        (!search || icon.name.includes(search)),
    );
  });
  protected readonly form = new FormGroup<MenuFormControls>({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(100)],
    }),
    icono: new FormControl<string | null>(null),
    estado: new FormControl<0 | 1>(1, { nonNullable: true }),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['mode'] && !changes['menu']) {
      return;
    }

    const menu = this.menu();

    this.submitAttempted.set(false);
    this.iconPickerOpen.set(false);
    this.iconSearch.set('');
    this.iconCategory.set('Todos');
    this.form.reset({
      nombre: menu?.nombre ?? '',
      icono: menu?.icono?.trim() || null,
      estado: 1,
    });
  }

  protected isCreate(): boolean {
    return this.mode() === 'create';
  }

  protected fieldMessage(): string | null {
    const control = this.form.controls.nombre;

    if (control.invalid && (control.touched || this.submitAttempted())) {
      if (control.hasError('required')) {
        return 'El nombre del Menú es obligatorio.';
      }

      if (control.hasError('maxlength')) {
        return 'El nombre del Menú admite hasta 100 caracteres.';
      }
    }

    return this.fieldErrors()['nombre'] ?? null;
  }

  protected iconName(icono: string | null): string {
    return icono?.trim() || 'menu';
  }

  protected previewName(): string {
    return this.form.controls.nombre.value.trim() || 'Nuevo Menú';
  }

  protected previewStatusLabel(): string {
    return this.form.controls.estado.value === 1 ? 'Activo' : 'Inactivo';
  }

  protected toggleIconPicker(): void {
    if (this.submitting()) {
      return;
    }

    this.iconPickerOpen.update((open) => !open);
  }

  protected searchIcons(event: Event): void {
    this.iconSearch.set((event.target as HTMLInputElement).value);
  }

  protected selectIconCategory(category: MenuIconCategory): void {
    this.iconCategory.set(category);
  }

  protected selectInitialState(state: 0 | 1): void {
    this.form.controls.estado.setValue(state);
  }

  protected selectIcon(iconName: string): void {
    this.form.controls.icono.setValue(iconName);
    this.iconPickerOpen.set(false);
  }

  protected clearIcon(): void {
    this.form.controls.icono.setValue(null);
  }

  protected close(): void {
    if (!this.submitting()) {
      this.closed.emit();
    }
  }

  protected submit(): void {
    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.submitting()) {
      this.focusNameInput();
      return;
    }

    const raw = this.form.getRawValue();
    const nombre = raw.nombre.trim();
    const icono = raw.icono?.trim() || null;

    if (this.isCreate()) {
      this.saved.emit({
        mode: 'create',
        request: { nombre, icono, estado: raw.estado },
      });
      return;
    }

    this.saved.emit({
      mode: 'edit',
      request: { nombre, icono },
    });
  }

  private focusNameInput(): void {
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('#menu-name')?.focus());
  }
}
