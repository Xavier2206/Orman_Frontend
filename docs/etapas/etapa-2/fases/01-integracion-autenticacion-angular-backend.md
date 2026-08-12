# Fase 01 — Integración de autenticación Angular ↔ ORMAN Backend

## Estado

`COMPLETADA`

## Objetivo

Convertir el flujo visual de acceso de ORMAN en autenticación WEB real contra el backend Spring Boot, manteniendo el access token únicamente en memoria y el refresh token en la cookie HttpOnly gestionada por backend.

## Alcance autorizado

- Proxy Angular para `/api` hacia el backend local.
- `HttpClient`, XSRF estándar Angular y modelos TypeScript tipados.
- Identificador de dispositivo estable y nombre de dispositivo no invasivo.
- `AuthService` con Signals para sesión y desafío OTP temporal.
- Login, OTP verify, OTP resend, refresh, reintento único y single-flight.
- Interceptor Bearer, manejo de `ProblemDetail`, logout y logout-all sin UI específica.
- Integración del mismo `LoginModalComponent` existente para los pasos LOGIN y OTP.
- Estado visual autenticado mínimo, accesibilidad, pruebas, build y documentación.

## Exclusiones

- Dashboard, rutas privadas, guards por roles, roles dinámicos, menú dinámico y `/auth/me`.
- Personas, usuarios, procesos, propiedades, sesiones visuales, contacto, reservas e imágenes.
- Nuevas APIs, nuevos contratos backend y dependencias externas.
- Theory de Etapa 2.

## Dependencias

- Base visual y arquitectónica de Etapa 1 disponible.
- Contrato backend de autenticación confirmado.
- Cookies/CSRF backend validados: `orman_refresh` HttpOnly con Path `/api/v1/auth`; `XSRF-TOKEN` no HttpOnly con Path `/`.

## Contrato backend utilizado

- Base relativa Angular: `/api/v1`.
- `POST /auth/login`: recibe `login`, `password`, `deviceId`, `deviceName`, `clientType: WEB`; responde `AUTHENTICATED` u `OTP_REQUIRED`.
- `POST /auth/otp/verify`: recibe `challengeId`, `code`, `deviceId`, `deviceName`; responde `AUTHENTICATED`.
- `POST /auth/otp/resend`: recibe `challengeId`; responde `204`.
- `POST /auth/refresh`: usa cookie refresh y header XSRF; responde `AUTHENTICATED`.
- `POST /auth/logout` y `POST /auth/logout-all`: requieren Bearer y responden `204`.
- Errores: `ProblemDetail` / `application/problem+json`.

## Decisiones conocidas

- Angular usa rutas relativas y proxy de desarrollo; los servicios no contienen `localhost:9090`.
- El mecanismo XSRF nativo de Angular debe usar `XSRF-TOKEN` y `X-XSRF-TOKEN`; no se implementará parser manual de cookies.
- El access token no se persiste. `orman_refresh` no es accesible para Angular. Solo `orman-device-id` se guarda en `localStorage`.
- El flujo OTP reutiliza el mismo modal y overlay existentes.

## Implementación realizada

- Se añadió `proxy.conf.json` y se configuró `angular.json` para que `ng serve` reenvíe `/api` a `http://localhost:9090` sin rutas absolutas en los servicios.
- Se configuró `provideHttpClient` con interceptor funcional y `withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' })`.
- Se centralizó la base `/api/v1` y se añadieron modelos estrictos para autenticación y `ProblemDetail`.
- `DeviceService` mantiene `orman-device-id` en `localStorage` y genera un nombre sencillo de navegador/plataforma. No persiste tokens ni desafíos OTP.
- `AuthService` mantiene sesión y desafío OTP mediante Signals. `accessToken`, `login`, `codper`, `sid` y `expiresIn` viven únicamente en memoria.
- El interceptor agrega Bearer solo a peticiones autenticadas, excluye login, OTP y refresh, y gestiona `TOKEN_EXPIRED` con refresh único, reintento único y single-flight.
- `LoginModalComponent` conserva el mismo overlay, focus trap, Escape, scroll lock, Reactive Forms y diseño; ahora alterna entre LOGIN y OTP dentro del mismo modal.
- `PublicHeaderComponent` muestra un estado autenticado mínimo con `login` y permite logout, sin inventar roles ni área privada.

## Ajuste visual y UX puntual posterior

Este ajuste no inicia una fase funcional nueva y queda documentado dentro de la Fase 01 porque afecta exclusivamente al segundo estado ya implementado del `LoginModalComponent`.

