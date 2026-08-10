# Fase 04 — Sistema de temas de ORMAN

Fecha de ejecución: 2026-07-22.

## 1. Objetivo

Implementar la infraestructura de tres temas visuales para ORMAN con Angular Signals, Tailwind CSS 4, variables CSS semánticas, `data-theme` y persistencia en `localStorage`, acompañada únicamente por una demostración temporal mínima.

## 2. Alcance

### Evolucion posterior - Microfase 1 de arquitectura de tokens refinados

La Microfase 1 prepara `--theme-page-bg`, Field y la semantica separada de Danger y Success sin cambiar componentes ni aplicar cambios visuales. `ThemeService`, `ThemeName`, `data-theme`, `localStorage`, los valores consumidos actuales y los tokens `--theme-hero-*` permanecen intactos. Los nuevos tokens se definen por tema y sus mappings de color se preparan en `@theme inline`, pero aun no se consumen.

La Microfase 2 consume por primera vez `--theme-page-bg` unicamente en el wrapper principal de PublicLayout mediante `background-image`, manteniendo `bg-page` y `--theme-page` como color fallback. No se modifican componentes visuales ni se consumen los tokens Field, Danger o Success refinados.

### Evolucion posterior - Microfase 3 de LoginModal refinado

La Microfase 3 consume los tokens refinados exclusivamente en `LoginModalComponent`. El panel usa `--theme-modal-bg`, `--theme-modal-border` y `--theme-modal-shadow`; los campos usan `Field`, `Danger` y `Success` refinados; y las etiquetas flotantes usan `--theme-field-label-bg`. El foco de los inputs se resuelve localmente con borde de acento y doble halo, sin alterar el focus-visible de los controles restantes. El boton secundario consume sus tokens modales propios. Overlay, blur, dimensiones, estructura, logo y logica de `ThemeService` permanecen intactos. QuickMenu, Hero, Page y el resto de componentes quedan fuera de alcance.

### Evolucion posterior - Microfase 4 de QuickMenu refinado

La Microfase 4 aisla exclusivamente el panel de `QuickMenuComponent` de `--theme-card` mediante `--theme-quick-menu-bg`, `--theme-quick-menu-border`, `--theme-quick-menu-secondary-bg` y `--theme-quick-menu-secondary-border`. El caret usa el mismo fondo y borde que el panel, mientras que cerrar y cancelar consumen la superficie secundaria local. El boton primario, el icon container, la logica, la posicion, los focus-visible y las sombras existentes permanecen intactos. LoginModal queda congelado y Hero sigue pendiente de refinamiento.

### Evolucion posterior - Microfase 5A de Header y ThemeSelector refinados

La Microfase 5A define superficies locales para `PublicHeaderComponent` mediante `--theme-header-bg` y `--theme-header-border`, conservando el blur y la sombra existentes. El elemento sticky final es `header.public-header`. `ThemeSelectorComponent` se aisla de Surface, Border, Card y Card Hover globales con tokens locales de base, borde, activo y hover; conserva Accent, ring, sombra, `aria-pressed` y focus-visible. No se modifica la logica, Page, QuickMenu, LoginModal, Landing, Footer, Hero ni ThemeService.

### Evolucion posterior - Microfase 5B de Landing refinado

La Microfase 5B define superficies locales para las tres secciones informativas de `LandingComponent` mediante `--theme-landing-card-bg`, `--theme-landing-panel-bg` y `--theme-landing-border`, sin modificar los tokens globales Card, Surface o Border. En ORMAN, solo `#propiedades` recibe una composicion destacada local con gradientes discretos, borde propio y sombra propia; `#contacto` conserva la card refinada estandar y `#como-funciona` conserva un panel neutral. Noche y Dia no reciben gradientes especiales. Hero, Footer, Header, ThemeSelector, QuickMenu, LoginModal, PublicLayout y ThemeService permanecen sin cambios.

### Evolucion posterior - Microfase 5C de Footer refinado

