export interface DashboardIngresoMensual {
  readonly periodo: string;
  readonly monto: number;
}

export interface DashboardResumenGeneral {
  readonly cantidadPropiedades: number;
  readonly inversionInicialTotal: number;
  readonly ingresosConfirmadosAcumulados: number;
  readonly porcentajeRecuperacion: number | null;
}

export interface DashboardPropiedadFinanciera {
  readonly codprop: number;
  readonly nombre: string;
  readonly inversionInicial: number;
  readonly ingresosConfirmadosAcumulados: number;
  readonly porcentajeRecuperacion: number | null;
  readonly ingresosConfirmadosPorMes: readonly DashboardIngresoMensual[];
}

export interface DashboardResumenFinancieroResponse {
  readonly moneda: string;
  readonly resumenGeneral: DashboardResumenGeneral;
  readonly propiedades: readonly DashboardPropiedadFinanciera[];
  readonly ingresosConfirmadosPorMes: readonly DashboardIngresoMensual[];
}
