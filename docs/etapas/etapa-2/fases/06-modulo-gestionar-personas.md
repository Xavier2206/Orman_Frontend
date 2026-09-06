# Fase 06 — Módulo Gestionar Personas

## Estado

`EN DESARROLLO`

## Objetivo y alcance

Integrar la ruta privada `personas/listar` y una pantalla Angular de gestión de Personas contra el contrato Backend confirmado. Incluye listado paginado remoto, filtros, altas, edición, baja/reactivación lógica, detalle imprimible, fotos autenticadas y operaciones de Usuario.

## Exclusiones

No se modificó Backend, autenticación, guards, AuthContext ni se añadió DELETE físico de Personas, librerías PDF, NgRx o datos ficticios productivos.

## Implementación realizada

- `Proceso.enlace` se normaliza y navega internamente mediante `Router` a `/app/<enlace>`; enlaces vacíos quedan no navegables.
- Ruta lazy protegida: `/app/personas/listar`.
- `PersonaApiService` consume `GET/POST/PUT /personas`, activación/desactivación, foto Blob/multipart/delete y los endpoints de Usuario documentados.
- Listado remoto con `q` debounced 350 ms, tipo, estado, página, `size=10` y `sort=ap,asc`; no hay paginación local.
- Cards responsive con foto o iniciales, badges, acciones según `Persona.acciones`, menú móvil y sin botón de DELETE físico.
- Formularios Reactivos para Persona, Usuario y contraseña; estado se conserva en PUT; errores ProblemDetail y fieldErrors se presentan en el formulario.
- Las fotos se descargan mediante HttpClient Blob y las object URL se revocan al cambiar de página y destruir el componente. La carga local se valida como JPEG/PNG de hasta 2 MiB.
- Detalle en modal e impresión mediante `window.print()`.

## Ajuste visual posterior

- Se corrigió la causa de los nombres de iconos visibles como texto: el feature importaba `MatIconModule`, pero sus `mat-icon` no seleccionaban la fuente cargada `Material Symbols Rounded`; el fallback de Angular era `Material Icons`, que no está cargado. El CSS local ahora declara familia, ligaduras y variaciones de Material Symbols; no se ocultó texto ni se redujeron contenedores como workaround.
- Botón principal, buscador, teléfono, acciones y limpiar usan glyphs Material reales. Las cards incorporan el teléfono con icono, un divisor semántico antes de acciones y un orden fijo Editar, Detalle, estado, Usuario.
- Filtros tienen labels visibles y la paginación se presenta en una franja responsive con tokens del tema.

## Resumen superior de Personas

- Se añadió el modelo local `PersonaResumen` y `GET /api/v1/personas/resumen` al servicio tipado existente, sin modificar el listado ni recalcular métricas en Angular.
- Al entrar a Gestionar Personas, listado y resumen se solicitan en paralelo e independientemente. El resumen se presenta entre el encabezado y los filtros con cuatro cards compactas: Total Personas, Activas, Inactivas y Con Usuario.
- Las cards usan Material Symbols reales (`group`, `check_circle`, `remove_circle`, `lock`), tokens de ORMAN para las tres paletas y una grilla 4 columnas en desktop / 2 × 2 en tablet y móvil, sin scroll horizontal.
- Durante la carga se muestran skeletons locales; un error del resumen solo muestra un aviso discreto y no bloquea el listado ni inventa valores.
- El resumen solo se refresca tras crear Persona, cambiar su estado o crear Usuario vinculado. Buscar, filtros, paginación, edición, cambio de contraseña y fotografía no vuelven a solicitarlo.

## Rediseño visual del modal Persona

- El modal reutilizable de Añadir/Editar Persona conserva su lógica y campos, pero ahora separa cabecera, cuerpo con scroll interno y footer para una jerarquía visual compacta.
- Añadir y Editar comparten avatar centrado, control de fotografía accesible con el input nativo visualmente oculto, formulario de dos columnas adaptable y footer separado; solo varían título, subtítulo, datos y texto de acción.
- Los inputs y selects usan radios, alturas, foco, superficies, bordes y estados de error basados en los tokens existentes. La implementación no añade paletas ni modifica los temas ORMAN, DÍA o NOCHE.
- El estilo visual se resolvió principalmente con utilidades Tailwind para mantener el CSS específico del componente dentro de su presupuesto de build.

