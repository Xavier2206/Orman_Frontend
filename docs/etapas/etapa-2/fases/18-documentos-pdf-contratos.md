# Fase 18 — Documentos PDF de Contratos

## Estado

`COMPLETADA`, implementada el 2026-09-16.

## Objetivo

Integrar en ORMAN Frontend la gestión de documentos PDF asociados a contratos, sin cambiar Backend,
endpoints existentes ni las reglas del alta del contrato.

## Alcance

- Selección de un PDF en `/app/contratos/nuevo` con validación de extensión y archivo no vacío.
- Subida del archivo únicamente después de que `POST /api/v1/unidades/{coduni}/contratos` devuelva
  un `ContratoResponse` con `codcon`.
- Indicador de subida, nombre y tamaño del archivo seleccionado y confirmación de carga.
- Vista previa del documento adjunto en el resumen del alta.
- Detalle en `/app/contratos/{codcon}/detalle` mediante `GET /api/v1/contratos/{codcon}`.
- Listado de metadatos de archivos, descarga Blob y eliminación con confirmación.
- Estados visuales responsive compatibles con los temas y tokens existentes.

## Exclusiones

- No se modificó Backend, entidades, tablas, migraciones, contratos HTTP ni lógica de negocio.
- No se cargan archivos ni se hacen peticiones de documentos desde `GET /api/v1/contratos`.
- No se implementó compresión en el navegador. El Backend ya procesa/optimiza el PDF después de
  recibirlo; el frontend no duplica ese trabajo ni agrega dependencias pesadas.
- No se implementaron pagos, cuotas, recibos, notificaciones de dominio, edición, finalización ni
  rescisión.

## Contratos confirmados y decisiones

- La creación devuelve `ContratoResponse`, cuyo `codcon` se usa para encadenar la subida opcional.
- La subida usa `POST /api/v1/contratos/{codcon}/archivos` con `multipart/form-data`, campo `archivo`
  y parámetro `orden=0` para el primer documento.
- `ContratoArchivoResponse` contiene `codarc`, `codcon`, `nombreArchivo`, `tipoContenido`,
  `tamanoOriginal`, `tamanoFinal`, `fechaSubida`, `subidoPor`, `orden` y
  `almacenadoInternamente`.
- La descarga se solicita bajo demanda como Blob; no existe URL pública en la respuesta de metadatos.
- Si falla la subida después de crear el contrato, el alta permanece en pantalla para reintentar el
  documento sin repetir el POST de creación.
- El límite de Backend es configurable y por defecto es 20 MB. El frontend muestra el tamaño y deja
  la validación definitiva al servidor, que además valida MIME, extensión, cabecera PDF y tamaño.

## Archivos creados

- `src/app/features/contratos/data/contrato-archivo.service.ts`
- `src/app/features/contratos/data/contrato-archivo.service.spec.ts`
- `src/app/features/contratos/components/contrato-archivo-manager/contrato-archivo-manager.component.ts`
- `src/app/features/contratos/components/contrato-archivo-manager/contrato-archivo-manager.component.html`
- `src/app/features/contratos/components/contrato-archivo-manager/contrato-archivo-manager.component.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.ts`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.html`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.css`
- `src/app/features/contratos/pages/contrato-detail/contrato-detail.component.spec.ts`
- `docs/etapas/etapa-2/fases/18-documentos-pdf-contratos.md`

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/features/contratos/data/contrato-api.service.ts`
- `src/app/features/contratos/data/contrato-api.service.spec.ts`
- `src/app/features/contratos/models/contrato.model.ts`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.ts`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.html`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.css`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.spec.ts`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.html`
- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.ts`
- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.html`
- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.css`
- `src/app/features/contratos/README.md`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- `docs/etapas/etapa-2/fases/README.md`

Los cambios previos locales de las Fases 16 y 17 se conservaron; no se descartó ni se sobrescribió
trabajo ajeno a esta integración. `package-lock.json` no cambió y el Backend permanece sin cambios.

## Implementación

`ContratoArchivoService` mantiene HTTP fuera de los componentes y usa tipos explícitos. El manager
reutilizable coordina selección, validación, carga de metadatos, descarga bajo demanda y eliminación
confirmada. En el alta, `ContratoCreateComponent` mantiene el archivo en memoria, recibe el response
tipado del POST de creación y permite al manager iniciar la subida solo cuando existe `codcon`.

La pantalla de detalle carga primero el contrato y después sus metadatos PDF. La vista general de
Contratos no incorpora el manager, por lo que continúa sin llamadas de archivos y mantiene
`GET /api/v1/contratos` sin cambios.

## Pruebas y validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --include src/app/features/contratos`: 7 archivos y 31 pruebas aprobadas.
- `npm test`: 71 archivos y 512 pruebas aprobadas.
- `npm run build`: correcto. Se mantienen advertencias de presupuesto CSS, incluidas las hojas nuevas
  de Contratos, y advertencias CommonJS de dependencias existentes.
- `git diff --check`: correcto antes del cierre.
- Backend: sin modificaciones (`git status --short` vacío en su repositorio).

## Revisión de mantenibilidad

El manager de archivos mantiene una responsabilidad cohesiva porque agrupa el ciclo visual completo
de un documento: selección, estado, metadatos y acciones. Su hoja CSS supera 300 líneas debido a que
contiene de forma local los estilos de carga, listado, modal, estados y responsive; se revisó la
segmentación y no se dividió para evitar separar estilos que evolucionan como una única superficie.
No se introdujo `any`, dependencia nueva, almacenamiento persistente de archivos ni URL pública.

## Riesgos y pendientes

- El límite real puede cambiar mediante configuración Backend; por eso no se replica como constante
  rígida en el frontend.
- La barra de progreso porcentual no se implementó porque el proyecto no tenía un patrón existente y
  el endpoint confirmado no expone progreso; se muestra estado de subida con indicador visual.

## Resultado

La integración frontend de documentos PDF queda implementada y validada, lista para revisión y cierre
Git manual.
