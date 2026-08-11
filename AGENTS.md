# Instrucciones permanentes para agentes Codex

Este archivo contiene reglas estables para trabajar en ORMAN Frontend. No sustituye el plan de una fase ni autoriza por sí mismo ningún trabajo.

## Fuentes y lectura obligatoria

Antes de comenzar una fase, el agente debe leer, en este orden:

1. `AGENTS.md`.
2. `docs/PlanGeneral.md`.
3. El documento de la fase activa, si ya existe.
4. La documentación técnica directamente relacionada.

La jerarquía documental permanente es:

```text
AGENTS.md
  → reglas permanentes para agentes
docs/PlanGeneral.md
  → Etapas, Fases, estados, dependencias y siguiente trabajo
docs/CHANGELOG.md
  → cambios realmente realizados
docs/etapas/<etapa>/fases/
  → documentación detallada de cada Fase
docs/etapas/<etapa>/theory/
  → conocimiento consolidado al cerrar toda la Etapa
docs/README.md
  → explicación de la organización documental
```

## Etapas, Fases y Theory

La regla permanente es:

```text
ETAPA
  ↓
FASES
  ↓
todas las fases completadas
  ↓
CIERRE DE ETAPA
  ↓
THEORY
```

Una Etapa contiene varias Fases. Cada Fase debe ser pequeña, acotada, verificable y documentada. Theory no se escribe después de cada Fase: se crea o consolida únicamente cuando todas las Fases de la Etapa hayan finalizado.

Solo se trabaja en la Fase expresamente autorizada. Una dependencia técnica no es autorización automática. Al cerrar una Fase, el agente debe detenerse y esperar autorización antes de comenzar otra.

No adelantar componentes, servicios, endpoints, modelos, rutas, guards, interceptores, dependencias, tablas, mocks ni funcionalidades de Fases futuras. Si aparece una necesidad futura, documentarla como `PENDIENTE` sin implementarla.

## Tecnología real del proyecto

La base actual confirmada es:

- Angular 22 (`@angular/core` y CLI 22.0.7 en las dependencias actuales).
- TypeScript 6 y tipado estricto.
- Componentes standalone; no existe un `NgModule` raíz.
- Angular Router con rutas lazy mediante `loadComponent`.
- Aplicación zoneless.
- Angular Signals para estado local y `ThemeService`.
- Reactive Forms cuando corresponde; el modal visual actual ya utiliza `ReactiveFormsModule`.
- `inject()` para inyección de dependencias cuando resulta coherente.
- Tailwind CSS 4.3.3 mediante `@tailwindcss/postcss` y PostCSS.
- Vitest para pruebas unitarias.

No introducir NgModules, NgRx u otra librería de estado o UI sin una necesidad real y autorización expresa. No añadir librerías externas por comodidad si Angular o Tailwind resuelven la necesidad.

## Arquitectura

Conservar la separación existente:

```text
src/app/
├── core/       infraestructura global y servicios de aplicación
├── shared/     elementos reutilizables
├── layouts/    composición estructural
└── features/   funcionalidades concretas
```

La infraestructura de temas está en `src/app/core/theme/`; la experiencia pública en `src/app/features/public/`; los componentes de acceso visual en `src/app/features/auth/`; el layout público en `src/app/layouts/`; y el selector reutilizable en `src/app/shared/components/`.

No reorganizar carpetas globalmente durante una Fase funcional salvo autorización expresa. No hacer refactors preventivos fuera del alcance.

Preferir componentes standalone, Signals para estado local apropiado, servicios para responsabilidades compartidas, Reactive Forms para formularios complejos, tipado explícito e imports específicos. Evitar componentes gigantes, lógica de negocio compleja en templates, `any`, suscripciones innecesarias, estado global improvisado y duplicación.

## Tailwind e interfaz visual

ORMAN Frontend utiliza Tailwind CSS. No introducir Bootstrap, Angular Material, PrimeNG, Bulma ni otra librería UI completa sin autorización expresa.

