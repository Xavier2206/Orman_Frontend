import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { isProblemDetail } from '../../../core/api/problem-detail.model';
import { AuthContextService } from '../../../core/auth/auth-context.service';
import { AuthService } from '../../../core/auth/auth.service';

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
  private readonly authService = inject(AuthService);
  private readonly authContext = inject(AuthContextService);
  private readonly dialogPanel = viewChild.required<ElementRef<HTMLElement>>('dialogPanel');
  private readonly usernameInput =
    viewChild.required<ElementRef<HTMLInputElement>>('usernameInput');
  private previousBodyOverflow = '';
  private scrollLocked = false;

  readonly close = output<void>();
  readonly authenticated = output<void>();

  protected readonly passwordVisible = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly loginForm = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(30)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(72)],
    }),
  });

  constructor() {
    this.lockDocumentScroll();

    afterNextRender(() => this.usernameInput().nativeElement.focus(), { injector: this.injector });

    this.destroyRef.onDestroy(() => this.restoreDocumentScroll());
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((isVisible) => !isVisible);
  }

  protected submitLogin(): void {
    this.loginForm.markAllAsTouched();
    this.clearFeedback();

    if (this.loginForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const { username, password } = this.loginForm.getRawValue();

    this.authService
      .login(username, password)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => this.loadContextAndFinish(),
        error: (error: unknown) =>
          this.showError(this.getAuthErrorMessage(error, 'No fue posible iniciar sesión.')),
      });
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
    return control.invalid && control.touched;
  }

  protected showPasswordError(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && control.touched;
  }

  protected isUsernameValid(): boolean {
    const control = this.loginForm.controls.username;
    return control.valid && (control.dirty || control.touched);
  }

  protected isPasswordValid(): boolean {
    const control = this.loginForm.controls.password;
    return control.valid && (control.dirty || control.touched);
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
    this.isSubmitting.set(false);
    this.clearFeedback();
    this.loginForm.reset({
      username: '',
      password: '',
    });
  }

  private finishAuthentication(): void {
    this.resetState();
    this.restoreDocumentScroll();
    this.authenticated.emit();
  }

  private loadContextAndFinish(): void {
    this.authContext
      .loadContext()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.finishAuthentication(),
        // Authentication remains valid if only its complementary context fails. The layout renders
        // its explicit context error state instead of reintroducing mock navigation.
        error: () => this.finishAuthentication(),
      });
  }

  private clearFeedback(): void {
    this.feedbackMessage.set(null);
  }

  private showError(message: string): void {
    this.feedbackMessage.set(message);
  }

  private getAuthErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse) || !isProblemDetail(error.error)) {
      return fallback;
    }

    switch (error.error.errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Credenciales incorrectas.';
      case 'SESSION_EXPIRED':
      case 'SESSION_REVOKED':
        return 'Tu sesión ya no está activa. Inicia sesión nuevamente.';
      case 'CSRF':
        return 'No fue posible validar la solicitud. Intenta nuevamente.';
      default:
        return error.error.detail || fallback;
    }
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
