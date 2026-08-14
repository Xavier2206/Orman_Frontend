# Fase 04 — Selector de rol y Sidebar dinámico

## Estado

`COMPLETADA`

## Objetivo

Vincular el selector de rol del Topbar con la navegación privada para que Sidebar represente únicamente Menús → Procesos del rol elegido dentro del `AuthContext` ya cargado.

## Alcance

- Selección única de rol en `AuthContextService` mediante Signals.
- Selector accesible del Topbar alimentado por roles reales del contexto.
- Sidebar derivado de los menús del rol seleccionado, sin agrupadores de rol.
- Limpieza, restauración F5 y pruebas del estado derivado.

## Exclusiones

- Backend, requests por rol, JWT/authorities, persistencia de selección, guards, permisos, rutas dinámicas de procesos y rediseño del layout.

## Dependencias

- Fase 03 completada: `AuthContextService`, contexto en memoria, topbar y sidebar reales.

## Archivos creados

- `docs/etapas/etapa-2/fases/04-selector-rol-sidebar-dinamico.md`

## Archivos modificados

- `src/app/core/auth/auth-context.service.ts` y su prueba.
- `src/app/layouts/private-layout/components/private-topbar/` (componente, plantilla y prueba).
- `src/app/layouts/private-layout/components/private-sidebar/` (componente, plantilla, estilos y prueba).
- `docs/PlanGeneral.md` y `docs/CHANGELOG.md`.

## Decisiones

- `selectedRoleId`, `selectedRole` y `selectedMenus` viven en el servicio de contexto existente. `selectedMenus` es un `computed`, sin copia mutable de arreglos.
- Tras cada respuesta exitosa de `/auth/context` se selecciona el primer rol en el orden devuelto. No hay persistencia adicional; después de F5 se aplica de nuevo la misma regla sobre el contexto recién recuperado.
- `selectRole()` valida que el código pertenezca al contexto actual y actualiza solo Signals. No ejecuta HTTP ni cambia sesión, JWT o authorities.
- Sidebar no representa roles ni los usa como agrupadores. Si no existen roles o el rol elegido no tiene menús, muestra un estado vacío seguro.
- `Proceso.enlace` conserva el tratamiento de Fase 03: información de modelo, no ruta Angular.

## Implementación

- Topbar usa un `<select>` nativo accesible con `codr` como valor y `nombre` como etiqueta; no contiene nombres hardcodeados.
- Sidebar consume solo `selectedRole` y `selectedMenus`, conserva iconos, responsive, colapso y procesos bajo cada menú.
- `clearContext()` limpia también el rol seleccionado; restauración y logout no pueden retener selección del usuario anterior.

## Pruebas

- Selección automática del primer rol, menús derivados y restauración F5.
- Cambio de rol local, validación de rol existente y ausencia de nueva solicitud de contexto.
- Selector Topbar con roles reales.
- Sidebar sin nombres de rol, con rol único, varios roles, sin roles y rol sin menús.
- Limpieza de selección tras logout.

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json` correcto.
- `npm test -- --watch=false` correcto: 18 archivos y 107 pruebas aprobadas.
- `npm run build` correcto: 307.29 kB iniciales brutos y 78.92 kB de transferencia estimada.
- `git diff --check` correcto.
- `package-lock.json` no cambió.

## Riesgos y pendientes

- La comprobación manual de Network con usuario real de múltiples roles requiere credenciales autorizadas. Las pruebas verifican que la selección no dispara una solicitud HTTP.
- No existe todavía contrato Router para `Proceso.enlace` ni contrato para referencias de foto no URL; ambos continúan fuera de alcance.

## Resultado final

Fase completada técnicamente. La validación manual real con un usuario de múltiples roles sigue pendiente de credenciales autorizadas y acceso a DevTools; las pruebas comprueban que el cambio de rol no crea solicitudes HTTP. Los cambios locales previos de Fases 02 y 03 fueron preservados; no se realizaron operaciones Git de consolidación.
