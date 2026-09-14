# Fase 13 — Propiedades

## Estado

`COMPLETADA`

## Objetivo

Implementar y consolidar el módulo privado de Propiedades de ORMAN: listado, resumen, cards,
creación, edición, portada, selector de tipo, ubicación cartográfica, datos financieros, layout
responsive y validaciones, utilizando únicamente los contratos Backend confirmados.

Este documento es el documento canónico del módulo. Integra el trabajo que anteriormente estaba
distribuido en las fases 13 a 19, sin conservar una cronología de ajustes pequeños.

## Alcance funcional

El módulo contiene:

- Listado paginado de propiedades en `/app/propiedades/listar`.
- Detalle de propiedad en `/app/propiedades/:codprop/detalle`, con descarga PDF.
- Resumen global de inversión, propiedades activas, unidades y ocupación.
- Búsqueda, filtros, estados de carga/error/vacío y cards responsive.
- Creación en `/app/propiedades/nueva` y edición en
  `/app/propiedades/:codprop/editar`, mediante una pantalla reutilizable.
- Portada opcional con preview local y tarjeta de catálogo.
- Selector visual accesible para `CASA` y `EDIFICIO`.
- Ubicación mediante dirección, ciudad, referencia, coordenadas y mapa Leaflet/OpenStreetMap.
- Presentación adaptada a ORMAN, DÍA y NOCHE mediante tokens existentes.

No se agregaron campos, reglas, endpoints ni funcionalidades que no estén confirmados en el
contrato utilizado por el frontend.

## Listado de propiedades

### Presentación

`PropiedadesListComponent` coordina la carga, búsqueda, filtros, paginación y estados de la vista.
`PropiedadCardComponent` se ocupa de la presentación de cada propiedad y emite las intenciones de
Editar y Ver detalle sin navegar directamente.

El listado muestra, cuando los datos están disponibles:

- Nombre, tipo, dirección y ciudad.
- Portada autenticada o placeholder temático cuando no existe o falla su carga.
- Inversión inicial formateada en bolivianos, sin transformar el valor recibido.
- Cantidad total de unidades, con singular/plural accesible.
- Unidades habilitadas, ocupación y barra de progreso accesible.
- Acciones visuales de Editar y Ver detalle; el detalle funcional permanece pendiente.

La búsqueda remota usa `q` con debounce de 350 ms y cancelación mediante `switchMap`. Los filtros
confirmados son tipo (`CASA`/`EDIFICIO`) y estado (`1`/`0`); la ciudad se consulta mediante `q` y
no existe un filtro de ciudad independiente. La paginación usa `page` base cero, `size=20` y
`sort=nombre,asc`.

## Detalle de propiedad

La card emite `detailRequested` y `PropiedadesListComponent` navega a la ruta lazy
`/app/propiedades/:codprop/detalle`. `PropiedadDetailComponent` obtiene el identificador desde
`ActivatedRoute`, consulta `GET /api/v1/propiedades/{codprop}` y presenta estados diferenciados
para carga, 403, 404 y error genérico. La ficha no ofrece edición directa: `Editar` permanece
disponible en las cards del listado y la ruta `/app/propiedades/:codprop/editar` continúa vigente.

La ficha muestra únicamente los campos confirmados: nombre, tipo, estado, dirección, ciudad,
referencia, coordenadas cuando existen, inversión inicial y el identificador de la propiedad. La
referencia nula se presenta como `No registrada`. El GET de detalle entrega `cantidadUnidades`
mediante el conteo confirmado, pero sus campos `unidadesHabilitadas`, `unidadesOcupadas` y
`ocupacion` llegan con valores por defecto en el contrato actual; por eso no se presentan ni se
recalculan en Angular. No se agrega una lista de Unidades.

La portada se solicita como Blob autenticado mediante `GET /api/v1/propiedades/{codprop}/portada`
solo cuando el detalle confirma `tienePortada`. Se conserva en una Object URL local, se revoca al
destruir la vista y se reutiliza el Blob para el PDF; no se usa `portadaUrl` legado ni Base64
global.

La ubicación reutiliza `PropiedadLocationMapComponent` con `readOnly=true`: conserva tiles,
atribución, zoom y marcador, pero no permite seleccionar en el mapa ni arrastrar el marcador. Si
no hay ambas coordenadas, se muestra el estado explícito sin inicializar el mapa.

