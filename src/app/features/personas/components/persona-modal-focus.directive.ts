import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  inject,
  input,
  output,
} from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'button:not(:disabled)',
  '[href]',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

@Directive({
  selector: '[appPersonaModalFocus]',
  host: {
    tabindex: '-1',
    '(keydown)': 'handleKeydown($event)',
  },
})
export class PersonaModalFocusDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previouslyFocused = this.host.nativeElement.ownerDocument.activeElement;
  readonly initialFocusSelector = input<string | null>(null);
  readonly escapePressed = output<void>();

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      const initialFocus = this.initialFocusSelector()
        ? this.host.nativeElement.querySelector<HTMLElement>(this.initialFocusSelector()!)
        : null;

      (initialFocus ?? this.focusableElements()[0] ?? this.host.nativeElement).focus();
    });
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.escapePressed.emit();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = this.focusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.host.nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.host.nativeElement.ownerDocument.activeElement;
    if (event.shiftKey && (active === first || active === this.host.nativeElement)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  ngOnDestroy(): void {
    if (this.previouslyFocused instanceof HTMLElement && this.previouslyFocused.isConnected) {
      this.previouslyFocused.focus();
    }
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }
}
