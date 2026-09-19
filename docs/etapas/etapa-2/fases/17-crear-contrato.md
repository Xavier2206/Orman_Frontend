# Fase 17 — Crear Contrato

## Estado

`COMPLETADA`, implementada el 2026-09-16.

## Objetivo

Implementar el alta de un contrato desde el frontend, respetando los contratos
Backend existentes y el patrón visual administrativo de ORMAN.

## Alcance

- Ruta privada `/app/contratos/nuevo` y acceso desde `Nuevo contrato` en el listado.
- Selección de Propiedad y carga dependiente de sus Unidades operativas.
- Búsqueda paginada de Personas activas de tipo `I` (inquilino), mostrando nombre
  completo y CI.
- Periodo de inicio mensual con duraciones de 1, 6, 12 y 24 meses; fecha final
  calculada automáticamente al primer día del mes siguiente al periodo.
- Validación frontend de campos requeridos, alquiler positivo y garantía no
  negativa, además de una vista previa informativa del periodo y cuotas.
- Envío del alta al endpoint confirmado `POST
  /api/v1/unidades/{coduni}/contratos` y manejo de errores 400, 403, 404, 409 y
  422.
- Responsive para móvil, tablet y escritorio, con tokens del sistema y
  componentes standalone para selección de ubicación, selección de inquilino y
  vista previa.

## Exclusiones

No se modificó Backend, entidades, migraciones, reglas de negocio, estado de
contratos, cuotas reales, pagos, recibos, notificaciones de dominio, edición,
renovación, finalización ni rescisión. La vista previa no genera cuotas y no
realiza peticiones adicionales para calcularlas.

## Contratos confirmados y decisiones

- El cuerpo `ContratoCreateRequest` contiene `codperInquilino`, `fechaInicio`,
  `fechaFin`, `montoMensual` y `garantia`.
- La selección de propiedades reutiliza `PropiedadApiService`; las unidades se
  consultan mediante `UnidadApiService.listByProperty` con estado operativo
  habilitado.
- La búsqueda reutiliza `PersonaApiService.list` con `tipoPersona=I` y
  `estado=1`, y conserva la verificación de esos campos en el resultado.
- Las cuotas informativas se derivan de la duración seleccionada. No se
  persisten ni se solicita ningún endpoint de cuotas.
- El formulario calcula el fin en UTC al primer día del mes posterior al
  periodo. Para 12 meses desde octubre de 2026 envía inicio `2026-10-01`, fin
  `2027-10-01`, y presenta cuotas desde octubre de 2026 hasta septiembre de
  2027.
- El botón `Crear contrato` permanece utilizable para que la pantalla muestre
  validaciones inline; el envío se detiene si falta unidad, inquilino, periodo
  válido o importes.
- La notificación global de éxito reutiliza `OrmanNotificationService`; el
  manejo de errores permanece inline en la vista previa.

## Archivos creados

- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.ts`
- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.html`
- `src/app/features/contratos/components/contrato-create-preview/contrato-create-preview.component.css`
- `src/app/features/contratos/components/contrato-location-picker/contrato-location-picker.component.ts`
- `src/app/features/contratos/components/contrato-location-picker/contrato-location-picker.component.html`
- `src/app/features/contratos/components/contrato-location-picker/contrato-location-picker.component.css`
- `src/app/features/contratos/components/contrato-tenant-picker/contrato-tenant-picker.component.ts`
- `src/app/features/contratos/components/contrato-tenant-picker/contrato-tenant-picker.component.html`
- `src/app/features/contratos/components/contrato-tenant-picker/contrato-tenant-picker.component.css`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.ts`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.html`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.css`
- `src/app/features/contratos/pages/contrato-create/contrato-create.component.spec.ts`
- `src/app/features/contratos/utils/contrato-period.ts`
- `src/app/features/contratos/utils/contrato-period.spec.ts`

## Archivos modificados

- `src/app/app.routes.ts`
- `src/app/features/contratos/data/contrato-api.service.ts`
- `src/app/features/contratos/data/contrato-api.service.spec.ts`
- `src/app/features/contratos/models/contrato.model.ts`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.ts`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.html`
- `src/app/features/contratos/pages/contratos-list/contratos-list.component.spec.ts`
- `src/app/features/contratos/README.md`
- `docs/PlanGeneral.md`
- `docs/CHANGELOG.md`
- `docs/etapas/etapa-2/fases/README.md`

Al iniciar esta fase ya existían cambios locales relacionados con el listado,
el resumen y el modelo/servicio de Contratos. Se conservaron; el acceso `Nuevo
contrato` y la operación `create` se integraron sobre esos archivos sin
descartar cambios previos. `package-lock.json` no cambió.

## Pruebas y validaciones

- Pruebas focalizadas de alta, periodo y servicio: 3 archivos, 12 pruebas
  aprobadas.
- Suite completa: 69 archivos; 503 pruebas aprobadas y 3 fallos en
  `src/app/core/notifications/orman-notification.service.spec.ts`. Esa suite
  no pertenece al alcance de la fase ni sus archivos fueron modificados.
- `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- `npm run build`: correcto. Permanecen advertencias de presupuesto CSS en
  hojas existentes del proyecto y advertencias CommonJS de dependencias.
