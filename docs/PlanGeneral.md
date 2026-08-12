# Plan General de ORMAN Frontend

Documento maestro de planificación del frontend Angular. Indica qué Etapa está activa, qué fases existen, su estado, dependencias, documentación y próximos límites de trabajo.

## Objetivo general

ORMAN Frontend busca construir incrementalmente una aplicación Angular mantenible para una plataforma familiar de gestión de propiedades. El desarrollo comenzó con la fundación técnica, la identidad visual y la experiencia pública; continuará con la integración segura con el backend y, posteriormente, con áreas privadas y módulos funcionales cuando sean definidos y autorizados.

Las funcionalidades se consideran disponibles únicamente cuando están demostradas por el código y la documentación de su fase. La integración real con Spring Boot, la autenticación funcional y las áreas privadas todavía no forman parte de lo implementado en este repositorio.

## Estado actual

- **Etapa anterior:** Etapa 1 — Fundación visual y arquitectura pública. El histórico está documentado y la experiencia pública visual está implementada.
- **Etapa actual:** Etapa 2 — Integración funcional con Backend.
- **Última fase histórica documentada:** Fase 10 — Acceso visual en dos pasos.
- **Última fase completada:** Fase 01 de Etapa 2 — Integración de autenticación Angular ↔ ORMAN Backend.
- **Estado de la Fase 01:** `COMPLETADA`.
- **Pruebas:** `12 archivos y 80 pruebas aprobadas` tras el ajuste visual puntual del OTP dentro de la Fase 01.
- **Observación:** la Fase 06.1 conserva en su documento el estado “Pendiente de aprobación visual”; por eso aparece como `EN ANÁLISIS` en la tabla, aunque el README histórico agrupa las mejoras 06.1–06.2 como completadas. Esta diferencia queda visible y no se resuelve inventando una aprobación.

## Estados permitidos

| Estado | Significado |
| --- | --- |
| `PENDIENTE` | Aún no iniciada. |
| `EN ANÁLISIS` | Se están confirmando alcance, requisitos o decisiones. |
| `EN DESARROLLO` | La fase está autorizada y en ejecución. |
| `BLOQUEADA` | Existe un impedimento que evita continuar o cerrar. |
| `COMPLETADA` | Cumplió objetivo, validaciones y documentación. |
| `CANCELADA` | Se decidió no continuar con la fase. |

## ETAPA 1 — Fundación visual y arquitectura pública

La Etapa 1 reúne todo el trabajo histórico realizado antes de la integración funcional con Spring Boot: creación de la base Angular, estructura modular, Tailwind, temas, recursos públicos, landing, identidad visual y acceso visual no funcional.

### Theory de la Etapa 1

Existen documentos teóricos asociados a la etapa, pero no existe un único índice o documento que declare una consolidación final de toda la Etapa 1. Se conservan y enlazan sin reescribir:

- [Metodología de trabajo con Codex](etapas/etapa-1/theory/00-metodologia-trabajo-codex.md)
- [Angular y componentes standalone](etapas/etapa-1/theory/01-angular-y-componentes-standalone.md)
- [Estructura modular del frontend](etapas/etapa-1/theory/02-estructura-modular-frontend.md)
- [Tailwind CSS](etapas/etapa-1/theory/03-tailwind-css.md)
- [Variables CSS y temas visuales](etapas/etapa-1/theory/04-variables-css-y-temas.md)
- [Layouts y composición en Angular](etapas/etapa-1/theory/05-layouts-y-composicion-angular.md)

**Estado de consolidación:** pendiente de consolidación documental como Theory única de la Etapa 1.

### Fases de la Etapa 1

| Fase | Estado | Dependencia | Documento |
| --- | --- | --- | --- |
| 01 — Creación del proyecto Angular | `COMPLETADA` | Ninguna; creación inicial del proyecto | [Documento](etapas/etapa-1/fases/01-creacion-proyecto-angular.md) |
| 02 — Estructura base del frontend | `COMPLETADA` | Fase 01 | [Documento](etapas/etapa-1/fases/02-estructura-frontend.md) |
| 03 — Instalación y configuración de Tailwind CSS | `COMPLETADA` | Fase 02 | [Documento](etapas/etapa-1/fases/03-configuracion-tailwind.md) |
| 04 — Sistema de temas de ORMAN | `COMPLETADA` | Fase 03 | [Documento](etapas/etapa-1/fases/04-sistema-de-temas.md) |
| 04.1 — Estructura de recursos visuales públicos | `COMPLETADA` | Base Angular y Fase 03 | [Documento](etapas/etapa-1/fases/04-1-recursos-visuales-publicos.md) |
| 05 — Estructura base de la landing pública de ORMAN | `COMPLETADA` | Fase 04 y recursos públicos de Fase 04.1 | [Documento](etapas/etapa-1/fases/05-estructura-landing-publica.md) |
| 05.1 — Integración del logotipo oficial de ORMAN | `COMPLETADA` | Fase 05 | [Documento](etapas/etapa-1/fases/05-1-integracion-logo-orman.md) |
| 06.1 — Mejora del header y selector de temas | `EN ANÁLISIS` | Fase 05.1; aprobación visual pendiente según el documento de fase | [Documento](etapas/etapa-1/fases/06-1-mejora-header-selector-temas.md) |
| 06.2 — Mejora del hero con logotipo animado | `COMPLETADA` | Landing y componentes visuales disponibles | [Documento](etapas/etapa-1/fases/06-2-mejora-hero-logo-animado.md) |
| 10 — Acceso visual en dos pasos | `COMPLETADA` | Landing pública y componentes visuales disponibles | [Documento](etapas/etapa-1/fases/10-modal-inicio-sesion.md) |

