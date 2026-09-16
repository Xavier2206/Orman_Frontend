# Auditoría de estilos del listado de Personas

Fecha de revisión: 2026-09-15  
Alcance: análisis visual y estructural del listado existente de Personas.  
Modificaciones funcionales realizadas en esta auditoría: ninguna.

## 1. Archivos revisados

### Página y acceso a datos

- `src/app/features/personas/pages/personas-list/personas-list.component.ts`
- `src/app/features/personas/pages/personas-list/personas-list.component.html`
- `src/app/features/personas/pages/personas-list/personas-list.component.css`
- `src/app/features/personas/pages/personas-list/personas-list.component.spec.ts`
- `src/app/features/personas/data/persona-api.service.ts`
- `src/app/features/personas/data/persona-api.service.spec.ts`

### Modelos

- `src/app/features/personas/models/persona.model.ts`
- `src/app/features/personas/models/persona-resumen.model.ts`
- `src/app/features/personas/models/persona-modal.model.ts`

### Componentes hijos y pruebas

- `persona-form-modal/` — TypeScript, HTML, CSS y spec.
- `persona-detail-modal/` — TypeScript, HTML, CSS y spec.
- `persona-status-confirm-modal/` — TypeScript, HTML, CSS y spec.
- `persona-user-create-modal/` — TypeScript, HTML, CSS y spec.
- `persona-password-modal/` — TypeScript, HTML, CSS y spec.
- `persona-photo-field/` — TypeScript, HTML, CSS y spec.
- `persona-modal-focus.directive.ts`.

No se identificó un componente independiente `persona-card`; la card del listado
se construye directamente dentro de `personas-list.component.html`.

## 2. Estructura real del listado

```text
Página Gestionar Personas
├── sección raíz
│   ├── encabezado flex responsive
│   │   ├── h1 “Gestionar Personas”
│   │   └── botón “Añadir Persona”
│   ├── resumen independiente
│   │   ├── skeleton de cuatro cards
│   │   ├── cuatro cards de métricas
│   │   └── error de resumen
│   ├── panel de filtros
│   │   ├── buscador remoto con debounce
│   │   ├── filtro Tipo de persona como listbox custom
│   │   ├── filtro Estado como listbox custom
│   │   └── botón Limpiar
│   ├── error del listado
│   ├── loading con spinner centrado
│   ├── estado vacío contextual
│   ├── grid de cards inline de personas
│   │   ├── avatar/fotografía o iniciales
│   │   ├── identidad y teléfono
│   │   ├── badges de tipo y estado
│   │   ├── acciones con iconos en desktop
│   │   └── menú de acciones en móvil
│   └── paginación
└── modales hijos fuera de la sección principal
    ├── formulario Crear/Editar
    ├── detalle administrativo
    ├── confirmación Activar/Desactivar
    ├── creación de usuario
    └── cambio de contraseña
```

La página limita el contenido con `mx-auto w-full min-w-0 max-w-375`. El flujo
principal mantiene un ancho estable y evita overflow horizontal con `min-w-0`.

## 3. Encabezado

- Contenedor: `flex flex-col gap-4 sm:flex-row sm:items-center
sm:justify-between`.
- Título único: `h1#personas-title`, `text-3xl font-bold text-content`.
- No tiene kicker ni subtítulo visible en el estado actual.
- El botón principal se alinea al final desde `sm` y ocupa su ancho natural.
- Botón: `min-h-11`, `rounded-lg`, `bg-accent`, `text-accent-contrast`,
  `px-4`, `font-semibold`, `shadow-sm`.
- Hover: `bg-accent-hover` y `shadow-md`.
- Activo: reducción `scale-[.98]`.
- Movimiento reducido: se retiran transformación y transición.
- Icono: Material Symbols Rounded mediante `MatIconModule`, `person_add`,
  marcado `aria-hidden`.

## 4. Resumen

El resumen se solicita de forma independiente mediante `PersonaApiService.resumen()`;
los filtros y la paginación no modifican sus métricas.

### Distribución

