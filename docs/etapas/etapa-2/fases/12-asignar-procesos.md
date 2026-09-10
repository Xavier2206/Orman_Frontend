# Fase 12 — Asignar Procesos a Menú

## Estado

`COMPLETADA`

## Objetivo

Implementar el módulo privado de Asignar Procesos siguiendo el patrón visual y arquitectónico de Asignar Menús, administrando la relación Menú–Proceso.

## Alcance realizado

- Se implementó la Page master-detail de Asignar Procesos.
- Se añadieron Menús activos con búsqueda remota, paginación y selección.
- Se implementó el detalle del Menú seleccionado.
- Se implementaron Procesos asignados y disponibles.
- Se añadió búsqueda local y paginación independiente para Procesos.
- Se implementaron las operaciones de asignar y retirar Procesos.
- Se conservaron Signals, RxJS, `ProblemDetail`, notificaciones, accesibilidad y responsive de Asignar Menús.
- Se corrigió el consumo del contrato real de la relación Menú–Proceso, incluyendo la respuesta `MeProResponse` y el estado del catálogo de Procesos.
- Después de asignar o retirar un Proceso se recarga el contexto de navegación preservando el Rol seleccionado.
- Se registró la ruta lazy privada `/app/asignar-procesos/listar`.

## APIs integradas

- `GET /api/v1/menus?estado=1&page=&size=&sort=&q=`
- `GET /api/v1/procesos?page=&size=&sort=`
- `GET /api/v1/menus/{codm}/procesos`
- `POST /api/v1/menus/{codm}/procesos/{codp}`
- `DELETE /api/v1/menus/{codm}/procesos/{codp}`

Las operaciones POST y DELETE no envían body adicional.

## Modelos y servicios

- Se reutilizaron `Menu`, `PageResponse`, `ProblemDetail` y `OrmanNotificationService`.
- Se creó `Proceso` con los campos confirmados `codp`, `nombre`, `enlace` y `estado`.
- Se creó `MeProResponse` para la respuesta real de la relación Menú–Proceso: `codm`, `nombreMenu`, `estadoMenu`, `codp`, `nombreProceso`, `enlaceProceso` y `estadoProceso`.
- `AsignarProcesosApiService` encapsula exclusivamente asignaciones, consulta de asignados y retiro.
- `ProcesoApiService` encapsula el catálogo paginado, su reducción a catálogo completo y el filtro local de Procesos activos; no agrega parámetros no soportados por Backend.
- No se reutilizó `AuthContextProceso` como modelo administrativo.

## Diseño visual y accesibilidad

- Se mantuvo el layout master-detail de Asignar Menús.
- Se conservaron tokens de tema, ORMAN, Día, Noche y Material Symbols Rounded.
- Se mantuvieron los breakpoints de una, dos, tres y cuatro columnas.
- Se conservaron `aria-label`, `aria-labelledby`, `aria-pressed`, `aria-live`, `role="status"`, `role="alert"`, focus visible y estados disabled.
- Las transiciones y skeletons respetan `prefers-reduced-motion`.

## Archivos creados

- `src/app/features/asignar-procesos/data/asignar-procesos-api.service.ts`
- `src/app/features/asignar-procesos/data/asignar-procesos-api.service.spec.ts`
- `src/app/features/asignar-procesos/data/proceso-api.service.ts`
- `src/app/features/asignar-procesos/data/proceso-api.service.spec.ts`
- `src/app/features/asignar-procesos/models/proceso.model.ts`
- `src/app/features/asignar-procesos/models/me-pro-response.model.ts`

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.ts`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.html`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.css`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.spec.ts`
- `src/app/core/auth/auth-context.service.ts`

`app.routes.ts` ya contenía cambios previos de Asignar Menús; en esta fase solo se añadió la ruta de Asignar Procesos.

## Validaciones

- Typecheck: correcto.
- Prettier sobre archivos del alcance: correcto.
- Pruebas relacionadas: 5 archivos y 35 pruebas aprobadas.
- Build de producción: correcto; se generó el chunk lazy de Asignar Procesos.
- Typecheck: correcto.
- `git diff --check`: correcto; permanecen avisos de conversión LF/CRLF.
- `package-lock.json`: sin cambios.

## Riesgos y pendientes

- El build muestra una advertencia de presupuesto CSS para la hoja de Asignar Procesos, equivalente al patrón existente de Asignar Menús y Asignar Roles.
- Debe verificarse que `AuthContextProceso.enlace` del Backend coincida con `/app/asignar-procesos/listar`; no se modificó Sidebar ni se inventó una normalización de enlaces.
- El build muestra advertencias de presupuesto CSS, incluido Asignar Procesos, que se mantienen fuera del alcance porque no se modificaron estilos.

## Resultado final

El módulo de Asignar Procesos quedó implementado siguiendo el patrón de Asignar Menús, con los contratos de catálogo y relación tipados según Backend, sin commits y sin ajustes visuales fuera del alcance.