## Refactor estructural de modales

- `PersonasListComponent` conserva la orquestación de listado, filtros, resumen, capacidades, HTTP, `ProblemDetail`, fotografías de cards y refrescos.
- Se extrajeron componentes standalone para formulario Crear/Editar, fotografía local, detalle, confirmación de estado, creación de Usuario y cambio de contraseña. Los hijos emiten intención mediante `input()`/`output()` y no inyectan `PersonaApiService`.
- La foto temporal de formulario administra su propio preview y revoca su object URL; las fotos descargadas de cards continúan bajo control de la página.
- No se creó modal genérico, servicio adicional, store ni un falso CRUD de Editar Usuario.

## Auditoría técnica y correcciones

- Se corrigió el menú de acciones móvil de las cards: el estado existía, pero el menú no se renderizaba y las acciones desktop estaban ocultas por debajo de `sm`.
- Los botones de acción basados solo en iconos ahora tienen nombre accesible y los indicadores de carga exponen su estado a tecnologías de asistencia.
- Los cinco modales gestionan foco inicial, focus trap, Escape y restauración del foco mediante una directiva local del feature. Durante una operación en curso no permiten cierre accidental.
- Las object URLs de fotografías descargadas se almacenan en un Signal con actualizaciones inmutables, de modo que su llegada notifica correctamente a la vista zoneless.
- Los filtros dejaron de usar `$any` en el template; los eventos se estrechan explícitamente en TypeScript.

## Validación visual y consistencia del formulario Persona

- `PersonaFormModalComponent` sigue siendo el único formulario para Añadir y Editar: `persona === null` crea y `persona !== null` edita, conservando el estado actual en el PUT completo.
- El formulario reactivo ahora valida CI, nombre no blanco, apellidos de hasta 40 caracteres, género, correo, teléfono y tipo de Persona. La validación de grupo exige al menos un apellido no blanco, sin convertir `ap` ni `am` en obligatorios individualmente.
- Los controles empiezan neutrales; tras interacción o submit muestran error inline, `aria-invalid` y `aria-describedby`. Los valores válidos usan un borde semántico de éxito y Correo muestra confirmación breve. Los `fieldErrors` de ProblemDetail se presentan inline para todos los campos del formulario y fotografía.
- La fotografía mantiene JPEG/PNG, 2 MiB, preview y revocación de object URL. Si el POST crea la Persona y falla la carga de foto, la página conserva la Persona creada, informa el resultado parcial y un reintento usa PUT de Persona/foto sin repetir POST. Al eliminar foto se actualizan en memoria la Persona seleccionada, el listado y la URL Blob sin un GET adicional.
- El modal usa tokens semánticos existentes de error, éxito, foco, superficies y bordes; no modifica `themes.css` ni `ThemeService`. La estructura es una columna en móvil y aprovecha dos columnas desde 640 px. La directiva de foco admite un selector inicial y enfoca CI sin perder focus trap, Escape ni retorno de foco.
- Revisión de tamaño: el template del modal (300 líneas) conserva una única responsabilidad de presentación accesible de campos y mensajes; `PersonasListComponent` (462 líneas) permanece como orquestador cohesivo de los cinco modales, HTTP, estado de página y la emisión puntual de éxito a través de `OrmanNotificationService`. No se realizó una extracción general ajena al alcance; la sincronización local de foto se mantiene como una operación acotada de esa orquestación.

## Corrección visual posterior del modal Persona

- La grilla de Datos personales integra Tipo de Persona junto a Género y conserva Apellidos en una fila de dos controles; la sección Clasificación aislada desaparece. Contacto mantiene Correo/Teléfono en columnas desde 640 px y una columna en móvil.
- `Cancelar` es ahora un botón secundario real con superficie, borde, padding, hover, foco visible y estado disabled basados en tokens semánticos.
- Se corrigió el renderizado de `close` y `photo_camera`: `src/index.html` ya carga Material Symbols Rounded y cada CSS encapsulado que contiene `mat-icon` aplica la familia, ligaduras y variaciones tipográficas requeridas. No se ocultaron nombres de iconos ni se añadieron dependencias.
- Los desplegables nativos de Género y Tipo de Persona heredan el `color-scheme` activo y aplican los tokens de superficie y texto a las opciones que el navegador permite estilizar, sin reemplazar el control accesible nativo.
- En modo Añadir, Género y Tipo de Persona comienzan vacíos para exigir una selección explícita; en modo Editar se precargan desde la Persona recibida.

