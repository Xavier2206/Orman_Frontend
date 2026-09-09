# Fase 09 — Asignar Roles a Usuario

## Estado

`COMPLETADA`

## Objetivo

Implementar la primera pantalla funcional de `features/asignar-roles` con una experiencia administrativa master-detail para seleccionar usuarios y consultar o administrar sus Roles.

## Alcance realizado

- Se mantuvo la estructura `components`, `data`, `models` y `pages` del feature.
- Se creó `AsignarRolesListComponent` como página standalone con Signals para estado síncrono y RxJS para las solicitudes HTTP.
- La zona izquierda muestra usuarios paginados, selección visual, estados de carga, error y vacío.
- La zona derecha muestra el usuario seleccionado, sus Roles asignados, Roles activos disponibles y estados de carga, error y vacío.
- Se habilitaron asignación y retiro directo mediante los endpoints confirmados, sin modal avanzado ni confirmación adicional.
- Se añadió la ruta privada lazy `/app/asignar-roles/listar` sin modificar Sidebar ni permisos.
- Se reutilizaron `Rol` y `PageResponse` existentes. `Usuario` se limita a `login`, único campo confirmado en el frontend para `GET /api/v1/usuarios`.
- Los Roles muestran nombre, código, estado cuando existe en el contrato y la etiqueta visual protegida para `PROPIETARIO`, sin iconos inventados.
- Los mensajes de error consumen `ProblemDetail` y las operaciones exitosas o fallidas usan `OrmanNotificationService`.

## Endpoints consumidos

- `GET /api/v1/usuarios?page=&size=&sort=` para el listado paginado.
- `GET /api/v1/roles?estado=1&page=&size=&sort=` para el catálogo de Roles activos. El servicio recorre sus páginas hasta completar el catálogo.
- `GET /api/v1/usuarios/{login}/roles` para los Roles asignados.
- `POST /api/v1/usuarios/{login}/roles/{codr}` para asignar un Rol, sin body adicional.
- `DELETE /api/v1/usuarios/{login}/roles/{codr}` para retirar un Rol.

Los parámetros de paginación siguen el patrón ya existente de los listados administrativos. No se añadió búsqueda remota porque el contrato confirmado disponible no documenta un parámetro de búsqueda para Usuarios.

## Diseño y accesibilidad

- Se mantuvieron los tokens semánticos y aliases Tailwind existentes de ORMAN, DÍA y NOCHE.
- No se añadieron colores, sombras, radios, dependencias ni tokens globales.
- La composición es master-detail en desktop, se apila naturalmente en tablet y móvil, y conserva controles con altura mínima aproximada de 44 px.
- Se conservaron focus visible, `aria-label`, `aria-pressed`, `aria-live`, `role="status"` y `role="alert"`.
- Las transiciones se desactivan con `prefers-reduced-motion`.

## Archivos creados

- `src/app/features/asignar-roles/data/asignar-roles-api.service.ts`
- `src/app/features/asignar-roles/data/asignar-roles-api.service.spec.ts`
- `src/app/features/asignar-roles/models/usuario.model.ts`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.ts`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.html`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.css`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.spec.ts`

## Archivos modificados