- Cuatro métricas: Total Personas, Activas, Inactivas y Con Usuario.
- Skeleton: grid de `grid-cols-2` y `xl:grid-cols-4`.
- Datos: la misma distribución 2×2 hasta `xl` y 4×1 desde `xl`.
- Separación: `gap-3`.
- Card: `min-height: 5.5rem`, `padding: .85rem 1rem`, `gap: .8rem`,
  `border-radius: var(--radius-lg)`, `border: var(--theme-border)`,
  `background: var(--theme-card)`, `box-shadow: var(--shadow-sm)`.

### Iconos y contenido

- Iconos: `group`, `check_circle`, `remove_circle`, `lock`.
- Caja del icono: `2.55rem × 2.55rem`, circular, centrada, fondo
  `var(--theme-surface)`.
- Icono: `1.35rem`, color `var(--theme-accent-text)`.
- Activas: `success-bg` y `success-text`.
- Inactivas: `danger-bg` y `danger-text`.
- Texto de métrica: uppercase, `.7rem`, peso 700, tracking `.1em`, color
  `var(--theme-text-muted)`.
- Número: `1.65rem`, peso normal definido por `strong` y color
  `var(--theme-text)`.
- `summary-user` reduce gap y padding horizontal por la longitud del texto.

### Loading y error

- El skeleton conserva la geometría de icono y texto con bloques animados.
- El error del resumen usa `summary-error`, borde/fondo/texto de peligro,
  `radius-lg` y padding `0.85rem 1rem`.

## 5. Filtros

### Contenedor

- Panel con `mt-7`, `grid`, `min-w-0`, `rounded-xl`, borde de tema, fondo
  `bg-surface`, `p-4` y `shadow-sm`.
- Móvil: una columna y `gap-3`.
- Tablet (`md`): dos columnas, el buscador y Limpiar ocupan dos columnas cuando
  corresponde.
- Escritorio (`lg`): cuatro zonas mediante
  `minmax(260px,2.2fr) minmax(200px,1.2fr) minmax(190px,1.1fr) auto`.

### Buscador

- Label visible: `Buscar`.
- `input#persona-search`, tipo `search`, placeholder `Buscar personas...`.
- Icono `search`, posicionado absolutamente a la izquierda y centrado
  verticalmente; `.mat-icon` base de `1.25rem`.
- El input recibe `pl-11` para reservar el icono.
- La página envía la consulta al Backend con `debounceTime(350)`,
  `distinctUntilChanged`, `switchMap` no aplica directamente a este flujo de
  la versión actual, y ciclo de vida controlado por `takeUntilDestroyed`.
  La carga de cada búsqueda usa la API tipada.

### Filtros de tipo y estado

- No son `select` nativos: cada uno es un botón `.filter-trigger` que abre un
  `div[role=listbox]` con opciones `[role=option]`.
- El botón tiene `aria-labelledby`, `aria-controls`, `aria-haspopup` y
  `aria-expanded`.
- Soporta flechas, Enter, espacio y Escape; al cerrar puede devolver el foco al
  trigger.
- `.filter-trigger`: `min-height: 2.75rem`, ancho completo, borde field,
  `radius-md`, fondo field, `px .75rem`, distribución entre texto e icono.
- Hover: borde `var(--theme-border)`.
- Focus: borde y sombra `var(--theme-focus)`/`var(--shadow-sm)`.
- Opciones: posición absoluta, `z-index: 30`, `radius-md`, `bg-card`,
  `shadow-md`, padding `.25rem`.
- Opción: mínimo `2.5rem`, `radius-sm`, padding `.5rem`, `.875rem`.
- Opción seleccionada: `bg-surface`, `accent-text`, peso 600.

### Limpiar

- Usa la clase compartida local `.page-button`.
- Icono `filter_alt_off`.
- Se deshabilita cuando no hay `q`, tipo ni estado activos.
- En móvil ocupa el ancho disponible; desde `md` se alinea al final.

## 6. Cards de Personas

La card no es un componente hijo. Está definida inline como `article.persona-card`.

### Estructura interna

```text
article.persona-card
├── bloque superior flex
│   ├── avatar circular
│   │   ├── img Blob autenticado si existe foto
│   │   └── iniciales calculadas si no existe
│   └── contenido de identidad
│       ├── nombre completo
│       ├── teléfono con icono
│       └── badges Tipo + Estado
├── divider de acciones
│   ├── desktop: botones de icono visibles desde sm
│   └── móvil: botón more_vert y menú contextual
```

### Identidad y avatar

