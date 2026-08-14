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

## Corrección responsive posterior

Se corrigió puntualmente la composición visual del layout sin iniciar una fase nueva ni modificar autenticación, rutas o contenido funcional. La causa eran los contenedores `max-w-[1800px]` combinados con `mx-auto` en el cuerpo privado y el contenido interno del topbar; en viewports mayores a 1800 px producían márgenes laterales alrededor del área privada. El layout ahora usa una columna de `min-h-[100dvh]`, el cuerpo privado ocupa `w-full` y `flex-1`, el topbar utiliza todo el ancho y el sidebar conserva su ancho de 18rem pegado al inicio en desktop. La altura desktop del sidebar usa `calc(100dvh - 4rem)`.

La tarjeta de `/app/inicio` conserva su `max-w-4xl` y centrado local, por lo que no se estira innecesariamente en monitores grandes. Se mantuvieron el drawer móvil, la semántica, los temas y el estado “En construcción”.

## Mejora posterior del PrivateTopbar

Se amplió visualmente el topbar de Fase 02 sin modificar contratos ni funcionalidad backend. Ahora presenta branding ORMAN con subtítulo, fecha actual centrada en desktop mediante `Intl.DateTimeFormat('es-ES')`, selector de los tres temas existentes, rol neutral `Rol`, campana estructural sin notificaciones reales y un popover accesible de perfil. El popover muestra únicamente el `login` real de `AuthService`, utiliza avatar neutro y reutiliza `AuthService.logout()` para cerrar sesión. No se hardcodean roles, nombres completos, fotos, contadores ni notificaciones.

El popover admite cierre mediante X, click fuera, Escape y el mismo botón de perfil; el drawer móvil, el ancho completo del layout, el sidebar y la pantalla temporal permanecen sin cambios funcionales.

La corrección se validó con `npx tsc --noEmit -p tsconfig.app.json`, suite completa de `17 archivos y 95 pruebas aprobadas`, `npm run build` correcto (`303.79 kB` iniciales brutos y `78.30 kB` estimados) y `git diff --check` correcto. `package-lock.json` no cambió. No se realizó inspección visual mediante navegador en todos los viewports solicitados.

## Ajuste estructural posterior de TopBar y Sidebar

Se consolidó la distribución `TopBar → Sidebar + Main` sin introducir navegación real. En desktop el sidebar conserva una columna controlada de 18rem y puede colapsar a 4.5rem mediante un control estructural; no se inventaron menús ni iconos funcionales. En móvil permanece fuera del flujo como drawer de ancho completo razonable, con backdrop, cierre por hamburguesa, click externo y Escape. La hamburguesa controla exclusivamente el sidebar; el logo continúa siendo branding.

El TopBar conserva branding, fecha en español, temas, rol neutral, campana y perfil. La fecha ahora permanece visible en móvil como segunda fila. La posición del drawer y del backdrop se basa en `--private-topbar-height`, definido con CSS por breakpoint según la composición actual del TopBar; no se necesitó `ResizeObserver`. El Main mantiene `min-w-0`, `min-h-0` y `flex-1`; el shell continúa usando `100dvh` y sin `max-width` global.

Validación final del ajuste: `npx tsc --noEmit -p tsconfig.app.json` correcto; `npm test -- --watch=false` con `17 archivos y 97 pruebas aprobadas`; `npm run build` correcto (`304.47 kB` iniciales brutos y `78.43 kB` estimados); `git diff --check` correcto. `package-lock.json` no cambió. No se realizó inspección visual real en navegador.

## Corrección visual posterior del Sidebar

Para validar la composición visual se incorporó una lista explícitamente temporal de mock (`TEMPORARY MOCK NAVIGATION FOR LAYOUT VALIDATION`) con Dashboard, Personas, Propiedades, Pagos o Cobros, Contratos, Incidencias, Reportes, Contabilidad, Contacto, Pre-alquiler y Conciliación. Dashboard aparece activo solo como demostración mediante tokens ORMAN; estos elementos no son rutas, permisos ni navegación backend.

La hamburguesa pertenece al Sidebar y controla su estado. En desktop alterna la columna expandida de 18rem y compacta de 4.5rem; los iconos conservan labels accesibles y tooltip mediante `title`. En móvil el rail compacto de iconos permanece visible; la misma acción lo expande como drawer superpuesto, con backdrop y cierre por click o Escape. El TopBar ya no contiene hamburguesa.

La fecha del TopBar continúa visible en español en móvil, el Main conserva su distribución y el contenido funcional permanece en construcción. La lista mock deberá reemplazarse posteriormente por Usuario ↔ Roles ↔ Menús ↔ Procesos.

Validación: typecheck correcto; suite completa con `17 archivos y 98 pruebas aprobadas`; build correcto (`304.45 kB` iniciales brutos y `78.43 kB` estimados); `git diff --check` correcto; `package-lock.json` sin cambios. No se realizó validación visual real mediante navegador.

## Corrección puntual de altura del Sidebar al cambiar zoom

La causa de la zona blanca era que la fila Content del shell podía estirar el host `app-private-sidebar`, pero el `<nav>` tenía altura `auto` en desktop (`lg:h-auto`). Por ello el fondo del elemento terminaba al finalizar el contenido mock, especialmente visible al cambiar el zoom y variar la relación viewport/contenido. No era un problema de `body`, colores globales, lista mock ni breakpoint funcional.

La corrección mantiene `100dvh`, añade `items-stretch` explícito a la fila Content y hace que el host y el `<nav>` del Sidebar usen `height/min-height: 100%` en desktop (`lg:h-full`). El modo expandido y compacto comparten esta regla; el drawer móvil conserva su altura calculada `calc(100dvh - var(--private-topbar-height))`.

Validación técnica posterior: `npx tsc --noEmit -p tsconfig.app.json` correcto; suite completa con `17 archivos y 98 pruebas aprobadas`; `npm run build` correcto (`304.49 kB` iniciales brutos y `78.41 kB` estimados); `git diff --check` correcto; `package-lock.json` sin cambios. No se realizó inspección visual real en navegador ni se comprobaron porcentajes de zoom físicamente.

## Corrección estructural definitiva de altura del Sidebar

La corrección anterior dejó el `<nav>` y su host con `height: 100%`, pero el shell privado todavía usaba únicamente `min-height: 100dvh`. Como el `Content` flex no tenía una altura calculada explícita, ese porcentaje no disponía de una referencia vertical resoluble: el `<nav>` que pinta `bg-surface` podía acabar con la altura de su contenido mock y dejar visible el fondo de la página debajo.

El shell ahora tiene altura real `h-[100dvh]`, se organiza como columna flex con `overflow-hidden`, y `Content` recibe el espacio restante mediante `flex-1` y `min-h-0`. Así, `app-private-sidebar` y su `<nav>` desktop resuelven correctamente `height: 100%`; el `<nav>` permanece como el elemento que pinta toda la columna lateral. El `Main` y la lista de navegación poseen su propio `overflow-y-auto`, por lo que el número de entradas no define la altura del shell ni genera scroll doble.

No se rediseñaron el rail móvil, el drawer, la lista mock, iconos, TopBar, autenticación o rutas. La comprobación visual de zoom sigue pendiente de un navegador disponible. Las validaciones de esta corrección fueron correctas: `npx tsc --noEmit -p tsconfig.app.json`; suite completa con `17 archivos y 98 pruebas aprobadas`; `npm run build` con `304.54 kB` iniciales brutos y `78.38 kB` estimados; y `git diff --check` correcto. `package-lock.json` no cambió.
