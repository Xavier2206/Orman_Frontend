# Informe de auditoría técnica y funcional del frontend

**Proyecto:** ORMAN Frontend
**Fecha de auditoría:** 2026-09-14
**Alcance:** estado real del repositorio orman-frontend, sin modificar código funcional.
**Resultado global:** frontend parcialmente completo, con una base privada funcional y varias integraciones reales, pero con riesgos importantes de autorización, consistencia de datos, pruebas y documentación.

## Alcance y método

Se recorrieron las carpetas del repositorio y se revisaron AGENTS.md, docs/PlanGeneral.md, docs/README.md, docs/CHANGELOG.md, los documentos de fases, README.md, configuraciones, modelos, rutas, componentes, servicios, templates, estilos y pruebas.

- 9.agents.md: **NO ENCONTRADO**.
- Otros AGENTS.md, agents.md o instrucciones equivalentes adicionales dentro del repositorio: **NO ENCONTRADOS**.
- Backend, OpenAPI, Swagger o contratos ejecutables dentro de este repositorio: **NO IMPLEMENTADOS / NO DISPONIBLES**. El repositorio contiene exclusivamente el frontend.
- Validación end-to-end contra un backend activo: **NO VERIFICADA**.
- Validación visual manual por viewport: **NO VERIFICADA** en esta auditoría.
- No se modificaron componentes, servicios, rutas, estilos ni configuraciones. El único archivo creado es este informe.

## 1. Resumen ejecutivo

El repositorio no contiene Angular 21: contiene Angular **22.0.7**, TypeScript **6.0.3**, componentes standalone, lazy loading y una aplicación zoneless por la configuración/framework actuales. La aplicación ya no es solamente una landing visual: contiene autenticación real contra API, área privada, contexto de usuario, roles, menús, asignaciones, personas, propiedades y unidades.

La funcionalidad más madura está en los listados administrativos y sus operaciones de alta, edición, cambio de estado y asignaciones. Propiedades y Unidades tienen actualmente rutas de creación, edición, detalle, fotografías y generación de PDF en el código, aunque PlanGeneral.md y CHANGELOG.md todavía describen Unidades como un listado con acciones pendientes. La landing pública y la pantalla Inicio siguen siendo placeholders.

El mayor riesgo arquitectónico es que todas las rutas privadas están protegidas únicamente por autenticación; no existe guard de permisos ni metadatos de autorización. La visibilidad del Sidebar depende del contexto recibido, pero un usuario autenticado puede intentar acceder directamente a cualquier URL privada. La protección efectiva debe existir en Backend, pero ese backend no está en el repositorio y no pudo comprobarse.

El mayor riesgo funcional observable en código es PersonasListComponent: las cargas del listado no cancelan solicitudes anteriores y las cargas de fotografías se ejecutan por persona sin asociarse de forma cancelable a la página actual. Bajo búsquedas, filtros, paginación o recargas rápidas pueden mostrarse resultados o fotos obsoletos.

Estado de validación ejecutada:

| Validación                            | Resultado                                                              |
| ------------------------------------- | ---------------------------------------------------------------------- |
| npx tsc --noEmit -p tsconfig.app.json | ✅ Pasa                                                                |
| npm run build                         | ✅ Pasa con warnings                                                   |
| npm test -- --watch=false             | ❌ 478/481 pruebas; 3 fallas                                           |
| npm run lint                          | **NO CONFIGURADO**; no existe script ni configuración ESLint/Stylelint |
| git diff --check                      | ✅ Pasa                                                                |

## 2. Estado general del frontend

| Área                         | Estado actual                             | Evidencia principal                                                                         |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| Landing pública              | ◐ Parcialmente implementada               | features/public/landing/landing.component.html; Propiedades y Contacto dicen “Próximamente” |
| Login, OTP, refresh y logout | ⚠️ Implementada con observaciones         | core/auth/auth.service.ts, auth.interceptor.ts, login-modal.component.ts                    |
| Área privada base            | ✅ Implementada y aparentemente funcional | app.routes.ts, private-layout, auth.guard.ts                                                |
| Contexto, roles y Sidebar    | ⚠️ Implementada con observaciones         | auth-context.service.ts y private-sidebar.component.ts; sin autorización por permiso        |
| Inicio                       | ◐ Parcialmente implementada               | inicio.component.html muestra “Contenido en construcción”                                   |
| Personas                     | ⚠️ Implementada con observaciones         | CRUD parcial, fotos y usuario; sin eliminar persona y con carreras                          |
| Roles                        | ⚠️ Implementada con observaciones         | listado, resumen, filtros, crear, editar y estado; PROPIETARIO hardcodeado                  |
| Menús                        | ⚠️ Implementada con observaciones         | listado, resumen, filtros, crear, editar y estado; body PATCH no verificable                |
| Asignar Roles                | ✅ Implementada dentro del alcance actual | usuarios, roles asignados/disponibles y POST/DELETE                                         |
| Asignar Menús                | ✅ Implementada dentro del alcance actual | roles, menús asignados/disponibles y POST/DELETE                                            |
| Asignar Procesos             | ✅ Implementada dentro del alcance actual | menús, procesos asignados/disponibles y POST/DELETE                                         |
| Propiedades                  | ⚠️ Implementada dentro del alcance actual | listado, resumen, crear, editar, detalle, portada, mapa, estado y PDF                       |
| Unidades                     | ⚠️ Implementada dentro del alcance actual | listado, filtros, CRUD actual, detalle, fotos, estado y PDF                                 |

## 3. Arquitectura encontrada

La aplicación usa la separación:

```text
src/app/
├── core/       autenticación, API base, notificaciones y temas
├── shared/     selector de temas y reutilización transversal
├── layouts/    layout público y privado
└── features/   landing, auth, inicio, personas, roles, menús,
                asignaciones, propiedades y unidades
```

Características observadas:

- Componentes standalone; no hay NgModule raíz ni módulos feature clásicos.
- Rutas lazy mediante loadComponent.
- Estado de UI con Signals; RxJS para HTTP, debounce, cancelación y composición.
- HttpClient se concentra en servicios ApiService y servicios core; las páginas no inyectan HttpClient directamente.
- ReactiveFormsModule se usa en formularios complejos.
- Tailwind CSS 4 más CSS local por componente.
- Servicios de PDF con jspdf, mapas con leaflet, notificaciones con ngx-sonner.

Observaciones:

