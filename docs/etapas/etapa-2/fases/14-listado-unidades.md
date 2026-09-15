# Fase 14 — Listado de Unidades

## Estado

`COMPLETADA`

## Nombre y objetivo

Implementar exclusivamente el listado del módulo Unidades en `/app/unidades/listar`, permitiendo
seleccionar una propiedad real y consultar sus unidades con paginación, estados visuales y datos
limitados al contrato Backend confirmado.

## Alcance

- Registrar la ruta privada lazy de Unidades como hermana de Propiedades.
- Reutilizar `PropiedadApiService` para cargar el catálogo completo de propiedades, recorriendo sus
  páginas con el tamaño máximo soportado de 100.
- Consultar las unidades de la propiedad seleccionada mediante `GET
  /api/v1/propiedades/{codprop}/unidades`, con página, tamaño 20 y orden `nombre,asc`.
- Mostrar selector nativo accesible, estado inicial, skeletons, cards, vacío, error con reintento y
  paginación real.
- Mantener compatibilidad visual con ORMAN, DÍA y NOCHE y con el layout privado responsive.
- Añadir pruebas para servicio HTTP, card y page.

## Exclusiones

No se implementaron creación, edición, detalle funcional, fotografías, galería, disponibilidad,
ocupación, inquilino actual, resumen, búsquedas, filtros, alta, CTA, acciones por card,
activar/desactivar, eliminar, nuevos contratos, endpoints ni cambios Backend. Los placeholders de
fotografías y las carpetas futuras de detalle/formulario/galería/estado se conservaron sin cambios.

## Dependencias y fuentes de verdad

- `AGENTS.md`, `docs/PlanGeneral.md`, `docs/CHANGELOG.md` y la documentación de Propiedades fueron
  revisados antes de modificar código.
- `PropiedadApiService` y `Propiedad` son la fuente frontend existente para el selector.
- El contrato confirmado de unidades es `PageResponse<UnidadResponse>` desde
  `GET /api/v1/propiedades/{codprop}/unidades`, con `page`, `size` y `sort`.
- `UnidadResponse` contiene exactamente `coduni`, `codprop`, `nombre`, `tipoUnidad`, `descripcion`,
  `area`, `dormitorios`, `banos`, `piso`, `ubicacionInterna`, `precioBase` y `estadoOperativo`.

## Archivos creados

- `src/app/features/unidades/components/unidad-card/unidad-card.component.ts`
- `src/app/features/unidades/components/unidad-card/unidad-card.component.html`
- `src/app/features/unidades/components/unidad-card/unidad-card.component.css`
- `src/app/features/unidades/components/unidad-card/unidad-card.component.spec.ts`
- `src/app/features/unidades/data/unidad-api.service.spec.ts`
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.ts`
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.html`
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.css`
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.spec.ts`
- Este documento.

## Archivos modificados

- `src/app/app.routes.ts`: ruta lazy privada `unidades/listar`.
- `src/app/features/unidades/data/unidad-api.service.ts`: método tipado `listByProperty`.
- `src/app/features/unidades/models/unidad.model.ts`: interfaz `UnidadResponse` exacta.
- `docs/PlanGeneral.md`, `docs/CHANGELOG.md`, `docs/README.md` y el índice de fases.

No se modificaron `fotografia-api.service.ts`, `fotografia.model.ts`, Sidebar, Backend,
`package.json` ni `package-lock.json`.

## Decisiones técnicas

- El catálogo de propiedades se carga con `PropiedadApiService` y `expand`/`reduce` para no asumir
  que la primera página contiene todas las propiedades. Se solicita tamaño 100, el máximo permitido.
- La carga de unidades usa `Subject` + `switchMap`; cambiar de propiedad o página cancela la
  solicitud anterior y evita renderizar una respuesta obsoleta.
- El listado no agrega filtros ni parámetros de transporte fuera de los confirmados. La propiedad
  permanece como única selección de contexto.
- El estado `estadoOperativo === 1` se presenta como `OPERATIVA`; cualquier otro valor se presenta
  como `NO OPERATIVA`, según la regla visual solicitada.
