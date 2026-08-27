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
- Revisión de tamaño: el template del modal (300 líneas) conserva una única responsabilidad de presentación accesible de campos y mensajes; `PersonasListComponent` (457 líneas) permanece como orquestador ya existente de los cinco modales, HTTP y estado de página. No se realizó una extracción general ajena al alcance; la sincronización local de foto se mantiene como una operación acotada de esa orquestación.

## Corrección visual posterior del modal Persona

- La grilla de Datos personales integra Tipo de Persona junto a Género y conserva Apellidos en una fila de dos controles; la sección Clasificación aislada desaparece. Contacto mantiene Correo/Teléfono en columnas desde 640 px y una columna en móvil.
- `Cancelar` es ahora un botón secundario real con superficie, borde, padding, hover, foco visible y estado disabled basados en tokens semánticos.
- Se corrigió el renderizado de `close` y `photo_camera`: `src/index.html` ya carga Material Symbols Rounded y cada CSS encapsulado que contiene `mat-icon` aplica la familia, ligaduras y variaciones tipográficas requeridas. No se ocultaron nombres de iconos ni se añadieron dependencias.
- Los desplegables nativos de Género y Tipo de Persona heredan el `color-scheme` activo y aplican los tokens de superficie y texto a las opciones que el navegador permite estilizar, sin reemplazar el control accesible nativo.
- En modo Añadir, Género y Tipo de Persona comienzan vacíos para exigir una selección explícita; en modo Editar se precargan desde la Persona recibida.

## Pruebas y validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 26 archivos y 133 pruebas aprobadas.
- `npm run build`: correcto; 333.85 kB iniciales brutos y Personas como chunk lazy de 51.80 kB brutos.
- `git diff --check`: correcto.
- Iteración de validación del formulario: `npx tsc -p tsconfig.app.json --noEmit` correcto; `npm test -- --watch=false` con 26 archivos y 161 pruebas aprobadas; `npm run build` correcto (341.12 kB iniciales brutos y Personas como chunk lazy de 78.74 kB). El build conserva una advertencia preexistente de presupuesto CSS en `personas-list.component.css`, que no fue ampliado.

## Pendientes / bloqueo de cierre

La validación manual con Browser confirmó el modal de Añadir inicialmente neutral, con foco en CI, y sus mensajes inline tras un submit inválido; también confirmó la precarga en Editar y la aplicación de los tres temas. La comprobación semántica en 360 px mostró la variante móvil del listado y el modal abierto, pero la medición geométrica no respondió antes del límite del navegador; queda pendiente una revisión visual exhaustiva de todos los breakpoints antes de marcar la Fase como `COMPLETADA`.

## Riesgos

La regla de al menos un apellido queda aplicada por ahora solo en Angular; debe replicarse posteriormente en Backend para proteger solicitudes externas a la interfaz.

El contrato entregado no especifica el cuerpo exitoso del endpoint de foto ni el DTO de creación de Usuario. La implementación solo depende de la respuesta enriquecida de Persona cuando existe y recarga el listado para mantener consistencia.