La Microfase 5C define `--theme-footer-bg` y `--theme-footer-border` para aislar el Footer de Surface y Border globales. La superficie estructural y el separador de copyright consumen esos tokens locales; texto, Accent, enlaces, hover, foco global, radios, responsive y contenido se conservan. No se incorporan gradientes, filtros, radios ni sombras. Landing, Hero, Header, ThemeSelector, QuickMenu, LoginModal, PublicLayout y ThemeService permanecen sin cambios.

### Evolucion posterior - Microfase 6 de radios, sombras y consistencia visual

La Microfase 6 audita la escala actual de radios y sombras sin modificar la implementacion. Se conserva la jerarquia aprobada: LoginModal con panel de 20 px, campos y acciones de 14 px y sombra modal especifica; QuickMenu con panel de 16 px, acciones de 14 px y `shadow-lg`; Header estructural con `shadow-sm`; ThemeSelector en formato pill con `shadow-sm` y ring activo; Landing con secciones de 16 px, card ORMAN destacada, card estandar y panel sin sombra; Footer estructural sin radio ni sombra. No se modifica la escala Tailwind, no se crean tokens y Hero queda pendiente para la Microfase 7.

### Evolucion posterior - Microfase 7 de Hero refinado e integracion final

La Microfase 7 aisla el eyebrow del Hero mediante los tokens existentes de tag y separa la CTA secundaria con tres tokens Hero propios para fondo, borde y hover. La CTA principal conserva Accent, `shadow-md`, focus y su radio actual. El panel y la superficie del logo mantienen 24 px, `shadow-lg` y sus sombras locales. Los valores efectivos de Hero para Dia se centralizan en `themes.css`; el CSS local conserva unicamente estructura, marco, margenes y animaciones existentes. No se modifican los tokens globales ni los componentes aprobados de las microfases anteriores.

La fase incluye los temas ORMAN, Noche y Día; un servicio central; inicialización temprana; selector accesible; integración con utilidades semánticas; pruebas; validaciones y documentación.

No incluye landing definitiva, header, hero, navegación, buscador, propiedades, formularios, footer, autenticación, backend, API, rutas nuevas, panel administrativo, detección del tema del sistema ni temas adicionales.

## 3. Estado anterior

- Angular 22.0.7, TypeScript 6.0.3 y componentes standalone.
- Aplicación zoneless con Angular Router y ruta `/` diferida.
- Vitest y Tailwind CSS 4.3.3 mediante PostCSS.
- Una landing temporal con utilidades neutras.
- Sin `core`, `shared`, servicio, selector ni sistema de temas.
- Sin SCSS y sin `tailwind.config.js`.

## 4. Arquitectura de temas

La arquitectura separa cuatro responsabilidades:

1. `themes.css` define las paletas mediante variables `--theme-*`.
2. `styles.css` registra tokens de Tailwind con `@theme inline`.
3. `ThemeService` mantiene el estado, valida la persistencia y aplica `data-theme`.
4. Los componentes consumen Signals y utilidades semánticas sin conocer colores concretos.

El atributo vive en `document.documentElement` y admite `orman`, `dark` o `light`. Una misma interfaz responde a los tres valores.

## 5. Paletas utilizadas

### ORMAN

| Rol             | Valor                      |
| --------------- | -------------------------- |
| page            | `#000F1F`                  |
| surface         | `#021427`                  |
| card            | `#062238`                  |
| card-hover      | `#0A2B45`                  |
| text            | `#E7EDF3`                  |
| text-muted      | `#AEBBC7`                  |
| accent          | `#D4A94E`                  |
| accent-hover    | `#E0BB68`                  |
| accent-contrast | `#000F1F`                  |
| border          | `rgba(212, 169, 78, 0.25)` |
| overlay         | `rgba(0, 15, 31, 0.72)`    |

### Noche

| Rol             | Valor                      |
| --------------- | -------------------------- |
| page            | `#080808`                  |
| surface         | `#111111`                  |
| card            | `#191919`                  |
| card-hover      | `#232323`                  |
| text            | `#F5F5F5`                  |
| text-muted      | `#B8B8B8`                  |
| accent          | `#D4A94E`                  |
| accent-hover    | `#E0BB68`                  |
| accent-contrast | `#080808`                  |
| border          | `rgba(212, 169, 78, 0.22)` |
| overlay         | `rgba(0, 0, 0, 0.72)`      |

