# Fase 03 — Contexto post-login real en Angular

## Estado

`COMPLETADA`

## Objetivo

Consumir `GET /api/v1/auth/context` para mantener en memoria el contexto autenticado Usuario → Persona → Roles → Menús → Procesos y usarlo en el layout privado.

## Alcance

- Modelos TypeScript estrictos del contrato de contexto.
- `AuthContextService` con Signals, carga única en vuelo, recarga explícita y limpieza.
- Carga posterior a login directo, OTP correcto y restauración de sesión mediante refresh.
- Perfil privado con nombre de Persona, login y fallback de avatar.
- Reemplazo de la fuente mock del sidebar por Roles → Menús → Procesos.
- Pruebas unitarias e integración y documentación de la fase.

## Exclusiones

- Cambios Backend, contratos adicionales, RBAC/guards por rol, permisos frontend, persistencia del contexto, polling, WebSocket, rutas nuevas y endpoint de fotografías.
- Conversión automática de `Proceso.enlace` en rutas Angular.

## Dependencias

- Fases 01 y 02 completadas: `AuthService`, interceptor Bearer, refresh HttpOnly, guard autenticado y layout privado.
- Contrato confirmado `GET /api/v1/auth/context`.

## Archivos creados

- `src/app/core/auth/auth-context.model.ts`
- `src/app/core/auth/auth-context.service.ts`
- `src/app/core/auth/auth-context.service.spec.ts`

## Archivos modificados

- `src/app/app.config.ts`
- `src/app/core/auth/auth.service.ts`
- `src/app/features/auth/login-modal/login-modal.component.ts` y su prueba.
- `src/app/layouts/private-layout/components/private-sidebar/` (componente, plantilla, estilos y prueba).
- `src/app/layouts/private-layout/components/private-topbar/` (componente, plantilla y prueba).
- `src/app/layouts/private-layout/private-layout.component.spec.ts`
- `docs/PlanGeneral.md` y `docs/CHANGELOG.md`.

## Decisiones

- `AuthContextService` es la única responsabilidad HTTP de `/auth/context`; reutiliza `HttpClient`, `apiPath` e interceptor Bearer, sin agregar headers manualmente.
- Contexto, carga, estado cargado y error viven en Signals únicamente en memoria. No se guardan Persona, foto, roles, menús ni procesos en almacenamiento web.
- `restoreContext()` secuencia `AuthService.restoreSession()` y, solo tras recuperar sesión, una única carga de contexto. `loadContext()` comparte una solicitud en vuelo; los componentes solo consumen Signals.
- `AuthService` notifica su limpieza de sesión al contexto con un handler registrado por el servicio. Logout, refresh fallido e invalidación del interceptor eliminan de inmediato Persona y navegación sin una dependencia circular.
- Login directo y OTP correcto esperan la carga de contexto; `OTP_REQUIRED` conserva únicamente el desafío temporal y no consulta contexto.
- `Proceso.enlace` se conserva y muestra como referencia: solo existen `/app` y `/app/inicio`, por lo que `personas/listar` no es un `routerLink` confirmado.
- La foto se muestra únicamente si es URL absoluta `http(s)` válida. Una referencia como `referencia-foto-test`, `null` o error mantiene el avatar existente; falta una convención Backend para referencias no URL.
- La adaptación de iconos es local al sidebar, usa glifos existentes y fallback; no añade librerías.

## Implementación

- Se modelaron `AuthContext`, `AuthContextUsuario`, `AuthContextPersona`, `AuthContextRol`, `AuthContextMenu` y `AuthContextProceso`, incluyendo `am` y `foto` anulables.
- El inicializador de aplicación espera restauración de contexto, no solo refresh. Si falla solo contexto se conserva la sesión y sidebar presenta un error seguro sin mock.
- Topbar usa `nombre`, `ap` y `am` sin espacios sobrantes, conserva `usuario.login` y usa foto/fallback conforme a la decisión anterior.
- Sidebar conserva Rol → Menú → Proceso, soporta roles sin menús, menús sin procesos y usuarios sin roles. No muta el contexto ni aplica seguridad frontend.

## Pruebas

- Servicio: GET, Bearer existente, mapeo completo, foto presente/ausente, arrays vacíos, single-flight, limpieza y restauración F5.
- Modal: login directo carga contexto; OTP_REQUIRED no lo carga; OTP correcto sí.
- Sidebar: uno o varios roles, menús, procesos, arrays vacíos y contexto sin roles, sin mock.
- Topbar: nombre completo, segundo apellido nulo, foto URL directa y fallback.

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json` correcto.
- `npm test -- --watch=false` correcto: 18 archivos y 105 pruebas aprobadas.
- `npm run build` correcto: 306.96 kB iniciales brutos y 78.83 kB de transferencia estimada.
- `git diff --check` correcto.
- `package-lock.json` no cambió.

## Riesgos y pendientes

- `persona.foto` puede llegar como referencia no resoluble. No se inventó URL; falta contrato Backend de fotografía o convención confirmada.
- La compatibilidad Router de `Proceso.enlace` sigue pendiente hasta contar con rutas y contrato confirmados.
- La validación manual real de login, OTP, F5, logout, Network y DevTools exige credenciales y OTP autorizados.

## Resultado final

Fase completada técnicamente. La validación manual con credenciales autorizadas sigue pendiente: no se disponía de login, acceso a OTP ni sesión Backend para revisar DevTools/Network. Los cambios locales previos de correcciones visuales de Fase 02 fueron preservados e integrados; no se realizaron operaciones Git de consolidación.
