# Plan General de ORMAN Frontend

Documento maestro de planificación del frontend Angular. Indica qué Etapa está activa, qué fases existen, su estado, dependencias, documentación y próximos límites de trabajo.

## Objetivo general

ORMAN Frontend busca construir incrementalmente una aplicación Angular mantenible para una plataforma familiar de gestión de propiedades. El desarrollo comenzó con la fundación técnica, la identidad visual y la experiencia pública; continuará con la integración segura con el backend y, posteriormente, con áreas privadas y módulos funcionales cuando sean definidos y autorizados.

Las funcionalidades se consideran disponibles únicamente cuando están demostradas por el código y la documentación de su fase. La integración real con Spring Boot, la autenticación funcional y las áreas privadas todavía no forman parte de lo implementado en este repositorio.

## Estado actual

- **Etapa anterior:** Etapa 1 — Fundación visual y arquitectura pública. El histórico está documentado y la experiencia pública visual está implementada.
- **Etapa actual:** Etapa 2 — Integración funcional con Backend.
- **Última fase histórica documentada:** Fase 10 — Acceso visual en dos pasos.
- **Última fase completada:** Fase 11 de Etapa 2 — Asignar Menús a Rol.
- **Estado de la Fase 05:** `COMPLETADA`.
- **Pruebas:** 42 archivos y 293 pruebas aprobadas.
- **Corrección responsive posterior:** Desktop conserva Sidebar expandido/compacto. En tablet y móvil, la navegación es un drawer off-canvas: cerrado no reserva rail ni ancho y abierto se sitúa tras la altura real del Topbar con backdrop, cierre interno y Escape. Los estados sin roles o sin menús aprovechan el Main sin una columna vacía; AuthContext, roles, menús, procesos y seguridad permanecen sin cambios funcionales.
- **Observación:** la Fase 06.1 conserva en su documento el estado “Pendiente de aprobación visual”; por eso aparece como `EN ANÁLISIS` en la tabla, aunque el README histórico agrupa las mejoras 06.1–06.2 como completadas. Esta diferencia queda visible y no se resuelve inventando una aprobación.

## Estados permitidos

| Estado | Significado |
| --- | --- |
| `PENDIENTE` | Aún no iniciada. |
| `EN ANÁLISIS` | Se están confirmando alcance, requisitos o decisiones. |
| `EN DESARROLLO` | La fase está autorizada y en ejecución. |
| `BLOQUEADA` | Existe un impedimento que evita continuar o cerrar. |
| `COMPLETADA` | Cumplió objetivo, validaciones y documentación. |
| `CANCELADA` | Se decidió no continuar con la fase. |

## ETAPA 1 — Fundación visual y arquitectura pública

La Etapa 1 reúne todo el trabajo histórico realizado antes de la integración funcional con Spring Boot: creación de la base Angular, estructura modular, Tailwind, temas, recursos públicos, landing, identidad visual y acceso visual no funcional.

### Theory de la Etapa 1

Existen documentos teóricos asociados a la etapa, pero no existe un único índice o documento que declare una consolidación final de toda la Etapa 1. Se conservan y enlazan sin reescribir:

- [Metodología de trabajo con Codex](etapas/etapa-1/theory/00-metodologia-trabajo-codex.md)
- [Angular y componentes standalone](etapas/etapa-1/theory/01-angular-y-componentes-standalone.md)
- [Estructura modular del frontend](etapas/etapa-1/theory/02-estructura-modular-frontend.md)
- [Tailwind CSS](etapas/etapa-1/theory/03-tailwind-css.md)
- [Variables CSS y temas visuales](etapas/etapa-1/theory/04-variables-css-y-temas.md)
- [Layouts y composición en Angular](etapas/etapa-1/theory/05-layouts-y-composicion-angular.md)

**Estado de consolidación:** pendiente de consolidación documental como Theory única de la Etapa 1.

### Fases de la Etapa 1