- `src/app/app.routes.ts`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`

## Validaciones

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- Pruebas relevantes de Asignar Roles: 2 archivos y 8 pruebas aprobadas.
- Suite completa: 37 archivos; 245 pruebas aprobadas y 3 fallas preexistentes en `orman-notification.service.spec.ts`, relacionadas con mocks de `ngx-sonner`.
- Build de producción: correcto. El chunk lazy de Asignar Roles se generó sin advertencia propia; permanecen advertencias de presupuesto CSS preexistentes en componentes de Roles, Menús y Personas.
- `git diff --check`: correcto; solo se mostraron avisos de conversión de finales de línea de Git.
- `package-lock.json`: sin cambios.

## Limitaciones y pendientes

- El contrato disponible para `GET /api/v1/usuarios` no expone en este frontend un nombre ni un estado confirmados; por eso la UI muestra `login` y comunica que el nombre no está disponible. Cuando Backend confirme esos campos, se ampliará `Usuario` en una fase autorizada.
- No se añadieron búsqueda o filtros de Usuarios al no existir parámetros confirmados.
- No se implementaron modales avanzados, confirmaciones, abstracciones genéricas, optimizaciones ni integración con Sidebar/permisos.

## Resultado

La base funcional y visual de la pantalla master-detail quedó implementada sin modificar Backend, contratos existentes fuera del alcance ni `package-lock.json`.

## Iteración visual administrativa

### Objetivo realizado

Se elevó la presentación de Asignar Roles a Usuario con una jerarquía administrativa coherente con Personas y Roles: panel de directorio de Usuarios, búsqueda local de la página visible, selección resaltada, ficha superior de Usuario, cards de Roles, estados vacíos, skeletons, iconografía Material y adaptación responsive.

### Servicios reutilizados

- `AsignarRolesApiService` conserva exclusivamente el listado de Usuarios y las operaciones de consultar, asignar y retirar Roles por `login`.
- `RolApiService` ahora concentra también el recorrido paginado del catálogo de Roles activos mediante `listActiveCatalog()`. Se eliminó esa responsabilidad duplicada de `AsignarRolesApiService`.
- `PersonaApiService.get(codper)` consulta la Persona del Usuario seleccionado. El contrato confirmado de Usuario incorpora `codper`; la ficha compone nombre, apellido paterno y apellido materno sin valores nulos ni espacios duplicados.

### Datos no inventados

- La ficha no muestra CI por decisión visual. Muestra Estado Usuario desde `persona.usuario.estado` cuando existe y Estado Persona desde `persona.estado`.
- Las cards de Roles comunican que la fecha de asignación no está disponible: `GET /api/v1/usuarios/{login}/roles` retorna `Rol`, cuyo contrato no contiene ese dato.
- `PROPIETARIO` conserva una etiqueta visual de protección, sin bloquear asignación ni retiro en Angular; Backend continúa como autoridad.

### Archivos modificados en esta iteración

- `src/app/features/roles/data/rol-api.service.ts`
- `src/app/features/roles/data/rol-api.service.spec.ts`
- `src/app/features/asignar-roles/data/asignar-roles-api.service.ts`
- `src/app/features/asignar-roles/data/asignar-roles-api.service.spec.ts`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.ts`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.html`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.css`
- `src/app/features/asignar-roles/pages/asignar-roles-list/asignar-roles-list.component.spec.ts`
- `src/app/features/asignar-roles/models/usuario.model.ts`

No se creó ningún componente, servicio de Usuario, endpoint, modelo de transporte ni dependencia nueva.

### Validaciones de esta iteración

- `npx tsc -p tsconfig.app.json --noEmit`: correcto.
- `npm test -- --watch=false`: 37 archivos y 245 pruebas aprobadas; persisten 3 fallas preexistentes en `orman-notification.service.spec.ts` por mocks de `ngx-sonner`.
- `npm run build`: correcto. Se mantienen advertencias de presupuesto CSS históricas y la hoja cohesiva de Asignar Roles alcanza 6.69 kB frente al presupuesto de 4 kB; no se fragmentó porque conserva una única responsabilidad de presentación de la página.
- `git diff --check`: correcto; sólo informa avisos de conversión LF/CRLF de Git.
- `package-lock.json`: sin cambios.

### Corrección de información personal

- Al seleccionar un Usuario se consulta `PersonaApiService.get(user.codper)` con cancelación de solicitudes anteriores mediante `switchMap`.
- La ficha usa el nombre completo real y conserva el login. Durante la consulta presenta estado de carga y, si falla, conserva el Usuario seleccionado y muestra el error `ProblemDetail`.
- La cobertura específica verifica nombre con ambos apellidos, sin apellido materno, sin apellido paterno, carga y error de Persona.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 10 pruebas aprobadas.

### Corrección de jerarquía de Usuario seleccionado

- La ficha presenta siempre el `login` del Usuario como identidad principal y el nombre completo de la Persona asociada como información secundaria.
- Se eliminó el texto genérico de administración de Roles; no se modificaron la consulta actual de Persona, `PersonaApiService`, los modelos ni los contratos Backend.
- La prueba de página verifica que el encabezado de la ficha contiene el login, el nombre completo aparece debajo y el texto eliminado no se renderiza.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 10 pruebas aprobadas.