## Notificaciones globales del área privada

- Se integró `ngx-sonner` 3.1.0, cuya metadata publicada declara licencia MIT y peers `@angular/common` / `@angular/core` `>=19.0.0`; es compatible con Angular 22.0.7 sin forzar dependencias ni añadir `@angular/animations`.
- `OrmanNotificationService`, provisto en raíz, encapsula `ngx-sonner` y expone `success`, `info`, `warning`, `error` y `dismiss`. Los features no importan `toast` directamente.
- El único host `NgxSonnerToaster` vive en `PrivateLayout`, por lo que persiste entre rutas privadas. Su tema se deriva del Signal de `ThemeService`: DÍA usa `light`; ORMAN y NOCHE usan `dark`.
- Sonner consume variables semánticas de ORMAN para superficies, texto, bordes, foco, sombras y los cuatro tipos de notificación. Se completaron los tokens de advertencia e información sin modificar los temas existentes.
- Crear y Editar Persona notifican únicamente después de completar el flujo confirmado. El fallo de fotografía posterior al POST mantiene su alerta contextual y reintento sin toast de éxito ni repetición de POST; `fieldErrors` continúa inline sin toast duplicado.

## Mejora integral del Detalle de Persona

- La cabecera del modal ahora funciona como perfil administrativo: muestra la Object URL de la fotografía protegida cuando está disponible y usa iniciales como fallback, junto con nombre, tipo y estado.
- La información se presenta en las tres secciones solicitadas —Información personal, Información de contacto e Información del sistema— usando únicamente campos existentes de `Persona`; no se agregaron contratos, propiedades, pagos ni datos derivados nuevos.
- `PersonasListComponent` continúa siendo el único responsable de solicitar fotografías mediante `PersonaApiService.getFoto()`, crear/revocar Object URLs y notificar su llegada mediante Signal. `PersonaDetailModalComponent` solo recibe `imageUrl` y permanece sin HTTP.
- La vista de impresión es un `print-sheet` separado del modal, con marca ORMAN, título FICHA DE PERSONA, fotografía o iniciales, datos agrupados y `@page { size: letter; }`. En impresión se oculta el overlay y la ficha cubre el contenido restante de la pantalla.
- El modal tiene cabecera/footer fijos, cuerpo con scroll interno, límites de altura y una grilla que pasa a una columna en móvil. Los iconos usan Material Symbols Rounded y los estados reutilizan tokens semánticos de ORMAN, DÍA y NOCHE.

### Archivos modificados en esta iteración

- `src/app/features/personas/components/persona-detail-modal/persona-detail-modal.component.ts`
- `src/app/features/personas/components/persona-detail-modal/persona-detail-modal.component.html`
- `src/app/features/personas/components/persona-detail-modal/persona-detail-modal.component.css`
- `src/app/features/personas/components/persona-detail-modal/persona-detail-modal.component.spec.ts`
- `src/app/features/personas/pages/personas-list/personas-list.component.html`
- `src/app/features/personas/pages/personas-list/personas-list.component.spec.ts`

La hoja CSS del detalle conserva una responsabilidad cohesiva de presentación de modal y ficha impresa; aunque supera 300 líneas, dividirla introduciría estilos acoplados a un componente visual único sin mejorar la lectura ni la reutilización.

## Iteración posterior: impresión y distribución responsive

- La regla de impresión del listado ya no oculta `:host`; oculta únicamente la sección normal del listado para que el `print-sheet` descendiente pueda renderizarse.
- La ficha impresa conserva formato carta, usa superficie blanca y texto negro sin depender del tema activo, mantiene la fotografía o iniciales y permite overflow visible para evitar recortes.
- La cabecera del modal concentra nombre, tipo y estado. La sección personal conserva CI y Género; Contacto e Información del sistema conservan sus campos propios sin repetir esos datos.
- `details-layout` usa una columna por defecto y dos columnas desde 768 px. El panel usa `max-height` relativo al viewport y el cuerpo conserva scroll cuando la altura disponible o el zoom lo requieren.
- No se modificaron modelos, servicios, endpoints, autenticación ni el ciclo de vida de Object URLs.

