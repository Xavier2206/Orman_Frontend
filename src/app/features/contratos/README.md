# Feature Contratos

El feature contiene el listado paginado de contratos y conserva cuotas y archivos dentro de este dominio.

## Estado actual

- El listado está disponible en `/app/contratos/listar`.
- `ContratosListComponent` consume el endpoint paginado real `GET /api/v1/contratos`.
- `ContratoApiService` usa únicamente `codprop`, `coduni`, `estado`, `page`, `size` y `sort`, que son los parámetros confirmados.
- El filtro de Unidad permanece deshabilitado hasta seleccionar una Propiedad;
  entonces reutiliza `UnidadApiService.listByProperty` para cargar solamente
  las unidades de esa propiedad.
- Las tarjetas muestran solo los campos entregados por `ContratoResponse`; no se hacen peticiones N+1 para cuotas ni datos relacionados.

## Convención aplicada

La carpeta `data/` corresponde a la convención actual de ORMAN Frontend para servicios de acceso a datos. Cuando exista un contrato Backend confirmado, podrá alojar las responsabilidades de:

- `contrato-api.service.ts`;
- `cuota-api.service.ts`;
- `contrato-archivo-api.service.ts`.

El modelo de listado se limita a `ContratoResponse` y a sus filtros. El detalle, alta, edición, rescisión funcional, finalización funcional, pagos, recibos, archivos y pantallas independientes de cuotas permanecen pendientes.

El backend no expone búsqueda libre ni endpoint de resumen. El resumen visual obtiene los cuatro totales mediante una consulta paginada de tamaño 1 por estado, sin cargar todas las páginas.

El catálogo de Propiedades se carga de forma paginada para poblar el filtro.
Al cambiar de Propiedad se limpia la Unidad, se descarta el resultado anterior
y se consulta `/api/v1/propiedades/{codprop}/unidades`. La selección combinada
envía `codprop` y `coduni` al endpoint de Contratos.

Las cuotas no constituyen un feature independiente y los archivos de contrato permanecen dentro de Contratos.