- PageResponse<T> vive en features/personas/models/persona.model.ts y es importado por Roles, Menús, Asignaciones, Propiedades y Unidades. Es una dependencia transversal innecesaria hacia Personas.
- PropiedadFormComponent tiene 597 líneas TypeScript y 558 CSS; UnidadFormComponent, 513 TypeScript y 514 CSS; UnidadFotosManagerComponent, 520 TypeScript; UnidadesListComponent, 472 TypeScript.
- No hay evidencia concluyente de componentes o servicios muertos porque no existe lint configurado. La verificación con noUnusedLocals detectó una constante sin uso en el PDF de Unidades.

## 4. Tecnologías y dependencias reales

| Tecnología/dependencia                    | Versión instalada | Uso                                     |
| ----------------------------------------- | ----------------: | --------------------------------------- |
| Angular core/common/forms/router/compiler |            22.0.7 | framework y routing                     |
| Angular CLI/build                         |            22.0.7 | desarrollo y build                      |
| TypeScript                                |             6.0.3 | lenguaje                                |
| RxJS                                      |             7.8.2 | streams HTTP y estado asíncrono         |
| Tailwind CSS                              |             4.3.3 | utilidades visuales                     |
| @tailwindcss/postcss / PostCSS            |    4.3.3 / 8.5.22 | integración CSS                         |
| Angular Material                          |            22.0.7 | MatIconModule; no suite visual completa |
| ngx-sonner                                |             3.1.0 | toasts                                  |
| Leaflet / @types/leaflet                  |    1.9.4 / 1.9.20 | mapa                                    |
| jspdf                                     |             4.2.1 | PDF de Propiedad y Unidad               |
| Vitest / jsdom                            |   4.1.10 / 28.1.0 | pruebas unitarias                       |
| Prettier                                  |             3.9.6 | formato, sin script de lint             |

No se encontraron Bootstrap, PrimeNG, NgRx, SCSS ni tailwind.config.js.

## 5. Estructura del proyecto

Inventario aproximado bajo src: 159 archivos TypeScript, 45 templates HTML y 44 hojas CSS. Hay 64 archivos de pruebas spec.ts.

| Carpeta                        | Contenido real                                                    |
| ------------------------------ | ----------------------------------------------------------------- |
| src/app/core/api               | API_BASE_PATH y ProblemDetail                                     |
| src/app/core/auth              | sesión, dispositivo, contexto, guard, interceptor y context token |
| src/app/core/notifications     | fachada OrmanNotificationService                                  |
| src/app/core/theme             | modelo, constantes y ThemeService                                 |
| src/app/shared/components      | selector de temas                                                 |
| src/app/layouts/public-layout  | header, footer, outlet público                                    |
| src/app/layouts/private-layout | topbar, Sidebar, outlet privado                                   |
| src/app/features/auth          | QuickMenu y LoginModal                                            |
| src/app/features/public        | landing y Hero                                                    |
| src/app/features/inicio        | pantalla privada inicial placeholder                              |
| src/app/features/personas      | listado, formularios, detalle, fotos, usuario y contraseña        |
| src/app/features/roles         | listado, formulario y estado                                      |
| src/app/features/menus         | listado, formulario, catálogo y estado                            |
| src/app/features/asignar-*     | Usuario–Rol, Rol–Menú y Menú–Proceso                              |
| src/app/features/propiedades   | listado, resumen, formulario, detalle, portada, mapa y PDF        |
| src/app/features/unidades      | listado, formulario, detalle, fotografías, estado y PDF           |

No existen src/environments/, configuración de entorno para API ni backend en el repositorio.

## 6. Mapa completo de módulos y funcionalidades

