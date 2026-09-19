import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { PersonaModalFocusDirective } from '../../../personas/components/persona-modal-focus.directive';
import { ContratoArchivoService } from '../../data/contrato-archivo.service';
import { ContratoArchivoResponse } from '../../models/contrato.model';

@Component({
  selector: 'app-contrato-archivo-manager',
  imports: [MatIconModule, PersonaModalFocusDirective],
  templateUrl: './contrato-archivo-manager.component.html',
  styleUrl: './contrato-archivo-manager.component.css',
})
export class ContratoArchivoManagerComponent implements OnChanges {
  readonly contractId = input<number | null>(null);
  readonly documentTitle = input('Documento del contrato');
  readonly autoUpload = input(false);
  readonly loadExistingFiles = input(true);
  readonly fileSelectionChange = output<File | null>();
  readonly fileSelectionInvalidChange = output<boolean>();
  readonly documentUploaded = output<ContratoArchivoResponse>();

  private readonly archiveApi = inject(ContratoArchivoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private loadedContractId: number | null = null;

  protected readonly selectedFile = signal<File | null>(null);
  protected readonly files = signal<readonly ContratoArchivoResponse[]>([]);
  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly downloadingId = signal<number | null>(null);
  protected readonly deleting = signal(false);
  protected readonly operationError = signal<string | null>(null);
  protected readonly listError = signal<string | null>(null);
  protected readonly pendingDeletion = signal<ContratoArchivoResponse | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (!('contractId' in changes)) {
      return;
    }

    const codcon = this.contractId();
    if (codcon === null || codcon === this.loadedContractId) {
      return;
    }

    this.loadedContractId = codcon;
    if (this.autoUpload() && this.selectedFile()) {
      this.uploadSelectedFile(codcon);
      return;
    }

    if (this.loadExistingFiles()) {
      this.loadFiles(codcon);
    }
  }

  protected selectFile(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.item(0) ?? null;
    inputElement.value = '';

    if (!file) {
      return;
    }

    if (file.size === 0) {
      this.setSelectionError('El archivo PDF está vacío.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.setSelectionError('Selecciona un archivo con extensión PDF.');
      return;
    }

    this.operationError.set(null);
    this.selectedFile.set(file);
    this.fileSelectionInvalidChange.emit(false);
    this.fileSelectionChange.emit(file);

    const codcon = this.contractId();
    if (codcon !== null && this.autoUpload()) {
      this.uploadSelectedFile(codcon);
    }
  }

  protected clearSelection(): void {
    this.selectedFile.set(null);
    this.operationError.set(null);
    this.fileSelectionChange.emit(null);
  }

  protected uploadFromDetail(): void {
    const codcon = this.contractId();
    if (codcon !== null && !this.loading() && !this.listError()) {
      this.uploadSelectedFile(codcon);
    }
  }

  protected retryLoadFiles(): void {
    const codcon = this.contractId();
    if (codcon !== null) {
      this.loadFiles(codcon);
    }
  }

  protected uploadSelectedFile(codcon: number): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) {
      return;
    }

    this.operationError.set(null);
    this.uploading.set(true);

    this.archiveApi
      .uploadArchivo(codcon, file, this.nextOrder())
      .pipe(
        finalize(() => this.uploading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (uploadedFile) => {
          this.files.update((files) => [...files, uploadedFile].sort(this.compareFiles));
          this.selectedFile.set(null);
          this.fileSelectionChange.emit(null);
          this.documentUploaded.emit(uploadedFile);
        },
        error: (requestError: unknown) => {
          this.operationError.set(this.fileErrorMessage(requestError));
        },
      });
  }

  protected downloadFile(file: ContratoArchivoResponse): void {
    const codcon = this.contractId();
    if (codcon === null || this.downloadingId() !== null) {
      return;
    }

    this.operationError.set(null);
    this.downloadingId.set(file.codarc);
    this.archiveApi
      .descargarArchivo(codcon, file.codarc)
      .pipe(
        finalize(() => this.downloadingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (content) => this.saveDownload(content, file.nombreArchivo),
        error: (requestError: unknown) => {
          this.operationError.set(this.fileErrorMessage(requestError));
        },
      });
  }

  protected requestDelete(file: ContratoArchivoResponse): void {
    this.operationError.set(null);
    this.pendingDeletion.set(file);
  }

  protected closeDeleteConfirmation(): void {
    if (!this.deleting()) {
      this.pendingDeletion.set(null);
    }
  }

  protected confirmDelete(): void {
    const codcon = this.contractId();
    const file = this.pendingDeletion();
    if (codcon === null || file === null || this.deleting()) {
      return;
    }

    this.operationError.set(null);
    this.deleting.set(true);
    this.archiveApi
      .eliminarArchivo(codcon, file.codarc)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.files.update((files) => files.filter((current) => current.codarc !== file.codarc));
          this.pendingDeletion.set(null);
        },
        error: (requestError: unknown) => {
          this.operationError.set(this.fileErrorMessage(requestError));
        },
      });
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const megabytes = bytes / (1024 * 1024);
    if (megabytes >= 1) {
      return `${megabytes.toLocaleString('es-BO', { maximumFractionDigits: 2 })} MB`;
    }

    return `${(bytes / 1024).toLocaleString('es-BO', { maximumFractionDigits: 1 })} KB`;
  }

  protected formatContentType(contentType: string): string {
    return contentType === 'application/pdf' ? 'PDF' : contentType;
  }

  protected formatUploadDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private loadFiles(codcon: number): void {
    this.loading.set(true);
    this.listError.set(null);
    this.archiveApi
      .listarArchivos(codcon)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (files) => this.files.set([...files].sort(this.compareFiles)),
        error: (requestError: unknown) => {
          this.listError.set(this.fileErrorMessage(requestError));
        },
      });
  }

  private nextOrder(): number {
    return this.files().reduce((highest, file) => Math.max(highest, file.orden), -1) + 1;
  }

  private compareFiles(left: ContratoArchivoResponse, right: ContratoArchivoResponse): number {
    return left.orden - right.orden || left.codarc - right.codarc;
  }

  private setSelectionError(message: string): void {
    this.selectedFile.set(null);
    this.fileSelectionInvalidChange.emit(true);
    this.fileSelectionChange.emit(null);
    this.operationError.set(message);
  }

  private saveDownload(content: Blob, fileName: string): void {
    const downloadUrl = URL.createObjectURL(content);
    const link = this.document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
  }

  private fileErrorMessage(requestError: unknown): string {
    if (requestError instanceof HttpErrorResponse) {
      switch (requestError.status) {
        case 400:
          return 'El archivo no es válido. Selecciona un documento PDF correcto.';
        case 403:
          return 'No tienes permisos para gestionar documentos de este contrato.';
        case 404:
          return 'No se encontró el contrato o el documento solicitado.';
        case 413:
          return 'El archivo es demasiado grande para subirlo.';
        case 415:
          return 'El formato no está permitido. Selecciona un archivo PDF.';
      }
    }

    return 'No fue posible completar la operación del documento. Inténtalo nuevamente.';
  }
}
