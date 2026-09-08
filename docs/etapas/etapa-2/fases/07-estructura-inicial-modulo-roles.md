# Fase 07 — Gestionar Roles: listado, resumen y filtros remotos

## Estado

`COMPLETADA`

## Objetivo

Implementar la pantalla funcional de Gestionar Roles con listado, resumen, filtros, paginación y operaciones de crear, editar, activar y desactivar.

## Alcance realizado

- Se creó `src/app/features/roles/` con las carpetas `components`, `data`, `models` y `pages`.
- `RolesListComponent` es standalone, solicita la primera página al entrar y renderiza cards paginadas con estados loading, error y vacío.
- `RolFormModalComponent` es standalone y comparte los modos `create | edit`.
- `RolStatusConfirmModalComponent` es standalone y comparte las operaciones `activate | deactivate`.
- `RolApiService.list()` consume `GET /api/v1/roles` con `q`, `estado`, `page`, `size` y `sort=nombre,asc`; omite `q` vacío y `estado` no seleccionado.
- `RolApiService.resumen()` consume `GET /api/v1/roles/resumen` y recibe `totalRoles`, `activos` e `inactivos`.
- El resumen es global e independiente del listado: se carga una vez al entrar y no se vuelve a consultar al buscar, filtrar o paginar.
- La búsqueda remota aplica `debounceTime(350)` y `distinctUntilChanged()`; el flujo de listado usa `switchMap`, por lo que una respuesta anterior cancelada no puede sobrescribir el resultado más reciente.
- Las cards muestran únicamente nombre, código, estado y la etiqueta de negocio `Protegido` para `PROPIETARIO`; no representan los Roles mediante iconos inventados.
- Se incorporaron tarjetas resumen, filtros accesibles de búsqueda/estado, limpieza de filtros, estados vacíos diferenciados y el mismo hover, tokens, responsive y reduced motion de Personas.
- `RolApiService` implementa `create()`, `update()`, `activate()` y `deactivate()` con los contratos HTTP confirmados, sin inspeccionar manualmente códigos de estado.
- `RolFormModalComponent` es un único modal tipado para `create | edit`, con validación de nombre, estado inicial únicamente en creación, feedback general y errores de campo.
- `RolStatusConfirmModalComponent` es un único modal tipado para `activate | deactivate`, con mensajes administrativos aprobados, feedback ProblemDetail y estados de envío.
- `RolesListComponent` coordina HTTP, toasts, recargas, preservación de filtros/página y protección UX de `PROPIETARIO`; los modales no realizan HTTP.
- Las cards ofrecen acciones de escritorio y menú `more_vert` en mobile, con tooltips, estados semánticos y áreas interactivas mínimas de 44 px.
- `Rol` se limita a los campos Backend confirmados: `codr`, `nombre` y `estado`, con estado `0 | 1`.
- Se añadieron pruebas de resumen, parámetros remotos, debounce, combinación y limpieza de filtros, preservación de filtros al paginar, estados visuales, propietario, vacíos, errores y paginación.

## Exclusiones explícitas

- DELETE de Roles, detalle de Rol, asignaciones Rol–Usuario y cualquier escritura distinta de crear, editar, activar y desactivar.
- Gestión de Menús, Procesos, Sidebar, permisos Backend y cambios Backend.
- Sidebar, Menús, Procesos, permisos y cambios Backend.
- Componentes de detalle, eliminación, fotografía, usuario, menú o proceso.

## Archivos creados

- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.ts`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.html`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.css`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.spec.ts`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.ts`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.html`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.css`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.spec.ts`
- `src/app/features/roles/data/rol-api.service.ts`
- `src/app/features/roles/models/rol.model.ts`
- `src/app/features/roles/pages/roles-list/roles-list.component.ts`
- `src/app/features/roles/pages/roles-list/roles-list.component.html`
- `src/app/features/roles/pages/roles-list/roles-list.component.css`
- `src/app/features/roles/pages/roles-list/roles-list.component.spec.ts`
- `src/app/features/roles/pages/roles-list/roles-list.actions.spec.ts`

## Archivos modificados en esta iteración

- `src/app/app.routes.ts`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.ts`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.html`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.css`
- `src/app/features/roles/components/rol-form-modal/rol-form-modal.component.spec.ts`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.ts`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.html`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.css`
- `src/app/features/roles/components/rol-status-confirm-modal/rol-status-confirm-modal.component.spec.ts`
- `src/app/features/roles/data/rol-api.service.ts`
- `src/app/features/roles/models/rol.model.ts`
- `src/app/features/roles/pages/roles-list/roles-list.component.ts`
- `src/app/features/roles/pages/roles-list/roles-list.component.html`
- `src/app/features/roles/pages/roles-list/roles-list.component.css`
- `src/app/features/roles/pages/roles-list/roles-list.component.spec.ts`
- `src/app/features/roles/pages/roles-list/roles-list.actions.spec.ts`

## Validaciones

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npm test -- --watch=false`: correcto; 31 archivos y 209 pruebas aprobadas.
- `npm run build`: correcto. No hay advertencia de presupuesto CSS para Roles; persisten dos advertencias preexistentes en componentes de Personas.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

## Revisión de tamaño y responsabilidades

`RolesListComponent` tiene 354 líneas y `roles-list.component.html` 394 líneas porque concentran la orquestación de filtros, paginación, estados, dos modales y acciones responsive de una única pantalla. La responsabilidad continúa siendo cohesiva y los flujos HTTP permanecen en `RolApiService`; separar cada interacción en componentes artificiales aumentaría la complejidad sin aportar una frontera de dominio estable en esta fase.

## Pendientes

El módulo Gestionar Roles no incluye DELETE, detalle, asignaciones Rol–Usuario, Menús, Procesos ni cambios Backend.