- Card: `relative min-w-0 rounded-xl border border-theme-border bg-card p-5
shadow-sm`.
- Contenido superior: `flex gap-4`.
- Avatar: `size-14`, `shrink-0`, `rounded-full`, `overflow-hidden`, grid
  centrado, fondo `bg-surface`, color `text-accent-text`, texto `text-lg
font-bold`.
- Fotografía: ocupa el avatar, `object-cover`, `alt` dinámico basado en nombre.
- Sin fotografía: iniciales obtenidas de nombre y primer apellido; fallback
  `P`.
- Nombre: `1.05rem`, `line-height: 1.3`, `font-bold`, `text-content`.
- Teléfono: margen superior `.35rem`, flex, gap `.35rem`, `text-sm`,
  `text-muted`, icono `phone` de `text-base`.
- El bloque textual usa `min-w-0 flex-1` para permitir truncamiento y evitar
  desbordes.

### Badges

- Contenedor: `mt-3 flex flex-wrap gap-[.4rem]`.
- Badge base de tipo: inline-flex, mínimo `1.55rem`, circular, borde de tema,
  fondo surface, padding horizontal `.55rem`, vertical `.1rem`, `.75rem`, peso
  650, color muted.
- Tipo: Administrativo o Inquilino.
- Estado: Activa o Inactiva, mismo tamaño y forma; solo cambia colores.
- Activa: `success-border`, `success-bg`, `success-text`.
- Inactiva: `danger-border`, `danger-bg`, `danger-text`.
- No existe una sombra propia de badge.

### Card, hover y estados

- Fondo normal: `var(--theme-card)`.
- Borde normal: `var(--theme-border)`.
- Radio normal: `rounded-xl`.
- Padding: `p-5`.
- Sombra normal: `var(--shadow-sm)`.
- Hover solo cuando el dispositivo declara hover: borde `theme-modal-border`,
  fondo `theme-card-hover`, sombra `shadow-md`, desplazamiento vertical de
  `-1px`.
- Transiciones: fondo, borde, sombra y transform en `170ms`; se eliminan con
  `prefers-reduced-motion`.

## 7. Acciones con iconos

### Lenguaje visual

- Librería: Angular Material `MatIconModule` usando fuente Material Symbols
  Rounded definida localmente.
- Botón `.action`: cuadrado `2.75rem × 2.75rem`, `flex: 0 0 2.75rem`, grid
  centrado, `radius-md`, color inicial `text-muted`.
- Icono base: `1.25rem`; el área clicable supera el icono y cumple un tamaño
  administrativo cómodo.
- Separación: `gap-1` entre iconos.
- Contenedor desktop: borde superior en `.actions-divider`, `mt-4`, `pt-3`,
  `justify-end`.
- Tooltip: `.action-tooltip`, posición absoluta sobre el botón, `radius-sm`,
  fondo surface, texto content, `.75rem`, padding `.35rem .5rem`, oculto hasta
  hover/focus.

### Acciones y condiciones

| Acción             | Icono         | Condición                      | Color/estado                         | Accesibilidad                                  |
| ------------------ | ------------- | ------------------------------ | ------------------------------------ | ---------------------------------------------- |
| Editar             | `edit`        | `persona.acciones.puedeEditar` | Accent en hover                      | `aria-label` dinámico y tooltip `Editar`       |
| Ver detalle        | `description` | Siempre                        | Texto normal en hover                | `aria-label` dinámico y tooltip `Ver detalle`  |
| Dar de baja        | `person_off`  | Estado activo + permiso        | `danger-bg`/`danger-text` en hover   | `aria-label` y tooltip `Desactivar`            |
| Reactivar          | `restore`     | Estado inactivo + permiso      | `success-bg`/`success-text` en hover | `aria-label` y tooltip `Reactivar`             |
| Crear usuario      | `lock_open`   | Sin usuario + permiso          | Accent                               | `aria-label` y tooltip `Sin usuario vinculado` |
| Cambiar contraseña | `lock`        | Usuario vinculado              | `success-text`; puede estar disabled | `aria-label`, tooltip `Usuario vinculado`      |

- Los iconos decorativos internos usan `aria-hidden="true"`.
- El botón de contraseña queda deshabilitado cuando falta el permiso, sin
  ocultar el estado de vínculo.