### Validación de esta iteración

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos y 174 pruebas aprobadas.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 89.28 kB. Permanecen advertencias de presupuesto CSS en `persona-detail-modal.component.css` (5.43 kB frente a 4.00 kB) y `personas-list.component.css` (7.52 kB frente a 4.00 kB), sin errores de compilación.
- `git diff --check`: correcto. `package-lock.json` no cambió.

## Corrección final: conservación del diseño aprobado

- Se restauró la presentación de las tres tarjetas apiladas del detalle. No se mantiene la redistribución completa en dos columnas porque no forma parte del diseño aprobado.
- Se conservan la cabecera de perfil, los iconos Material Symbols Rounded, los tokens de temas, la fotografía Blob/Object URL, el focus trap y el cierre mediante Escape.
- La corrección de impresión permanece acotada al selector `@media print` del listado y al `print-sheet`; no se añadieron rutas, módulos, servicios ni contratos.

### Validación final registrada

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos y 175 pruebas aprobadas.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 88.95 kB. Persisten advertencias de presupuesto CSS en `persona-detail-modal.component.css` (5.24 kB frente a 4.00 kB) y `personas-list.component.css` (7.52 kB frente a 4.00 kB), sin errores.
- `git diff --check`: correcto. `package-lock.json` no cambió.
- El servidor Angular compiló correctamente en `127.0.0.1:4201`, pero no se pudo completar la verificación visual manual porque no hubo navegador integrado disponible en la sesión.

## Ajuste puntual del encabezado de impresión

- Se incrementó de `1.5rem` a `1.7rem` el tamaño de la identidad textual `ORMAN` dentro de `print-sheet`.
- Se agregó `padding-inline-start: 0.35cm` al encabezado impreso para separarlo del borde de la hoja; como `ORMAN` y `FICHA DE PERSONA` comparten el mismo bloque, ambos conservan la alineación.
- No se modificaron la estructura de datos, el modal visual, la fotografía, la función `window.print()` ni los estilos generales responsive.

## Incorporación del logo oficial en impresión

- Se reemplazó el texto institucional del encabezado por `<img src="/images/brand/orman-logo.svg">`, siguiendo la ruta pública ya utilizada por ORMAN.
- El recurso SVG conserva calidad vectorial al imprimir o guardar como PDF y no depende de fondos ni colores del tema.
- El tamaño se fijó en `1.8cm` de alto y el encabezado mantiene `0.35cm` de separación lateral; el título permanece debajo y alineado con el logo.
- La prueba del componente verifica la ruta y el texto alternativo del logo.

## Iteración posterior: ampliación institucional de la ficha impresa

- El encabezado conserva el logo oficial y agrega la palabra `ORMAN` a su lado; `FICHA DE PERSONA` permanece debajo dentro del mismo bloque compacto.
- Información del sistema incorpora el valor existente `persona.codper` y conserva Estado, Usuario y Fecha de registro en una grilla de cuatro datos.
- Se añadió el pie `ORMAN · Gestión de Personas` y la leyenda `Ficha generada el DD/MM/YYYY`.
- La fecha se obtiene con `new Date()` al crear la ficha y se presenta mediante el `DatePipe` existente, sin fecha fija ni modificación de `window.print()`.
- El pie y el texto institucional usan estilos discretos y reglas de impresión independientes del tema; la hoja continúa siendo carta, blanca y de texto oscuro.

### Validación de esta iteración

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos; 172 pruebas aprobadas y 3 fallas preexistentes de `OrmanNotificationService` por mocks de `ngx-sonner`.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 90.14 kB. Persisten advertencias de presupuesto CSS en `persona-detail-modal.component.css` (5.73 kB frente a 4.00 kB) y `personas-list.component.css` (7.52 kB frente a 4.00 kB), sin errores.
- El SVG responde correctamente desde `/images/brand/orman-logo.svg` y se copia al build bajo `browser/images/brand/orman-logo.svg`.
- `git diff --check`: correcto. `package-lock.json` no cambió.

