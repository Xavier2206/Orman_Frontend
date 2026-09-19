# Fase 19 — Detalle de Contrato

## Estado

`COMPLETADA`, implementada el 2026-09-18.

## Objetivo

Convertir la pantalla de detalle de Contrato en una vista de expediente
contractual usando únicamente los endpoints Backend existentes.

## Alcance

- Distribución responsive en dos columnas: información y cuotas a la izquierda,
  documentos a la derecha.
- Cabecera con inquilino, CI, iniciales y estado visual según el estado real del
  contrato.
- Tarjeta de información contractual con ubicación y condiciones.
- Resumen financiero con total, pagadas, pendientes y saldo pendiente usando el
  resumen entregado por `ContratoResponse`.
- Pestañas `Cuotas y pagos` y `Documentos` sin adelantar un historial.
- Tabla de cuotas desde `GET /api/v1/contratos/{codcon}/cuotas`, con estados,
  importes y acciones visuales.
- Consulta bajo demanda de pagos desde `GET /api/v1/cuotas/{codcuo}/pagos`
  mediante un modal tipado.
- Reutilización de la gestión existente de documentos PDF, descarga y
  eliminación.

## Exclusiones

No se modificó Backend, entidades, migraciones, endpoints, reglas de negocio,
creación de contratos, registro de pagos, cuotas, recibos ni notificaciones.
`Registrar pago` se presenta deshabilitado porque el alcance solo permite
consultar pagos existentes. No se implementó historial contractual.

## Contratos confirmados y decisiones

- `CuotaResponse` conserva `codcuo`, periodo, vencimiento, monto, montos
  confirmado/pendiente, saldo y los estados `PENDIENTE`, `PARCIAL`, `PAGADA` y
  `ANULADA`.
- `PagoResponse` conserva los campos de monto, método, referencia, fechas,
  estado, origen y usuarios devueltos por Backend.
- El detalle carga el contrato y, después, sus cuotas. Los pagos solo se
  consultan al elegir `Ver pagos` en una cuota pagada.
- Los documentos continúan gestionándose con `ContratoArchivoManagerComponent`
  y sus endpoints existentes; no se descargan PDFs automáticamente.
- La hoja CSS de detalle supera 300 líneas porque mantiene en un único archivo
  cohesivo la tarjeta contractual, resumen, tabla, pestañas, estados y
  responsive. Se revisó la segmentación y no se dividió para evitar separar
  reglas que evolucionan como una misma superficie visual.

## Archivos creados

- `src/app/features/contratos/data/cuota-api.service.ts`
- `src/app/features/contratos/data/cuota-api.service.spec.ts`
- `src/app/features/contratos/data/pago-api.service.ts`
- `src/app/features/contratos/data/pago-api.service.spec.ts`
- `src/app/features/contratos/components/contrato-pagos-modal/contrato-pagos-modal.component.ts`
- `src/app/features/contratos/components/contrato-pagos-modal/contrato-pagos-modal.component.html`
- `src/app/features/contratos/components/contrato-pagos-modal/contrato-pagos-modal.component.css`
- `src/app/features/contratos/components/contrato-pagos-modal/contrato-pagos-modal.component.spec.ts`
- `docs/etapas/etapa-2/fases/19-detalle-contrato.md`

## Archivos modificados

- `src/app/features/contratos/models/contrato.model.ts`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.ts`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.html`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.spec.ts`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- `docs/etapas/etapa-2/fases/README.md`

Los cambios locales previos fueron conservados. `package-lock.json` no cambió
y el repositorio Backend no fue modificado.

## Pruebas y validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- Pruebas focalizadas de detalle, servicios y modal: 4 archivos; 5 pruebas
  aprobadas.
- Suite completa: 74 archivos; 514 pruebas aprobadas y 3 fallos en
  `src/app/core/notifications/orman-notification.service.spec.ts`, fuera del
  alcance de esta fase y sin archivos modificados en ese módulo.
- `npm run build`: correcto. Se mantienen advertencias de presupuesto CSS y
  dependencias CommonJS existentes; la nueva hoja de detalle también supera el
  presupuesto CSS configurado.
- `git diff --check`: correcto; Git reporta únicamente avisos de conversión
  LF/CRLF del working tree.

## Resultado

El detalle de Contrato queda implementado con información contractual,
resumen financiero, cuotas, consulta bajo demanda de pagos y documentos PDF,
manteniendo la arquitectura Angular y los contratos Backend existentes.