La descarga usa `PropiedadDetailPdfService`, que utiliza la única dependencia `jspdf`
incorporada al frontend y reproduce en A4 la misma jerarquía: cabecera ORMAN, portada horizontal,
tarjeta principal con tipo/estado/nombre/ubicación/inversión/identificador y las secciones de Datos
generales, Ubicación, Datos financieros y Resumen operativo. La portada Blob se recorta con
proporción de cobertura sin deformarse; sin portada se usa el placeholder documental. El PDF usa
fondo blanco, texto oscuro, acento ORMAN, footer con página total y saltos antes de secciones
completas, independientemente del tema activo. La descarga mantiene un nombre sanitizado y
muestra una notificación de error si la generación falla.

La revisión de mantenibilidad conserva la page por debajo de 300 líneas y separa la generación PDF
en `PropiedadDetailPdfService`. El renderer PDF queda en 463 líneas porque concentra una única
responsabilidad cohesiva —la composición vectorial A4, paginación, portada y formato de la ficha—;
dividir cada primitive visual en archivos separados aumentaría el acoplamiento sin aportar una
frontera reutilizable. La hoja de estilos del detalle mantiene una responsabilidad única —la
superficie responsive y tematizada de esta ficha—, por lo que se conserva como un archivo local
cohesionado aunque supere el umbral de tamaño del presupuesto CSS existente.

### Resumen

`PropiedadesResumenComponent` muestra las métricas entregadas por Backend sin recalcularlas en
Angular:

- inversión total;
- propiedades activas, diferenciando casas y edificios;
- unidades totales, habilitadas y no habilitadas;
- unidades ocupadas y ocupación global.

El resumen se consulta de forma independiente del listado, la búsqueda, los filtros y la
paginación. Sus estados de carga y error no bloquean el listado.

### Layout del listado

El resumen usa una composición 2×2 en móvil y tablet, y 4×1 en escritorio, con variante compacta
en móviles estrechos. Las cards usan una columna en móvil, dos desde `md` y tres desde `2xl`
(`1536px`). En desktop la portada se compacta a una proporción aproximada de `2.2:1`; en móvil y
tablet conserva `16:9`.

La composición interna de las cards mantiene identidad e inversión en la fila superior desde
`lg`, y Unidades/Ocupación equilibradas en la fila inferior. En móvil y tablet los bloques se
apilan o se distribuyen en columnas compactas según el ancho disponible. No se modifican datos ni
métricas al cambiar la posición visual.

## Crear y editar propiedad

### Rutas y pantalla compartida

Las rutas lazy son:

- Crear: `/app/propiedades/nueva`.
- Editar: `/app/propiedades/:codprop/editar`.

Ambas utilizan `PropiedadFormComponent` y un único `FormGroup`. Crear obtiene el propietario desde
`AuthService.codper()` y envía `estado: 1`. Editar obtiene el detalle por `codprop` antes de
mostrar el formulario y conserva los datos técnicos requeridos para el `PUT`, incluidos propietario,
estado y la referencia de portada del contrato.

### Campos y validaciones

Los únicos campos visibles son:

- Nombre.
- Tipo.
- Dirección.
- Ciudad.
- Referencia.
- Latitud.
- Longitud.
- Inversión inicial.

Se validan requeridos, longitudes, tipo cerrado, inversión no negativa, rangos de coordenadas y
la regla de que latitud y longitud deben enviarse como pareja. Los errores `ProblemDetail` y
`fieldErrors` se muestran de manera contextual y accesible.

### Persistencia

El flujo de datos es:

1. Crear o actualizar la propiedad con el contrato confirmado.
2. En Crear, recibir `codprop` y subir la portada opcional una sola vez.
3. En Editar, aplicar después del `PUT` de datos el reemplazo o la eliminación de portada que
   haya quedado pendiente.
4. Volver al listado tras un guardado correcto.

Un fallo de portada no repite el `POST` ni el `PUT` de datos. Cancelar descarta cambios locales y
libera las Object URL creadas en el navegador.

## Portada de propiedad

La respuesta de propiedad utiliza `tienePortada: boolean`. La portada se maneja como `Blob` y
`URL.createObjectURL()`; no se convierte a Base64 ni se utiliza `portada_ref`.

Reglas confirmadas:

- formatos JPG y PNG;
- tamaño máximo frontend de 5 MiB;
- preview local y placeholder cuando no existe portada;
- cambios de reemplazo y eliminación pendientes hasta Guardar;
- liberación de Object URL al reemplazar, cancelar, destruir o reutilizar una card;
- las cards descargan la imagen protegida como Blob y conservan el placeholder ante ausencia o
  error.