Las mejoras posteriores de tokens, superficies, radios, sombras y Hero están registradas dentro del documento histórico de la Fase 04, tal como existe actualmente; no se renumeran ni se separan retroactivamente.

## ETAPA 2 — Integración funcional con Backend

La Etapa 2 inicia la integración funcional del frontend Angular con el backend Spring Boot de ORMAN. Todavía no se ha implementado la primera fase.

### Theory de la Etapa 2

**Pendiente de creación al cerrar la Etapa 2.** No se crea Theory después de cada fase.

### Fases previstas

| Fase | Estado | Dependencia | Documento |
| --- | --- | --- | --- |
| 01 — Integración de autenticación Angular ↔ ORMAN Backend | `COMPLETADA` | Etapa 1 disponible; contrato backend de autenticación y configuración de cookies/CSRF validados | [Documento](etapas/etapa-2/fases/01-integracion-autenticacion-angular-backend.md) |
| 02 — Área privada base, layout autenticado y protección de rutas | `COMPLETADA` | Fase 01 completada; contrato de refresh y logout validado | [Documento](etapas/etapa-2/fases/02-area-privada-layout-rutas-protegidas.md) |

La Fase 01 integró proxy Angular, `HttpClient`, login, OTP, estado de autenticación, access token en memoria, interceptor Bearer, XSRF, refresh, logout, manejo de errores y pruebas. El resultado y la validación manual pendiente quedan registrados en su documento. La Fase 02 completó el contenedor privado, restauración inicial de sesión y protección de rutas, sin adelantar roles, menús ni módulos funcionales.

### Fases futuras por definir

No se registran nombres ni funcionalidades adicionales hasta que sean decididos y autorizados.

## Forma de trabajo

- El desarrollo se organiza por Etapas.
- Cada Etapa contiene fases pequeñas, acotadas y verificables.
- Solo debe trabajarse una fase autorizada.
- No deben adelantarse funcionalidades futuras ni ampliar el alcance de una fase.
- Cada fase debe documentar objetivo, alcance, exclusiones, cambios, decisiones, pruebas, validaciones y pendientes.
- Al cerrar una fase se actualizan su documento, `PlanGeneral.md` y `CHANGELOG.md`.
- La Theory se consolida únicamente cuando se cierra la Etapa completa.

Una dependencia expresa orden técnico, pero cada fase requiere además autorización explícita antes de comenzar. Este documento no constituye autorización automática para implementar la siguiente fase.

## Decisiones pendientes

- La aprobación visual pendiente indicada en el documento de la Fase 06.1 debe confirmarse o cerrarse documentalmente.
- Las decisiones fuera del alcance de autenticación, como roles dinámicos y navegación privada, siguen pendientes de una fase posterior.
- Los roles dinámicos del usuario, las propiedades y las futuras áreas privadas no tienen todavía una fase frontend implementada en este repositorio.
- Las fases posteriores de la Etapa 2 permanecen por definir.

## Dependencias generales

- **Etapa 1:** sus fases dependen secuencialmente de la base Angular y de los resultados documentados de las fases anteriores; las correcciones 04.1 y 05.1 conservan su numeración histórica.
- **Etapa 2 / Fase 01:** depende de la base visual y arquitectónica disponible de la Etapa 1, del contrato de autenticación Spring Boot y de la configuración backend de cookies/CSRF validada.
- No se adelantan dependencias de fases futuras que todavía no existen.

## Relación con la documentación

- `PlanGeneral.md` indica **qué** está planeado y en qué estado se encuentra.
- `CHANGELOG.md` indica **qué cambió realmente**.
- Cada documento de fase explica **cómo y por qué** se realizó una fase.
- La Theory explica **qué conocimiento técnico quedó consolidado** después de cerrar una Etapa.