### Corrección de jerarquía del directorio de Usuarios

- Las tarjetas del directorio mantienen al `login` como identidad visual principal y muestran debajo el nombre completo disponible de la Persona asociada como referencia secundaria.
- El placeholder del buscador ahora comunica el alcance visual previsto: `Buscar por login o nombre...`. La lógica permanece como filtro local por login, ya que no se autorizó ni existe soporte para modificarla.
- No se modificaron servicios, Backend, modelos ni la asignación Usuario → Rol.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 10 pruebas aprobadas.

### Simplificación de ficha de Usuario seleccionado

- Se retiró el bloque visual duplicado de Login, Estado Usuario y Estado Persona. La ficha conserva únicamente avatar o iniciales, login como identidad principal y nombre completo de Persona como información secundaria.
- Las secciones de Roles asignados y Roles disponibles comienzan directamente después de la cabecera, sin modificar `PersonaApiService`, servicios, APIs, modelos ni asignación Usuario → Rol.
- Se eliminaron los estilos locales que pertenecían exclusivamente al bloque retirado; la hoja de estilos mantiene una única responsabilidad de presentación de la página pese a superar 300 líneas.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 10 pruebas aprobadas.

### Reestructuración vertical de Roles

- La zona de Roles dejó el layout lateral y ahora presenta Roles asignados en el bloque superior y Roles disponibles para asignar en el bloque inferior.
- Las cards de Roles asignados conservan únicamente nombre, código, estado, protección cuando corresponde y la acción de quitar; se eliminó la fecha de asignación no disponible.
- Roles disponibles usa un grid responsive de una columna en móvil y dos columnas desde tablet, manteniendo la separación basada en `availableRoles()`.
- No se añadieron descripciones, permisos, historial ni datos fuera del contrato real de `Rol`.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 10 pruebas aprobadas. `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.

### Optimización responsive de tarjetas de Roles

- `Roles asignados` y `Roles disponibles para asignar` comparten `roles-grid`.
- El grid usa una columna en móvil, dos desde `40rem`, tres desde `80rem` y cuatro desde `90rem`, adaptándose a la disponibilidad de espacio del layout.
- Las cards reducen su padding a `0.75rem` y los espacios de badges y acciones para conservar la información actual en una composición más compacta.
- No se añadieron colores, tokens, fechas, descripciones ni cambios de lógica.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 16 pruebas aprobadas. `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas.

### Distribución dinámica y paginación de tarjetas

- Ambas secciones adaptan la cantidad visible de columnas al viewport y al número de tarjetas: una tarjeta ocupa el ancho disponible, dos y tres conservan su cantidad en desktop y cuatro usan el máximo de cuatro columnas.
- Cuando una sección supera cuatro elementos muestra paginación independiente con cuatro tarjetas por página, página actual, Anterior y Siguiente.
- El estado de paginación se mantiene local a la página y se reajusta de forma segura cuando cambia la selección o el catálogo; no modifica las solicitudes ni la lógica de asignación.
- Las pruebas cubren usuario sin roles, cantidades pequeñas y catálogos de cinco o más roles, incluyendo el avance entre páginas.
- La revisión de archivos de 300 líneas o más mantiene `AsignarRolesListComponent` y su hoja cohesivos: la página concentra la coordinación de selección, Persona, asignaciones, catálogos, paginación y estados visuales; dividirlos introduciría capas artificiales fuera de esta Fase.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 16 pruebas aprobadas. `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.

### Altura uniforme de tarjetas asignadas

- Las cards de Roles asignados reservan una zona estable para badges opcionales mediante `.role-badges`, con altura mínima aun cuando el rol no tenga la etiqueta `Protegido`.
- La estructura vertical compartida conserva nombre, código, estado, badge de protección y acción; el botón se mantiene al final de la card mediante el patrón flex existente, alineando acciones entre roles con distinta información visual.
- La reserva es genérica para badges futuros y no depende del nombre de un rol. No se modificaron servicios, modelos, APIs ni la lógica de asignación o retiro.
- La prueba de presentación verifica la existencia de la zona reservada en un rol normal sin badge y en `PROPIETARIO` con `Protegido`.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 16 pruebas aprobadas. `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.
### Corrección de paginación del directorio de Usuarios