- Focus visible: outline de `2px`, color `var(--theme-focus)`, offset `2px`.
- Hover general: fondo surface, sombra small y color de texto; acciones de
  activación/desactivación usan tokens semánticos.
- No hay texto visible dentro de los botones desktop.

### Móvil

- Desde `sm` las acciones desktop están ocultas y se muestra un único botón
  `more_vert`.
- El botón abre un `div[role=menu]` absolutamente posicionado, con mínimo
  `12rem`, `radius-lg`, fondo card, `shadow-md`, padding `.4rem` y `z-index 10`.
- El menú móvil sí muestra texto junto al icono para que las acciones sean
  identificables en un menú compacto.
- Las entradas son `button[role=menuitem]`, mínimo `2.75rem`, alineadas con gap
  `.5rem`; estados de baja/reactivación conservan danger/success.

## 8. Paginación

- Se renderiza después de las cards, solo cuando la página tiene contenido.
- Contenedor `.pagination-bar`: flex vertical, `mt-7`, `gap-3`, borde de tema,
  `rounded-xl`, `bg-surface`, padding horizontal `1rem` y vertical `.75rem`.
- Desde `sm`: fila, alineación centrada y separación entre resumen y acciones.
- Resumen: total de personas y badge de página.
- Texto de total: `text-sm text-muted`.
- Página: `min-h-9`, `rounded-md`, borde, fondo surface, padding `2.5/.25rem`,
  `text-sm font-bold text-content`, `aria-live="polite"`.
- Acciones: en móvil ocupan el ancho completo con botones flexibles; en desktop
  conservan su ancho natural.
- Botones: `.page-button`, mínimo `2.75rem`, borde theme, `radius-md`, gap
  `.45rem`, color text.
- Hover: fondo card-hover, borde field-border y `shadow-sm`.
- Focus: outline y borde de focus de `2px`.
- Disabled: cursor not-allowed, fondo surface, muted, opacidad `.72`.
- Iconos de anterior/siguiente: `chevron_left` y `chevron_right`, caja de
  `1.1rem`.
- La página cambia `page` conservando filtros y el servicio envía `page`,
  `size: 10` y `sort: ap,asc`.

## 9. Loading

- Listado: no muestra cards parciales; usa un grid con `min-h-72` y spinner
  centrado.
- Spinner: `2.5rem`, borde de `3px`, borde superior accent, circular, animación
  `spin .8s linear infinite`, `role=status` y label `Cargando personas`.
- Resumen: usa skeletons con la misma forma y distribución de las métricas,
  animación `summary-pulse`.
- Modales: sus propios estilos contemplan estados submitting y spinner de botón;
  no son parte del loading del listado.
- En movimiento reducido se desactivan las animaciones.

## 10. Estado vacío

- Se muestra dentro de un bloque con `mt-6`, `rounded-xl`, borde de tema, fondo
  surface, `p-10` y texto centrado.
- Icono: `group_off`, `text-3xl text-accent-text`.
- Con filtros: título `No encontramos personas`, texto orientado a modificar o
  limpiar filtros y botón `Limpiar filtros` con `filter_alt_off`.
- Sin filtros: título `No hay personas registradas` y texto indicando que las
  personas futuras aparecerán en el listado.
- El estado es visualmente neutro, sin rojo para un catálogo vacío.

## 11. Estado de error

- Error del listado: párrafo con `mt-5`, `rounded-lg`, borde/fondo/texto de
  danger y `role=alert`; muestra el detalle `ProblemDetail` cuando existe.
- Error de resumen: bloque `summary-error` independiente; permite que el
  listado continúe visible aunque falle el resumen.
- No se muestran stack traces ni datos técnicos.
- Las operaciones de modales conservan el error inline en el modal y usan
  `OrmanNotificationService` solo para éxitos confirmados.
- No hay botón de reintento explícito en el listado actual; el siguiente cambio
  de filtro o acción que recarga la lista vuelve a solicitar datos.

## 12. Responsive

### Desktop

- Contenido centrado, limitado por `max-w-375`.
- Encabezado en fila.
- Resumen en cuatro columnas desde `xl`.
- Filtros en cuatro zonas desde `lg`.
- Cards mediante `repeat(auto-fit,minmax(min(100%,260px),1fr))`: no fija un
  número único de columnas; el navegador crea tantas como permite el ancho.
