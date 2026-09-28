import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { PagoApiService } from '../../contratos/data/pago-api.service';
import type { PagoResponse } from '../../contratos/models/contrato.model';
import type { CuotaListado } from '../models/cuota-listado.model';

export interface PagoRevisionLookup {
  readonly pagosPorCuota: ReadonlyMap<number, readonly PagoResponse[]>;
  readonly cuotasConError: ReadonlySet<number>;
}

interface CuotaPagoRevisionResult {
  readonly codcuo: number;
  readonly pagos: readonly PagoResponse[];
  readonly error: boolean;
}

const EMPTY_LOOKUP: PagoRevisionLookup = {
  pagosPorCuota: new Map(),
  cuotasConError: new Set(),
};

@Injectable({ providedIn: 'root' })
export class PagoRevisionLookupService {
  private readonly paymentApi = inject(PagoApiService);

  loadForQuotas(quotas: readonly CuotaListado[]): Observable<PagoRevisionLookup> {
    const cuotasConRevision = quotas.filter((quota) => quota.montoPendienteRevision > 0);

    if (cuotasConRevision.length === 0) {
      return of(EMPTY_LOOKUP);
    }

    return forkJoin(cuotasConRevision.map((quota) => this.loadQuotaPayments(quota))).pipe(
      map((results) => this.toLookup(results)),
    );
  }

  private loadQuotaPayments(quota: CuotaListado): Observable<CuotaPagoRevisionResult> {
    return this.paymentApi.listByInstallment(quota.codcuo).pipe(
      map((payments) => ({
        codcuo: quota.codcuo,
        pagos: payments.filter(
          (payment) =>
            payment.codcuo === quota.codcuo &&
            payment.estado === 'PENDIENTE_REVISION' &&
            payment.origenRegistro === 'INQUILINO',
        ),
        error: false,
      })),
      catchError(() =>
        of({
          codcuo: quota.codcuo,
          pagos: [],
          error: true,
        }),
      ),
    );
  }

  private toLookup(results: readonly CuotaPagoRevisionResult[]): PagoRevisionLookup {
    const paymentsByQuota = new Map<number, readonly PagoResponse[]>();
    const quotasWithError = new Set<number>();

    for (const result of results) {
      if (result.error) {
        quotasWithError.add(result.codcuo);
      } else if (result.pagos.length > 0) {
        paymentsByQuota.set(result.codcuo, result.pagos);
      }
    }

    return {
      pagosPorCuota: paymentsByQuota,
      cuotasConError: quotasWithError,
    };
  }
}