- El listado de Usuarios solicita al Backend un máximo de 5 elementos por página mediante el parámetro `size=5`.
- El paginador del directorio solo se renderiza cuando la respuesta tiene más de una página; con 1 o 5 Usuarios no aparecen controles activos.
- Se conserva la navegación anterior/siguiente y la selección de Usuario; no se modificaron la consulta de Roles, los servicios de Roles, las asignaciones, las tarjetas ni los estilos.
- Las pruebas cubren 1, 5, 6, 10 y 11 Usuarios, verifican un máximo de cinco elementos visibles y comprueban el avance hasta la última página.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 21 pruebas aprobadas.
- `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.
- `package-lock.json`: sin cambios. `git diff --check`: correcto, con los avisos habituales de conversión de finales de línea.
### Buscador local de Roles disponibles

- Se añadió un buscador accesible en el mismo encabezado de `Roles disponibles para asignar`, alineado a la derecha en desktop y con `flex-wrap` para bajar naturalmente en móvil.
- La búsqueda filtra en tiempo real por coincidencias parciales en `Rol.nombre` o en la representación textual de `Rol.codr`.
- La paginación de Roles disponibles se calcula sobre el resultado filtrado y vuelve a la primera página al cambiar la consulta.
- Cuando la consulta no encuentra coincidencias se muestra `No se encontraron roles disponibles.`; el estado de catálogo vacío sin búsqueda conserva su mensaje actual.
- No se modificaron Roles asignados, asignar/quitar, servicios, modelos, Backend, temas ni contratos.
- Las pruebas cubren ubicación del buscador, búsqueda por nombre, búsqueda por código y estado sin resultados; la envoltura flexible mantiene el comportamiento responsive.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 25 pruebas aprobadas.
- `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.
- `package-lock.json`: sin cambios. `git diff --check`: correcto, con los avisos habituales de conversión de finales de línea.
### Buscador local de Roles asignados

- Se añadió un buscador accesible en el mismo encabezado de `Roles asignados`, reutilizando el patrón visual y responsive del buscador de Roles disponibles.
- El filtro usa únicamente los Roles asignados al Usuario seleccionado y busca coincidencias parciales en el nombre o código del Rol.
- La paginación de Roles asignados se calcula sobre el resultado filtrado y se reinicia al escribir una nueva consulta.
- Una consulta sin coincidencias muestra `No se encontraron roles asignados.`; la consulta vacía restaura todos los Roles asignados.
- No se modificaron las acciones asignar/quitar, servicios, modelos, Backend ni la sección de Roles disponibles.
- Las pruebas cubren ubicación accesible, nombre, código, texto vacío, ausencia de coincidencias y múltiples Roles.
- `npx tsc -p tsconfig.app.json --noEmit`: correcto. `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 31 pruebas aprobadas.
- `npm run build`: correcto; permanecen advertencias de presupuesto CSS históricas, incluida la hoja de Asignar Roles.
- `package-lock.json`: sin cambios. `git diff --check`: correcto, con los avisos habituales de conversión de finales de línea.
### Busqueda remota de Usuarios

- `AsignarRolesApiService.listUsuarios(page, query?)` envia `page`, `size=5` y `sort=login,asc`; agrega `q` unicamente para consultas no vacias.
- El directorio dejo de filtrar localmente `page.content`. La respuesta paginada del Backend es ahora la fuente de verdad.
- La busqueda usa debounce de 350 ms y una unica tuberia con `switchMap`, por lo que las solicitudes anteriores quedan canceladas al emitir una nueva consulta o cambiar de pagina.
- Al escribir se solicita la pagina 0; al navegar se conserva la consulta actual.
- `Usuario` incorpora `estado`, `nombre`, `ap` y `am`. El directorio muestra login y nombre completo sin valores nulos ni espacios dobles.
- No se modificaron PersonaApiService, RolApiService, roles, asignaciones, retiro de roles, Backend ni `package-lock.json`.

### Validacion de esta iteracion

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false --include src/app/features/asignar-roles/**/*.spec.ts`: 2 archivos y 39 pruebas aprobadas.
- `npm run build`: correcto; permanecen advertencias de presupuesto CSS preexistentes, incluida la hoja de Asignar Roles.
- `git diff --check`: correcto.