| Fase | Estado | Dependencia | Documento |
| --- | --- | --- | --- |
| 01 — Creación del proyecto Angular | `COMPLETADA` | Ninguna; creación inicial del proyecto | [Documento](etapas/etapa-1/fases/01-creacion-proyecto-angular.md) |
| 02 — Estructura base del frontend | `COMPLETADA` | Fase 01 | [Documento](etapas/etapa-1/fases/02-estructura-frontend.md) |
| 03 — Instalación y configuración de Tailwind CSS | `COMPLETADA` | Fase 02 | [Documento](etapas/etapa-1/fases/03-configuracion-tailwind.md) |
| 04 — Sistema de temas de ORMAN | `COMPLETADA` | Fase 03 | [Documento](etapas/etapa-1/fases/04-sistema-de-temas.md) |
| 04.1 — Estructura de recursos visuales públicos | `COMPLETADA` | Base Angular y Fase 03 | [Documento](etapas/etapa-1/fases/04-1-recursos-visuales-publicos.md) |
| 05 — Estructura base de la landing pública de ORMAN | `COMPLETADA` | Fase 04 y recursos públicos de Fase 04.1 | [Documento](etapas/etapa-1/fases/05-estructura-landing-publica.md) |
| 05.1 — Integración del logotipo oficial de ORMAN | `COMPLETADA` | Fase 05 | [Documento](etapas/etapa-1/fases/05-1-integracion-logo-orman.md) |
| 06.1 — Mejora del header y selector de temas | `EN ANÁLISIS` | Fase 05.1; aprobación visual pendiente según el documento de fase | [Documento](etapas/etapa-1/fases/06-1-mejora-header-selector-temas.md) |
| 06.2 — Mejora del hero con logotipo animado | `COMPLETADA` | Landing y componentes visuales disponibles | [Documento](etapas/etapa-1/fases/06-2-mejora-hero-logo-animado.md) |
| 10 — Acceso visual en dos pasos | `COMPLETADA` | Landing pública y componentes visuales disponibles | [Documento](etapas/etapa-1/fases/10-modal-inicio-sesion.md) |

Las mejoras posteriores de tokens, superficies, radios, sombras y Hero están registradas dentro del documento histórico de la Fase 04, tal como existe actualmente; no se renumeran ni se separan retroactivamente.

## ETAPA 2 — Integración funcional con Backend

La Etapa 2 inicia la integración funcional del frontend Angular con el backend Spring Boot de ORMAN. Todavía no se ha implementado la primera fase.

### Theory de la Etapa 2

**Pendiente de creación al cerrar la Etapa 2.** No se crea Theory después de cada fase.

### Fases previstas

| Fase | Estado | Dependencia | Documento |
| --- | --- | --- | --- |
| 01 — Integración de autenticación Angular ↔ ORMAN Backend | `COMPLETADA` | Etapa 1 disponible; contrato backend de autenticación y configuración de cookies/CSRF validados | [Documento](etapas/etapa-2/fases/01-integracion-autenticacion-angular-backend.md) |
| 02 — Área privada base, layout autenticado y protección de rutas | `COMPLETADA` | Fase 01 completada; contrato de refresh y logout validado | [Documento](etapas/etapa-2/fases/02-area-privada-layout-rutas-protegidas.md) |
| 03 — Contexto post-login real en Angular | `COMPLETADA` | Fases 01 y 02; contrato `GET /api/v1/auth/context` confirmado | [Documento](etapas/etapa-2/fases/03-contexto-post-login-angular.md) |
| 04 — Selector de rol y Sidebar dinámico | `COMPLETADA` | Fase 03; contexto autenticado con roles | [Documento](etapas/etapa-2/fases/04-selector-rol-sidebar-dinamico.md) |
| 05 — Angular Material Icons en el área privada | `COMPLETADA` | Fase 04; layout privado y `Menu.icono` disponibles | [Documento](etapas/etapa-2/fases/05-angular-material-icons.md) |
| 06 — Módulo Gestionar Personas | `EN DESARROLLO` | Fases privadas disponibles; contrato Backend de Personas entregado | [Documento](etapas/etapa-2/fases/06-modulo-gestionar-personas.md) |
| 07 — Gestionar Roles: listado, resumen y filtros remotos | `COMPLETADA` | Contratos confirmados de `GET /api/v1/roles` y `GET /api/v1/roles/resumen` | [Documento](etapas/etapa-2/fases/07-estructura-inicial-modulo-roles.md) |
| 08 — Acciones y modales de Gestionar Menús | `COMPLETADA` | Contratos confirmados de lectura, creación, edición y cambio de estado; asignaciones fuera de alcance | [Documento](etapas/etapa-2/fases/08-estructura-inicial-modulo-menus.md) |
| 09 — Asignar Roles a Usuario | `COMPLETADA` | Contratos confirmados de Usuarios, Roles y asignaciones Usuario–Rol | [Documento](etapas/etapa-2/fases/09-asignar-roles-usuario.md) |
| 10 — Estructura base de Asignar Menús y Asignar Procesos | `COMPLETADA` | Fase 09; patrón arquitectónico de `features/asignar-roles/` | [Documento](etapas/etapa-2/fases/10-estructura-asignar-menus-procesos.md) |
| 11 — Asignar Menús a Rol | `COMPLETADA` | Fase 10; contratos confirmados de Roles, Menús y asignaciones Rol–Menú | [Documento](etapas/etapa-2/fases/11-asignar-menus.md) |
| 12 — Asignar Procesos a Menú | `COMPLETADA` | Fase 11; contratos confirmados de Menú–Proceso | [Documento](etapas/etapa-2/fases/12-asignar-procesos.md) |

