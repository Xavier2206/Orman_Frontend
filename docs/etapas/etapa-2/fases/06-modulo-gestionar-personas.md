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

## Pruebas y validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm test -- --watch=false`: 26 archivos y 133 pruebas aprobadas.
- `npm run build`: correcto; 333.85 kB iniciales brutos y Personas como chunk lazy de 51.80 kB brutos.
- `git diff --check`: correcto.

## Pendientes / bloqueo de cierre

La validación obligatoria con Browser no pudo iniciarse: el runtime indicó literalmente que no hay navegador disponible. Por ello no se afirma validación visual en 1440/1366/1280/1024/768/429/360, temas ni flujos autenticados; tampoco se puede cerrar esta fase como `COMPLETADA` todavía.

## Riesgos

El contrato entregado no especifica el cuerpo exitoso del endpoint de foto ni el DTO de creación de Usuario. La implementación solo depende de la respuesta enriquecida de Persona cuando existe y recarga el listado para mantener consistencia.
