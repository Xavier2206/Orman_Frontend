# Fase 10 — Estructura base de Asignar Menús y Asignar Procesos

## Estado

`COMPLETADA`

## Objetivo

Preparar la estructura base de las features administrativas `asignar-menus` y `asignar-procesos`, siguiendo el patrón arquitectónico existente de `features/asignar-roles/`.

## Alcance

- Crear las carpetas `components`, `data`, `models` y `pages` de ambas features.
- Crear la Page `asignar-menus-list` como componente standalone compilable.
- Crear la Page `asignar-procesos-list` como componente standalone compilable.
- Crear una prueba mínima de creación para cada Page.
- Mantener HTML y CSS mínimos, sin diseño visual específico.

## Exclusiones

- No se implementó funcionalidad de negocio.
- No se consumieron APIs ni se crearon endpoints.
- No se crearon servicios, modelos de dominio, DTOs ni mocks.
- No se crearon componentes hijos, modales, formularios, filtros ni paginadores.
- No se crearon rutas, permisos ni lógica de asignación o retiro.
- No se añadieron dependencias ni se modificaron contratos Backend.

## Dependencias

- Estructura arquitectónica existente de `features/asignar-roles/`.
- Convenciones actuales de componentes standalone de Angular del proyecto.

## Archivos creados

### Asignar Menús

- `src/app/features/asignar-menus/components/.gitkeep`
- `src/app/features/asignar-menus/data/.gitkeep`
- `src/app/features/asignar-menus/models/.gitkeep`
- `src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.ts`
- `src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.html`
- `src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.css`
- `src/app/features/asignar-menus/pages/asignar-menus-list/asignar-menus-list.component.spec.ts`

### Asignar Procesos

- `src/app/features/asignar-procesos/components/.gitkeep`
- `src/app/features/asignar-procesos/data/.gitkeep`
- `src/app/features/asignar-procesos/models/.gitkeep`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.ts`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.html`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.css`
- `src/app/features/asignar-procesos/pages/asignar-procesos-list/asignar-procesos-list.component.spec.ts`

## Decisiones técnicas

- Se mantuvo la convención actual de Angular: componentes standalone por defecto, `templateUrl`, `styleUrl` y pruebas con `TestBed`.
- Las carpetas sin implementación contienen únicamente `.gitkeep` para conservar su estructura en Git.
- Las Pages no importan dependencias, no inyectan servicios y no contienen estado ni métodos funcionales.
- Los templates solo incluyen un encabezado semántico con el nombre explícito de cada feature.
- Las hojas CSS se mantienen vacías para no introducir diseño, colores, tokens ni estilos específicos.

## Implementación

Se crearon dos Pages independientes con sus templates, hojas de estilo y pruebas mínimas. Ambas Pages se pueden compilar y crear mediante `TestBed`; no existe integración con Router ni con infraestructura HTTP.

## Pruebas y validaciones

- Typecheck: `npx tsc -p tsconfig.app.json --noEmit` correcto.
- Pruebas específicas: 2 archivos y 2 pruebas aprobadas.
- Build de producción: `npm run build` correcto.
- `git diff --check`: correcto.
- `package-lock.json`: sin cambios.

El build conserva advertencias de presupuesto CSS preexistentes en componentes de Personas, Roles, Menús y Asignar Roles; ninguna corresponde a las nuevas hojas CSS vacías.

## Riesgos

- Las features todavía no tienen rutas ni comportamiento visible dentro de la aplicación; su integración queda deliberadamente fuera de esta fase.

## Pendientes

- Definir y confirmar en fases posteriores los contratos Backend necesarios para Menú–Rol y Menú–Proceso.
- Implementar servicios, modelos, rutas, permisos y UI funcional únicamente en fases autorizadas.

## Resultado final

La estructura base de `asignar-menus` y `asignar-procesos` quedó creada y compilable, sin adelantar funcionalidad, contratos Backend ni integración de rutas.