La Fase 01 integró proxy Angular, `HttpClient`, login, OTP, estado de autenticación, access token en memoria, interceptor Bearer, XSRF, refresh, logout, manejo de errores y pruebas. El resultado y la validación manual pendiente quedan registrados en su documento. La Fase 02 completó el contenedor privado, restauración inicial de sesión y protección de rutas, sin adelantar roles, menús ni módulos funcionales. La Fase 05 incorporó `MatIcon` y Material Symbols Rounded únicamente en el área privada; `Menu.icono` se representa directamente y los valores legacy incompatibles siguen pendientes de actualización en Backend/BD.

La Fase 06 incorporó además el resumen remoto superior de Personas desde `GET /api/v1/personas/resumen`. Sus métricas no se derivan del listado, se cargan independientemente y solo se actualizan tras operaciones que modifican altas, estado o vínculo de Usuario. La página de Personas ahora orquesta componentes de modal separados, sin mover HTTP fuera de `PersonaApiService` ni introducir estado global.

La auditoría técnica de la Fase 06 corrigió las acciones móviles, la gestión accesible de foco en modales y la notificación zoneless de fotografías, sin modificar contratos Backend ni ampliar funcionalidades.

La iteración activa de la Fase 06 reforzó el único modal compartido de Crear/Editar Persona con validación inline accesible, regla frontend de al menos un apellido, estados neutral/error/válido basados en tokens y recuperación segura ante fallo posterior de fotografía. La validación manual confirmó el flujo base de crear y editar, el foco inicial, el submit inválido y los temas; la fase permanece `EN DESARROLLO` hasta la decisión de replicar la regla de apellidos en Backend.

La corrección visual posterior del modal Persona integró Tipo de Persona junto a Género, eliminó huecos de la grilla, convirtió Cancelar en botón secundario y aplicó Material Symbols Rounded a los iconos encapsulados del modal y la fotografía, sin modificar validaciones ni contratos.

La iteración activa de la Fase 06 incorporó notificaciones privadas globales mediante `ngx-sonner` encapsulado por `OrmanNotificationService`. El host único reside en `PrivateLayout`, conserva la identidad ORMAN/DÍA/NOCHE por tokens semánticos y solo confirma por ahora Crear y Editar Persona; los errores inline y el éxito parcial de fotografía siguen siendo contextuales al modal.

La mejora integral del Detalle de Persona convirtió el modal en una ficha administrativa con cabecera de perfil, fotografía Blob autenticada o iniciales, secciones personales/de contacto/sistema, badges de tipo y estado, adaptación responsive con scroll interno y una vista de impresión independiente en hoja carta. El modal continúa siendo exclusivamente visual: recibe la Object URL que ya administra `PersonasListComponent`, sin HTTP ni contratos nuevos.

La iteración posterior corrigió la impresión vacía causada por ocultar el host completo de `PersonasListComponent`: durante impresión se oculta únicamente el listado y se conserva el modal de detalle. La ficha usa una superficie blanca y texto negro independientes del tema para evitar fondos oscuros, elimina repeticiones visuales y redistribuye la información en dos columnas desde 768 px, manteniendo una columna y scroll condicionado en móvil, baja altura o zoom.

La corrección final de esta mejora conserva el diseño visual aprobado del Detalle de Persona: mantiene las tres tarjetas de información apiladas, elimina únicamente reglas de redistribución completa en dos columnas y conserva el ajuste de altura/scroll relativo al viewport. La impresión continúa usando la ficha separada con fondo blanco, sin ocultar el host del listado.