- El estado OTP ahora muestra seis inputs individuales centrados, con tamaño y separación adaptables a viewport pequeño.
- Cada casilla acepta un solo dígito, avanza automáticamente, permite navegación con teclado, vuelve a la casilla anterior con Backspace sobre una casilla vacía y distribuye un código pegado.
- Los seis valores se sincronizan con el `FormControl` interno `code`; `AuthService`, endpoints y el contrato `{ challengeId, code, deviceId, deviceName }` no cambiaron.
- Se eliminó el mensaje informativo redundante al entrar en OTP. Se conservaron los mensajes `aria-live` para errores y resend, el foco inicial, el focus trap, Escape, X y el retorno a LOGIN.
- `Verificar` queda deshabilitado con código incompleto o durante verify. `Volver` limpia las casillas y restaura el foco al usuario del primer paso. `Reenviar código` permanece como acción secundaria y conserva el comportamiento backend existente.
- Se reutilizaron los tokens visuales existentes para los temas ORMAN, DÍA y NOCHE; no se modificó `ThemeService` ni el primer paso de LOGIN.

## Seguridad y cookies

- `orman_refresh` no se lee, persiste ni copia desde Angular; el navegador la envía mediante el proxy para `/api/v1/auth`.
- `XSRF-TOKEN` usa el mecanismo estándar de Angular. No existe parser manual de `document.cookie` ni interceptor XSRF personalizado.
- El access token no se guarda en `localStorage`, `sessionStorage`, IndexedDB ni cookies creadas por Angular.
- `deviceId` se preserva después de logout porque no es secreto.

## Manejo de errores

- Se añadieron interfaces `ProblemDetail` y `ProblemFieldError`.
- El modal muestra mensajes seguros para credenciales inválidas, OTP, entrega OTP, sesión expirada/revocada y CSRF; no expone `traceId`, stack trace ni excepciones internas.
- `SESSION_REVOKED`, `SESSION_EXPIRED`, `INVALID_TOKEN` y fallo de refresh limpian el estado local sin bucles de refresh.

## Pruebas y validaciones

- Estado previo confirmado: `10 archivos y 65 pruebas aprobadas`.
- Resultado final de la Fase 01: `12 archivos y 76 pruebas aprobadas`.
- Resultado tras el ajuste visual OTP: `12 archivos y 80 pruebas aprobadas`.
- Se añadieron pruebas para deviceId estable, almacenamiento sin tokens, login `AUTHENTICATED`, `OTP_REQUIRED`, OTP verify, OTP resend, transición LOGIN → OTP, loading/doble envío, accesibilidad esencial OTP, Bearer, XSRF estándar, refresh/retry, reintento único, single-flight, errores de sesión, logout y estado visual autenticado.
- Typecheck: `npx tsc --noEmit -p tsconfig.app.json` correcto.
- Suite completa de la Fase 01: `npm test -- --watch=false` correcta.
- Suite completa tras el ajuste: `npx ng test --no-watch` correcta (`12 archivos y 80 pruebas aprobadas`).
- Typecheck y build tras el ajuste: `npx tsc --noEmit -p tsconfig.app.json` y `npm run build` correctos; build inicial de `289.32 kB` brutos y `77.22 kB` de transferencia estimada.
- Build de producción: `npm run build` correcto, con total inicial de `289.16 kB` brutos y `77.14 kB` de transferencia estimada.

## Validación manual en navegador

**VALIDACIÓN MANUAL BLOQUEADA POR FALTA DE CREDENCIALES.**

El backend local estaba escuchando en `localhost:9090`, pero el repositorio frontend no contiene archivos `.env` ni credenciales de prueba reales conocidas. Tampoco se contó con acceso al correo OTP. No se afirmó una autenticación real sin esa evidencia.

La configuración, el comportamiento XSRF y los flujos de login, OTP, refresh, retry, single-flight y logout están validados automáticamente. La verificación real de Network, cookies, `document.cookie`, almacenamiento del navegador y logout queda pendiente de credenciales autorizadas.

Cuando se disponga de credenciales, verificar en navegador:

- `POST /api/v1/auth/login` mediante el proxy, sin URL absoluta a `localhost:9090` en el servicio.
- `orman_refresh` con `HttpOnly=true` y Path `/api/v1/auth`; no debe aparecer en `document.cookie`.
- `XSRF-TOKEN` con `HttpOnly=false` y Path `/`; debe aparecer en `document.cookie` y producir `X-XSRF-TOKEN` en refresh.
- OTP verify, refresh con rotación y logout `204`.

## Pendientes fuera de alcance

- No se implementaron rutas privadas, guards, roles, permisos, dashboard, personas, usuarios, propiedades ni administración de sesiones.
- La Theory de Etapa 2 continúa pendiente hasta el cierre de todas las fases de la Etapa.
