import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
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
  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private readonly usernameInput = viewChild<ElementRef<HTMLInputElement>>('usernameInput');
  private readonly previousBodyOverflow = this.document.body.style.overflow;

  readonly closed = output<void>();

  protected readonly currentStep = signal<1 | 2>(1);
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
    this.document.body.style.overflow = 'hidden';

    afterNextRender(() => this.closeButton().nativeElement.focus());

    this.destroyRef.onDestroy(() => {
      this.document.body.style.overflow = this.previousBodyOverflow;
    });
  }

  protected showCredentialsStep(): void {
    this.currentStep.set(2);
    this.showInformation.set(false);

    afterNextRender(
      () => this.usernameInput()?.nativeElement.focus(),
      { injector: this.injector },
    );
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
    this.closed.emit();
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  protected handleKeydown(event: KeyboardEvent): void {
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
    const focusableElements = [
      ...this.dialogPanel().nativeElement.querySelectorAll<HTMLElement>(
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
    } else if (!this.dialogPanel().nativeElement.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  private resetState(): void {
    this.currentStep.set(1);
    this.passwordVisible.set(false);
    this.showInformation.set(false);
    this.loginForm.reset({
      username: '',
      password: '',
    });
  }
}