| Módulo           | Ruta                         | Principal y secundarios                                            | Servicios/modelos                           | Funciones reales                                                                           | Estado |
| ---------------- | ---------------------------- | ------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| Público          | /                            | PublicLayout, Landing, Header, Footer, Hero, QuickMenu, LoginModal | AuthService, ThemeService                   | anclas, temas, login, logout                                                               | ◐      |
| Autenticación    | modal en /                   | LoginModalComponent                                                | AuthService, DeviceService                  | credenciales, OTP, resend, cierre, refresh indirecto                                       | ⚠️     |
| Inicio privado   | /app/inicio                  | InicioComponent                                                    | AuthContextService                          | muestra roles/menús o placeholder                                                          | ◐      |
| Personas         | /app/personas/listar         | PersonasList y 6 modales/campos                                    | PersonaApiService y modelos                 | listar, buscar, filtrar, paginar, crear, editar, detalle, estado, fotos, usuario, password | ⚠️     |
| Roles            | /app/roles/listar            | RolesList, formulario y estado                                     | RolApiService                               | listado, resumen, búsqueda, estado, crear, editar                                          | ⚠️     |
| Menús            | /app/menus/listar            | MenusList, formulario y estado                                     | MenuApiService                              | listado, resumen, búsqueda, estado, crear, editar                                          | ⚠️     |
| Asignar Roles    | /app/asignar-roles/listar    | master-detail usuarios/roles                                       | APIs de usuarios, Persona y Rol             | buscar/paginar usuarios, asignar/quitar roles                                              | ✅     |
| Asignar Menús    | /app/asignar-menus/listar    | master-detail roles/menús                                          | APIs de Rol y Menú                          | catálogo activo, asignar/quitar menús                                                      | ✅     |
| Asignar Procesos | /app/asignar-procesos/listar | master-detail menús/procesos                                       | APIs de Menú, Proceso y contexto            | asignar/quitar procesos y reload contexto                                                  | ✅     |
| Propiedades      | /app/propiedades/*           | list, card, resumen, form, detail, portada, mapa                   | PropiedadApiService, geocoding, PDF         | listar, filtrar, crear, editar, detalle, portada, ubicación, estado, PDF                   | ⚠️     |
| Unidades         | /app/unidades/*              | list, card, form, detail, fotos, estado                            | UnidadApiService, FotografiaApiService, PDF | selector, filtro, CRUD actual, fotos, estado, PDF                                          | ⚠️     |

## 7. Estado funcional por módulo

“Completo” significa completo respecto a lo que el frontend actual implementa; no significa cobertura total del dominio ni validación del backend.

### Módulos completos dentro del alcance actual

- Autenticación de dos pasos, refresh, logout y gestión de sesión: aparentemente funcional.
- Área privada base, selector de rol y Sidebar dinámico: aparentemente funcional si el contexto coincide con el contrato.
- Roles y Menús: listado, resumen, filtro, crear, editar y cambio de estado implementados.
- Asignar Roles, Asignar Menús y Asignar Procesos: listados master-detail y POST/DELETE implementados.

### Módulos incompletos o con observaciones

- Landing pública: Propiedades reales, contacto y datos públicos son **NO IMPLEMENTADOS**.
- Inicio: **IMPLEMENTACIÓN INCOMPLETA**; muestra “Contenido en construcción”.
- Personas: no existe eliminación y hay carreras de solicitudes.
- Propiedades: contratos, pagos, eliminación y gestión de unidades en ficha son **NO IMPLEMENTADOS**.
- Unidades: el código sí contiene crear, editar, detalle y fotos, en contradicción con las Fases 14–15; disponibilidad/ocupación y eliminación no aparecen implementadas.

## 8. Mapa de navegación

```text
/
└── PublicLayout
    └── Landing
        ├── anclas #inicio, #propiedades, #como-funciona, #contacto
        └── LoginModal → AuthService → /app/inicio

/app
└── authGuard
    └── PrivateLayout
        ├── /app → redirect /app/inicio
        ├── /app/inicio
        ├── /app/personas/listar
        ├── /app/propiedades/listar
        ├── /app/propiedades/nueva
        ├── /app/propiedades/:codprop/editar
        ├── /app/propiedades/:codprop/detalle
        ├── /app/unidades/listar
        ├── /app/unidades/nueva
        ├── /app/unidades/:coduni/editar
        ├── /app/unidades/:coduni/detalle
        ├── /app/roles/listar
        ├── /app/menus/listar
        ├── /app/asignar-roles/listar
        ├── /app/asignar-menus/listar
        └── /app/asignar-procesos/listar
```

El Sidebar transforma roles, menús, procesos y enlace del AuthContext en comandos de Router y antepone /app.

## 9. Matriz de rutas

| Ruta                              | Carga                        | Guard     | Estado observado       |
| --------------------------------- | ---------------------------- | --------- | ---------------------- |
| /                                 | PublicLayout + Landing       | ninguno   | ✅                     |
| /app                              | PrivateLayout                | authGuard | redirige a /app/inicio |
| /app/inicio                       | InicioComponent              | heredado  | ⚠️ placeholder         |
| /app/personas/listar              | PersonasListComponent        | heredado  | ⚠️                     |
| /app/propiedades/listar           | PropiedadesListComponent     | heredado  | ⚠️                     |
| /app/propiedades/nueva            | PropiedadFormComponent       | heredado  | ✅                     |
| /app/propiedades/:codprop/editar  | PropiedadFormComponent       | heredado  | ✅                     |
| /app/propiedades/:codprop/detalle | PropiedadDetailComponent     | heredado  | ✅ lectura/PDF         |
| /app/unidades/listar              | UnidadesListComponent        | heredado  | ✅                     |
| /app/unidades/nueva               | UnidadFormComponent          | heredado  | ✅ en código actual    |
| /app/unidades/:coduni/editar      | UnidadFormComponent          | heredado  | ✅ en código actual    |
| /app/unidades/:coduni/detalle     | UnidadDetailComponent        | heredado  | ✅ en código actual    |
| /app/roles/listar                 | RolesListComponent           | heredado  | ⚠️                     |
| /app/menus/listar                 | MenusListComponent           | heredado  | ⚠️                     |
| /app/asignar-roles/listar         | AsignarRolesListComponent    | heredado  | ✅                     |
| /app/asignar-menus/listar         | AsignarMenusListComponent    | heredado  | ✅                     |
| /app/asignar-procesos/listar      | AsignarProcesosListComponent | heredado  | ✅                     |

- No hay path wildcard, componente 404 ni fallback explícito.
- No hay guards de permiso, rol o proceso.
- No hay canMatch, canActivateChild ni metadata de permisos.
- Solo Unidades conserva contexto de listado mediante query params; los demás filtros viven en memoria.
- No se observaron duplicados literales ni componentes de ruta inexistentes.

## 10. Matriz CRUD

| Entidad               | Listar           | Buscar/filtrar                   | Crear        | Visualizar               | Editar                | Activar/desactivar | Eliminar  | Estado |
| --------------------- | ---------------- | -------------------------------- | ------------ | ------------------------ | --------------------- | ------------------ | --------- | ------ |
| Persona               | ✅               | ✅ remoto, debounce; tipo/estado | ✅           | ✅ modal                 | ✅                    | ✅                 | ❌        | ⚠️     |
| Usuario de Persona    | vía modal        | no                               | ✅           | no ficha separada        | —                     | —                  | —         | ⚠️     |
| Contraseña de usuario | —                | —                                | —            | —                        | ✅ cambiar            | —                  | —         | ✅     |
| Rol                   | ✅               | ✅ remoto, resumen               | ✅           | card/listado             | ✅                    | ✅                 | ❌        | ⚠️     |
| Menú                  | ✅               | ✅ remoto, resumen               | ✅           | card/listado             | ✅                    | ✅                 | ❌        | ⚠️     |
| Usuario–Rol           | ✅ usuarios      | ✅ q y paginación                | ✅ POST      | ✅ asignados/disponibles | —                     | —                  | ✅ DELETE | ✅     |
| Rol–Menú              | ✅ roles         | catálogo activo                  | ✅ POST      | ✅ asignados/disponibles | —                     | —                  | ✅ DELETE | ✅     |
| Menú–Proceso          | ✅ menús         | catálogo activo/local            | ✅ POST      | ✅ asignados/disponibles | —                     | —                  | ✅ DELETE | ✅     |
| Propiedad             | ✅               | ✅ q, tipo, estado, resumen      | ✅           | ✅ detalle/PDF           | ✅                    | ✅                 | ❌        | ⚠️     |
| Portada Propiedad     | —                | —                                | ✅ upload    | ✅ Blob                  | ✅ reemplazo          | —                  | ✅ DELETE | ✅     |
| Unidad                | ✅ por propiedad | ✅ estado operativo              | ✅           | ✅ detalle/PDF           | ✅                    | ✅                 | ❌        | ⚠️     |
| Foto Unidad           | ✅ lista         | —                                | ✅ multipart | ✅ Blob/view-only        | ✅ metadata/reemplazo | portada            | ✅ DELETE | ⚠️     |

## 11. Integración frontend–backend

La base de API está centralizada en src/app/core/api/api.constants.ts como /api/v1. En desarrollo, proxy.conf.json dirige /api a http://localhost:9090. No hay ambiente de producción ni URL configurable.

Todas las integraciones HTTP se expresan mediante servicios tipados, pero la existencia y compatibilidad efectiva del Backend son **NO VERIFICADAS** porque no hay código Backend, OpenAPI ni servidor disponible.

| Familia        | Conexión en frontend                   | Verificación                     |
| -------------- | -------------------------------------- | -------------------------------- |
| Auth/contexto  | real, cookies y Bearer                 | runtime **NO VERIFICADO**        |
| Personas       | real, GET/POST/PUT/PATCH/DELETE y Blob | **NO VERIFICADO**                |
| Roles/Menús    | real, CRUD parcial y estado            | **NO VERIFICADO**                |
| Asignaciones   | real, GET/POST/DELETE                  | **NO VERIFICADO**                |
| Propiedades    | real, CRUD parcial, portada y resumen  | **NO VERIFICADO**                |
| Ubicación      | real contra Nominatim externo          | disponibilidad **NO VERIFICADA** |
| Unidades/fotos | real en código actual                  | **NO VERIFICADO**                |

No se encontraron URLs absolutas hardcodeadas para el Backend de ORMAN; sí para Google Fonts, tiles de OpenStreetMap y Nominatim.

## 12. Inventario de servicios HTTP

| Servicio y consumidor       | Método y endpoint                                       | Parámetros/request                                | Response                     | Loading/error                       |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------- | ---------------------------- | ----------------------------------- |
| AuthService / LoginModal    | POST /api/v1/auth/login                                 | login, password, deviceId, deviceName, clientType | LoginResponse                | modal, ProblemDetail                |
| AuthService / LoginModal    | POST /api/v1/auth/otp/verify                            | challenge y código OTP                            | AuthenticatedResponse        | modal, sesión en Signal             |
| AuthService / LoginModal    | POST /api/v1/auth/otp/resend                            | desafío/login                                     | void                         | modal                               |
| AuthService / interceptor   | POST /api/v1/auth/refresh                               | null, withCredentials                             | AuthenticatedResponse        | request compartida; limpia sesión   |
| AuthService / Header/Topbar | POST /api/v1/auth/logout                                | null, withCredentials                             | void                         | loading y navegación/limpieza       |
| AuthService                 | POST /api/v1/auth/logout-all                            | null, withCredentials                             | void                         | método disponible; sin UI observada |
| AuthContextService          | GET /api/v1/auth/context                                | ninguno                                           | AuthContext                  | initializer, loading/error          |
| PersonaApiService           | GET /api/v1/personas                                    | page, size, sort, q, tipoPersona, estado          | PageResponse<Persona>        | listado; cancelación insuficiente   |
| PersonaApiService           | GET /api/v1/personas/resumen                            | ninguno                                           | PersonaResumen               | independiente                       |
| PersonaApiService           | GET /api/v1/personas/{codper}                           | path                                              | Persona                      | modales                             |
| PersonaApiService           | POST/PUT /api/v1/personas[/{codper}]                    | PersonaRequest                                    | Persona                      | submit, fieldErrors                 |
| PersonaApiService           | PATCH .../{codper}/activar                              | desactivar                                        | {}                           | Persona                             | modal y recarga    |
| PersonaApiService           | GET/PUT/DELETE .../{codper}/foto                        | Blob o multipart foto                             | Blob/Persona/void            | object URLs, cargas paralelas       |
| PersonaApiService           | POST /api/v1/usuarios                                   | CrearUsuarioRequest                               | unknown                      | modal; contrato no modelado         |
| PersonaApiService           | PUT /api/v1/usuarios/{login}/password                   | newPassword                                       | void                         | modal                               |
| RolApiService               | GET /api/v1/roles y /resumen                            | page, size, sort, q, estado                       | page/RolResumen              | switchMap y resumen                 |
| RolApiService               | POST/PUT /api/v1/roles[/{codr}]                         | create/update rol                                 | Rol                          | modal                               |
| RolApiService               | PATCH .../{codr}/activar                                | desactivar                                        | {}                           | Rol                                 | modal y recarga    |
| MenuApiService              | GET /api/v1/menus y /resumen                            | page, size, sort, q, estado                       | page/MenuResumen             | switchMap y resumen                 |
| MenuApiService              | POST/PUT /api/v1/menus[/{codm}]                         | create/update menú                                | Menu                         | modal                               |
| MenuApiService              | PATCH .../{codm}/activar                                | desactivar                                        | null                         | Menu                                | body inconsistente |
| AsignarRolesApiService      | GET /api/v1/usuarios                                    | page, size=5, sort=login,asc, q                   | PageResponse<Usuario>        | debounce + switchMap                |
| AsignarRolesApiService      | GET/POST/DELETE /api/v1/usuarios/{login}/roles[/{codr}] | login encoded, codr                               | Rol[]/unknown                | master-detail y acciones            |
| AsignarMenusApiService      | GET/POST/DELETE /api/v1/roles/{codr}/menus[/{codm}]     | codr, codm                                        | Menu[]/unknown               | master-detail y acciones            |
| ProcesoApiService           | GET /api/v1/procesos                                    | page, size, sort                                  | PageResponse<Proceso>        | catálogo con expand                 |
| AsignarProcesosApiService   | GET/POST/DELETE /api/v1/menus/{codm}/procesos[/{codp}]  | codm, codp                                        | MeProResponse[]/void         | acción, toast, reload context       |
| PropiedadApiService         | GET /api/v1/propiedades y /resumen                      | page, size, sort, q, tipo, estado                 | page/resumen                 | switchMap, independientes           |
| PropiedadApiService         | GET /api/v1/propiedades/{codprop}                       | path                                              | Propiedad                    | detalle/form                        |
| PropiedadApiService         | GET/PUT/DELETE .../{codprop}/portada                    | Blob o multipart foto                             | Blob/void                    | object URL y operación parcial      |
| PropiedadApiService         | POST/PUT/PATCH /api/v1/propiedades...                   | PropiedadRequest, path, {}                        | Propiedad                    | form/status                         |
| LocationGeocodingService    | GET Nominatim /reverse                                  | lat, lon, format, zoom, idioma                    | unknown normalizado          | rate limit 1 s                      |
| UnidadApiService            | GET /api/v1/propiedades/{codprop}/unidades              | page, size=20, sort, estadoOperativo              | PageResponse<UnidadResponse> | switchMap, retry                    |
| UnidadApiService            | POST/GET/PUT /api/v1/.../unidades[/{coduni}]            | request o identificadores                         | UnidadResponse               | form/detail                         |
| UnidadApiService            | PATCH /api/v1/unidades/{coduni}/activar                 | desactivar                                        | {}                           | UnidadResponse                      | modal/recarga      |
| FotografiaApiService        | GET /api/v1/unidades/{coduni}/fotos                     | coduni                                            | UnidadFotoResponse[]         | manager/detail                      |
| FotografiaApiService        | POST .../fotos                                          | multipart foto, titulo, ambiente, orden           | UnidadFotoResponse           | secuencial o inmediata              |
| FotografiaApiService        | GET .../fotos/{id}/archivo                              | path                                              | Blob                         | object URL                          |
| FotografiaApiService        | PATCH/PUT .../{id}/metadata                             | archivo                                           | metadata o multipart foto    | UnidadFotoResponse                  | editor/reemplazo   |
| FotografiaApiService        | PATCH/DELETE .../{id}/portada o foto                    | {} o path                                         | foto/void                    | portada/delete                      |

Todas las respuestas reales y códigos de Backend son **NO VERIFICADOS**.

## 13. Formularios

| Formulario         | Componente                      | Campos/flujo                                                 | Estado                  |
| ------------------ | ------------------------------- | ------------------------------------------------------------ | ----------------------- |
| Login              | LoginModalComponent             | login, password y OTP de seis dígitos                        | ✅                      |
| Persona            | PersonaFormModalComponent       | CI, nombre, apellidos, género, correo, teléfono, tipo, foto  | ✅                      |
| Crear usuario      | PersonaUserCreateModalComponent | login, password, confirmación                                | ⚠️ mensajes incompletos |
| Cambiar contraseña | PersonaPasswordModalComponent   | password, confirmación                                       | ⚠️ mensajes incompletos |
| Rol                | RolFormModalComponent           | nombre                                                       | ✅                      |
| Menú               | MenuFormModalComponent          | nombre, icono                                                | ✅                      |
| Propiedad          | PropiedadFormComponent          | identidad, dirección, coordenadas, inversión, propietario    | ✅                      |
| Unidad             | UnidadFormComponent             | propiedad, identidad, características, precio, estado, fotos | ✅ en código actual     |
| Foto Unidad        | UnidadFotosManagerComponent     | archivo, título, ambiente, orden/portada                     | ⚠️                      |

Todos usan Reactive Forms o controles nativos coordinados con Signals.

## 14. Validaciones

- Login: required, login máximo 30; password required, mínimo 8 y máximo 72.
- OTP: código numérico de seis posiciones, limpieza y paste.
- Persona: obligatorios, límites y al menos un apellido; sin patrones específicos observables para CI/teléfono.
- Usuario/password: límites y confirmación; login sin política frontend equivalente claramente definida.
- Rol: nombre obligatorio, no vacío, máximo 50.
- Menú: nombre obligatorio, no vacío, máximo 100; icono de catálogo.
- Propiedad: campos obligatorios, límites, rangos y par latitud-longitud.
- Unidad: textos con límites, números no negativos, enteros para dormitorios/baños/piso, tipo y estado válidos.
- Fotos: JPG/PNG; Persona hasta 2 MiB y Unidad hasta 5 MiB; metadatos con límites.
- Consistencia frente al Backend: **NO VERIFICADA**.
- No se observaron contraseñas ni access tokens persistidos.

## 15. Listados, filtros y paginación

| Listado          | Carga                            | Búsqueda/filtros                       | Paginación      | Actualización            |
| ---------------- | -------------------------------- | -------------------------------------- | --------------- | ------------------------ |
| Personas         | listado + resumen independientes | búsqueda debounce, tipo/estado remotos | sí              | recarga tras operaciones |
| Roles            | listado + resumen                | búsqueda/estado remotos                | sí              | conserva filtros         |
| Menús            | listado + resumen                | búsqueda/estado remotos                | sí              | conserva filtros         |
| Asignar Roles    | usuarios remotos                 | q, debounce, cards locales             | usuarios/cards  | reload asignados         |
| Asignar Menús    | roles y catálogo activo          | cards locales                          | selección/cards | reload asignados         |
| Asignar Procesos | menús y catálogo activo          | cards locales                          | selección/cards | reload y contexto        |
| Propiedades      | listado + resumen                | q, tipo, estado                        | sí, 20          | recarga tras estado      |
| Unidades         | propiedades + unidades           | propiedad/estado operativo             | sí, 20          | recarga tras estado      |

Roles, Menús, Asignaciones y Propiedades usan switchMap en sus flujos principales. Personas no cancela load ni loadPhotos. Varios listados muestran error sin reintento visible.

## 16. Modales y confirmaciones

Se encontraron QuickMenu, Login/OTP, modales de Persona, Rol, Menú, confirmación de Unidad y editor de metadatos de foto.

Login y los modales con PersonaModalFocusDirective tienen Escape, restauración de foco y focus trap básico. QuickMenu, drawer móvil, perfil Topbar y editor de foto no tienen una estrategia equivalente completa.

Las confirmaciones de estado existen para Persona, Rol, Menú, Propiedad y Unidad. DELETE de fotografías y de asignaciones se ejecuta directamente después del click, sin confirmación adicional.

## 17. Manejo de estados y datos

- Loading, error, selección, filtros, página, modal y feedback se mantienen principalmente como Signals locales.
- computed se usa para estado derivado.
- RxJS se usa para HTTP, debounce, switchMap, expand, reduce, finalize y requests compartidos.
- takeUntilDestroyed está presente en la mayoría de cargas y acciones.
- AuthService comparte refresh concurrente.
- AuthContextService conserva el rol elegido durante reloadContext.
- Se revocan object URLs en varias limpiezas y destrucciones.

Riesgos: carreras de Personas; imágenes de Unidad sin revisión por entidad al cambiar parámetros en la misma instancia; suscripción interna de persistencia de fotos sin takeUntilDestroyed del padre; persistencia de fotos no transaccional aunque se comunica el resultado parcial.

## 18. Autenticación

Implementa login con cookies, OTP, access token en memoria, refresh por cookie HttpOnly, refresh automático frente a TOKEN_EXPIRED, logout/logout-all, authGuard, XSRF XSRF-TOKEN/X-XSRF-TOKEN y deviceId bajo orman-device-id.

No se encontraron access tokens en localStorage, sessionStorage, IndexedDB ni cookies leídas desde JavaScript. Esto está alineado con la política documentada.

## 19. Autorización

La autorización visual depende de roles, menús y procesos del AuthContext; eso solo oculta el Sidebar. No existe guard de permiso/proceso, metadata de permisos, canMatch, canActivateChild ni directiva de autorización reutilizable observada.

La autorización efectiva debe existir en Backend para cada GET/POST/PUT/PATCH/DELETE. En este repositorio no puede comprobarse. La regla PROPIETARIO del frontend no sustituye una autorización de Backend.

## 20. UX funcional

Fortalezas: estados vacíos/loading/error, toasts, conservación de filtros en varios listados, feedback de operaciones parciales, botones de reintento en Unidades y navegación de retorno.

Problemas concretos:

- Inicio no entrega una función de negocio.
- Landing contiene marcadores y no datos reales.
- Algunas acciones visibles son inertes para PROPIETARIO.
- Crear usuario/cambiar contraseña puede fallar sin señalar claramente el campo inválido.
- Fotos y asignaciones se pueden eliminar sin confirmación.
- No todos los errores ofrecen reintento.
- Detalles de Propiedad/Unidad ofrecen PDF, pero no Editar/Activar dentro de la ficha.

## 21. Responsive

Existen media queries para móvil, tablet y desktop en listados, formularios, cards, modales, fotos, Header, Topbar, Sidebar y detalles. La verificación visual real por viewport queda **NO VERIFICADA** para overflow de listados, modales, formularios, textos largos, drawer, mapa y datos extremos.

## 22. Impresión

La impresión CSS existe únicamente para el detalle de Persona: oculta el listado, usa una hoja alternativa, tamaño letter, margen 0, padding 1.4 cm, superficie blanca, texto negro y break-inside avoid. Propiedades y Unidades generan PDF con jspdf.

La salida real en navegador/impresora y contenido largo es **NO VERIFICADA**. La hoja usa position fixed y overflow visible, lo que requiere comprobación de varias páginas.

## 23. Rendimiento

Hay lazy loading, debounce, switchMap en la mayoría de listados, catálogos paginados y no se recalculan resúmenes localmente. Los riesgos son las cargas de fotos de Personas sin cancelación, catálogos completos con expand cuando crezcan y dependencias CommonJS asociadas a PDF.

No se auditó el peso binario de imágenes en detalle.

## 24. Accesibilidad

Hay labels, alt, aria-live, aria-busy, role, aria-invalid, foco visible, Escape, focus trap en algunos modales y prefers-reduced-motion.

Problemas concretos: foco incompleto en drawer/profile/QuickMenu/editor de foto; algunos overlays no bloquean scroll; el mapa no tiene alternativa textual equivalente para seleccionar coordenadas; mensajes inline incompletos en usuario/password; tooltips de cards necesitan verificación con teclado.

## 25. Calidad del código

Fortalezas:

- no se encontró any en producción;
- interfaces y aliases tipados en la mayoría de respuestas;
- nombres de dominio claros;
- separación Page/Component → ApiService → HttpClient;
- guard clauses y finalize en muchos flujos;
- no se encontraron TODO/FIXME/HACK.

Problemas:

- isProblemDetail() solo comprueba objeto no nulo;
- mutaciones de asignación y crearUsuario usan Observable<unknown>;
- páginas y CSS grandes concentran estado, UI y orquestación;
- PDF_PAGE_WIDTH está declarado y no se usa;
- body PATCH de Menús difiere del resto;
- theme-shadow-sm, theme-accent-border y theme-accent-soft se referencian pero no se definen en themes.css.

## 26. Tests

npm test -- --watch=false ejecutó 64 archivos y 481 pruebas: 478 aprobadas, 3 fallidas, código de salida 1.

Las tres fallas están en src/app/core/notifications/orman-notification.service.spec.ts:

1. encapsulates success notifications with the ORMAN duration.
2. keeps action-required warnings and errors visible until dismissal.
3. delegates programmatic dismissal to ngx-sonner.

Las aserciones esperan llamadas a toast.success, toast.warning, toast.error y toast.dismiss, pero registran cero llamadas. No se corrigió el problema. La causa exacta entre mock/import de Vitest y API/runtime de ngx-sonner queda **NO VERIFICADA**.

No se observó una prueba E2E contra Backend, navegador real, permisos por rol, expiración de cookie real ni responsive por viewport.

## 27. Resultado de build y typecheck

npx tsc --noEmit -p tsconfig.app.json pasa. strict y strictTemplates no están activos globalmente.

Con noUnusedLocals/noUnusedParameters falla solo por:

```text
src/app/features/unidades/data/unidad-detail-pdf.service.ts(15,7):
'PDF_PAGE_WIDTH' is declared but its value is never read.
```

npm run build pasa. El tamaño inicial observado es 375.84 kB raw y 94.84 kB estimado transferido. Hay warnings de 16 hojas CSS sobre el budget de 4 KiB y warnings CommonJS para módulos usados por canvg, html2canvas, core-js, raf y rgbcolor.

No hubo errores de TypeScript ni templates durante el build.

## 28. Código incompleto, TODO, FIXME y temporales

- TODO/FIXME/HACK: no encontrados.
- Landing: Propiedades y Contacto son placeholders intencionales.
- Inicio: “Contenido en construcción”.
- .gitkeep en carpetas de Unidades: espacios preparados, sin valor runtime.
- README: todavía describe una aplicación exclusivamente pública, sin autenticación/backend.
- Plan/CHANGELOG: describen Unidades como listado con acciones pendientes, aunque el código actual tiene rutas y páginas de form/detail/fotos.

## 29. Problemas encontrados

Los hallazgos están clasificados en las secciones 32–35. Cada uno incluye evidencia directa de archivo, componente, método o configuración. Las incompatibilidades de Backend no probables en este repositorio se marcan como **NO VERIFICADAS**.

## 30. Riesgos

1. Acceso directo a rutas y operaciones privadas sin capa frontend de permisos.
2. Resultados o fotografías obsoletas en Personas por solicitudes no canceladas.
3. Posible exposición de detalles internos mediante ProblemDetail.detail.
4. CI bloqueada por pruebas fallidas de notificaciones.
5. Documentación desfasada que puede alterar la planificación.
6. Dependencias externas de mapas/geocoding y chunks CommonJS.
7. Ausencia de environments para distintos backends.

## 31. Deuda técnica

- autorización declarativa por proceso/permiso;
- definición neutral de PageResponse;
- cancelación/revisión de cargas;
- validación runtime de respuestas;
- revisión de páginas/estilos grandes;
- alineación README/Plan/CHANGELOG/código;
- corrección de tokens CSS;
- estrategia de entornos/proveedores;
- confirmaciones para DELETE;
- lint/quality gate y resolución de tests de ngx-sonner.

## 32. Hallazgos críticos

**Total: 0**

No se confirmó pérdida de datos, exposición de token o ruptura total de una función esencial. La falta de autorización frontend se clasifica como alta porque no se pudo demostrar una omisión efectiva del Backend.

## 33. Hallazgos altos

**Total: 6**

### H-01 — No existe autorización por permiso en rutas o acciones

- **Evidencia:** src/app/app.routes.ts, rutas 25–138, solo declara authGuard; src/app/core/auth/auth.guard.ts solo decide autenticado/no autenticado.
- **Qué ocurre:** un usuario con sesión puede intentar navegar directamente a cualquier área privada.
- **Impacto:** ocultar el Sidebar no protege una ruta ni una operación; el riesgo final depende del Backend.
- **Recomendación:** definir la matriz Backend de permisos y añadir guard/directiva/metadata declarativa, manteniendo autorización efectiva en Backend.

### H-02 — Acción de desactivar rol protegido visible pero inerte

- **Evidencia:** roles-list.component.html muestra desactivar para roles activos; roles-list.component.ts bloquea openStatus() si isProtectedRole() detecta PROPIETARIO.
- **Qué ocurre:** el usuario ve y pulsa el botón, pero el handler retorna sin feedback.
- **Impacto:** operación administrativa inconsistente y regla hardcodeada por nombre.
- **Recomendación:** usar una capacidad/permiso confirmado por Backend y no ofrecer la acción cuando no corresponda.

### H-03 — ProblemDetail.detail se muestra sin sanitización funcional

- **Evidencia:** Personas, Propiedades, Unidades y asignaciones usan detail para el mensaje; isProblemDetail() no valida estructura.
- **Qué ocurre:** cualquier texto de detail llega al usuario.
- **Impacto:** posible exposición de stack trace, excepciones internas o datos sensibles si el Backend los devuelve.
- **Recomendación:** mapear códigos a mensajes permitidos y conservar detalles técnicos solo en logging controlado.

### H-04 — Carreras de solicitudes en el listado de Personas

- **Evidencia:** PersonasListComponent.load() se suscribe directamente; búsqueda, filtros, paginación y acciones pueden invocar cargas concurrentes sin switchMap o revisión.
- **Qué ocurre:** una respuesta antigua puede sobrescribir una carga reciente.
- **Impacto:** listado incorrecto, filtros aparentemente ignorados y acciones sobre datos obsoletos.
- **Recomendación:** usar un stream cancelable o asociar cada respuesta a una revisión de filtros/página.

### H-05 — Cargas de fotos de Personas pueden quedar asociadas a otra página

- **Evidencia:** PersonasListComponent.loadPhotos() lanza una petición Blob por persona; revokePhotos() no cancela requests anteriores ni identifica la página solicitante.
- **Qué ocurre:** respuestas tardías insertan object URLs de personas que ya no están en la vista.
- **Impacto:** fotos equivocadas, memoria consumida y URLs no revocadas oportunamente.
- **Recomendación:** cancelar/versionar por página, limitar concurrencia y revocar URLs de respuestas obsoletas.

### H-06 — La suite de tests termina fallando

- **Evidencia:** 3 fallas en orman-notification.service.spec.ts; comando con salida 1.
- **Qué ocurre:** el mock de ngx-sonner no registra las llamadas esperadas.
- **Impacto:** CI/entrega puede quedar bloqueada y las notificaciones no quedan verificadas.
- **Recomendación:** aislar la causa mock/import/API, corregir según contrato y ejecutar la suite completa.

## 34. Hallazgos medios

**Total: 15**

### M-01 — Sin environments para API o proveedores externos

**Evidencia:** no existe src/environments/; API_BASE_PATH es relativo, proxy.conf.json fija localhost y Leaflet/Nominatim usan URLs absolutas. Configuración productiva: **NO VERIFICADA**.

### M-02 — No existe 404 ni wildcard

**Evidencia:** src/app/app.routes.ts no declara path: '**'. Una URL no existente no tiene pantalla funcional de recuperación.

### M-03 — Documentación de estado desfasada

**Evidencia:** README.md:19 niega autenticación, Backend y panel; PlanGeneral.md:26–27 marca form/detail/fotos de Unidades como pendientes aunque existen en rutas y páginas.

### M-04 — Variables CSS de tema inexistentes

**Evidencia:** detalles de Propiedad/Unidad y fotos usan theme-shadow-sm, theme-accent-border y theme-accent-soft; themes.css no las define. Puede perderse sombra, borde o fondo.

### M-05 — Archivos grandes con señales de crecimiento

**Evidencia:** Propiedad form 597 TS/558 CSS; Unidad form 513 TS/514 CSS; Fotos manager 520 TS; Unidades list 472 TS. Requieren revisión antes de crecer.

### M-06 — Validación runtime débil y respuestas unknown

**Evidencia:** isProblemDetail() solo comprueba objeto; crearUsuario() y asignaciones devuelven Observable<unknown>. Se pierde garantía del contrato de mutaciones.

### M-07 — Body inconsistente en PATCH de Menús

**Evidencia:** MenuApiService.activate/deactivate() envía null; Persona, Rol, Propiedad y Unidad envían {}. Compatibilidad real: **NO VERIFICADA**.

### M-08 — Foco y scroll incompletos en overlays

**Evidencia:** Sidebar móvil, Topbar, QuickMenu y editor de foto no usan la estrategia completa de Login/directive. Algunos modales no bloquean scroll.

### M-09 — Errores inline incompletos en usuario/password

**Evidencia:** los modales validan, pero no muestran de forma completa required, min/max y mismatch; el submit inválido puede parecer no hacer nada.

### M-10 — Foto inválida conserva selección anterior

**Evidencia:** PersonaPhotoFieldComponent.selectFile() retorna ante archivo inválido antes de limpiar la selección/preview anterior. El estado visible queda ambiguo.

### M-11 — DELETE de fotos y asignaciones sin confirmación

**Evidencia:** UnidadFotosManagerComponent.deletePhoto() y las acciones de asignación llaman DELETE directamente. Un click accidental elimina sin segunda oportunidad.

### M-12 — Persistencia de fotos sin ciclo de vida del padre

**Evidencia:** UnidadFormComponent.submit() se suscribe al Observable de persistPendingPhotos() sin takeUntilDestroyed del padre.

### M-13 — Imágenes de Unidad sin revisión por entidad

**Evidencia:** UnidadDetailComponent y UnidadFotosManagerComponent cancelan por destrucción, pero no por cambio de coduni dentro de la misma instancia. Respuestas tardías podrían mezclarse.

### M-14 — Reintento desigual ante errores

**Evidencia:** Unidades tiene Reintentar; Personas, Roles, Menús y Propiedades no siempre lo ofrecen para listado/resumen.

### M-15 — Warnings de budget CSS y CommonJS

**Evidencia:** npm run build muestra 16 hojas CSS sobre 4 KiB y warnings CommonJS de canvg, html2canvas, core-js, raf y rgbcolor. No rompe el build actual.

## 35. Hallazgos bajos

**Total: 5**

### L-01 — Título HTML genérico

**Evidencia:** src/index.html usa <title>OrmanFrontend</title>.

### L-02 — Constante sin uso en PDF de Unidad

**Evidencia:** unidad-detail-pdf.service.ts:15 declara PDF_PAGE_WIDTH; confirmado con noUnusedLocals.

### L-03 — Paginación innecesaria de una sola página

**Evidencia:** templates de Asignar Menús/Procesos condicionan por pageCount() >= 1, cuyo mínimo es 1. Puede mostrar “Página 1 de 1” sin necesidad.

### L-04 — Carpetas .gitkeep de espacios no usados

**Evidencia:** carpetas de Unidades preparadas para detail/form/gallery/status junto a implementaciones actuales. Es ruido estructural menor.

### L-05 — No hay script ni configuración de lint

**Evidencia:** package.json solo tiene ng, start, build, test y watch; no hay ESLint/Stylelint.

## 36. Funcionalidades pendientes

| Funcionalidad                           | Estado                                                |
| --------------------------------------- | ----------------------------------------------------- |
| Propiedades reales en landing pública   | ❌ NO IMPLEMENTADO                                    |
| Formulario de contacto público          | ❌ NO IMPLEMENTADO                                    |
| Contenido funcional de Inicio/dashboard | ◐ IMPLEMENTACIÓN INCOMPLETA                           |
| 404/fallback de rutas                   | ❌ NO IMPLEMENTADO                                    |
| Guard de permisos/procesos              | ❌ NO IMPLEMENTADO                                    |
| Eliminar Persona                        | ❌ NO IMPLEMENTADO en frontend/contrato no disponible |
| Detalle/Eliminar Rol                    | ❌ NO IMPLEMENTADO                                    |
| Detalle/Eliminar Menú                   | ❌ NO IMPLEMENTADO                                    |
| Contratos y pagos de Propiedad          | ❌ NO IMPLEMENTADO                                    |
| Eliminación de Propiedad                | ❌ NO IMPLEMENTADO                                    |
| Ocupación/disponibilidad de Unidad      | ❌ NO IMPLEMENTADO como flujo independiente           |
| Eliminación de Unidad                   | ❌ NO IMPLEMENTADO                                    |
| Validación contra Backend               | **NO VERIFICADA**                                     |
| Responsive por viewport real            | **NO VERIFICADA**                                     |

## 37. Recomendaciones

1. Confirmar permisos con Backend y proteger rutas/acciones; no basarlos en nombres como PROPIETARIO.
2. Resolver las tres pruebas fallidas de notificaciones y convertir la suite en gate.
3. Cancelar/versionar cargas de Personas y fotos de Unidades.
4. Mapear errores a mensajes seguros.
5. Corregir tokens CSS inexistentes y revisar budgets.
6. Verificar endpoints con Backend y normalizar PATCH/DTOs.
7. Actualizar README, PlanGeneral y CHANGELOG.
8. Añadir 404, reintentos, mensajes inline y confirmaciones.
9. Definir environments y proveedores externos.
10. Añadir tests de autorización, cancelación, respuestas inválidas, navegación directa y errores HTTP.

## 38. Orden recomendado de corrección

| Orden | Trabajo                                  | Motivo                           |
| ----: | ---------------------------------------- | -------------------------------- |
|     1 | Autorización Backend y rutas/acciones    | seguridad                        |
|     2 | Tests de notificaciones                  | suite roja                       |
|     3 | Carreras de Personas/fotos               | datos incorrectos y memoria      |
|     4 | Mapeo seguro de errores                  | exposición de detalles internos  |
|     5 | Tokens CSS y budgets                     | defectos visuales/deuda          |
|     6 | Verificación Backend/PATCH/DTOs          | integraciones posiblemente rotas |
|     7 | Alinear documentación                    | planificación                    |
|     8 | Foco, confirmaciones, retry y validación | UX/accesibilidad                 |
|     9 | Environments/proveedores                 | despliegue                       |
|    10 | Segmentación y lint                      | mantenibilidad                   |

## 39. Conclusión sobre el estado actual

El frontend está en un estado **funcional parcial avanzado**: posee una aplicación administrativa real con sesión, contexto, listados, filtros, formularios, cambios de estado, asignaciones, propiedades y unidades conectadas a servicios HTTP. El build y el typecheck pasan.

No debe considerarse terminado para producción sin resolver autorización por permiso, carreras de solicitudes de Personas, la suite fallida, el tratamiento de errores y la verificación real contra Backend. La landing y el Inicio siguen incompletos por diseño.

**Conteo final:** 0 críticos, 6 altos, 15 medios y 5 bajos.
**Módulos completos dentro del alcance actual:** autenticación base, área privada base, Roles, Menús, Asignar Roles, Asignar Menús y Asignar Procesos. Propiedades y Unidades tienen el alcance CRUD actual implementado, pero permanecen con observaciones.
**Módulos incompletos:** Landing pública, Inicio, Personas respecto a eliminación/robustez, Propiedades respecto a contratos/pagos/eliminación y Unidades respecto a ocupación/disponibilidad/eliminación.
**Integraciones posiblemente rotas o no verificables:** PATCH de Menús por body null, notificaciones en la suite, proveedores OSM/Nominatim y todas las compatibilidades contra Backend por ausencia del servidor/código en este repositorio.
**Informe creado en:** docs/INFORME_AUDITORIA_FRONTEND.md.
