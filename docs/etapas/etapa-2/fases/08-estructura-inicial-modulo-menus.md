# Fase 08 — Gestionar Menús: listado, acciones y modales

## Estado

`COMPLETADA`

Esta fase finaliza la pantalla funcional de listar Menús con sus acciones de crear, editar y cambio de estado. Las asignaciones del módulo no están implementadas.

## Objetivo

Implementar la pantalla de listado y sus acciones administrativas confirmadas siguiendo las convenciones actuales de Personas y Roles, con integración de lectura y escritura al Backend confirmado.

## Alcance realizado

- `MenusListComponent` consume el listado remoto paginado, el resumen global, búsqueda remota con debounce, filtro remoto por estado, limpieza de filtros y navegación de páginas.
- `MenuApiService` implementa únicamente `list()` para `GET /api/v1/menus` y `resumen()` para `GET /api/v1/menus/resumen`, con parámetros y respuestas tipados.
- Se añadieron cards responsive con nombre, código, estado e icono Material Symbol proveniente de `Menu.icono`; el fallback visual para valor nulo o vacío es `menu`.
- Se incorporaron estados de loading, catálogo vacío, filtros sin coincidencias, error de listado y error independiente de resumen.
- Se añadió la ruta lazy protegida `/app/menus/listar`, sin modificar Sidebar.
- Se implementaron Crear, Editar, Desactivar y Reactivar mediante un único formulario y un único modal de confirmación de estado; la página conserva la coordinación HTTP.
- Se incorporó un selector visual local de iconos con búsqueda, categorías, selección, preview y eliminación opcional del icono.
- Se actualizaron las pruebas para cubrir contratos HTTP, formularios, selector visual, acciones, toasts, recargas, filtros, paginación, estados visuales, iconos y errores.

## Exclusiones explícitas

- Asignaciones Rol–Menú y Menú–Proceso.
- Detalle de Menú y DELETE, que no forma parte del contrato Backend.
- Cualquier operación distinta de Crear, Editar, Activar y Desactivar.
- Sidebar, Menús/Procesos existentes y Backend.
- DELETE, que no forma parte del modelo confirmado.

## Archivos creados

- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.ts`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.html`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.css`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.spec.ts`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.ts`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.html`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.css`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.spec.ts`
- `src/app/features/menus/data/menu-api.service.ts`
- `src/app/features/menus/models/menu.model.ts`
- `src/app/features/menus/models/menu-icon-catalog.ts`
- `src/app/features/menus/pages/menus-list/menus-list.component.ts`
- `src/app/features/menus/pages/menus-list/menus-list.component.html`
- `src/app/features/menus/pages/menus-list/menus-list.component.css`
- `src/app/features/menus/pages/menus-list/menus-list.component.spec.ts`
- `src/app/features/menus/pages/menus-list/menus-list.actions.spec.ts`

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/features/menus/data/menu-api.service.ts`
- `src/app/features/menus/models/menu.model.ts`
- `src/app/features/menus/pages/menus-list/menus-list.component.ts`
- `src/app/features/menus/pages/menus-list/menus-list.component.html`
- `src/app/features/menus/pages/menus-list/menus-list.component.css`
- `src/app/features/menus/pages/menus-list/menus-list.component.spec.ts`
- `src/app/features/menus/pages/menus-list/menus-list.actions.spec.ts`
- `src/app/features/menus/models/menu-icon-catalog.ts`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.ts`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.html`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.css`
- `src/app/features/menus/components/menu-form-modal/menu-form-modal.component.spec.ts`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.ts`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.html`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.css`
- `src/app/features/menus/components/menu-status-confirm-modal/menu-status-confirm-modal.component.spec.ts`

## Decisiones

- `Menu.icono` se tipó como `string | null` porque el contrato confirmado permite valor nulo.
- `Menu.estado` se tipó como `0 | 1`, igual que los modelos equivalentes existentes.
- `MenuListParams` contiene únicamente `q`, `estado`, `page`, `size` y `sort`; `PageResponse` se reutiliza desde Personas.
- El resumen se carga una vez al entrar y no se vuelve a solicitar al cambiar filtros o página.
- El fallback de icono es exclusivamente visual (`menu`) y nunca modifica ni persiste el valor recibido.
- Create envía `nombre`, `icono` y `estado`; Edit envía únicamente `nombre` e `icono`.
- Crear y cambio de estado recargan listado y resumen; Editar recarga únicamente el listado, conservando los filtros actuales.
- El catálogo de iconos es curado y local, no una representación completa de todos los Material Symbols; está separado del componente para facilitar ampliaciones.

## Revisión de segmentación

`MenusListComponent` tiene 356 líneas, su template 371 líneas y su CSS 317 líneas porque concentran una única pantalla administrativa cohesiva: filtros remotos, estados, paginación, cards, acciones responsive, coordinación de dos modales, toasts y recargas. `MenuFormModalComponent` tiene 164 líneas de TypeScript, 201 de template y 400 de CSS porque mantiene en un único modal el formulario compartido Crear/Editar, preview y selector visual integrado. Separar estas piezas únicamente para reducir el contador introduciría componentes artificiales y rompería el flujo de una responsabilidad estable.

## Validaciones

- Typecheck: correcto (`npx tsc -p tsconfig.app.json --noEmit`).
- Pruebas relacionadas: correctas; 4 archivos y 30 pruebas aprobadas.
- Suite completa: correcta; 35 archivos y 239 pruebas aprobadas.
- Build de producción: correcto; se mantienen advertencias de presupuesto CSS en los componentes de Menús y las advertencias históricas de Personas.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

## Pendientes

Quedan pendientes asignación Rol–Menú, asignación Menú–Proceso, detalle de Menú y cualquier operación no confirmada. DELETE no existe en el contrato Backend.

## Corrección de centrado de iconos posterior — 2026-09-13

### Objetivo

Corregir la alineación visual de los iconos circulares en las tarjetas resumen del listado de Menús.

### Observación e implementación

Las tarjetas utilizaban `align-items: flex-start`, mientras que el glifo Material heredaba una altura de línea superior a su tamaño visual. Se ajustó únicamente el CSS del listado para centrar verticalmente el contenido de cada tarjeta y para que la caja tipográfica del icono tenga centrado explícito mediante `grid`, `place-items: center` y `line-height: 1`.

### Archivos modificados

- `src/app/features/menus/pages/menus-list/menus-list.component.css`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- Este documento de Fase, como registro posterior de la corrección.

### Validación

- Las pruebas focalizadas de Menús aprobaron 30 de 30 casos en 4 archivos.
- `npx tsc --noEmit -p tsconfig.app.json` finalizó correctamente.
- Prettier se ejecutó sobre el CSS modificado.
- El centrado se verificó en navegador para anchos de 320, 360, 390, 430, 768, 1280, 1536 y 1856 px, sin overflow de página, y en los temas ORMAN, DÍA y NOCHE.
- La suite completa registró 343 de 346 pruebas aprobadas; las tres fallas restantes corresponden a `orman-notification.service.spec.ts` y son ajenas a esta corrección.
- El build estándar no pudo completar la descarga de Google Fonts por un error DNS de `fonts.googleapis.com`; el fallback sin optimización quedó limitado por presupuestos CSS existentes.