### Día

| Rol             | Valor                   |
| --------------- | ----------------------- |
| page            | `#FFFFFF`               |
| surface         | `#F4F6F8`               |
| card            | `#FFFFFF`               |
| card-hover      | `#F8FAFC`               |
| text            | `#000F1F`               |
| text-muted      | `#52606D`               |
| accent          | `#D4A94E`               |
| accent-hover    | `#BF9134`               |
| accent-contrast | `#000F1F`               |
| border          | `#D9E0E6`               |
| overlay         | `rgba(0, 15, 31, 0.16)` |

Los tres comparten `success: #16A34A`, `warning: #D97706`, `danger: #DC2626` y `focus: #D4A94E`.

## 6. Variables semánticas

Las variables base son `--theme-page`, `--theme-surface`, `--theme-card`, `--theme-card-hover`, `--theme-text`, `--theme-text-muted`, `--theme-accent`, `--theme-accent-hover`, `--theme-accent-contrast`, `--theme-border`, `--theme-overlay`, `--theme-success`, `--theme-warning`, `--theme-danger` y `--theme-focus`.

También se definieron tres sombras, tres radios y `--transition-theme`. No se añadieron variables ajenas al alcance.

## 7. Integración con Tailwind CSS 4

`@theme inline` asigna las variables base a tokens Tailwind diferenciados. La separación evita referencias circulares y produce estas utilidades semánticas:

- `bg-page`, `bg-surface`, `bg-card`, `bg-card-hover`.
- `text-content`, `text-muted`, `text-accent`, `text-accent-contrast`.
- `bg-accent`, `bg-accent-hover`.
- `border-theme-border`.
- Tokens adicionales para overlay, success, warning, danger y focus.

No se creó `tailwind.config.js` y las plantillas no usan colores hexadecimales arbitrarios.

## 8. Archivos creados

- `src/styles/themes.css`.
- `src/app/core/theme/theme.model.ts`.
- `src/app/core/theme/theme.constants.ts`.
- `src/app/core/theme/theme.service.ts`.
- `src/app/core/theme/theme.service.spec.ts`.
- `src/app/shared/components/theme-selector/theme-selector.component.ts`.
- `src/app/shared/components/theme-selector/theme-selector.component.html`.
- `src/app/shared/components/theme-selector/theme-selector.component.spec.ts`.
- `docs/fases/04-sistema-de-temas.md`.
- `docs/theory/04-variables-css-y-temas.md`.

## 9. Archivos modificados

- `src/styles.css`.
- `src/index.html`.
- `src/app/app.config.ts`.
- `src/app/features/public/landing/landing.component.ts`.
- `src/app/features/public/landing/landing.component.html`.
- `src/app/features/public/landing/landing.component.spec.ts`.
- `README.md`.
- `docs/README.md`.
- `docs/CHANGELOG.md`.

No se eliminó ningún archivo.

## 10. Servicio de temas

`ThemeService` es un singleton con `providedIn: 'root'`. Mantiene un `signal<ThemeName>` privado y expone `activeTheme` con `asReadonly()`. `setTheme()` aplica el atributo y persiste la selección; `initializeTheme()` restaura y valida el valor almacenado.

`DOCUMENT` se inyecta desde `@angular/common`, evitando depender de una referencia global rígida en la implementación.

## 11. Inicialización

`app.config.ts` utiliza la API moderna `provideAppInitializer` para llamar a `ThemeService.initializeTheme()` durante el arranque. `<html lang="es" data-theme="orman">` y las variables de `:root` ofrecen un respaldo ORMAN inmediato antes de ejecutar JavaScript.

No se utilizó `APP_INITIALIZER` ni otra API obsoleta.

## 12. Persistencia

La clave es `orman-theme`. Los valores `orman`, `dark` y `light` se restauran; cualquier ausencia, error de acceso o texto inválido produce ORMAN. Las operaciones están dentro de bloques `try/catch`, por lo que bloquear `localStorage` no impide cambiar el tema durante la sesión.