## Iteración posterior: mejora UX del modal compartido de estado

- `PersonaStatusConfirmModalComponent` continúa siendo el único modal para activar y desactivar Personas; conserva únicamente los outputs `confirmed` y `closed`.
- Se añadió el input requerido `personaName`, alimentado por `fullName(persona)` desde `PersonasListComponent`, sin solicitud HTTP ni datos adicionales.
- `operation()` determina `person_off` y tono de peligro para desactivar, o `restore` y tono de éxito para reactivar. También determina los títulos, mensajes, acciones y etiquetas de carga aprobados.
- El modal mantiene el foco inicial en Cancelar, focus trap, Escape, retorno de foco y bloqueo de cierre durante `submitting`; ahora asocia el mensaje con `aria-describedby` y expone `aria-busy`.
- La presentación usa tokens de ORMAN/DÍA/NOCHE, mantiene el tamaño compacto y añade scroll defensivo para poca altura y una disposición vertical de botones en pantallas muy pequeñas.
- No se modificaron endpoints, servicios, permisos, fotografías, backend ni la lógica `submitStatus()`.

### Validación de esta iteración

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos y 177 pruebas aprobadas.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 93.92 kB. Persisten advertencias de presupuesto CSS en `persona-detail-modal.component.css` (5.73 kB frente a 4.00 kB) y `personas-list.component.css` (7.52 kB frente a 4.00 kB), sin errores.
- `git diff --check`: correcto. `package-lock.json` no cambió.

## Pruebas y validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 26 archivos y 133 pruebas aprobadas.
- `npm run build`: correcto; 333.85 kB iniciales brutos y Personas como chunk lazy de 51.80 kB brutos.
- `git diff --check`: correcto.
- Iteración de validación del formulario: `npx tsc -p tsconfig.app.json --noEmit` correcto; `npm test -- --watch=false` con 26 archivos y 161 pruebas aprobadas; `npm run build` correcto (341.12 kB iniciales brutos y Personas como chunk lazy de 78.74 kB). El build conserva una advertencia preexistente de presupuesto CSS en `personas-list.component.css`, que no fue ampliado.

## Validación de notificaciones

- `npx tsc --noEmit -p tsconfig.app.json` correcto; `npm test -- --watch=false` con 27 archivos y 167 pruebas aprobadas; `npm run build` correcto (353.48 kB iniciales brutos y Personas como chunk lazy de 79.57 kB).
- `git diff --check` correcto. `ng serve --host 127.0.0.1 --port 4201` compiló correctamente, sin errores de Vite, Angular o `ngx-sonner`.
- La sesión no dispuso de Browser para QA visual. La verificación estática confirma que el host usa tokens de tema y que Sonner respeta `prefers-reduced-motion`.

## Validación de la ficha administrativa

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 27 archivos y 173 pruebas aprobadas.
- `npm run build`: correcto; 353.48 kB iniciales brutos y Personas como chunk lazy de 89.53 kB. El build conserva advertencias de presupuesto CSS en `persona-detail-modal.component.css` y `personas-list.component.css`, sin errores de compilación.
- `git diff --check`: correcto.
- `package-lock.json` no cambió. No se añadieron endpoints, DTOs, dependencias, servicios de fotografía ni llamadas HTTP al componente visual.

## Pendientes / bloqueo de cierre

La validación manual con Browser confirmó el modal de Añadir inicialmente neutral, con foco en CI, y sus mensajes inline tras un submit inválido; también confirmó la precarga en Editar y la aplicación de los tres temas. La comprobación semántica en 360 px mostró la variante móvil del listado y el modal abierto, pero la medición geométrica no respondió antes del límite del navegador; queda pendiente una revisión visual exhaustiva de todos los breakpoints antes de marcar la Fase como `COMPLETADA`.

## Riesgos

La regla de al menos un apellido queda aplicada por ahora solo en Angular; debe replicarse posteriormente en Backend para proteger solicitudes externas a la interfaz.

El contrato entregado no especifica el cuerpo exitoso del endpoint de foto ni el DTO de creación de Usuario. La implementación solo depende de la respuesta enriquecida de Persona cuando existe y recarga el listado para mantener consistencia.
