# Feature Contratos

El feature contiene el listado, alta, detalle y gestión de documentos PDF de contratos; cuotas
permanecen dentro de este dominio.

## Estado actual

- El listado está disponible en `/app/contratos/listar`.
- El alta está disponible en `/app/contratos/nuevo` y crea contratos mediante
  `POST /api/v1/unidades/{coduni}/contratos`.
- `ContratosListComponent` consume el endpoint paginado real `GET /api/v1/contratos`.
- `ContratoApiService` conserva paginación y filtros confirmados `q`, `codprop`, `coduni` y `estado`, además de `page`, `size` y `sort`.
- El filtro de Unidad permanece deshabilitado hasta seleccionar una Propiedad;
  entonces reutiliza `UnidadApiService.listByProperty` para cargar solamente
  las unidades de esa propiedad.
- Las tarjetas muestran solo los campos entregados por `ContratoResponse`; no se hacen peticiones N+1 para cuotas ni datos relacionados.
- El alta carga propiedades activas, unidades operativas de la propiedad elegida e inquilinos activos
  con los servicios existentes. La duración mensual y la vista previa se calculan localmente; no se
  generan cuotas desde el frontend.
- El detalle está disponible en `/app/contratos/{codcon}/detalle` y consume el contrato individual real
  antes de cargar `GET /api/v1/contratos/{codcon}/archivos` para mostrar metadatos, sin descargar PDF
  automáticamente.
- `ContratoArchivoService` integra subida multipart, listado de metadatos, descarga Blob y eliminación.
  La subida usa `archivo` y `orden`; el Backend optimiza el PDF y el Frontend solo valida extensión y
  tamaño no vacío antes de enviarlo.

## Convención aplicada

La carpeta `data/` corresponde a la convención actual de ORMAN Frontend para servicios de acceso a datos.
`ContratoApiService` se ocupa del listado, resumen, creación y consulta individual. `ContratoArchivoService`
se ocupa exclusivamente de archivos PDF.

- `contrato-api.service.ts`;
- `contrato-archivo.service.ts`.

El modelo representa `ContratoResponse`, `ContratoCreateRequest`, filtros y `ContratoArchivoResponse` sin
usar `any`. El archivo seleccionado durante el alta permanece en memoria y se sube únicamente después de
recibir `codcon`; un error de subida permite reintentar sin repetir la creación.

El resumen visual consume `GET /api/v1/contratos/resumen` y conserva sus conteos independientes de filtros y paginación.

El catálogo de Propiedades se carga de forma paginada para poblar el filtro.
Al cambiar de Propiedad se limpia la Unidad, se descarta el resultado anterior
y se consulta `/api/v1/propiedades/{codprop}/unidades`. La selección combinada
envía `codprop` y `coduni` al endpoint de Contratos.

Las cuotas no constituyen un feature independiente y no se solicitan desde la gestión de documentos.
