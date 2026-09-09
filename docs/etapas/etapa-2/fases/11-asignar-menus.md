# Fase 11 — Asignar Menús a Rol

## Estado

COMPLETADA

## Objetivo

Implementar la pantalla privada /app/asignar-menus/listar para administrar la relación Rol–Menú usando el patrón visual y arquitectónico de features/asignar-roles/.

## Alcance realizado

- Se implementó el layout master-detail con listado paginado de Roles y detalle del Rol seleccionado.
- Se añadió búsqueda remota de Roles con debounceTime, distinctUntilChanged y switchMap.
- Se añadió la carga paginada del catálogo de Menús activos mediante MenuApiService.
- Se implementaron Menús asignados y Menús disponibles con filtros locales por nombre y código.
- Se implementó paginación independiente de cuatro cards por página para ambas secciones de Menús.
- Se implementaron las operaciones de asignar y retirar Menús.
- Se añadieron loading, error, vacío, sin selección y estados sin coincidencias.
- Se reutilizaron Rol, Menu, PageResponse, ProblemDetail y OrmanNotificationService.
- Se reutilizó Material Symbols Rounded con fallback visual menu para iconos nulos o vacíos.
- Se incorporó la ruta lazy privada /app/asignar-menus/listar.

## APIs integradas

- GET /api/v1/roles?estado=1&page=&size=&sort=&q=
- GET /api/v1/menus?estado=1&page=&size=&sort=
- GET /api/v1/roles/{codr}/menus
- POST /api/v1/roles/{codr}/menus/{codm}
- DELETE /api/v1/roles/{codr}/menus/{codm}

Las respuestas de Menús asignados se consumen como readonly Menu[]. No fue necesario crear un modelo RolMe.

## Estructura y archivos

### Archivos creados

- src/app/features/asignar-menus/data/asignar-menus-api.service.ts
- src/app/features/asignar-menus/data/asignar-menus-api.service.spec.ts
- src/app/features/menus/data/menu-api.service.spec.ts

### Archivos modificados

- src/app/app.routes.ts
- src/app/features/menus/data/menu-api.service.ts
- src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.ts
- src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.html
- src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.css
- src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.spec.ts

No se crearon componentes hijos ni modelos duplicados.

## Decisiones técnicas

- RolApiService conserva la consulta paginada y remota de Roles activos.
- MenuApiService incorpora listActiveCatalog() para recorrer las páginas del catálogo activo.
- AsignarMenusApiService contiene únicamente consulta, asignación y retiro de Menús por codr.
- El catálogo activo se carga completo y los Menús se buscan y paginan localmente.
- La selección de Rol cancela solicitudes de asignaciones anteriores con switchMap.
- Después de asignar o retirar, se vuelve a consultar la relación para recalcular disponibles.
- Las respuestas de error utilizan ProblemDetail y contemplan estados 403, 404, 409 y 422.
- No se modificaron Sidebar, permisos, AuthContext ni Backend.

## Diseño visual y accesibilidad

- Se conservaron los tokens semánticos de ORMAN, DÍA y NOCHE.
- El grid utiliza una, dos, tres o cuatro columnas según viewport y cantidad visible.
- Cada card conserva la acción al final mediante flexbox.
- Se incluyeron aria-label, aria-labelledby, aria-live, role=status, role=alert y foco visible.
- Los iconos decorativos utilizan aria-hidden.
- Las transiciones y skeletons respetan prefers-reduced-motion.

## Revisión de segmentación

La Page mantiene una responsabilidad cohesiva de coordinación de Roles, catálogo, selección, asignaciones, búsquedas, paginación y estados visuales. Sus tamaños finales son:

- TypeScript: 391 líneas.
- Template: 378 líneas.
- CSS: 473 líneas.

No se dividieron estos archivos porque extraer cards, buscadores o paginadores sin una reutilización confirmada introduciría componentes artificiales y separaría el flujo de una única pantalla administrativa. La hoja CSS supera el presupuesto de build, pero mantiene encapsulados los estilos del módulo y reutiliza exclusivamente tokens existentes.

## Pruebas y validaciones

- npx tsc -p tsconfig.app.json --noEmit: correcto.
- Pruebas específicas: 3 archivos y 12 pruebas aprobadas.
- Suite completa: 42 archivos y 293 pruebas aprobadas.
- npm run build: correcto.
- Chunk lazy de Asignar Menús generado correctamente.
- Advertencia nueva de presupuesto CSS: asignar-menus-list.component.css, 7.23 kB frente a 4.00 kB.
- git diff --check: correcto; permanecen únicamente avisos de conversión LF/CRLF.
- package-lock.json: sin cambios.

## Riesgos y pendientes

- La carga completa del catálogo activo es consistente con el patrón de Asignar Roles, pero deberá revisarse si el volumen de Menús crece significativamente.
- La integración con Sidebar y permisos no formó parte de esta implementación.
- No se implementó Asignar Procesos.

## Resultado

El módulo funcional de Asignar Menús quedó implementado en /app/asignar-menus/listar, con selección de Roles, consulta de asignaciones, catálogo local de Menús, búsqueda, paginación y operaciones de asignar/quitar.