El ajuste puntual posterior de la ficha impresa aumentó moderadamente el tamaño de la identidad `ORMAN` y añadió aire lateral al bloque superior, manteniendo alineado el título y sin modificar el resto del contenido ni la lógica de impresión.

La ficha impresa ahora reemplaza esa identidad textual por el SVG oficial `/images/brand/orman-logo.svg`, manteniendo el mismo bloque superior, un tamaño proporcional para hoja carta y una alineación independiente del tema visual.

La ficha impresa conserva el SVG junto a la palabra `ORMAN`, mantiene `FICHA DE PERSONA` como subtítulo, incorpora `persona.codper` en Información del sistema y añade el pie institucional con la fecha dinámica de generación en formato `dd/MM/yyyy`. No se modifican la fotografía, el modal visual ni la lógica `window.print()`.

El modal compartido de estado de Persona conserva las operaciones `activate`/`deactivate` en un único componente. Ahora muestra el nombre completo recibido desde `PersonasListComponent`, iconografía contextual, mensajes y acciones de carga específicos, además de `aria-describedby`, `aria-busy` y estilos semánticos de éxito/peligro basados en tokens existentes. La lógica HTTP permanece en `PersonasListComponent` y `PersonaApiService`.

La Fase 07 implementó `features/roles`: ruta privada `/app/roles/listar`, listado paginado desde `GET /api/v1/roles`, resumen global desde `GET /api/v1/roles/resumen`, búsqueda remota con debounce, filtro remoto por estado, cards responsive y estados de carga/error/vacío mediante tokens de los tres temas. El listado usa `switchMap` para no renderizar resultados de solicitudes canceladas. Crear, Editar, Activar y Desactivar se coordinan desde `RolesListComponent` mediante dos modales compartidos, `ProblemDetail`, toasts y recargas que conservan filtros. DELETE, detalle, asignaciones Rol–Usuario, Sidebar, Menús y Procesos permanecen fuera de alcance.

La Fase 08 implementó el listado funcional de `features/menus` y sus acciones administrativas: ruta privada `/app/menus/listar`, lectura paginada, resumen global, búsqueda y filtro remotos, cards responsive, iconos reales con fallback visual, formulario compartido Crear/Editar, selector visual curado de iconos, Desactivar, Reactivar, toasts y recargas diferenciadas. Las asignaciones Rol–Menú y Menú–Proceso, Sidebar y Backend permanecen fuera de alcance.

La Fase 11 implementó `features/asignar-menus`: selección remota y paginada de Roles activos, detalle del Rol, catálogo paginado de Menús activos, Menús asignados y disponibles con búsqueda y paginación local, asignación, retiro, estados visuales y ruta lazy `/app/asignar-menus/listar`. No se modificaron Sidebar, permisos, AuthContext ni Backend.

La Fase 12 implementó `features/asignar-procesos`: selección remota y paginada de Menús activos, detalle del Menú, catálogo paginado de Procesos, Procesos asignados y disponibles con búsqueda y paginación local, asignación, retiro, estados visuales y ruta lazy `/app/asignar-procesos/listar`. Posteriormente se corrigió el tipado y consumo de `Proceso` y `MeProResponse` según el contrato Backend confirmado, se filtró localmente el catálogo por `estado === 1` sin agregar parámetros no soportados y se recargó `AuthContext` preservando el Rol seleccionado después de las mutaciones. No se modificaron Sidebar, permisos ni Backend.

### Fases futuras por definir

No se registran nombres ni funcionalidades adicionales hasta que sean decididos y autorizados.

## Forma de trabajo

- El desarrollo se organiza por Etapas.
- Cada Etapa contiene fases pequeñas, acotadas y verificables.
- Solo debe trabajarse una fase autorizada.
- No deben adelantarse funcionalidades futuras ni ampliar el alcance de una fase.
- Cada fase debe documentar objetivo, alcance, exclusiones, cambios, decisiones, pruebas, validaciones y pendientes.
- Al cerrar una fase se actualizan su documento, `PlanGeneral.md` y `CHANGELOG.md`.
- La Theory se consolida únicamente cuando se cierra la Etapa completa.

Una dependencia expresa orden técnico, pero cada fase requiere además autorización explícita antes de comenzar. Este documento no constituye autorización automática para implementar la siguiente fase.

## Decisiones pendientes

