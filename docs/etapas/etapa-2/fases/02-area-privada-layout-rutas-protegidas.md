# Fase 02 — Área privada base, layout autenticado y protección de rutas

## Estado

`COMPLETADA`

## Objetivo

Crear la entrada autenticada `/app/inicio`, su layout privado permanente, la protección de rutas y la restauración de sesión al iniciar Angular.

## Alcance

- Rutas `/app` y `/app/inicio` protegidas por autenticación.
- Bootstrap de sesión mediante `POST /api/v1/auth/refresh` usando la infraestructura validada de la Fase 01.
- `PrivateLayout`, topbar, sidebar estructural y pantalla temporal de inicio.
- Redirección a `/app/inicio` tras login directo u OTP correcto.
- Logout desde el área privada y retorno a `/`.

## Exclusiones

- Roles, permisos, guards por rol, navegación dinámica y servicios de menús o procesos.
- Módulos funcionales, datos inventados, dashboard, tablas, estadísticas o rutas futuras.
- Cambios de contratos backend, dependencias, temas globales y Theory de la Etapa 2.

## Dependencias

- Fase 01 completada: `AuthService`, interceptor Bearer, refresh HttpOnly, XSRF, login, OTP y logout.
- Sistema de temas ORMAN, DÍA y NOCHE existente.

## Arquitectura propuesta

`/app` estará protegido por un guard centrado exclusivamente en el estado de sesión. Bajo esa raíz, `PrivateLayout` conservará topbar y sidebar, mientras `RouterOutlet` cargará la pantalla `/app/inicio`.

## Decisiones conocidas

- El access token seguirá únicamente en memoria; la restauración usará la cookie HttpOnly mediante refresh.
- El bootstrap diferenciará `checking`, `authenticated` y `unauthenticated` para evitar redirecciones prematuras.
- El sidebar será deliberadamente un espacio “En construcción”; la navegación futura dependerá de Usuario ↔ Roles ↔ Menús ↔ Procesos.

## Archivos creados

- `src/app/core/auth/auth.guard.ts` y su prueba.
- `src/app/layouts/private-layout/` con layout, topbar, sidebar y pruebas del layout/sidebar.
- `src/app/features/private/inicio/` con la pantalla temporal y su prueba.

## Archivos modificados

- `src/app/core/auth/auth.model.ts` y `auth.service.ts` para el estado de bootstrap y la restauración de sesión.
- `src/app/app.config.ts` y `app.routes.ts` para inicialización y rutas privadas.
- `LoginModalComponent` se conserva como emisor único de autenticación; `PublicHeaderComponent` redirige ese resultado a `/app/inicio`.
- Pruebas existentes de autenticación, header y aplicación raíz.

## Implementación realizada

- `AuthService` inicia en `checking`. `restoreSession()` intenta una única llamada a `POST /api/v1/auth/refresh`; una respuesta autenticada restaura la sesión en memoria y cambia a `authenticated`. Un fallo limpia el estado y termina en `unauthenticated`, sin bucle.
- El `AppInitializer` espera esa restauración antes de la navegación inicial, evitando flicker de landing o área privada con estado incorrecto.
- `authGuard` espera a que el estado deje `checking`; permite únicamente `authenticated` y redirige cualquier sesión no válida a `/`.
- `/app` es la raíz técnica privada, está protegida y redirige a `/app/inicio`. Su layout persistente contiene `PrivateTopbar`, `PrivateSidebar` y `RouterOutlet`.
- Login directo y OTP correcto usan el mismo evento de autenticación del modal; el header lo navega a `/app/inicio`.
- El topbar muestra solo el login disponible, selector de tema y logout. Ante éxito o fallo de logout se limpia el estado local según la política de Fase 01 y se vuelve a `/` para no retener una pantalla privada inconsistente.
- El sidebar no contiene módulos ni enlaces futuros: muestra exclusivamente `Menú` y `En construcción`.

## Pruebas y validaciones

- Estado previo confirmado: `12 archivos y 80 pruebas aprobadas`.
- Se añadieron 12 pruebas para bootstrap, guard, rutas privadas, redirecciones, layout, sidebar, inicio y redirección posterior a autenticación.
- Resultado final: `16 archivos y 92 pruebas aprobadas`.
- Typecheck: `npx tsc --noEmit -p tsconfig.app.json` correcto.
- Suite completa: `npm test -- --watch=false` correcta.
- Build: `npm run build` correcto; total inicial `303.23 kB` bruto y `78.16 kB` estimado. El layout privado (`4.98 kB`) y la pantalla de inicio (`872 bytes`) permanecen lazy.

## Validación manual

No fue posible validar login, OTP, refresh cookie, logout ni navegación real en navegador porque no se proporcionaron credenciales autorizadas ni acceso al correo OTP. Los flujos se cubrieron con pruebas unitarias e integración de rutas.

## Riesgos y pendientes

- La validación manual con credenciales y DevTools sigue pendiente para comprobar la cookie HttpOnly, XSRF y los flujos reales de backend.
- La navegación del sidebar y carga de procesos no se hardcodearán: pertenecen a una fase posterior de integración real Usuario ↔ Roles ↔ Menús ↔ Procesos.
- No se creó Theory de Etapa 2; solo corresponde al cierre completo de la Etapa.

## Resultado final

Fase completada. `package-lock.json` no fue modificado. Los cambios locales previos no existían al inicio. `git diff --check` correcto.