La vista previa de catálogo solo muestra nombre, tipo, ciudad, inversión y portada. No se
incorporaron los campos patrimoniales de la referencia visual que no pertenecen al contrato.

## Tipo de propiedad

El selector visual accesible usa radios nativos dentro de un `radiogroup`, con los valores
exactos `CASA` y `EDIFICIO`, etiquetas, `required`, foco visible y estados de selección basados en
el `FormControl`. No existe un tercer tipo `Complejo Mixto`.

## Ubicación

### Campos y mapa

La ubicación usa los controles existentes de dirección, ciudad, referencia, latitud y longitud.
El mapa se implementa directamente con Leaflet `1.9.4`, tiles de OpenStreetMap y atribución
visible `© OpenStreetMap contributors`.

El usuario puede:

- hacer click en el mapa para crear o mover el marcador;
- arrastrar el marcador;
- editar manualmente latitud y longitud;
- usar zoom y conservar las coordenadas con precisión decimal.

El centro regional inicial de Tarija es únicamente orientativo y nunca se escribe como coordenadas
de la propiedad.

### Geocodificación final

La funcionalidad de geocodificación que permanece es reverse geocoding con Nominatim después de
una selección cartográfica. Completa dirección y ciudad solamente cuando están vacías, no
sobrescribe texto manual y nunca modifica Referencia.

La implementación final no conserva búsqueda explícita ni GPS del navegador: esas acciones y la
lógica exclusiva de ellas fueron retiradas para mantener el formulario dentro del contrato y
flujo aprobados. Las solicitudes externas omiten el Bearer mediante `HttpContext` y respetan el
intervalo mínimo de un segundo entre peticiones.

### Assets y corrección del marcador

Angular publica desde los assets existentes de Leaflet:

- `/leaflet/marker-icon.png`;
- `/leaflet/marker-icon-2x.png`;
- `/leaflet/marker-shadow.png`.

El mapa mantiene el `L.icon` explícito con tamaños y anclas estándar. El 404 observado provenía
de una sesión antigua de `ng serve`; al reiniciar el servidor, los assets respondieron correctamente
y el marcador normal, retina y sombra quedaron visibles. También se corrigió la junta subpíxel de
los tiles mediante un pequeño solape de los tiles reales, sin overlay visual.

## Datos financieros

`Inversión inicial` es el único dato financiero confirmado. Visualmente queda dentro de `Datos
generales`, debajo de `Nombre`, para compactar la pantalla; el selector de tipo permanece en la
columna derecha desde tablet y escritorio.

No se incorporaron fecha de adquisición, USD, código catastral, folio real, observaciones legales,
ROI, rentabilidad ni rendimiento.

## Layout, responsive y temas

La pantalla reutilizable de Crear/Editar usa un contenedor de hasta aproximadamente `1500px` y,
desde `1024px`, una distribución principal/sidebar aproximada de `2fr 1fr`. Por debajo de ese
breakpoint se presenta en una sola columna. Los controles internos se ajustan desde `640px` para
evitar campos estrechos.

El listado y el formulario conservan comportamiento de una columna en móvil, composición compacta
en tablet y distribución de varias columnas en desktop. Se revisaron los anchos `320`, `360`,
`390`, `430`, `768`, `1280`, `1366`, `1440`, `1600` y `1920px` sin overflow horizontal en las
validaciones documentadas.

ORMAN, DÍA y NOCHE reutilizan tokens semánticos existentes para superficies, texto, bordes,
foco, acentos y estados. No se añadieron temas ni colores aislados.

## Contratos Backend utilizados

El frontend consume únicamente estos contratos confirmados:

- `GET /api/v1/propiedades` con `q`, `tipo`, `estado`, `page`, `size` y `sort`.
- `GET /api/v1/propiedades/resumen`.
- `GET /api/v1/propiedades/{codprop}`.
- `POST /api/v1/propiedades`.
- `PUT /api/v1/propiedades/{codprop}`.
- `GET /api/v1/propiedades/{codprop}/portada` como Blob autenticado.
- `PUT /api/v1/propiedades/{codprop}/portada` como `multipart/form-data` con la parte `foto`,
  respuesta 204.
- `DELETE /api/v1/propiedades/{codprop}/portada`, respuesta 204.

El modelo de listado contempla los campos de identificación, ubicación, inversión, estado,
portada y métricas de unidades/ocupación entregados por Backend. El resumen contempla inversión,
propiedades activas, casas, edificios, unidades, habilitación, ocupación y unidades ocupadas.
No se inventaron endpoints, DTOs, datos derivados, permisos ni estados adicionales.