- La aprobación visual pendiente indicada en el documento de la Fase 06.1 debe confirmarse o cerrarse documentalmente.
- Las decisiones fuera del alcance de autenticación, como roles dinámicos y navegación privada, siguen pendientes de una fase posterior.
- Las propiedades y futuras áreas funcionales no tienen todavía una fase frontend implementada en este repositorio.
- Las fases posteriores de la Etapa 2 permanecen por definir.

## Dependencias generales

- **Etapa 1:** sus fases dependen secuencialmente de la base Angular y de los resultados documentados de las fases anteriores; las correcciones 04.1 y 05.1 conservan su numeración histórica.
- **Etapa 2 / Fase 01:** depende de la base visual y arquitectónica disponible de la Etapa 1, del contrato de autenticación Spring Boot y de la configuración backend de cookies/CSRF validada.
- No se adelantan dependencias de fases futuras que todavía no existen.

## Relación con la documentación

- `PlanGeneral.md` indica **qué** está planeado y en qué estado se encuentra.
- `CHANGELOG.md` indica **qué cambió realmente**.
- Cada documento de fase explica **cómo y por qué** se realizó una fase.
- La Theory explica **qué conocimiento técnico quedó consolidado** después de cerrar una Etapa.

## Fase 09 — Asignar Roles a Usuario

La Fase 09 implementó la pantalla privada master-detail de Asignar Roles a Usuario en `/app/asignar-roles/listar`. Su iteración visual administrativa añadió directorio con búsqueda local, ficha de Usuario y cards de Roles, centralizó el catálogo activo en `RolApiService` y consulta Persona mediante el `codper` confirmado del Usuario seleccionado. Tanto la ficha como el directorio priorizan el login y muestran el nombre completo de la Persona como información complementaria; la ficha no duplica Login ni estados antes de las secciones de Roles y el placeholder del directorio comunica búsqueda por login o nombre, sin modificar su filtro local existente. La zona de Roles se presenta verticalmente con ambas secciones usando un grid responsive compacto de 1/2/3/4 columnas según el viewport, con paginación independiente de cuatro tarjetas por página cuando corresponde; Roles asignados arriba y Roles disponibles para asignar abajo. Las cards comparten una zona reservada para badges opcionales, de modo que la etiqueta `Protegido` no altera su altura ni desalinean las acciones. La fecha de asignación permanece pendiente de un contrato Backend que la exponga y no se muestra en las cards; Angular no inventa ese dato. El detalle está documentado en [su documento de fase](etapas/etapa-2/fases/09-asignar-roles-usuario.md).

La Fase 10 preparó las estructuras base de `features/asignar-menus/` y `features/asignar-procesos/` con Pages standalone mínimas, templates semánticos, hojas CSS vacías y pruebas de creación. No se añadieron rutas, servicios, modelos, DTOs, mocks, permisos, APIs ni lógica de asignación; su implementación funcional queda pendiente de fases autorizadas.
### Corrección puntual de paginación en Fase 09

El directorio de Usuarios solicita y muestra como máximo cinco elementos por página y solo presenta el paginador cuando existen más de cinco Usuarios. La navegación y la selección de Usuario se conservan sin modificar la lógica de Roles ni asignaciones. El detalle queda registrado en [el documento de la Fase 09](etapas/etapa-2/fases/09-asignar-roles-usuario.md).
### Corrección puntual de Fase 09: búsqueda de Roles disponibles

La sección `Roles disponibles para asignar` incorpora un buscador local en su encabezado, con filtrado por nombre o código, estado sin resultados y adaptación flexible para desktop, tablet y móvil. La paginación de esa sección usa el resultado filtrado; Roles asignados, asignar/quitar, servicios, modelos y Backend permanecen sin cambios.
### Corrección puntual de Fase 09: búsqueda de Roles asignados

La sección `Roles asignados` incorpora un buscador local en su encabezado, con filtrado por nombre o código, estado sin resultados y adaptación flexible para desktop, tablet y móvil. El filtrado se limita al Usuario seleccionado y no modifica las acciones de asignar o quitar, los servicios, modelos ni Backend.
### Correccion puntual de Fase 09: busqueda remota de Usuarios

El directorio de Usuarios consulta `GET /api/v1/usuarios` con `q`, `page`, `size=5` y `sort=login,asc`. La busqueda se aplica en Backend con debounce y cancelacion mediante `switchMap`; la paginacion conserva el filtro y las nuevas respuestas incluyen el nombre completo disponible para el listado. No se modifican roles, asignaciones, servicios de Persona/Rol ni Backend.
