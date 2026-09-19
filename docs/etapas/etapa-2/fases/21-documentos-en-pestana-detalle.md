# Fase 21 — Documentos en la pestaña del Detalle de Contrato

## Estado

`COMPLETADA`, implementada el 2026-09-19.

## Objetivo

Retirar la tarjeta lateral de documentos del Detalle de contrato y presentar la
gestión de archivos PDF dentro de la pestaña `Documentos`, ocupando todo el
ancho disponible del expediente.

## Alcance

- Mantener las pestañas `Cuotas y pagos` y `Documentos`.
- Montar el gestor existente de archivos al seleccionar `Documentos`.
- Mostrar en esa sección título, descripción, carga PDF, archivos adjuntos,
  tamaño, tipo, fecha disponible en la respuesta y acciones existentes.
- Mantener descarga, eliminación, confirmación, estados y servicios actuales.
- Eliminar únicamente la composición lateral del layout.

## Exclusiones

No se modifica Backend, endpoints, modelos de negocio, cuotas, pagos, creación
de contratos ni reglas de documentos. No se crean servicios ni llamadas nuevas.

## Decisiones

- `ContratoArchivoManagerComponent` continúa siendo la única responsabilidad
  de carga, listado, descarga y eliminación de archivos.
- El componente se instancia al abrir la pestaña `Documentos`, evitando cargar
  metadatos de archivos cuando el usuario permanece en `Cuotas y pagos`.
- El título del gestor admite una variante visual para conservar el texto
  singular usado en Crear contrato y mostrar el plural requerido en Detalle.

## Archivos modificados

- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.html`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail-panels.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.spec.ts`
- `src/app/features/contratos/components/contrato-archivo-manager/contrato-archivo-manager.component.ts`
- `src/app/features/contratos/components/contrato-archivo-manager/contrato-archivo-manager.component.html`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- `docs/etapas/etapa-2/fases/README.md`

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- Pruebas focalizadas de detalle y documentos: 2 archivos; 10 pruebas
  aprobadas.
- Suite completa: 75 archivos; 517 pruebas aprobadas y 7 fallos fuera del
  alcance: tres del servicio global de notificaciones y cuatro del generador
  PDF de Propiedades.
- Build de producción: correcto; se mantienen advertencias existentes de
  presupuesto CSS y dependencias CommonJS.
- `git diff --check`: correcto; Git reporta únicamente avisos de conversión
  LF/CRLF del working tree.

## Resultado

La pestaña `Documentos` ocupa el ancho completo del detalle, conserva la
gestión PDF existente y evita cargar archivos mientras se visualizan cuotas.