## Correcciones técnicas relevantes

- Declaración local de Material Symbols Rounded y ligaduras en el feature para evitar iconos
  recortados o mostrados como texto.
- Selector accesible de tipo con radios nativos.
- Object URL controlada para previews y cards.
- Omisión segura del Bearer en llamadas externas de Nominatim.
- Corrección de assets normal/retina/sombra de Leaflet y de la junta subpíxel de tiles.
- Reacomodo de inversión, métricas, resumen y cards para aprovechar el espacio disponible.
- Retiro de búsqueda/GPS no necesarios en el flujo final.
- Retiro de `Volver a propiedades` del encabezado de Crear/Editar, porque duplicaba `Cancelar`.

## Archivos del módulo

La implementación queda distribuida dentro de `src/app/features/propiedades/` en sus
componentes, pages, data, models y utils existentes, principalmente:

- `components/propiedad-card/`;
- `components/propiedades-resumen/`;
- `components/propiedad-cover-field/`;
- `components/propiedad-location-map/`;
- `data/propiedad-api.service.ts`, configuración y servicio de geocodificación;
- `models/propiedad.model.ts`, `propiedad-form.model.ts`, `propiedad-location.model.ts` y
  `propiedad-resumen.model.ts`;
- `pages/propiedades-list/` y `pages/propiedad-form/`;
- `utils/propiedad-formatters.ts`.

Las rutas lazy se registran en `src/app/app.routes.ts`; los assets de Leaflet se configuran en
`angular.json` y el contexto HTTP externo se encuentra en `src/app/core/auth/`.

## Pruebas y validación

Última validación técnica consolidada:

- Pruebas focalizadas de detalle y PDF: `2` archivos y `10` pruebas aprobadas.
- Suite completa: `54` archivos y `405` pruebas aprobadas.
- Typecheck con `npx tsc --noEmit -p tsconfig.app.json`: correcto.
- Prettier en los archivos relacionados: correcto.
- Build de producción: correcto; se conservan advertencias de presupuesto CSS existentes y la
  advertencia de presupuesto de la hoja del detalle, además de advertencias CommonJS asociadas a
  `jspdf`/`html2canvas`/`canvg`.
- `git diff --check`: correcto; Git solo muestra avisos informativos de conversión LF/CRLF.

La validación visual generó y renderizó con Poppler un PDF A4 real con portada y otro sin portada;
ambos quedaron en una sola página con la misma densidad y jerarquía de la ficha. Se
revisaron cabecera, portada horizontal, badges, tarjeta principal, secciones, márgenes y footer.

La sesión autenticada local permitió verificar Crear y Editar sin guardar datos externos. Se
confirmaron listado, navegación desde `Ver detalle`, ficha con portada y placeholder, mapa de solo
lectura, coordenadas, edición desde cards y ruta, descarga PDF con y sin portada sin error de consola,
responsive y los tres temas. Se verificaron los anchos `320`, `360`, `390`, `430`, `768`, `1280`,
`1366`, `1440`, `1600` y `1920px`; el viewport aplicado por browser reportó `767px` en la
comprobación de `768px` por redondeo del entorno. El listado quedó restaurado al finalizar las
revisiones.

## Exclusiones y pendientes

Continúan fuera del módulo consolidado:

- métricas operativas de habilitación, ocupación y unidades ocupadas en el GET de detalle hasta que
  Backend las exponga con valores calculados para esa respuesta;
- activación/desactivación desde la ficha;
- creación y gestión de Unidades;
- contratos, pagos y rentabilidad;
- campos patrimoniales no confirmados;
- borradores y registro por fases;
- funcionalidades adicionales de GPS, búsqueda geográfica o geocoder institucional.

OSM y Nominatim siguen sujetos a disponibilidad, límites, CORS y sus políticas de uso. Los tres
fallos de `OrmanNotificationService` permanecen como problema ajeno a Propiedades.

## Estado final

Propiedades queda `COMPLETADA` como una única fase canónica de la Etapa 2. El listado, el resumen,
la creación, la edición, el detalle, la portada, el selector, el mapa, la ubicación, la descarga
PDF, el layout y sus validaciones están implementados y documentados en este documento.
Los ajustes pequeños, visuales o técnicos del módulo deben consolidarse aquí mientras pertenezcan
al alcance activo; no generan automáticamente una nueva fase del plan general.

No se modificó Backend durante este trabajo documental y no se ejecutaron `git add`, `git commit`
ni `git push`.