Usar las convenciones Tailwind existentes. Preferir utilidades y tokens existentes; el CSS específico de componente solo debe utilizarse cuando Tailwind no resuelva limpiamente una necesidad real. Evitar colores, radios, sombras o reglas aisladas que dupliquen el sistema.

Respetar la identidad visual existente, el logo oficial, proporciones, espaciado, radios, sombras, tipografía, responsive y los componentes visuales ya terminados. No rediseñar componentes aprobados como efecto colateral de otra Fase.

## Sistema de temas

Los tres temas oficiales son exactamente:

- `ORMAN` (`orman`)
- `DÍA` (`light`)
- `NOCHE` (`dark`)

No crear temas nuevos ni modificar paletas globales durante una Fase que no sea específicamente de diseño o temas. La fuente de verdad visual es `src/styles/themes.css`, junto con:

- `src/app/core/theme/theme.model.ts`;
- `src/app/core/theme/theme.constants.ts`;
- `src/app/core/theme/theme.service.ts`;
- `src/styles.css`.

Antes de introducir un color nuevo, revisar y reutilizar tokens semánticos existentes. No usar valores hardcodeados como `bg-[#123456]` si existe un token equivalente.

`ThemeService` utiliza Signals, aplica `data-theme` al elemento raíz y persiste únicamente la selección de tema bajo la clave `orman-theme` en `localStorage`. Esa persistencia no debe confundirse con almacenamiento de credenciales.

## Accesibilidad y responsive

Toda UI debe conservar HTML semántico, labels, atributos `aria-*` cuando correspondan, navegación por teclado, foco visible, gestión correcta del foco en modales, Escape, focus trap cuando corresponda, `alt` en imágenes, `prefers-reduced-motion`, un único `h1` principal cuando corresponda y el skip link existente.

Toda UI nueva debe considerar móvil, tablet y desktop. No diseñar únicamente para la pantalla de desarrollo ni romper el comportamiento responsive existente.

## Backend, API y seguridad

El frontend no inventa contratos backend: no inventar endpoints, campos, DTOs, roles, permisos, respuestas, estados ni paginaciones. La fuente de verdad es, en este orden, el código backend confirmado, el contrato Backend → Angular documentado y la instrucción explícita del usuario. Si una API aún no existe, marcarla como `PENDIENTE EN BACKEND`.

Mientras no cambie el contrato de seguridad:

- El access token WEB debe vivir únicamente en memoria Angular.
- No guardar access tokens en `localStorage`, `sessionStorage` ni IndexedDB.
- El refresh token WEB debe vivir en la cookie HttpOnly gestionada por backend.
- Angular y JavaScript no deben leer `orman_refresh`.
- `deviceId` puede persistirse porque no es un secreto.
- XSRF debe respetar el contrato Spring Security/Angular validado.
- No decodificar JWT para inventar permisos.
- No guardar contraseñas ni registrar tokens en `console.log`.

La autorización real siempre debe existir también en backend. No hardcodear permisos ni asumir roles por tipo de persona, usuario, URL, menú o dispositivo. Si backend no expone información suficiente para una decisión visual, no inventarla.

Para HTTP, usar interfaces y tipos explícitos, nunca `any` para respuestas. Respetar el formato de error real del backend, actualmente `ProblemDetail` / `application/problem+json` según el contrato documentado. No mostrar al usuario stack traces, `traceId` ni excepciones internas; conservar datos técnicos solo para debugging controlado.

## Pruebas y estados

Cada Fase funcional debe mantener o mejorar su cobertura. Antes de marcar una Fase como `COMPLETADA`, ejecutar las validaciones que correspondan: typecheck, pruebas y build de producción; registrar el resultado real. No eliminar pruebas para obtener un resultado verde ni ocultar regresiones modificando pruebas antiguas.

Los únicos estados permitidos son:

`PENDIENTE`, `EN ANÁLISIS`, `EN DESARROLLO`, `BLOQUEADA`, `COMPLETADA`, `CANCELADA`.

El estado debe estar sincronizado con `docs/PlanGeneral.md`. Una Fase no está completada hasta terminar implementación, validaciones, documentación y revisión del diff.

