import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Injector,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './login-modal.component.html',
  styleUrl: './login-modal.component.css',
})
export class LoginModalComponent {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialogPanel = viewChild.required<ElementRef<HTMLElement>>('dialogPanel');
  private readonly usernameInput = viewChild.required<ElementRef<HTMLInputElement>>('usernameInput');
  private previousBodyOverflow = '';
  private scrollLocked = false;

  readonly close = output<void>();

  protected readonly passwordVisible = signal(false);
  protected readonly showInformation = signal(false);
  protected readonly loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.lockDocumentScroll();

    afterNextRender(
      () => this.usernameInput().nativeElement.focus(),
      { injector: this.injector },
    );

    this.destroyRef.onDestroy(() => this.restoreDocumentScroll());
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((isVisible) => !isVisible);
  }

  protected submitLogin(): void {
    this.loginForm.markAllAsTouched();
    this.showInformation.set(false);

    if (this.loginForm.valid) {
      this.showInformation.set(true);
    }
  }

  protected requestClose(): void {
    this.resetState();
    this.restoreDocumentScroll();
    this.close.emit();
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
      return;
    }

    if (event.key === 'Tab') {
      this.keepFocusInsideDialog(event);
    }
  }

  protected showUsernameError(): boolean {
    const control = this.loginForm.controls.username;
    return control.invalid && (control.dirty || control.touched);
  }

  protected showPasswordError(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  private keepFocusInsideDialog(event: KeyboardEvent): void {
    const dialogPanel = this.dialogPanel().nativeElement;
    const focusableElements = [
      ...dialogPanel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((element) => !element.hidden);

    if (focusableElements.length === 0) {
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = this.document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    } else if (!dialogPanel.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private resetState(): void {
    this.passwordVisible.set(false);
    this.showInformation.set(false);
    this.loginForm.reset({
      username: '',
      password: '',
    });
  }

  private lockDocumentScroll(): void {
    if (this.scrollLocked) {
      return;
    }

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.scrollLocked = true;
  }

  private restoreDocumentScroll(): void {
    if (!this.scrollLocked) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.scrollLocked = false;
  }
}
