# Documentación de ORMAN Frontend

Este directorio centraliza la documentación técnica y el registro incremental del proyecto.

- [Plan general](PlanGeneral.md): índice maestro de Etapas, fases, estados, dependencias y próximos pasos.


## Convencion documental por etapas

La documentacion de desarrollo se organiza con esta secuencia:

ETAPA
↓
FASES
↓
CIERRE DE ETAPA
↓
THEORY

- Una **Etapa** representa un bloque grande del desarrollo de ORMAN.
- Cada Etapa se desarrolla mediante varias fases pequenas y controladas.
- Las fases se documentan mientras se desarrolla cada trabajo.
- La **Theory** no se crea ni se actualiza despues de cada fase: se genera o consolida unicamente cuando terminan todas las fases de la Etapa.
- La Theory de cierre resume la arquitectura resultante, decisiones tecnicas, patrones, contratos, aprendizajes, restricciones, seguridad y comportamiento final.
- La documentacion historica no se reescribe ni se modifica salvo que sea necesario corregir una referencia de ruta.

El historico actual pertenece a `etapas/etapa-1/`. La `etapas/etapa-2/` contiene la Fase 01 de integración de autenticación; su Theory continúa pendiente hasta cerrar toda la Etapa.

## Etapa 2

- [Fases de Etapa 2](etapas/etapa-2/fases/README.md)
- [Fase 14 — Listado de Unidades](etapas/etapa-2/fases/14-listado-unidades.md)
- [Fase 15 — Compactación y acciones de Unidades](etapas/etapa-2/fases/15-compactacion-acciones-unidades.md)
- [Fase 01 — Integración de autenticación Angular ↔ ORMAN Backend](etapas/etapa-2/fases/01-integracion-autenticacion-angular-backend.md)
- [Theory de Etapa 2](etapas/etapa-2/theory/README.md)

## Estado actual

- Microfase 2 de Page Background refinado aplicada unicamente en PublicLayout.
- Microfase 1 de arquitectura de tokens refinados preparada sin cambios visuales de componentes.
- Microfase 3 de LoginModal refinado aplicada exclusivamente en el modal de inicio de sesion.
- Microfase 4 de QuickMenu refinado aplicada exclusivamente en el popover de acceso.
- Microfase 5A de Header y ThemeSelector refinados aplicada y aprobada visualmente sin modificar la logica de navegacion o temas.
- Microfase 5B de Landing refinado aplicada exclusivamente a sus tres secciones informativas, sin modificar Hero ni componentes compartidos.
- Microfase 5C de Footer refinado aplicada mediante superficie y borde locales, sin cambiar estructura ni comportamiento.
- Microfase 6 de radios, sombras y consistencia visual auditada y cerrada sin cambios de implementación; Hero queda pendiente para la Microfase 7.
- Microfase 7 de Hero refinado e integración final aplicada sin modificar los componentes aprobados previamente.

- Fases 00 a 05, corrección 05.1 y Fases 06.1–06.2 completadas.
- Fase 10 de modal visual de inicio de sesión completada.
- Fase intermedia 04.1 de recursos visuales públicos completada.
- Estructura base de la landing pública implementada y verificada.
- Logotipo oficial integrado desde `public/images/brand/orman-logo.svg`.
- Fase 01 de Etapa 2 de autenticación Angular ↔ ORMAN Backend completada con 76 pruebas aprobadas.
- Fase 15 de Etapa 2 — Compactación y acciones de Unidades — completada; las fases posteriores requieren autorización expresa.

## Documentos de fases

- [Fase 01 — Creación del proyecto Angular](etapas/etapa-1/fases/01-creacion-proyecto-angular.md)
- [Fase 02 — Estructura base del frontend](etapas/etapa-1/fases/02-estructura-frontend.md)
- [Fase 03 — Instalación y configuración de Tailwind CSS](etapas/etapa-1/fases/03-configuracion-tailwind.md)
- [Fase 04 — Sistema de temas](etapas/etapa-1/fases/04-sistema-de-temas.md)
- [Fase 04.1 — Estructura de recursos visuales públicos](etapas/etapa-1/fases/04-1-recursos-visuales-publicos.md)
- [Fase 05 — Estructura base de la landing pública](etapas/etapa-1/fases/05-estructura-landing-publica.md)
- [Fase 05.1 — Integración del logotipo oficial de ORMAN](etapas/etapa-1/fases/05-1-integracion-logo-orman.md)
- [Fase 06.1 — Mejora del header y selector de temas](etapas/etapa-1/fases/06-1-mejora-header-selector-temas.md)
- [Fase 06.2 — Mejora del hero con logotipo animado](etapas/etapa-1/fases/06-2-mejora-hero-logo-animado.md)
- [Fase 10 — Modal visual de inicio de sesión en dos pasos](etapas/etapa-1/fases/10-modal-inicio-sesion.md)

## Documentos teóricos

- [Metodología de trabajo con Codex](etapas/etapa-1/theory/00-metodologia-trabajo-codex.md)
- [Angular y componentes standalone](etapas/etapa-1/theory/01-angular-y-componentes-standalone.md)
- [Estructura modular del frontend](etapas/etapa-1/theory/02-estructura-modular-frontend.md)
- [Tailwind CSS](etapas/etapa-1/theory/03-tailwind-css.md)
- [Variables CSS y temas](etapas/etapa-1/theory/04-variables-css-y-temas.md)
- [Layouts y composición en Angular](etapas/etapa-1/theory/05-layouts-y-composicion-angular.md)

## Registro de cambios

- [CHANGELOG](CHANGELOG.md)

`PlanGeneral.md` describe lo planificado y su estado; `CHANGELOG.md` registra lo que cambió realmente; cada documento de fase explica cómo y por qué se hizo; y la Theory consolida el conocimiento técnico al cerrar una Etapa.

Las fases futuras se documentarán únicamente después de recibir autorización.
