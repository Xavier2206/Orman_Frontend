# Feature Pagos

Estructura inicial para el futuro flujo de pagos. Las cuentas de pago, comprobantes y recibos permanecen agrupados dentro de este feature.

## Estado actual

- Solo se prepara la organización de carpetas.
- `pagosRoutes` se deja como configuración standalone vacía y todavía no se conecta a `app.routes.ts`.
- No se definen pantallas, modelos, DTOs, enums, formularios, validaciones, estados ni llamadas HTTP.
- No hay código de Backend, OpenAPI ni contrato Backend → Angular disponible en este repositorio para confirmar entidades, campos, endpoints o respuestas.

## Convención aplicada

La carpeta `data/` corresponde a la convención actual de ORMAN Frontend para servicios de acceso a datos. Cuando exista un contrato Backend confirmado, podrá alojar las responsabilidades de:

- `pago-api.service.ts`;
- `cuenta-pago-api.service.ts`;
- `comprobante-api.service.ts`;
- `recibo-api.service.ts`.

Los modelos se crearán dentro de `models/` únicamente cuando los contratos reales estén confirmados. Los directorios de componentes y páginas son puntos de extensión, no implementaciones funcionales.

Los comprobantes y recibos no constituyen features independientes.