- Acciones visibles como fila de iconos al pie.
- Paginación en fila desde `sm`.

### Tablet

- Encabezado continúa en fila desde `sm`.
- Resumen permanece 2×2 hasta `xl`.
- Filtros en dos columnas desde `md`; el buscador y Limpiar pueden ocupar dos.
- La grilla auto-fit puede mostrar una o más cards según el ancho real.
- Acciones siguen el comportamiento desktop desde `sm`.

### Móvil

- Encabezado apilado; botón principal queda debajo o con su ancho natural.
- Resumen 2×2.
- Filtros una columna, con botón Limpiar a ancho completo.
- Cards una por fila por la restricción `minmax(min(100%,260px),1fr)`.
- Acciones reemplazadas por menú `more_vert`; el menú se abre hacia arriba o
  abajo según su posición normal, sin scroll horizontal.
- Paginación apilada y botones con ancho flexible.
- El detalle modal reduce avatar y pasa el grid de datos a una columna bajo
  `639px`; confirmación reduce padding y apila botones bajo `25rem`.

## 13. Tipografía

- La tipografía global proviene del sistema visual existente; la página usa
  utilidades Tailwind y pesos directos solo donde aportan jerarquía.
- `h1`: `text-3xl`, peso bold.
- Nombre de card: `1.05rem`, bold, line-height `1.3`.
- Labels: `.875rem`, peso 600.
- Texto secundario/teléfono: `.875rem`, muted.
- Labels de resumen y badges: entre `.68rem` y `.7rem`, uppercase, tracking
  amplio (`.08em`–`.1em`), peso 650–800.
- Números de resumen: `1.65rem`; controles y paginación usan `.875rem`.
- Tooltips: `.75rem`.
- Los iconos usan ligaduras de Material Symbols Rounded, no SVGs individuales.

## 14. Colores

La página no introduce colores hexadecimales aislados. Consume tokens semánticos
del sistema de temas:

- Contenido: `text-content` / `var(--theme-text)`.
- Secundario: `text-muted` / `var(--theme-text-muted)`.
- Fondo general: `bg-page` provisto por el layout privado.
- Superficie: `bg-surface` / `var(--theme-surface)`.
- Card: `bg-card` / `var(--theme-card)`.
- Hover card: `var(--theme-card-hover)`.
- Acento y contraste: `bg-accent`, `bg-accent-hover`, `text-accent-text`,
  `text-accent-contrast`.
- Borde: `border-theme-border` / `var(--theme-border)`.
- Campo: `var(--theme-field)` y `var(--theme-field-border)`.
- Éxito: `success-bg`, `success-border`, `success-text`.
- Peligro: `danger-bg`, `danger-border`, `danger-text`.
- Focus: `var(--theme-focus)`.
- Modal: `theme-modal-border`, `theme-modal-bg`, `theme-modal-shadow`.

Este uso permite que ORMAN, DÍA y NOCHE mantengan contraste y personalidad sin
que Personas defina una paleta paralela.

## 15. Espaciados

- Encabezado: gap `1rem` y margen/flujo natural.
- Separación encabezado–resumen: `mt-6`.
- Separación resumen–filtros: `mt-7`.
- Separación filtros–listado: `mt-6`.
- Separación de card: `gap-5`.
- Card: `p-5`.
- Avatar–identidad: `gap-4`.
- Teléfono: `mt-[.35rem]`, `gap-[.35rem]`.
- Badges: `mt-3`, `gap-[.4rem]`.
- Acciones: `mt-4`, `pt-3`, `gap-1`.
- Paneles de filtros y paginación: `p-4` y `px-4 py-3` respectivamente.
- Los modales reutilizan la escala próxima de 1rem–1.5rem y `clamp()` para
  padding de overlay.

## 16. Bordes, radius y sombras

- Card de persona: `rounded-xl`, borde `theme-border`, `shadow-sm`; hover
  `shadow-md`.
- Resumen: `radius-lg`, borde theme, `shadow-sm`.
- Filtros/paginación/empty: `rounded-xl`.
- Inputs y triggers: `radius-md`.
- Badges, avatar y círculos de resumen: `rounded-full`.
- Botón principal: `rounded-lg`.
- Tooltips: `radius-sm`.
- Dropdowns: `radius-md`, `shadow-md`.
- Ninguna regla del listado usa `!important` para la UI; el `!important` de
  la fuente de iconos se limita a asegurar Material Symbols en el scope de
  componentes donde está declarado.

