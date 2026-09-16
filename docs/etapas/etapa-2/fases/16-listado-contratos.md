# Fase 16 — Listado de Contratos

## Estado

`COMPLETADA`, implementada el 2026-09-15.

## Objetivo

Implementar exclusivamente `/app/contratos/listar` con listado paginado,
filtros compatibles con Backend, resumen de estados, cards responsive y
acciones administrativas representadas únicamente mediante iconos.

## Alcance

- Modelo y servicio para `GET /api/v1/contratos`.
- Filtros `codprop`, `coduni` y `estado`, con relación dependiente
  Propiedad → Unidad y cancelación de solicitudes anteriores mediante
  `switchMap`.
- Catálogo paginado de Propiedades y catálogo de Unidades cargado únicamente
  después de seleccionar una Propiedad.
- Resumen global de `PROGRAMADO`, `VIGENTE`, `FINALIZADO` y `RESCINDIDO`.
- Cards inline, en una columna móvil y dos columnas desde `md`, siguiendo el
  patrón visual ya aprobado del listado de Personas.
- Skeleton, estado vacío, error con `ProblemDetail`, reintento y paginación.
- Acciones de ver, registrar pago, finalizar y rescindir como iconos con
  `title`, tooltip y `aria-label`.

## Exclusiones

No se implementaron detalle, alta, edición, modales funcionales de finalizar
o rescindir, registro de pagos, archivos, recibos, scheduler, notificaciones
de dominio ni pantallas independientes de cuotas.

## Contrato Backend confirmado

El Backend actual expone:

- `GET /api/v1/contratos` con `codprop`, `coduni`, `estado`, `page`, `size` y
  `sort`.
- `GET /api/v1/propiedades` para el catálogo paginado de Propiedades y
  `GET /api/v1/propiedades/{codprop}/unidades` para el catálogo dependiente de
  Unidades.
- `ContratoResponse` con `codcon`, `coduni`, `codperInquilino`, fechas,
  `montoMensual`, `moneda`, `garantia`, `estado` y datos de registro/rescisión.
- Los estados son únicamente `PROGRAMADO`, `VIGENTE`, `FINALIZADO` y
  `RESCINDIDO`.

El response no contiene nombre/CI del inquilino, nombre de propiedad,
ubicación descriptiva ni cuotas/saldos. Por esa razón la UI identifica
inquilino y unidad mediante sus códigos, no muestra cuotas y no crea
peticiones adicionales por contrato. Tampoco existe búsqueda libre ni
endpoint de resumen; los cuatro totales se calculan solicitando una página de
tamaño 1 por estado, aprovechando `totalElements`.

## Archivos creados

- `src/app/features/contratos/models/contrato.model.ts`
- `src/app/features/contratos/data/contrato-api.service.ts`
- `src/app/features/contratos/data/contrato-api.service.spec.ts`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.ts`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.html`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.css`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.spec.ts`

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/features/contratos/README.md`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`

## Decisiones

- No se añadió un parámetro `q`: el controlador Backend no lo acepta.
- Se reutilizaron `PropiedadApiService` y `UnidadApiService`; no se crearon
  endpoints ni servicios duplicados.
- El botón `Nuevo contrato` y las acciones de las cards quedan deshabilitados
  para no navegar a rutas inexistentes ni simular operaciones todavía fuera
  de alcance.
- La card se mantiene inline dentro de la page, como en Personas; no se crea
  un componente visual independiente sin una responsabilidad reutilizable.
- El resumen evita recorrer páginas completas y falla de forma independiente
  del listado.
- No se modificó `src/app/features/pagos/` ni se añadieron dependencias.

## Validaciones

- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- Pruebas focalizadas: 2 archivos, 10 aprobadas, 0 fallos.
- `npm run build`: correcto; permanecen advertencias históricas de presupuesto
  CSS y dependencias CommonJS.
- Suite completa `npm test -- --watch=false`: 67 archivos, 490 aprobadas,
  3 fallos. Los tres fallos pertenecen a
  `src/app/core/notifications/orman-notification.service.spec.ts` y no fueron
  introducidos por esta fase.
- `git diff --check`: correcto.

## Revisión de mantenibilidad

La page TypeScript, su template y su hoja de estilos superan individualmente
las 300 líneas por concentrar el flujo completo de un listado: consulta
paginada, resumen, filtros accesibles, catálogos dependientes, estados
visuales, card inline y paginación. La responsabilidad sigue siendo cohesiva;
dividir el flujo de filtros en componentes o capas sin reutilización real
empeoraría su lectura y aumentaría la superficie de cambios. No se modificó la
page de Personas.

## Riesgos y pendientes

- Para una tarjeta administrativa completa se requiere que Backend entregue
  datos descriptivos del inquilino, propiedad/unidad y un resumen de cuotas;
  queda `PENDIENTE EN BACKEND`.
- La búsqueda libre solicitada queda pendiente de un parámetro Backend
  confirmado.
- La ejecución completa no queda totalmente verde por los tres fallos
  históricos de notificaciones.

## Resultado

El listado solicitado queda implementado sin adelantar pantallas de detalle,
alta, pagos o terminación funcional. La fase queda lista para revisión y
cierre Git manual.