- `git diff --check`: correcto; Git reporta únicamente avisos de conversión
  LF/CRLF de archivos del working tree.
- No se modificó código Backend.

## Revisión de mantenibilidad

La page coordina formulario, preview y envío; los catálogos dependientes,
búsqueda de inquilinos y presentación de la vista previa quedaron separados en
componentes standalone cohesivos. El cálculo mensual es una función pura con
pruebas de límites de calendario. Los templates y estilos mantienen formato
legible y no se introdujo `any` ni dependencia nueva.

## Riesgos y pendientes

- Los tres tests de `OrmanNotificationService` fallaron durante la última
  ejecución completa. No se modificaron ni se cambiaron como parte de esta
  fase; las pruebas focalizadas del alta pasaron.
- El Backend continúa siendo la fuente final de validación del periodo y de
  reglas de negocio.

## Resultado

La pantalla de alta queda implementada y conectada al endpoint Backend
confirmado. La fase queda lista para revisión y cierre Git manual.

## Ajuste visual de distribución — 2026-09-16

La pantalla aprovecha el ancho del área privada con el mismo máximo de
`1500px` que Añadir Propiedad. Desde `64rem`, presenta formulario y resumen en
columnas `1.85fr / 1fr` (aprox. 65/35, con 18rem mínimos para la columna
secundaria); por debajo los apila y evita anchos mínimos fijos en el contenido.
El selector mensual adapta sus tres campos al ancho disponible, y las
condiciones económicas permanecen agrupadas en dos columnas cuando hay espacio.

La vista previa permanece dinámica y ahora presenta sus datos en una tarjeta
resumen compacta, incluida la cantidad informativa de cuotas previstas. La
selección visual del inquilino identifica estado activo y tipo inquilino, datos
ya garantizados por los filtros y verificaciones existentes. Se añadió una
zona ilustrativa para PDF con aviso de integración futura; no tiene input,
arrastre, carga ni llamadas nuevas. Cancelar y Crear contrato quedaron al pie
de ambas columnas. No se alteraron formularios, validaciones, periodo, payload,
servicios, endpoints ni reglas de negocio.

### Validación de la mejora visual

- `npm test -- --include src/app/features/contratos/pages/contrato-create/contrato-create.component.spec.ts`:
  1 archivo y 5 pruebas aprobadas.
- Suite completa `npm test`: 69 archivos, 503 pruebas aprobadas y 3 fallos en
  `OrmanNotificationService`, fuera del alcance de esta mejora.
- `npm run build`: correcto. Se mantienen avisos de presupuesto CSS y módulos
  CommonJS; las hojas locales de alta de Contrato e Inquilino superan el
  presupuesto CSS configurado.
- Inspección visual del navegador en escritorio; los breakpoints de
  apilamiento se verificaron en estilos y estructura, sin cambiar datos del
  formulario abierto.
- No se modificó Backend ni se implementó carga real de archivos.
