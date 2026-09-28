import { Component, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { CuotaFiltroOpcion } from '../../models/cuota-listado.model';

@Component({
  selector: 'app-cuota-filter-select',
  imports: [MatIconModule],
  templateUrl: './cuota-filter-select.component.html',
  styleUrl: './cuota-filter-select.component.css',
})
export class CuotaFilterSelectComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly filterId = input.required<string>();
  readonly label = input.required<string>();
  readonly options = input.required<readonly CuotaFiltroOpcion[]>();
  readonly value = input('');
  readonly placeholder = input('Selecciona una opción');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly selectionChange = output<string>();

  protected readonly expanded = signal(false);

  protected selectedLabel(): string {
    return (
      this.options().find((option) => option.value === this.value())?.label ?? this.placeholder()
    );
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.expanded()) {
      this.close();
      return;
    }

    this.openAt(this.selectedOptionIndex());
  }

  protected handleTriggerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      return;
    }

    event.preventDefault();
    this.openAt(this.selectedOptionIndex());
  }

  protected handleOptionKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close(true);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectOption(index);
      return;
    }

    const options = this.options();

    if (event.key === 'Home') {
      event.preventDefault();
      this.focusOption(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      this.focusOption(options.length - 1);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      this.focusOption((index + offset + options.length) % options.length);
    }
  }

  protected selectOption(index: number): void {
    const option = this.options()[index];

    if (!option) {
      return;
    }

    this.selectionChange.emit(option.value);
    this.close(true);
  }

  protected optionId(index: number): string {
    return `${this.filterId()}-option-${index}`;
  }

  protected handleFocusOut(): void {
    setTimeout(() => {
      if (!this.host.nativeElement.contains(this.host.nativeElement.ownerDocument.activeElement)) {
        this.close();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (this.expanded() && target instanceof Node && !this.host.nativeElement.contains(target)) {
      this.close();
    }
  }

  private openAt(index: number): void {
    if (this.options().length === 0) {
      return;
    }

    this.expanded.set(true);
    this.focusOption(index);
  }

  private close(restoreFocus = false): void {
    this.expanded.set(false);

    if (restoreFocus) {
      queueMicrotask(() => {
        this.host.nativeElement.querySelector<HTMLButtonElement>('.filter-select-trigger')?.focus();
      });
    }
  }

  private selectedOptionIndex(): number {
    const selectedIndex = this.options().findIndex((option) => option.value === this.value());
    return selectedIndex < 0 ? 0 : selectedIndex;
  }

  private focusOption(index: number): void {
    queueMicrotask(() => {
      this.host.nativeElement.querySelector<HTMLElement>(`#${this.optionId(index)}`)?.focus();
    });
  }
}
