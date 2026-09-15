# Fase 15 — Compactación y acciones de Unidades

## Estado

`COMPLETADA`

## Objetivo

Aplicar una mejora puntual sobre el listado existente de Unidades: reducir la altura de sus cards,
retirar la descripción únicamente del render del listado y añadir las acciones visuales Editar y
Ver detalle sin implementar todavía sus pantallas ni rutas funcionales.

## Auditoría inicial

- Se revisaron `UnidadesListComponent`, `UnidadCardComponent`, su HTML, CSS y pruebas.
- Se auditó `src/app/app.routes.ts`; solo existe `/app/unidades/listar`. No existen
  `/app/unidades/:coduni/editar` ni `/app/unidades/:coduni/detalle`.
- Se revisaron `PropiedadCardComponent` y su listado como referencia de footer, separadores,
  iconos, estados hover/focus y outputs de acciones. Propiedades no fue modificado.
- El estado Git contenía los cambios locales de la Fase 14; se conservaron y esta fase solo añade
  cambios en Unidades y documentación obligatoria.

## Alcance y exclusiones

Se modificaron exclusivamente la presentación y pruebas de la card de Unidad, el comportamiento
visual del grid y la documentación de la fase. No se tocaron selector, carga de propiedades,
endpoint, paginación, estados, modelo, servicio, Backend ni contratos. No se implementaron
formularios, detalle, fotografías, eliminación, activar/desactivar, búsqueda, filtros, resumen ni
botón Añadir Unidad.

## Archivos modificados

- `src/app/features/unidades/components/unidad-card/unidad-card.component.ts`: outputs
  `editRequested` y `detailRequested`.
- `src/app/features/unidades/components/unidad-card/unidad-card.component.html`: card compacta,
  descripción retirada y footer de acciones.
- `src/app/features/unidades/components/unidad-card/unidad-card.component.css`: densidad, estilos
  de acciones, estados hover/focus y reducción de movimiento.
- `src/app/features/unidades/components/unidad-card/unidad-card.component.spec.ts`: ausencia de
  descripción, campos, acciones y ausencia de enlaces.
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.html`: grid sin límite
  rígido de tres columnas en `2xl`.
- `src/app/features/unidades/pages/unidades-list/unidades-list.component.css`: grid `auto-fit`
  desde escritorio y ancho máximo visual de cards.
- `docs/PlanGeneral.md`, `docs/CHANGELOG.md`, `docs/README.md` y el índice de fases.

No se modificó `src/app/features/unidades/models/unidad.model.ts`; `descripcion` sigue formando
parte de `UnidadResponse`. El estado final también conserva el archivo local no versionado
`ORMAN-Propiedad-Casa-Camargo.pdf`, ajeno al alcance y sin modificación.

## Decisiones técnicas

- `descripcion` continúa en el modelo, servicio, contrato y fixtures; solo se eliminó el bloque
  visual del template de la card para reservarlo para Detalle de Unidad.
- Las acciones son botones, no enlaces, porque las rutas auditadas aún no existen. Los outputs
  permiten que una fase futura conecte la intención sin cambiar la presentación ni inventar
  navegación.
- El footer reutiliza el lenguaje de Propiedades: borde superior, iconos Material Symbols Rounded,
  focus visible, hover con tokens y acción táctil mínima. Se muestran icono y texto en la misma
  zona responsive.
- La card conserva `flex` y `margin-top: auto` en el footer para mantener las acciones alineadas
  cuando una fila del grid tenga alturas distintas.
- El grid usa `auto-fit` con un mínimo de `22rem` desde 1024px y un máximo de `30rem` por card,
  manteniendo una columna en móvil y evitando cards excesivamente anchas con uno o dos registros.

## Implementación visual

La nueva jerarquía es: badges de tipo/estado, nombre, ubicación interna opcional, grid compacto
de cuatro características, precio base y footer de acciones. Se redujeron `p-5` a `p-4`, los
márgenes verticales y los paddings de separadores; se eliminó la descripción y se redujo levemente
el tamaño de los valores métricos. Los datos visibles permanecen limitados a `UnidadResponse`.

Editar y Ver detalle tienen `aria-label` con el nombre de la unidad, focus visible y no provocan
cambio de URL. No hay acciones de eliminar, activar, desactivar ni fotografías.

## Pruebas

Se actualizó únicamente `unidad-card.component.spec.ts`:

- confirma nombre, tipo, estado, ubicación, área, dormitorios, baños, piso y precio;
- confirma que una `descripcion` existente no se renderiza;
- confirma badge operativo/no operativo y omisión de ubicación nula;
- confirma la existencia de Editar y Ver detalle;
- confirma que ambos outputs se emiten y que no existen enlaces.

Resultado focalizado: 3 archivos, 14 pruebas aprobadas.

Suite completa: 57 archivos, 415 pruebas aprobadas de 419. La última ejecución mostró 4 fallos
fuera del alcance en `src/app/features/propiedades/data/propiedad-detail-pdf.service.spec.ts`;
no se modificaron ni se corrigieron en esta fase.

## Validaciones

- Typecheck: `npx tsc --noEmit -p tsconfig.app.json` — correcto.
- Build: `npm run build` — correcto; no apareció warning nuevo de Unidades. Se conservan warnings
  históricos de presupuesto CSS y dependencias CommonJS.
- Prettier sobre archivos modificados de Unidades — correcto.
- `git diff --check` — correcto.
- Browser autenticado: se verificaron card compacta, campos visibles, ausencia de descripción,
  acciones Editar/Ver detalle, ausencia de navegación al pulsarlas y temas DÍA, NOCHE y ORMAN.
  ORMAN quedó restaurado.
- Viewports exactos `320`, `360`, `390`, `430`, `768`, `1280`, `1366`, `1440`, `1600` y `1920 px`:
  `Validación Browser pendiente`, porque la API CUA disponible no permite fijar el viewport de
  forma reproducible.

## Riesgos y pendientes

- Editar y Ver detalle son actualmente acciones preparadas sin navegación. Deben conectarse solo
  después de confirmar sus rutas, contratos y componentes en fases futuras.
- Debe repetirse la revisión visual exacta por viewport cuando exista una herramienta con control
  de tamaño.
- La suite completa mantiene 4 fallos ajenos en la generación PDF de Propiedades.
- El archivo local no versionado `ORMAN-Propiedad-Casa-Camargo.pdf` permanece intacto y debe
  conservarse o limpiarse manualmente según corresponda al usuario.

## Resultado final

La card de Unidad quedó más compacta, sin descripción visible y con acciones claras, accesibles y
no rotas. El modelo y contrato permanecen intactos; la fase queda lista para cierre Git manual.