- Área y precio reutilizan el formato boliviano existente. La card solo presenta campos presentes
  en `UnidadResponse`; los campos nullable se ocultan cuando no tienen valor.
- Los errores de lectura se muestran inline con detalle `ProblemDetail` cuando existe y botón de
  reintento. No se agregó toast porque esta fase no ejecuta mutaciones y el patrón de lectura
  contextual ya existe en el módulo Propiedades.
- Se usaron tokens de tema y utilidades Tailwind existentes, sin agregar librerías UI, tokens
  globales ni estilos inline.

## Implementación

`UnidadesListComponent` carga el catálogo de propiedades al iniciar y mantiene Signals para la
selección, propiedad derivada, estados de carga/error y página de unidades. Al seleccionar una
propiedad solicita la página cero; los controles Anterior/Siguiente envían la página siguiente sin
alterar la propiedad ni el orden. La vista inicial no solicita unidades, el vacío usa el texto
confirmado y la grilla responsive muestra una `UnidadCardComponent` por registro.

La card muestra tipo, estado, nombre, ubicación interna y descripción opcionales, área,
dormitorios, baños, piso y precio base. No muestra ocupación, disponibilidad, inquilinos,
fotografías ni acciones.

Todos los archivos de código nuevos o modificados se revisaron por formato y responsabilidad. No
hay archivos mantenidos por esta fase de 300 líneas o más; no fue necesaria una segmentación
adicional.

## Pruebas

- `src/app/features/unidades/data/unidad-api.service.spec.ts`: endpoint, método, página, tamaño y
  orden confirmados.
- `src/app/features/unidades/components/unidad-card/unidad-card.component.spec.ts`: campos reales,
  estado operativo/no operativo y omisión de valores opcionales/datos de ocupación.
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.spec.ts`: estado inicial,
  recorrido de propiedades paginadas, selección, carga real, vacío, error/reintento, paginación,
  reset de página y cancelación por cambio de propiedad.

Resultado focalizado: 3 archivos, 13 pruebas aprobadas.

Resultado de suite completa: 57 archivos, 415 pruebas aprobadas de 418. Los 3 fallos están en
`src/app/core/notifications/orman-notification.service.spec.ts` y reproducen el fallo preexistente
de `OrmanNotificationService`; no pertenecen al alcance de esta fase.

## Validaciones

- Typecheck: `npx tsc --noEmit -p tsconfig.app.json` — correcto.
- Build: `npm run build` — correcto. Se conservan advertencias históricas de presupuesto CSS y
  dependencias CommonJS; no apareció warning nuevo de Unidades.
- Prettier sobre los archivos modificados/creados — correcto.
- `git diff --check` — correcto.
- Browser autenticado: `/app/unidades/listar` se abrió por navegación del Sidebar y mostró el
  enlace UNIDADES activo, selector real de propiedades, estado inicial, una unidad real con sus
  campos, estado vacío y reintentos cubiertos por pruebas. ORMAN, DÍA y NOCHE se visualizaron y
  ORMAN quedó restaurado.
- Viewports exactos solicitados: `Validación Browser pendiente`. La sesión CUA disponible permitió
  inspección visual de escritorio, pero no expuso control para fijar `320`, `360`, `390`, `430`,
  `768`, `1280`, `1366`, `1440`, `1600`, `1920` y `2000 px` de forma reproducible.

## Riesgos y pendientes

- La validación visual exacta por viewport queda pendiente y debe repetirse cuando esté disponible
  una herramienta de navegador con control de tamaño.
- Las operaciones de gestión de unidades siguen pendientes de contrato Backend y autorización de
  una fase futura.
- El build mantiene warnings de presupuesto CSS/CommonJS históricos del proyecto.
- `package-lock.json` no cambió.

## Resultado final

El listado de Unidades quedó implementado dentro del alcance autorizado, conectado a los contratos
reales confirmados, con estados y paginación, cobertura focalizada y sin cambios en Backend,
Sidebar, dependencias ni operaciones Git. La fase está lista para cierre Git manual.