Cada documento de Fase en `docs/etapas/<etapa>/fases/` debe registrar nombre, objetivo, estado, alcance, exclusiones, dependencias, archivos creados y modificados, decisiones, implementación, pruebas, validaciones, riesgos, pendientes y resultado final. Debe describir lo que ocurrió realmente, no resultados futuros.

Al cerrar técnicamente una Fase:

1. Ejecutar validaciones y revisar resultados.
2. Actualizar el documento de la Fase.
3. Actualizar `docs/PlanGeneral.md`.
4. Actualizar `docs/CHANGELOG.md`.
5. Registrar el total real de pruebas.
6. Revisar `git status` y `git diff`.
7. Ejecutar `git diff --check`.

## Git y cambios locales

Durante una Fase y también al finalizarla, el agente no ejecuta `git add`, `git commit` ni `git push`. Mantener los cambios sin consolidar hasta terminar la Fase, pasar validaciones, actualizar documentación y revisar el diff.

Al terminar y documentar una Fase, informar `FASE LISTA PARA CIERRE GIT`, recomendar un único nombre de commit con Etapa, Fase y objetivo, e indicar el tipo correspondiente al cambio real (`feat`, `fix`, `refactor`, `docs`, `test` o `chore`). El usuario controla y ejecuta manualmente `git add .`, el commit y, de forma independiente, cualquier `push`.

Sin autorización expresa, nunca ejecutar `git reset --hard`, `git clean`, `git checkout -- .`, restauraciones destructivas, rebase ni force push. No descartar cambios locales del usuario. Antes de modificar archivos, ejecutar `git status`, distinguir cambios previos y preservar los que no pertenecen a la Fase actual.

No ejecutar formatters masivos ni reformatear decenas de archivos durante una Fase funcional. Mantener diffs pequeños y relacionados con el objetivo. No instalar paquetes, ejecutar `npm update`, `npm audit fix --force` ni actualizar Angular dentro de una Fase que no sea específicamente de dependencias.

No modificar `package-lock.json` si la Fase no requiere cambios de dependencias. Investigar cualquier modificación inesperada y documentarla.

## Documentación histórica, Theory y pendientes

No reescribir documentación histórica para hacer parecer que una decisión nueva existía anteriormente. Los cambios nuevos se registran en la Fase actual, `PlanGeneral.md`, `CHANGELOG.md` y, al cierre de la Etapa, en Theory.

Theory no es un CHANGELOG ni una repetición literal de las Fases. Al cerrar toda una Etapa, debe consolidar arquitectura, decisiones, patrones, contratos, seguridad, aprendizajes, restricciones, estructura final y comportamiento resultante.

No dejar `console.log`, `TODO`, `FIXME` o `HACK` sin necesidad. Si un pendiente pertenece a otra Fase, documentarlo en la Fase o en `PlanGeneral.md`.

Cuando algo no esté claro, revisar código y documentación antes de inferir. Si no existe fuente de verdad, indicar explícitamente `INFERENCIA` o `PENDIENTE DE DECISIÓN`; no presentar inferencias como hechos.

## Informe y detención al terminar una Fase

Antes del cierre Git, el informe debe incluir qué se implementó, archivos creados y modificados, decisiones técnicas, pruebas, typecheck, build, riesgos, pendientes, cambios locales previos preservados, si `package-lock.json` cambió, el estado de `git diff`, `git diff --check`, si la Fase está lista para cierre Git y el nombre de commit recomendado.

Después de ese informe, detenerse. No iniciar otra Fase sin autorización.

## Prioridad entre fuentes

Si existe una contradicción, aplicar esta prioridad:

1. Instrucción explícita actual del usuario.
2. `AGENTS.md`.
3. `docs/PlanGeneral.md`.
4. Documento de la Fase activa.
5. Contratos técnicos confirmados.
6. Código actual.
7. Documentación histórica.
8. Inferencias.

Si la contradicción puede afectar seguridad, datos o arquitectura, informarla y no asumir silenciosamente.