No se consulta `prefers-color-scheme`.

## 13. Selector

`ThemeSelectorComponent` renderiza tres botones visibles: ORMAN, Noche y Día. Cada botón tiene `type="button"`, estado booleano `aria-pressed`, un tamaño táctil mínimo de 44 px y texto oculto “activo” para reforzar el estado sin depender solo del color.

Los botones HTML nativos conservan navegación por tabulador y activación por teclado.

## 14. Accesibilidad

- Etiqueta de grupo “Seleccionar tema visual”.
- Estado activo comunicado con `aria-pressed` y texto, además del color.
- Foco global visible de 3 px con el token dorado.
- Contraste de texto definido específicamente por tema.
- Transiciones limitadas a colores durante 200 ms.
- `prefers-reduced-motion` elimina las transiciones.
- La tarjeta anuncia el texto activo con `aria-live="polite"`.

## 15. Pruebas

Se verifican:

- tema ORMAN predeterminado y aplicación sobre `documentElement`;
- cambio a Noche y Día;
- escritura y restauración desde `localStorage`;
- retorno a ORMAN ante un valor inválido;
- renderizado de los tres botones;
- `aria-pressed` del botón activo;
- cambio de tema al pulsar;
- contenido temporal, selector y tema activo de la landing;
- pruebas existentes de creación, `router-outlet` y navegación a `/`.

Las aserciones no dependen del conjunto completo de clases Tailwind.

## 16. Comandos

Comandos principales ejecutados:

```powershell
npx prettier --write <archivos de la fase>
npx ng build
npx ng test --watch=false
npx ng serve --host 127.0.0.1 --port 4200
Invoke-WebRequest -Uri 'http://127.0.0.1:4200/' -UseBasicParsing
rg --files -g '*.scss' -g '!node_modules' -g '!dist'
```

También se inspeccionó el CSS de producción y se comprobó el puerto local. No se ejecutó ningún comando Git.

## 17. Resultado de compilación

`npx ng build` terminó con código 0:

- Bundle inicial: 216.63 kB brutos y 60.59 kB estimados.
- CSS global: 11.17 kB brutos y 2.79 kB estimados.
- Chunk diferido de landing: 3.19 kB brutos.
- Salida: `dist/orman-frontend`.

## 18. Resultado de pruebas

`npx ng test --watch=false` terminó con código 0:

- Archivos: 4 aprobados.
- Pruebas: 16 aprobadas.
- Fallos: 0.

## 19. Errores

1. El sandbox bloqueó la lectura de rutas del proyecto al iniciar build y pruebas.
2. La primera ejecución de pruebas encontró un espacio extra en el `textContent` generado alrededor del texto accesible “(activo)”.
3. No había un backend de navegador integrado disponible para inspección visual automatizada.

## 20. Soluciones

1. Build y pruebas se repitieron con la autorización necesaria fuera del sandbox.
2. La prueba normaliza espacios de texto sin acoplarse a clases CSS; no se alteró la semántica accesible.
3. Se aplicó la validación alternativa prevista: pruebas, HTTP 200, HTML base e inspección del CSS compilado.

El CSS producido contiene las utilidades semánticas indicadas, los selectores `:root[data-theme=orman]`, `:root[data-theme=dark]`, `:root[data-theme=light]` y la media query `prefers-reduced-motion`.

## 21. Estado final

La Fase 04 está completada. Los tres temas comparten una sola interfaz, ORMAN es el predeterminado, la elección válida se recuerda y el selector demuestra el cambio de forma accesible. `/` respondió HTTP 200 y el servidor temporal se detuvo; el puerto 4200 quedó liberado.

No existe SCSS ni `tailwind.config.js`. No se desarrolló la landing definitiva, no se avanzó a la Fase 05 y no se ejecutó ni inspeccionó Git.

## 22. Próximo paso

Esperar autorización. La próxima fase sugerida es la Fase 05 definida por el plan del proyecto; no debe iniciarse automáticamente.
