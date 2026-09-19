# Fase 20 — Rediseño del Detalle de Contrato

## Estado

`COMPLETADA`, implementada el 2026-09-18.

## Objetivo

Reorganizar visualmente el Detalle de contrato para presentarlo como un
expediente contractual tipo dashboard, sin modificar Backend, endpoints ni
reglas de negocio.

## Alcance

- Cabecera contractual con código, inquilino, CI, ubicación y estado.
- Cuatro tarjetas superiores para Inquilino, Ubicación, Periodo contractual y
  Condiciones económicas.
- Indicador de avance del periodo basado en las fechas y duración disponibles.
- Valor total informativo calculado en frontend como duración por alquiler
  mensual, sin persistencia.
- Resumen financiero con total, pagadas, parciales, pendientes y saldo.
- Tabla de cuotas, pestañas, consulta bajo demanda de pagos y documentos PDF
  existentes.
- Responsive para escritorio, tablet y móvil usando tokens ORMAN.

## Exclusiones

No se modifica Backend, entidades, migraciones, contratos HTTP, modelos
financieros, reglas de negocio, registro de pagos, cuotas, recibos ni
notificaciones. No se implementa historial contractual.

## Decisiones

- La cantidad de cuotas parciales se deriva únicamente de las cuotas ya
  recibidas por `GET /api/v1/contratos/{codcon}/cuotas`.
- El progreso del periodo usa la fecha actual del navegador y se limita entre
  cero y la duración del contrato.
- Cuando un dato no está disponible se muestra `—` o `No disponible`; no se
  inventan valores.
- La gestión de documentos continúa en `ContratoArchivoManagerComponent` y el
  modal de pagos mantiene la carga bajo demanda.

## Archivos modificados

- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.ts`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.html`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail-panels.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.spec.ts`
- `src/app/features/contratos/components/contrato-cuotas-panel/contrato-cuotas-panel.component.ts`
- `src/app/features/contratos/components/contrato-cuotas-panel/contrato-cuotas-panel.component.html`
- `src/app/features/contratos/components/contrato-cuotas-panel/contrato-cuotas-panel.component.css`
- `src/app/features/contratos/components/contrato-cuotas-panel/contrato-cuotas-panel.component.spec.ts`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- `docs/etapas/etapa-2/fases/README.md`

Los cambios previos se conservaron. No se modificó Backend ni
`package-lock.json`.

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- Pruebas focalizadas: 5 archivos; 12 pruebas aprobadas.
- Suite completa: 75 archivos; 517 pruebas aprobadas y 7 fallos fuera del
  alcance: tres del servicio global de notificaciones y cuatro del generador
  PDF de Propiedades.
- Build de producción: correcto; se mantienen advertencias de presupuesto CSS
  y dependencias CommonJS.
- `git diff --check`: correcto; Git reporta únicamente avisos de conversión
  LF/CRLF del working tree.

## Resultado

El rediseño queda implementado y validado en frontend, listo para el cierre
manual de Git.