## 17. Componentes reutilizables

| Componente                           | Responsabilidad                                  | Inputs                                                          | Outputs                                              | Utilidad como patrón                                  |
| ------------------------------------ | ------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `PersonaFormModalComponent`          | Crear/editar persona y coordinar formulario/foto | `persona`, `photoUrl`, `submitting`, `feedback`, `fieldErrors`  | `closed`, `saved`, `photoRemoved`                    | Patrón de modal de formulario, no de card             |
| `PersonaDetailModalComponent`        | Ficha administrativa e impresión                 | `persona`, `imageUrl`                                           | `closed`                                             | Patrón de detalle, identidad y secciones              |
| `PersonaStatusConfirmModalComponent` | Confirmar activar/desactivar                     | `operation`, `personaName`, `submitting`, `feedback`            | `confirmed`, `closed`                                | Patrón de confirmación de estado                      |
| `PersonaUserCreateModalComponent`    | Crear usuario vinculado                          | `personaName`, `submitting`, `feedback`, `fieldErrors`          | `submitted`, `closed`                                | Patrón de formulario acotado                          |
| `PersonaPasswordModalComponent`      | Cambiar contraseña                               | `login`, `submitting`, `feedback`, `fieldErrors`                | `submitted`, `closed`                                | Patrón de formulario acotado                          |
| `PersonaPhotoFieldComponent`         | Preview, selección y retiro de foto              | `imageUrl`, `initials`, `disabled`, `canRemove`, `errorMessage` | `fileSelected`, `removeRequested`, `validationError` | Patrón de avatar/foto; no aplica a contratos sin foto |
| `PersonaModalFocusDirective`         | Foco inicial, Escape, focus trap y retorno       | `initialFocusSelector`                                          | `escapePressed`                                      | Reutilizable para futuros modales                     |

Para Contratos conviene tomar la estructura visual de la card inline, no extraer
un componente compartido prematuramente: la card de Personas mezcla reglas de
permisos, foto, usuario y acciones específicas del dominio.

## 18. CSS reutilizable directamente

Estos son patrones que pueden tomarse casi sin cambios de intención, respetando
el scope del componente nuevo:

- `mx-auto w-full min-w-0 max-w-375` para el contenedor principal.
- Grid responsive `grid-cols-1 gap-5` con auto-fit y `minmax(260px,1fr)` para
  cards administrativas.
- Panel de filtros: `rounded-xl border border-theme-border bg-surface p-4
shadow-sm`.
- `.page-button`: mínimo `2.75rem`, borde, `radius-md`, gap, hover y focus.
- `.action`: caja clicable cuadrada de `2.75rem`, grid centrado, `radius-md`,
  hover, focus visible y disabled.
- `.action-tooltip` y `.tooltip-trigger`.
- `.actions-divider` como separador superior de acciones.
- Spinner centrado `2.5rem` con borde accent.
- Empty state con `rounded-xl`, fondo surface, padding `p-10`, icono accent y
  texto centrado.
- Paginación `pagination-bar` y disposición vertical→horizontal desde `sm`.
- Tokens semánticos de estado activo/inactivo para badges.

## 19. CSS reutilizable con adaptación

- `.persona-card`: reutilizar geometría, padding, borde, sombra y hover, pero
  cambiar el contenido y no arrastrar condiciones de Persona.
- Avatar `size-14`: adaptar el contenido; Contratos no tiene foto ni nombre real
  en el response actual, por lo que solo puede usar un fallback con código.
- `.summary-card`: adaptar el contenido/iconos; la distribución 2×2→4×1 es
  directamente aprovechable.
- `.filter-trigger`/`.filter-options`: reutilizar solo si el filtro requiere un
  listbox custom; mantener teclado, foco y cierre por fuera.
- `.mobile-actions`: adaptar las acciones al dominio; no reutilizar el menú de
  tres puntos si el requisito del módulo futuro exige iconos siempre visibles.
- Modal base (`overlay`, `modal-panel`, `modal-header`, `modal-footer`): tomar
  únicamente como patrón para futuros modales funcionales.
