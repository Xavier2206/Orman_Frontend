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
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { isProblemDetail } from '../../../core/api/problem-detail.model';
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
  private readonly dialogPanel = viewChild.required<ElementRef<HTMLElement>>('dialogPanel');
  private readonly usernameInput = viewChild.required<ElementRef<HTMLInputElement>>('usernameInput');
  private readonly otpInputs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');
  private previousBodyOverflow = '';
  private scrollLocked = false;

  readonly close = output<void>();
  readonly authenticated = output<void>();

  protected readonly passwordVisible = signal(false);
  protected readonly authStep = signal<'LOGIN' | 'OTP'>('LOGIN');
  protected readonly isSubmitting = signal(false);
  protected readonly isResendingOtp = signal(false);
  protected readonly feedbackMessage = signal<string | null>(null);
  protected readonly feedbackKind = signal<'error' | 'status'>('error');
  protected readonly otpDigits = signal<string[]>(['', '', '', '', '', '']);
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
  protected readonly otpForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
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
        next: (response) => {
          if (response.status === 'OTP_REQUIRED') {
            this.authStep.set('OTP');
            this.resetOtp();
            afterNextRender(() => this.focusOtpInput(0), { injector: this.injector });
            return;
          }

          this.finishAuthentication();
        },
        error: (error: unknown) => this.showError(this.getAuthErrorMessage(error, 'No fue posible iniciar sesión.')),
      });
  }

  protected submitOtp(): void {
    this.otpForm.markAllAsTouched();
    this.clearFeedback();

    if (this.otpForm.invalid || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .verifyOtp(this.otpForm.controls.code.value)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: () => this.finishAuthentication(),
        error: (error: unknown) =>
          this.showError(this.getAuthErrorMessage(error, 'Código incorrecto o vencido.')),
      });
  }

  protected resendOtp(): void {
    if (this.isResendingOtp() || this.isSubmitting()) {
      return;
    }

    this.clearFeedback();
    this.isResendingOtp.set(true);

    this.authService
      .resendOtp()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isResendingOtp.set(false)),
      )
      .subscribe({
        next: () => this.showStatus('Enviamos un nuevo código de verificación.'),
        error: (error: unknown) =>
          this.showError(this.getAuthErrorMessage(error, 'No pudimos enviar el código.')),
      });
  }

  protected handleOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 6 - index);

    if (digits.length > 1) {
      this.applyOtpDigits(index, digits);
      return;
    }

    input.value = digits;
    this.setOtpDigit(index, digits);

    if (digits) {
      this.focusOtpInput(index + 1);
    }
  }

  protected handleOtpKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();

      if (this.otpDigits()[index]) {
        this.setOtpDigit(index, '');
      } else if (index > 0) {
        this.setOtpDigit(index - 1, '');
        this.focusOtpInput(index - 1);
      }
      return;
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      this.setOtpDigit(index, '');
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.otpDigits().length - 1) {
      event.preventDefault();
      this.focusOtpInput(index + 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.focusOtpInput(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.focusOtpInput(this.otpDigits().length - 1);
    }
  }

  protected handleOtpPaste(index: number, event: ClipboardEvent): void {
    event.preventDefault();
    const pastedDigits = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6 - index) ?? '';

    if (pastedDigits) {
      this.applyOtpDigits(index, pastedDigits);
    }
  }

  protected returnToLogin(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.authService.clearOtpChallenge();
    this.resetOtp();
    this.authStep.set('LOGIN');
    this.clearFeedback();
    afterNextRender(() => this.usernameInput().nativeElement.focus(), { injector: this.injector });
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

  protected showOtpError(): boolean {
    const control = this.otpForm.controls.code;
    return control.invalid && control.touched;
  }

  protected isOtpValid(): boolean {
    const control = this.otpForm.controls.code;
    return control.valid && (control.dirty || control.touched);
  }

  private setOtpDigit(index: number, digit: string): void {
    const nextDigits = [...this.otpDigits()];
    nextDigits[index] = digit;
    this.updateOtpState(nextDigits);
  }

  private applyOtpDigits(startIndex: number, digits: string): void {
    const nextDigits = [...this.otpDigits()];
    const normalizedDigits = digits.replace(/\D/g, '').slice(0, 6 - startIndex);

    normalizedDigits.split('').forEach((digit, offset) => {
      nextDigits[startIndex + offset] = digit;
    });
    this.updateOtpState(nextDigits);
    this.focusOtpInput(Math.min(startIndex + normalizedDigits.length, nextDigits.length - 1));
  }

  private updateOtpState(digits: string[]): void {
    this.otpDigits.set(digits);
    this.otpForm.controls.code.setValue(digits.join(''), { emitEvent: false });
    this.otpForm.controls.code.markAsDirty();
    this.otpForm.controls.code.updateValueAndValidity({ emitEvent: false });
  }

  private resetOtp(): void {
    this.otpDigits.set(['', '', '', '', '', '']);
    this.otpForm.reset({ code: '' });
  }

  private focusOtpInput(index: number): void {
    this.otpInputs()[index]?.nativeElement.focus();
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
    this.authStep.set('LOGIN');
    this.isSubmitting.set(false);
    this.isResendingOtp.set(false);
    this.clearFeedback();
    this.authService.clearOtpChallenge();
    this.loginForm.reset({
      username: '',
      password: '',
    });
    this.resetOtp();
  }

  private finishAuthentication(): void {
    this.resetState();
    this.restoreDocumentScroll();
    this.authenticated.emit();
  }

  private clearFeedback(): void {
    this.feedbackMessage.set(null);
  }

  private showError(message: string): void {
    this.feedbackKind.set('error');
    this.feedbackMessage.set(message);
  }

  private showStatus(message: string): void {
    this.feedbackKind.set('status');
    this.feedbackMessage.set(message);
  }

  private getAuthErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse) || !isProblemDetail(error.error)) {
      return fallback;
    }

    switch (error.error.errorCode) {
      case 'INVALID_CREDENTIALS':
        return 'Credenciales incorrectas.';
      case 'OTP_DELIVERY_FAILED':
        return 'No pudimos enviar el código. Intenta nuevamente.';
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