- `profile-header`, `profile-avatar`, badges de detalle y `details-section`:
  sirven para una eventual vista de detalle, no para el listado.

## 20. Elementos no reutilizables

- Selectores `.persona-status-active`, `.persona-status-inactive` como nombres:
  son específicos de estados de Persona; solo los tokens son compartibles.
- `fullName`, `initials`, `typeName`, `photoUrl` y reglas de usuario vinculado:
  son lógica de dominio, no CSS ni helpers visuales genéricos.
- Iconos `person_off`, `lock_open`, `lock` y textos de sus tooltips.
- Acciones y permisos contenidos en `persona.acciones`.
- `persona-card` como componente o API pública: actualmente no existe y no debe
  inventarse a partir de una similitud superficial.
- `print-sheet` y estilos de impresión del detalle.
- Estilos específicos de foto, formulario, contraseña y confirmación que
  dependen de Reactive Forms o del ciclo de vida de sus modales.

## 21. Consistencia visual y patrón recomendado para Contratos

El lenguaje visual recuperado de Personas es administrativo, compacto y
orientado a lectura rápida:

1. Contenedor centrado `max-w-375`, con `min-w-0` en cada frontera.
2. Encabezado simple con h1 de 30px y acción primaria accent.
3. Resumen en cards de 88px aproximadamente, con icono circular y número
   destacado.
4. Panel de filtros surface, borde tenue, `radius-xl`, `shadow-sm` y controles
   de 44px.
5. Cards de contenido `radius-xl`, `p-5`, fondo card, borde theme y `shadow-sm`.
6. Jerarquía de nombre fuerte, datos secundarios muted y badges compactos.
7. Acciones al pie, área clicable 44px, iconos Material Symbols Rounded,
   tooltip y focus visible.
8. Estados success/danger con tokens semánticos, no colores hardcodeados.
9. Loading, vacío y error conservan la geometría y el espaciado de la página.
10. Responsive real: 2×2 de resumen, filtros adaptables, cards auto-fit y menú
    móvil cuando la fila de iconos ya no es adecuada.

Para Contratos, el patrón recomendado es una nueva card administrativa con la
misma geometría (`rounded-xl`, `p-5`, `shadow-sm`, hover opcional), avatar o
identificador en una cabecera horizontal, badges de estado semánticos, un
separador superior y una fila de acciones con botones de `2.75rem`. Deben
mantenerse independientes las reglas de negocio y no copiarse los nombres de
clases específicos de Persona. Los campos no entregados por Backend no deben
simularse para completar visualmente la card.

## 22. Lista exacta de referencias para un futuro listado de Contratos

### Estructura de página

- `src/app/features/personas/pages/personas-list/personas-list.component.html`
  — estructura, encabezado, filtros, estados, cards y paginación.
- `src/app/features/personas/pages/personas-list/personas-list.component.css`
  — card, acciones, filtros, resumen, spinner, vacío, error y responsive.
- `src/app/features/personas/pages/personas-list/personas-list.component.ts`
  — Signals, debounce, filtros, paginación y coordinación de UI.

### Datos y pruebas

- `src/app/features/personas/data/persona-api.service.ts` — patrón de servicio
  tipado y parámetros reales.
- `src/app/features/personas/models/persona.model.ts` — `PageResponse` y
  filtros paginados.
- `src/app/features/personas/models/persona-resumen.model.ts` — forma del
  resumen remoto.
- `src/app/features/personas/pages/personas-list/personas-list.component.spec.ts`
  — expectativas de listado, resumen, filtros, paginación, acciones y modales.
- `src/app/features/personas/data/persona-api.service.spec.ts` — expectativas
  de URL y parámetros HTTP.

### Iconos y modales

- `persona-detail-modal.component.css` — cabecera de perfil, avatar, badges y
  superficies administrativas.
- `persona-status-confirm-modal.component.css` — botones, focus y estados
  success/danger.
- `persona-modal-focus.directive.ts` — patrón de teclado y foco.

## Resultado de la auditoría

- No se modificaron componentes, servicios, rutas, modelos ni tests de Personas.
- No se copiaron estilos ni se modificó el módulo de Contratos.
- No se crearon componentes compartidos ni se movió CSS a `shared`.
- El informe recupera el patrón real para una futura implementación coherente.
